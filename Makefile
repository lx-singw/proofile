.PHONY: setup-dev start-dev stop-dev migrate test-backend test-frontend lint security-scan security-full security-secrets security-deps security-containers security-infra security-fix

# Development commands
setup-dev:
	@echo "Setting up development environment..."
	./scripts/dev/setup-dev.sh

start-dev:
	@echo "Starting development services..."
	docker-compose up -d --build

stop-dev:
	@echo "Stopping development services..."
	docker-compose down

migrate:
	@echo "Running database migrations..."
	docker-compose exec backend alembic upgrade head

# Testing commands
test-backend:
	@echo "Running backend tests..."
	docker-compose exec backend bash -c "cd /app && poetry run pytest"

test-frontend:
	@echo "Running frontend tests..."
	docker-compose exec frontend npm test

lint:
	@echo "Linting all code..."
	pre-commit run --all-files

# Security commands
security-scan:
	@echo "🔒 Running quick security scan..."
	@echo "Checking for secrets..."
	docker run --rm -v "$(PWD):/repo" zricethezav/gitleaks:latest detect --source /repo --verbose || true
	@echo "Scanning dependencies..."
	docker-compose exec frontend npm audit --audit-level=moderate || true
	docker-compose exec backend poetry run safety check || true

security-full:
	@echo "🔒 Running comprehensive security scan..."
	@$(MAKE) security-secrets
	@$(MAKE) security-deps
	@$(MAKE) security-containers
	@$(MAKE) security-infra

security-secrets:
	@echo "🔍 Scanning for secrets and credentials..."
	@echo "Running GitLeaks..."
	docker run --rm -v "$(PWD):/repo" zricethezav/gitleaks:latest detect --source /repo --config /repo/.gitleaks.toml --verbose
	@echo "Running TruffleHog..."
	docker run --rm -v "$(PWD):/repo" trufflesecurity/trufflehog:latest filesystem /repo --only-verified

security-deps:
	@echo "📦 Scanning dependencies for vulnerabilities..."
	@echo "Frontend dependencies..."
	docker-compose exec frontend npm audit --audit-level=moderate || true
	docker run --rm -v "$(PWD)/frontend:/app" -w /app node:20-alpine sh -c "npm ci && npx snyk test --severity-threshold=medium" || true
	@echo "Backend dependencies..."
	docker-compose exec backend poetry run safety check || true
	docker-compose exec backend poetry run bandit -r app/ -f json || true

security-containers:
	@echo "🐳 Scanning container images..."
	@echo "Building images for scanning..."
	docker build -t proofile-frontend:security-scan ./frontend
	docker build -t proofile-backend:security-scan ./backend
	@echo "Scanning with Trivy..."
	docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image proofile-frontend:security-scan
	docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image proofile-backend:security-scan
	@echo "Scanning Dockerfiles with Hadolint..."
	docker run --rm -i hadolint/hadolint:latest < frontend/Dockerfile
	docker run --rm -i hadolint/hadolint:latest < backend/Dockerfile

security-infra:
	@echo "🏗️ Scanning infrastructure configurations..."
	@echo "Running Checkov..."
	docker run --rm -v "$(PWD):/tf" bridgecrew/checkov -d /tf --framework dockerfile --framework kubernetes --framework terraform || true
	@echo "Running Hadolint on Dockerfiles..."
	docker run --rm -i hadolint/hadolint < frontend/Dockerfile || true
	docker run --rm -i hadolint/hadolint < backend/Dockerfile || true

security-fix:
	@echo "🔧 Attempting to fix security issues..."
	@echo "Fixing frontend dependencies..."
	cd frontend && npm audit fix || true
	@echo "Updating backend dependencies..."
	cd backend && poetry update || true
	@echo "Running security patches..."
	cd frontend && npx snyk wizard || true

security-monitor:
	@echo "📊 Setting up security monitoring..."
	cd frontend && npx snyk monitor || true
	cd backend && snyk monitor || true

# Security report generation
security-report:
	@echo "📋 Generating security report..."
	@mkdir -p security/reports
	@echo "# Security Scan Report - $(shell date)" > security/reports/security-report.md
	@echo "" >> security/reports/security-report.md
	@echo "## Summary" >> security/reports/security-report.md
	@echo "" >> security/reports/security-report.md
	@echo "- Secrets Scan: $(shell gitleaks detect --source . --config .gitleaks.toml > /dev/null 2>&1 && echo '✅ PASS' || echo '❌ FAIL')" >> security/reports/security-report.md
	@echo "- Dependency Scan: $(shell cd frontend && npm audit --audit-level=moderate > /dev/null 2>&1 && echo '✅ PASS' || echo '❌ FAIL')" >> security/reports/security-report.md
	@echo "- Container Scan: Requires manual review" >> security/reports/security-report.md
	@echo "" >> security/reports/security-report.md
	@echo "Report generated at: $(shell date)" >> security/reports/security-report.md
	@echo "Security report saved to security/reports/security-report.md"

# Docker-based security commands
security-docker-secrets:
	@echo "🔍 Docker-based secret scanning..."
	docker-compose -f docker-compose.security.yml run --rm gitleaks
	docker-compose -f docker-compose.security.yml run --rm trufflehog

security-docker-deps:
	@echo "📦 Docker-based dependency scanning..."
	docker-compose -f docker-compose.security.yml run --rm snyk-frontend || true
	docker-compose -f docker-compose.security.yml run --rm snyk-backend || true
	docker-compose -f docker-compose.security.yml run --rm osv-scanner || true

security-docker-containers:
	@echo "🐳 Docker-based container scanning..."
	@echo "Building images first..."
	docker-compose build
	docker-compose -f docker-compose.security.yml run --rm trivy-frontend || true
	docker-compose -f docker-compose.security.yml run --rm trivy-backend || true
	docker-compose -f docker-compose.security.yml run --rm hadolint-frontend
	docker-compose -f docker-compose.security.yml run --rm hadolint-backend

security-docker-infra:
	@echo "🏗️ Docker-based infrastructure scanning..."
	docker-compose -f docker-compose.security.yml run --rm checkov

security-docker-sast:
	@echo "🔍 Docker-based SAST scanning..."
	docker-compose -f docker-compose.security.yml run --rm semgrep

security-docker-all:
	@echo "🔒 Running all Docker-based security scans..."
	@$(MAKE) security-docker-secrets
	@$(MAKE) security-docker-deps
	@$(MAKE) security-docker-containers
	@$(MAKE) security-docker-infra
	@$(MAKE) security-docker-sast

# Security environment setup
security-env-check:
	@echo "🔑 Checking security environment..."
	@if [ -z "$$SNYK_TOKEN" ]; then echo "⚠️ SNYK_TOKEN not set"; fi
	@if [ -z "$$SEMGREP_APP_TOKEN" ]; then echo "⚠️ SEMGREP_APP_TOKEN not set"; fi
	@if [ -z "$$SONAR_TOKEN" ]; then echo "⚠️ SONAR_TOKEN not set"; fi
	@echo "✅ Environment check complete"

# Help command
help:
	@echo "Available commands:"
	@echo "  Development:"
	@echo "    setup-dev       - Set up development environment"
	@echo "    start-dev       - Start development services"
	@echo "    stop-dev        - Stop development services"
	@echo "    migrate         - Run database migrations"
	@echo "  Testing:"
	@echo "    test-backend    - Run backend tests"
	@echo "    test-frontend   - Run frontend tests"
	@echo "    lint            - Run linting on all code"
	@echo "  Security (Local):"
	@echo "    security-scan   - Quick security scan"
	@echo "    security-full   - Comprehensive security scan"
	@echo "    security-secrets - Scan for secrets and credentials"
	@echo "    security-deps   - Scan dependencies for vulnerabilities"
	@echo "    security-containers - Scan container images"
	@echo "    security-infra  - Scan infrastructure configurations"
	@echo "    security-fix    - Attempt to fix security issues"
	@echo "    security-monitor - Set up security monitoring"
	@echo "    security-report - Generate security report"
	@echo "  Security (Docker):"
	@echo "    security-docker-all - Run all Docker-based security scans"
	@echo "    security-docker-secrets - Docker-based secret scanning"
	@echo "    security-docker-deps - Docker-based dependency scanning"
	@echo "    security-docker-containers - Docker-based container scanning"
	@echo "    security-docker-infra - Docker-based infrastructure scanning"
	@echo "    security-docker-sast - Docker-based SAST scanning"
	@echo "    security-env-check - Check security environment variables"