# Rate Limiting - Quick Reference

## What is Rate Limiting?

Rate limiting protects against brute force attacks by limiting the number of failed login attempts per email address per time window.

**Current Settings:**
- **Limit:** 50 failed login attempts
- **Window:** 60 seconds
- **Response:** HTTP 429 "Too many login attempts, try again later"
- **Storage:** Redis (in-memory cache with auto-expire TTL)

## How It Works

1. **Failed Login** → Counter increments for that email
2. **Counter reaches 50** → Next attempt gets HTTP 429
3. **All subsequent attempts** → HTTP 429 (rate limited)
4. **60 seconds pass** → Counter expires (auto-reset)
5. **Successful Login** → Counter immediately cleared
6. **User can retry** → Fresh counter starts

## Test Results

All rate limiting tests **PASSED**:

- ✅ Backend (Port 8000): Threshold 50 works correctly
- ✅ Frontend (Port 3000): Works through proxy correctly
- ✅ Window Reset: Expires after 60 seconds
- ✅ Success Clear: Counter cleared on login success

## Testing

### Quick Test (Backend)

```bash
# Clear Redis
docker compose exec redis redis-cli FLUSHALL

# Send 55 failed attempts (same email)
python3 << 'EOF'
import requests
email = "test@example.com"
for i in range(1, 56):
    r = requests.post("http://localhost:8000/api/v1/auth/token",
                      data={"username": email, "password": "wrong"})
    if i % 10 == 0 or r.status_code == 429:
        print(f"Attempt {i}: HTTP {r.status_code}")
EOF

# Expected: HTTP 429 at attempt 50
```

### Quick Test (Frontend Proxy)

```bash
# Send through port 3000 instead
curl -s -X POST 'http://localhost:3000/api/v1/auth/token' \
  -d 'username=test@example.com&password=wrong' \
  -w '\nHTTP %{http_code}\n'
```

## Configuration

**File:** `backend/app/core/config.py`

```python
RATE_LIMIT_LOGIN_REQUESTS: int = 50      # Change this
RATE_LIMIT_LOGIN_WINDOW: int = 60        # Or this
```

To change, edit config and rebuild:
```bash
docker compose down
docker compose up -d --build backend
```

## Monitoring

### Check Rate Limit Counters (Redis)

```bash
# See all rate limit keys
docker compose exec redis redis-cli KEYS "login_fail:*"

# Check specific email's counter
docker compose exec redis redis-cli GET "login_fail:test@example.com"

# Check seconds until reset
docker compose exec redis redis-cli TTL "login_fail:test@example.com"
```

### Clear All Counters

```bash
docker compose exec redis redis-cli FLUSHALL
```

## Error Messages

| Status | Message | Meaning |
|--------|---------|---------|
| **200** | `{access_token: "..."}` | ✓ Login successful |
| **401** | `Incorrect email or password` | Wrong credentials |
| **429** | `Too many login attempts, try again later` | Rate limited |

## Frontend Error Handling

```typescript
try {
  await login(email, password);
} catch (error) {
  if (error.response?.status === 429) {
    // Show: "Too many attempts, please wait"
    toast.error("Too many login attempts. Try again in a minute.");
  } else if (error.response?.status === 401) {
    // Show: "Wrong password"
    toast.error("Invalid email or password");
  }
}
```

## Security Notes

✅ **Strengths:**
- Per-email tracking (no cross-user interference)
- 50 attempts per minute = slow enough for security, fast enough for UX
- TTL auto-cleanup prevents memory leaks
- Redis fast (no database load)
- Generic error message (no user enumeration)

⚠️ **Considerations:**
- Only email-based (not IP-based)
- No progressive backoff (fixed "try again later")
- No audit logging of rate limit hits

## Recommendations

### Short Term (Ready to Deploy)
- Current settings are production-ready
- Monitor rate limit hits for security events

### Medium Term
- Add IP-based rate limiting
- Log rate limit hits to security monitoring

### Long Term
- Progressive backoff (try again in 5 mins, then 10 mins, etc.)
- IP-based + Email-based combination
- Captcha on repeated failures

## Documentation

- **Test Report:** `RATE_LIMITING_TEST_REPORT.md`
- **Testing Guide:** `RATE_LIMITING_TESTING_GUIDE.md`
- **Implementation:** `backend/app/api/v1/auth.py` (function: `_handle_failed_login`)
- **Configuration:** `backend/app/core/config.py`

## Key Files

```
backend/
├── app/
│   ├── api/v1/
│   │   └── auth.py                    ← Rate limit logic here
│   └── core/
│       └── config.py                  ← Configuration here
└── docker-compose.yml                 ← Redis service
```

## Next Steps

1. **Deploy** - Current implementation is production-ready
2. **Monitor** - Track rate limit events in logs
3. **Improve** - Add IP-based limits in next iteration
4. **Document** - Add to API documentation for clients

---

**Status:** ✅ Production Ready | **Last Tested:** November 11, 2025
