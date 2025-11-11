# Rate Limiting Testing Guide

This guide provides practical examples for testing and understanding rate limiting in the Proofile authentication system.

## Quick Start

### Prerequisites
```bash
# Ensure services are running
docker compose ps

# Should show: postgres, redis, backend, frontend all healthy
```

### Test 1: Direct Backend Rate Limiting

Test rate limiting on the backend directly (port 8000):

```bash
# Clear Redis to start fresh
docker compose exec -T redis redis-cli FLUSHALL

# Send 55 failed login attempts to same email
python3 << 'EOF'
import requests

email = "test@example.com"
for i in range(1, 56):
    response = requests.post(
        "http://localhost:8000/api/v1/auth/token",
        data={"username": email, "password": "wrongpass"},
        timeout=5
    )
    if i % 10 == 0 or response.status_code == 429:
        print(f"Attempt {i}: HTTP {response.status_code}")

EOF

# Expected output:
# Attempt 10: HTTP 401
# Attempt 20: HTTP 401
# Attempt 30: HTTP 401
# Attempt 40: HTTP 401
# Attempt 50: HTTP 429  ← Rate limit hit!
# Attempt 51: HTTP 429
# ...
```

### Test 2: Frontend Proxy Rate Limiting

Test rate limiting through Next.js proxy (port 3000):

```bash
# Clear Redis
docker compose exec -T redis redis-cli FLUSHALL

# Send 55 failed attempts through proxy
curl -s -X POST 'http://localhost:3000/api/v1/auth/token' \
  -d 'username=ratelimituser@test.com&password=wrong' \
  -w '\nHTTP %{http_code}\n' | head -2

# Run multiple times:
for i in {1..55}; do
  curl -s -X POST 'http://localhost:3000/api/v1/auth/token' \
    -d 'username=ratelimituser@test.com&password=wrong' \
    -w '\n%{http_code}\n' | grep -E '^(401|429)$'
done | tail -20
```

### Test 3: Successful Login Clears Counter

Test that a successful login resets the attempt counter:

```bash
# Clear Redis
docker compose exec -T redis redis-cli FLUSHALL

# Send 30 failed attempts
python3 << 'EOF'
import requests

email = "debug@example.com"
password_correct = "Passw0rd!"
password_wrong = "wrongpass"

print("Step 1: Sending 30 failed attempts...")
for i in range(30):
    requests.post(
        "http://localhost:8000/api/v1/auth/token",
        data={"username": email, "password": password_wrong},
        timeout=5
    )

print("Step 2: Successful login (resets counter)...")
response = requests.post(
    "http://localhost:8000/api/v1/auth/token",
    data={"username": email, "password": password_correct},
    timeout=5
)
print(f"Login: HTTP {response.status_code}")
if response.status_code == 200:
    print(f"✓ Token received: {response.json()['access_token'][:20]}...")

print("Step 3: Send 15 more failed attempts (should all be 401, not 429)...")
for i in range(15):
    response = requests.post(
        "http://localhost:8000/api/v1/auth/token",
        data={"username": email, "password": password_wrong},
        timeout=5
    )
    if response.status_code == 429:
        print(f"✗ Got rate limited at attempt {i+1} - counter NOT cleared!")
        break
    elif i == 14:
        print("✓ All 15 attempts got 401 - counter WAS cleared!")

EOF
```

### Test 4: Rate Limit Window Reset (65 seconds)

Test that rate limit counter resets after 60+ seconds:

```bash
# Clear Redis
docker compose exec -T redis redis-cli FLUSHALL

# Hit the rate limit
python3 << 'EOF'
import requests

for i in range(50):
    requests.post(
        "http://localhost:8000/api/v1/auth/token",
        data={"username": "window@test.com", "password": "wrong"},
        timeout=5
    )

r = requests.post(
    "http://localhost:8000/api/v1/auth/token",
    data={"username": "window@test.com", "password": "wrong"},
    timeout=5
)
print(f"Rate limited: HTTP {r.status_code}")

print("\nWaiting 65 seconds for window to expire...")
import time
time.sleep(65)

r = requests.post(
    "http://localhost:8000/api/v1/auth/token",
    data={"username": "window@test.com", "password": "wrong"},
    timeout=5
)
print(f"After reset: HTTP {r.status_code}")
if r.status_code == 401:
    print("✓ Rate limit window RESET - counter cleared")

EOF
```

## Configuration

Rate limiting is configured in `backend/app/core/config.py`:

```python
RATE_LIMIT_LOGIN_REQUESTS: int = 50      # Max attempts
RATE_LIMIT_LOGIN_WINDOW: int = 60        # Per 60 seconds
```

To modify:

1. Edit `backend/app/core/config.py`
2. Change values:
   ```python
   RATE_LIMIT_LOGIN_REQUESTS: int = 30  # Change from 50 to 30
   RATE_LIMIT_LOGIN_WINDOW: int = 120   # Change from 60 to 120
   ```
3. Rebuild backend:
   ```bash
   docker compose down
   docker compose up -d --build backend
   ```

## Monitoring Rate Limits

### Check Redis Counter:

```bash
# View current rate limit keys
docker compose exec redis redis-cli KEYS "login_fail:*"

# View attempt count for specific email
docker compose exec redis redis-cli GET "login_fail:test@example.com"

# View TTL (seconds until reset)
docker compose exec redis redis-cli TTL "login_fail:test@example.com"

# Clear all rate limits
docker compose exec redis redis-cli FLUSHALL
```

### Check Backend Logs:

```bash
# View last 50 lines of backend logs
docker compose logs backend --tail=50

# Watch logs in real-time
docker compose logs -f backend
```

## Understanding Response Codes

| HTTP Code | Meaning | Action |
|-----------|---------|--------|
| **200** | ✓ Login successful | Store token, redirect to dashboard |
| **401** | Invalid credentials | Show "Email or password incorrect" |
| **429** | Rate limited | Show "Too many attempts, try again later" |

## Frontend Error Handling

Example error handling in React:

```typescript
try {
  const response = await api.post("/api/v1/auth/token", {
    username: email,
    password: password,
  });
  // Success - handle token
} catch (error) {
  if (error.response?.status === 429) {
    // Show rate limit message
    toast.error("Too many login attempts. Please try again in a minute.");
  } else if (error.response?.status === 401) {
    // Show authentication error
    toast.error("Invalid email or password");
  } else {
    // Show generic error
    toast.error("Login failed");
  }
}
```

## Production Considerations

### Security:
- Rate limit is **per-email**, not per-IP
- Consider adding IP-based limits for additional protection
- Consider progressive backoff (exponential increase in wait time)

### Performance:
- Rate limiting uses Redis (fast, in-memory)
- No database queries required
- TTL auto-cleanup prevents memory bloat

### Customization:
```python
# Current: 50 attempts per 60 seconds
RATE_LIMIT_LOGIN_REQUESTS: int = 50      

# Strict: 30 attempts per 60 seconds
RATE_LIMIT_LOGIN_REQUESTS: int = 30      

# Lenient: 100 attempts per 60 seconds
RATE_LIMIT_LOGIN_REQUESTS: int = 100     

# Longer window: 30 attempts per 300 seconds
RATE_LIMIT_LOGIN_WINDOW: int = 300       
```

## Troubleshooting

### Rate limiting not working?

1. **Check Redis is running:**
   ```bash
   docker compose ps redis
   # Should show: healthy
   ```

2. **Check Redis connection:**
   ```bash
   docker compose exec backend python3 -c \
     "import redis; r = redis.from_url('redis://redis:6379/0'); print(r.ping())"
   ```

3. **Check backend logs:**
   ```bash
   docker compose logs backend | grep -i "rate\|redis"
   ```

### Rate limit stuck?

Clear Redis:
```bash
docker compose exec redis redis-cli FLUSHALL
```

### Getting 429 too quickly?

The email might already be in Redis from previous test. Try:
```bash
# Clear Redis between tests
docker compose exec redis redis-cli FLUSHALL

# Or use different email
python3 << 'EOF'
import time
email = f"test{int(time.time())}@example.com"
print(f"Using email: {email}")
EOF
```

## Related Files

- Rate limiting implementation: `backend/app/api/v1/auth.py` → `_handle_failed_login()`
- Configuration: `backend/app/core/config.py` → `RATE_LIMIT_LOGIN_*`
- Test report: `RATE_LIMITING_TEST_REPORT.md`

---

*Last Updated: November 11, 2025*
