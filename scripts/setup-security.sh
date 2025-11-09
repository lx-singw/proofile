#!/bin/bash

# Security Tools Setup Script for Proofile
# Installs and configures all security tools

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔒 Setting up Proofile Security Tools${NC}"
echo "====================================="
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install tool if not present
install_tool() {
    local tool_name="$1"
    local install_command="$2"
    local check_command="${3:-$tool_name}"
    
    echo -n "Checking $tool_name... "
    
    if command_exists "$check_command"; then
        echo -e "${GREEN}✅ Already installed${NC}"
    else
        echo -e "${YELLOW}⚠️ Installing...${NC}"
        eval "$install_command"
        if command_exists "$check_command"; then
            echo -e "${GREEN}✅ $tool_name installed successfully${NC}"
        else
            echo -e "${RED}❌ Failed to install $tool_name${NC}"
            return 1
        fi
    fi
}

echo -e "${BLUE}📦 Installing Security Tools${NC}"
echo "----------------------------"

# Install GitLeaks
install_tool "GitLeaks" "
    if [[ \"\$OSTYPE\" == \"linux-gnu\"* ]]; then
        curl -sSfL https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_linux_x64.tar.gz | tar -xz -C /tmp
        sudo mv /tmp/gitleaks /usr/local/bin/
    elif [[ \"\$OSTYPE\" == \"darwin\"* ]]; then
        brew install gitleaks
    fi
" "gitleaks"

# Install TruffleHog (via Docker)
echo -n "Checking TruffleHog... "
if docker images | grep -q "trufflesecurity/trufflehog"; then
    echo -e "${GREEN}✅ Docker image available${NC}"
else
    echo -e "${YELLOW}⚠️ Pulling Docker image...${NC}"
    docker pull trufflesecurity/trufflehog:latest
    echo -e "${GREEN}✅ TruffleHog Docker image ready${NC}"
fi

# Install Snyk
install_tool "Snyk" "npm install -g snyk" "snyk"

# Install Trivy (via Docker)
echo -n "Checking Trivy... "
if docker images | grep -q "aquasec/trivy"; then
    echo -e "${GREEN}✅ Docker image available${NC}"
else
    echo -e "${YELLOW}⚠️ Pulling Docker image...${NC}"
    docker pull aquasec/trivy:latest
    echo -e "${GREEN}✅ Trivy Docker image ready${NC}"
fi

# Install Checkov (via Docker)
echo -n "Checking Checkov... "
if docker images | grep -q "bridgecrew/checkov"; then
    echo -e "${GREEN}✅ Docker image available${NC}"
else
    echo -e "${YELLOW}⚠️ Pulling Docker image...${NC}"
    docker pull bridgecrew/checkov:latest
    echo -e "${GREEN}✅ Checkov Docker image ready${NC}"
fi

# Install Hadolint (via Docker)
echo -n "Checking Hadolint... "
if docker images | grep -q "hadolint/hadolint"; then
    echo -e "${GREEN}✅ Docker image available${NC}"
else
    echo -e "${YELLOW}⚠️ Pulling Docker image...${NC}"
    docker pull hadolint/hadolint:latest
    echo -e "${GREEN}✅ Hadolint Docker image ready${NC}"
fi

echo ""
echo -e "${BLUE}🐍 Setting up Python Security Tools${NC}"
echo "-----------------------------------"

# Check if we're in the backend directory or need to navigate
if [ -f "pyproject.toml" ]; then
    BACKEND_DIR="."
elif [ -f "backend/pyproject.toml" ]; then
    BACKEND_DIR="backend"
else
    echo -e "${RED}❌ Could not find backend pyproject.toml${NC}"
    exit 1
fi

cd "$BACKEND_DIR"

# Install Python security tools via Poetry
echo "Installing Python security tools..."
poetry add --group dev bandit safety semgrep

echo ""
echo -e "${BLUE}🌐 Setting up Frontend Security Tools${NC}"
echo "------------------------------------"

# Navigate back to root if we were in backend
if [ "$BACKEND_DIR" = "backend" ]; then
    cd ..
fi

# Check if we're in the frontend directory or need to navigate
if [ -f "package.json" ]; then
    FRONTEND_DIR="."
elif [ -f "frontend/package.json" ]; then
    FRONTEND_DIR="frontend"
else
    echo -e "${RED}❌ Could not find frontend package.json${NC}"
    exit 1
fi

cd "$FRONTEND_DIR"

# Install Node.js security tools
echo "Installing Node.js security tools..."
npm install --save-dev eslint-plugin-security snyk

# Navigate back to root if we were in frontend
if [ "$FRONTEND_DIR" = "frontend" ]; then
    cd ..
fi

echo ""
echo -e "${BLUE}🔧 Setting up Pre-commit Hooks${NC}"
echo "------------------------------"

# Install pre-commit if not present
if ! command_exists "pre-commit"; then
    echo "Installing pre-commit..."
    pip install pre-commit
fi

# Install pre-commit hooks
echo "Installing pre-commit hooks..."
pre-commit install
pre-commit install --hook-type commit-msg

echo ""
echo -e "${BLUE}🔑 Setting up Environment Variables${NC}"
echo "-----------------------------------"

# Create .env.example if it doesn't exist
if [ ! -f ".env.example" ]; then
    echo "Creating .env.example..."
    cat > .env.example << 'EOF'
# Security Configuration
SNYK_TOKEN=your_snyk_token_here
SONAR_TOKEN=your_sonar_token_here
SEMGREP_APP_TOKEN=your_semgrep_token_here

# Application Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/proofile
REDIS_URL=redis://localhost:6379
JWT_SECRET_KEY=your_jwt_secret_here
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
EOF
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️ .env file not found. Copy .env.example and configure your secrets:${NC}"
    echo "cp .env.example .env"
    echo ""
fi

echo ""
echo -e "${BLUE}📋 Security Configuration Summary${NC}"
echo "=================================="

# Run security dashboard to show current status
if [ -f "scripts/security-dashboard.sh" ]; then
    ./scripts/security-dashboard.sh
else
    echo -e "${YELLOW}⚠️ Security dashboard script not found${NC}"
fi

echo ""
echo -e "${GREEN}✅ Security setup complete!${NC}"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "1. Configure your security tokens in .env file"
echo "2. Run: make security-scan"
echo "3. Set up GitHub repository secrets:"
echo "   - SNYK_TOKEN"
echo "   - SONAR_TOKEN" 
echo "   - SEMGREP_APP_TOKEN"
echo "4. Enable GitHub Security features:"
echo "   - Dependabot alerts"
echo "   - Code scanning alerts"
echo "   - Secret scanning alerts"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "- Security Policy: SECURITY.md"
echo "- Run security dashboard: ./scripts/security-dashboard.sh"
echo "- Security commands: make help"
echo ""