#!/bin/bash

# Docker-based Security Setup for Proofile
# Uses Docker containers for all security tools - no local installation needed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔒 Setting up Proofile Security (Docker-based)${NC}"
echo "=============================================="
echo ""

# Check if Docker is available
if ! command -v docker >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is required but not installed${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker Compose is required but not installed${NC}"
    echo "Please install Docker Compose first"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are available${NC}"
echo ""

echo -e "${BLUE}📦 Pulling Security Tool Images${NC}"
echo "-------------------------------"

# List of security tool images to pull
images=(
    "zricethezav/gitleaks:latest"
    "trufflesecurity/trufflehog:latest"
    "aquasec/trivy:latest"
    "bridgecrew/checkov:latest"
    "hadolint/hadolint:latest"
    "snyk/snyk:node"
    "snyk/snyk:python"
    "ghcr.io/google/osv-scanner:latest"
    "returntocorp/semgrep:latest"
)

for image in "${images[@]}"; do
    echo -n "Pulling $image... "
    if docker pull "$image" >/dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌${NC}"
    fi
done

echo ""
echo -e "${BLUE}🔧 Setting up Configuration Files${NC}"
echo "---------------------------------"

# Check if security config files exist
config_files=(
    ".gitleaks.toml"
    "sonar-project.properties"
    "frontend/.eslintrc-security.js"
    "backend/bandit.yaml"
    ".pre-commit-config.yaml"
    "SECURITY.md"
)

for file in "${config_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file exists${NC}"
    else
        echo -e "${YELLOW}⚠️ $file missing${NC}"
    fi
done

echo ""
echo -e "${BLUE}🔑 Environment Variables Setup${NC}"
echo "------------------------------"

# Check if .env file exists
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}⚠️ .env file not found. Creating from .env.example...${NC}"
        cp .env.example .env
        echo -e "${GREEN}✅ .env file created${NC}"
    else
        echo -e "${YELLOW}⚠️ Creating basic .env file...${NC}"
        cat > .env << 'EOF'
# Security Tool Tokens (Optional - for enhanced features)
SNYK_TOKEN=
SONAR_TOKEN=
SEMGREP_APP_TOKEN=

# Application Configuration
DATABASE_URL=postgresql://postgres:password@db:5432/proofile
REDIS_URL=redis://redis:6379
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
EOF
        echo -e "${GREEN}✅ Basic .env file created${NC}"
    fi
fi

# Check environment variables
echo ""
echo "Security token status:"
if [ -n "$SNYK_TOKEN" ]; then
    echo -e "${GREEN}✅ SNYK_TOKEN is set${NC}"
else
    echo -e "${YELLOW}⚠️ SNYK_TOKEN not set (optional)${NC}"
fi

if [ -n "$SONAR_TOKEN" ]; then
    echo -e "${GREEN}✅ SONAR_TOKEN is set${NC}"
else
    echo -e "${YELLOW}⚠️ SONAR_TOKEN not set (optional)${NC}"
fi

if [ -n "$SEMGREP_APP_TOKEN" ]; then
    echo -e "${GREEN}✅ SEMGREP_APP_TOKEN is set${NC}"
else
    echo -e "${YELLOW}⚠️ SEMGREP_APP_TOKEN not set (optional)${NC}"
fi

echo ""
echo -e "${BLUE}🧪 Testing Security Setup${NC}"
echo "-------------------------"

# Test basic security scan
echo "Running quick security test..."
echo -n "Testing GitLeaks... "
if docker run --rm -v "$(pwd):/repo" zricethezav/gitleaks:latest detect --source /repo --no-git >/dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${YELLOW}⚠️ (may have found issues - check manually)${NC}"
fi

echo -n "Testing Trivy... "
if docker run --rm aquasec/trivy:latest --version >/dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

echo -n "Testing Hadolint... "
if docker run --rm hadolint/hadolint:latest --version >/dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Security setup complete!${NC}"
echo ""
echo -e "${BLUE}🚀 Quick Start Commands:${NC}"
echo "------------------------"
echo "Run quick security scan:     make security-scan"
echo "Run Docker-based full scan:  make security-docker-all"
echo "Check security environment:  make security-env-check"
echo "Generate security report:    make security-report"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Set up security tokens in .env file (optional but recommended):"
echo "   - Get Snyk token: https://app.snyk.io/account"
echo "   - Get SonarCloud token: https://sonarcloud.io/account/security"
echo "   - Get Semgrep token: https://semgrep.dev/manage/settings"
echo ""
echo "2. Add these secrets to your GitHub repository:"
echo "   - SNYK_TOKEN"
echo "   - SONAR_TOKEN"
echo "   - SEMGREP_APP_TOKEN"
echo ""
echo "3. Enable GitHub Security features:"
echo "   - Go to Settings > Security & analysis"
echo "   - Enable Dependabot alerts"
echo "   - Enable Code scanning alerts"
echo "   - Enable Secret scanning alerts"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "- Security Policy: SECURITY.md"
echo "- All commands: make help"
echo ""
echo -e "${GREEN}Your repository security gate is now ready! 🔒${NC}"