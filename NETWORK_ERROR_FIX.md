# Network Error Fix - Authentication Endpoints

## Problem
The frontend was experiencing "Network Error" when trying to call `/api/v1/auth/refresh` and other authentication endpoints. Users couldn't register or sign in.

## Root Cause
The issue was caused by a mismatch between Docker internal networking and browser-accessible URLs:

1. **Frontend container** runs inside Docker and can access backend via `http://backend:8000` (Docker internal hostname)
2. **Browser** runs on the host machine and cannot resolve `backend` hostname - it needs `http://localhost:8000`
3. The `NEXT_PUBLIC_API_URL` environment variable was set to `http://localhost:8000` in `.env.local`, but the Docker Compose was overriding it with `http://backend:8000`

## Solution Applied

### 1. Environment Variable Configuration
Updated environment variables to distinguish between:
- **Browser-side requests**: Use `NEXT_PUBLIC_API_URL=http://localhost:8000`
- **Server-side requests**: Use `BACKEND_INTERNAL_URL=http://backend:8000`

### 2. Files Modified

#### `/docker-compose.yml`
Removed the `NEXT_PUBLIC_API_URL=http://backend:8000` override that was preventing browser access:
```yaml
environment:
  - NODE_ENV=development
  - WATCHPACK_POLLING=true
  - NEXT_DISABLE_TRANSPILE_CACHE=1
  - BACKEND_INTERNAL_URL=http://backend:8000  # For server-side rewrites only
```

#### `/frontend/src/lib/api.ts`
Updated to always use relative proxy URLs in development:
```typescript
function getApiUrl(): string {
  // Always use relative proxy in development
  if (typeof window === "undefined") {
    return "";  // SSR uses relative paths
  }
  
  // Only use absolute URLs in production for different domains
  if (process.env.NODE_ENV === "production" && rawEnvUrl) {
    // ... check if different domain
  }
  
  return "";  // Use relative proxy
}
```

#### `/frontend/.env.local`
```env
# Browser-side API URL (must be accessible from host machine)
NEXT_PUBLIC_API_URL=http://localhost:8000
# Server-side backend URL (Docker internal)
BACKEND_INTERNAL_URL=http://backend:8000
```

#### `/.env`
```env
# Frontend settings
NEXT_PUBLIC_API_URL=http://localhost:8000
BACKEND_INTERNAL_URL=http://backend:8000
ENVIRONMENT=development
```

#### `/backend/app/main.py`
Added `X-XSRF-TOKEN` to CORS allowed headers:
```python
allow_headers=[
    "Content-Type", 
    "Authorization",
    "Accept",
    "Origin",
    "X-Requested-With",
    "X-XSRF-TOKEN",  # Added for CSRF protection
],
```

### 3. How It Works

The Next.js configuration (`next.config.ts`) already has rewrites configured:
```typescript
async rewrites() {
  const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://backend:8000";
  return [
    {
      source: "/api/:path*",
      destination: `${backendUrl}/api/:path*`,
    },
  ];
}
```

This means:
- **Browser makes request to**: `http://localhost:3000/api/v1/auth/refresh`
- **Next.js server proxies to**: `http://backend:8000/api/v1/auth/refresh` (Docker internal)
- **Response flows back** through the proxy to the browser

However, the frontend API client (`src/lib/api.ts`) has logic to use absolute URLs when `NEXT_PUBLIC_API_URL` points to a different domain. Since we're in development with Docker, we want the browser to make requests directly to `localhost:8000` to avoid proxy overhead and ensure cookies work correctly.

## Testing

After applying the fix:

1. **Backend health check**: ✅
   ```bash
   curl http://localhost:8000/health
   # Returns: {"status":"ok","project_name":"Proofile API"}
   ```

2. **Refresh endpoint**: ✅
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/refresh
   # Returns: 401 (expected without refresh token)
   ```

3. **Services running**: ✅
   - Backend: `http://localhost:8000`
   - Frontend: `http://localhost:3000`
   - PostgreSQL: `localhost:5432`
   - Redis: `localhost:6379`

## Next Steps

1. **Hard refresh your browser** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Clear browser cache and cookies** for `localhost:3000`
3. **Clear localStorage**: Open browser console and run `localStorage.clear()`
4. Try registering a new user at `http://localhost:3000/register`
5. Try logging in at `http://localhost:3000/login`

## Verification

The proxy is confirmed working:
```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
# Successfully creates user
```

## Production Considerations

In production, you would typically:
- Use a reverse proxy (nginx) in front of both services
- Set `NEXT_PUBLIC_API_URL` to your production domain
- Enable `COOKIE_SECURE=true` for HTTPS
- Enable `CSRF_ENABLED=true` (already enabled for production in config)
