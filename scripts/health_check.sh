#!/usr/bin/env bash
set -euo pipefail

# Basic health checks for frontend and backend
BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:8000"

echo "Checking frontend: ${FRONTEND_URL}..."
if ! curl -fsS "${FRONTEND_URL}" >/dev/null; then
  echo "Frontend not reachable"
  exit 2
fi

echo "Checking backend /api/v1/auth/me (expected 401)..."
status=$(curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}/api/v1/auth/me" || true)
if [ "${status}" != "401" ] && [ "${status}" != "403" ]; then
  echo "Unexpected backend response code: ${status}"
  exit 3
fi

echo "All health checks passed"
exit 0
