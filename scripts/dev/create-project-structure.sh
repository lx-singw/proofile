#!/bin/bash
# create-project-structure.sh: Scaffolds the complete monorepo structure for Proofile.

echo "🏗️  Scaffolding the Proofile project structure..."

# --- 1. Create Core Directories ---
mkdir -p \
  backend/{app/{api/v1,core,models,schemas,services,utils,tasks,tests/integration},alembic/versions,scripts} \
  frontend \
  mobile/src/{components/{common,profile,jobs,verification},screens/{auth,profile,jobs,dashboard},navigation,services,hooks,utils,types} \
  infrastructure/{terraform/environments/{dev,staging,production},kubernetes/{applications,configmaps,secrets,monitoring},docker/{backend,frontend,nginx}} \
  docs/{api,architecture,user-guides,development,business,legal} \
  scripts/{dev,deployment,data,monitoring} \
 .github/{workflows,ISSUE_TEMPLATE} \
  legal/contracts/{templates,executed} \
  qa/{test-plans,automation/{selenium,api-tests,mobile-tests},reports} \
  security/{policies,scans,certificates,audits} \
  ml-models/{job-matching,skills-extraction,fraud-detection} \
  partnerships/{seta-partnerships,training-providers,employers,government} \
  analytics/{notebooks,reports,dashboards} \
  data/{fixtures,samples,migrations} \
  integrations/{seta-apis,job-boards,whatsapp,ai-services} \
  localization/translations/{en,af,zu,xh}

echo "✅ Core directories created."

# --- 2. Create Root-Level Config Files ---
touch \
  README.md \
 .gitignore \
 .env.example \
  docker-compose.yml \
  Makefile \
 .pre-commit-config.yaml \
 .gitattributes \
  LICENSE \
  CONTRIBUTING.md

# --- 3. Populate Key Configuration Files ---

#.gitignore
cat >.gitignore << 'EOF'
# Environments
.env
.venv
venv/
.idea/
.vscode/

# Python
__pycache__/
*.pyc
*.pyo
*.pyd

# Node
node_modules/
.next/
npm-debug.log
yarn-error.log

# Build artifacts
dist/
build/
*.DS_Store
EOF

# Makefile for simplified commands
cat > Makefile << 'EOF'
.PHONY: setup-dev start-dev stop-dev test-all lint

setup-dev:
	@echo "Setting up development environment..."
	./scripts/dev/setup-dev.sh

start-dev:
	@echo "Starting development services..."
	docker-compose up -d --build

stop-dev:
	@echo "Stopping development services..."
	docker-compose down

test-backend:
	@echo "Running backend tests..."
	docker-compose exec backend poetry run pytest

test-frontend:
	@echo "Running frontend tests..."
	docker-compose exec frontend npm test

lint:
	@echo "Linting all code..."
	pre-commit run --all-files
EOF

echo "✅ Key config files populated."

# --- 4. Create Placeholder Backend Files ---
touch backend/app/__init__.py backend/app/main.py
touch backend/app/api/__init__.py backend/app/api/deps.py
touch backend/app/api/v1/__init__.py backend/app/api/v1/api.py
touch backend/{Dockerfile,.dockerignore,pyproject.toml}

echo "✅ Backend placeholders created."

echo "🎉 Project structure for Proofile scaffolded successfully!"