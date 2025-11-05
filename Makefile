.PHONY: setup-dev start-dev stop-dev migrate test-backend test-frontend lint

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

test-backend:
	@echo "Running backend tests..."
	docker-compose exec backend poetry run pytest

test-frontend:
	@echo "Running frontend tests..."
	docker-compose exec frontend npm test

lint:
	@echo "Linting all code..."
	pre-commit run --all-files