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

test-backend:
	@echo "Running backend tests..."
	@echo "--> Recreating test database and applying migrations..."
	docker-compose exec -T postgres dropdb --if-exists -U proofile_user proofile_test
	docker-compose exec -T postgres createdb -U proofile_user proofile_test
	docker-compose exec -e DATABASE_URL="postgresql+asyncpg://proofile_user:proofile_password@postgres:5432/proofile_test" backend alembic upgrade head
	@echo "--> Running pytest..."
	docker-compose exec -e DATABASE_URL="postgresql+asyncpg://proofile_user:proofile_password@postgres:5432/proofile_test" backend poetry run pytest



test-frontend:
	@echo "Running frontend tests..."
	docker-compose exec frontend npm test

lint:
	@echo "Linting all code..."
	pre-commit run --all-files