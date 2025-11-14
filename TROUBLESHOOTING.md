# Troubleshooting Guide

## Network Errors on Registration/Login

### Symptoms
- "Network Error" in browser console
- Cannot register or login
- API requests failing with AxiosError

### Solution
1. **Hard refresh browser**: Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. **Clear browser data**:
   - Open DevTools (F12)
   - Go to Application tab
   - Clear Storage → Clear site data
   - Or run in console: `localStorage.clear(); sessionStorage.clear();`
3. **Clear cookies**: Delete all cookies for `localhost:3000`
4. **Restart containers** (if needed):
   ```bash
   docker-compose restart frontend backend
   ```

### How to Verify It's Working

#### Test 1: Check Services
```bash
docker ps
# All services should show "healthy" status
```

#### Test 2: Test Backend Directly
```bash
curl http://localhost:8000/health
# Should return: {"status":"ok","project_name":"Proofile API"}
```

#### Test 3: Test Through Next.js Proxy
```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
# Should create user successfully
```

#### Test 4: Check Browser Console
1. Open `http://localhost:3000`
2. Open DevTools (F12) → Console tab
3. Look for: `[api] Using relative proxy /api`
4. Should NOT see: `[api] Using absolute URL: http://backend:8000`

## Common Issues

### Issue: "ECONNREFUSED" or "Network Error"
**Cause**: Frontend trying to access Docker internal hostname from browser

**Fix**: 
- Ensure `NEXT_PUBLIC_API_URL` is NOT set to `http://backend:8000`
- Use relative URLs (empty string) to leverage Next.js proxy
- Check docker-compose.yml doesn't override environment variables

### Issue: CORS Errors
**Cause**: Backend CORS configuration doesn't allow frontend origin

**Fix**: Check `backend/app/main.py`:
```python
cors_origins = ["http://localhost:3000", "http://localhost:8000"]
allow_credentials=True
allow_headers=["Content-Type", "Authorization", "X-XSRF-TOKEN", ...]
```

### Issue: 401 Unauthorized on Refresh
**Cause**: Missing CSRF token or refresh token cookie

**Fix**:
- Ensure `withCredentials: true` in axios config
- Check cookies are being set (DevTools → Application → Cookies)
- Verify CSRF is disabled in development: `CSRF_ENABLED=False`

### Issue: Containers Not Starting
**Cause**: Port conflicts or resource issues

**Fix**:
```bash
# Stop all containers
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Rebuild and start
docker-compose up -d --build
```

## Environment Variables Checklist

### Frontend (`.env` and `frontend/.env.local`)
```env
✓ NEXT_PUBLIC_API_URL=http://localhost:8000  # For production only
✓ BACKEND_INTERNAL_URL=http://backend:8000   # For Next.js rewrites
✓ NODE_ENV=development
```

### Backend (`.env`)
```env
✓ DATABASE_URL=postgresql+asyncpg://proofile_user:proofile_password@postgres:5432/proofile_dev
✓ REDIS_URL=redis://redis:6379/0
✓ SECRET_KEY=<your-secret-key>
✓ ENVIRONMENT=development
✓ CSRF_ENABLED=False  # Auto-set in development
```

### Docker Compose
```yaml
✓ frontend.environment should NOT override NEXT_PUBLIC_API_URL
✓ frontend.environment should set BACKEND_INTERNAL_URL=http://backend:8000
✓ All services should be on same network (proofile-network)
```

## Debug Commands

### View Container Logs
```bash
# Frontend logs
docker logs proofile-frontend --tail 50 -f

# Backend logs
docker logs proofile-backend --tail 50 -f

# All logs
docker-compose logs -f
```

### Check Environment Variables
```bash
# Frontend
docker exec proofile-frontend env | grep -E "NEXT_PUBLIC|BACKEND"

# Backend
docker exec proofile-backend env | grep -E "DATABASE|REDIS|SECRET"
```

### Test Network Connectivity
```bash
# From host to backend
curl http://localhost:8000/health

# From frontend container to backend
docker exec proofile-frontend curl http://backend:8000/health

# From host through Next.js proxy
curl http://localhost:3000/api/v1/auth/me
```

### Check Database Connection
```bash
# Connect to PostgreSQL
docker exec -it proofile-postgres psql -U proofile_user -d proofile_dev

# List tables
\dt

# Check users
SELECT id, email, role FROM users;
```

## Still Having Issues?

1. **Check browser console** for detailed error messages
2. **Check backend logs** for server-side errors
3. **Verify all services are healthy**: `docker ps`
4. **Try a clean restart**:
   ```bash
   docker-compose down
   docker-compose up -d
   ```
5. **Check this file for updates**: This troubleshooting guide may be updated with new solutions
