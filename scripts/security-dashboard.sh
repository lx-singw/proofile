#!/bin/bash

# Security Dashboard Script for Proofile
# Provides a comprehensive overview of security status

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Icons
CHECK="✅"
CROSS="❌"
WARNING="⚠️"
INFO="ℹ️"

echo -e "${BLUE}🔒 Proofile Security Dashboard${NC}"
echo "=================================="
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to run security check and report status
run_security_check() {
    local check_name="$1"
    local command="$2"
    local success_msg="$3"
    local fail_msg="$4"
    
    echo -n "Checking $check_name... "
    
    if eval "$command" >/dev/null 2>&1; then
        echo -e "${GREEN}${CHECK} $success_msg${NC}"
        return 0
    else
        echo -e "${RED}${CROSS} $fail_msg${NC}"
        return 1
    fi
}

# Initialize counters
total_checks=0
passed_checks=0

echo -e "${BLUE}📋 Security Tools Status${NC}"
echo "------------------------"

# Check if security tools are installed
tools=("git" "docker" "npm" "poetry" "gitleaks" "snyk" "bandit" "safety")
for tool in "${tools[@]}"; do
    total_checks=$((total_checks + 1))
    if command_exists "$tool"; then
        echo -e "${GREEN}${CHECK} $tool installed${NC}"
        passed_checks=$((passed_checks + 1))
    else
        echo -e "${YELLOW}${WARNING} $tool not installed${NC}"
    fi
done

echo ""
echo -e "${BLUE}🔍 Secret Detection${NC}"
echo "-------------------"

# GitLeaks check
total_checks=$((total_checks + 1))
if command_exists "gitleaks"; then
    if gitleaks detect --source . --config .gitleaks.toml >/dev/null 2>&1; then
        echo -e "${GREEN}${CHECK} No secrets detected${NC}"
        passed_checks=$((passed_checks + 1))
    else
        echo -e "${RED}${CROSS} Secrets detected - Review required${NC}"
    fi
else
    echo -e "${YELLOW}${WARNING} GitLeaks not available${NC}"
fi

echo ""
echo -e "${BLUE}📦 Dependency Security${NC}"
echo "----------------------"

# Frontend dependency check
total_checks=$((total_checks + 1))
if [ -f "frontend/package.json" ]; then
    cd frontend
    if npm audit --audit-level=moderate >/dev/null 2>&1; then
        echo -e "${GREEN}${CHECK} Frontend dependencies secure${NC}"
        passed_checks=$((passed_checks + 1))
    else
        echo -e "${RED}${CROSS} Frontend vulnerabilities found${NC}"
    fi
    cd ..
else
    echo -e "${YELLOW}${WARNING} Frontend package.json not found${NC}"
fi

# Backend dependency check
total_checks=$((total_checks + 1))
if [ -f "backend/pyproject.toml" ]; then
    cd backend
    if command_exists "poetry" && command_exists "safety"; then
        if poetry run safety check >/dev/null 2>&1; then
            echo -e "${GREEN}${CHECK} Backend dependencies secure${NC}"
            passed_checks=$((passed_checks + 1))
        else
            echo -e "${RED}${CROSS} Backend vulnerabilities found${NC}"
        fi
    else
        echo -e "${YELLOW}${WARNING} Poetry or Safety not available${NC}"
    fi
    cd ..
else
    echo -e "${YELLOW}${WARNING} Backend pyproject.toml not found${NC}"
fi

echo ""
echo -e "${BLUE}🐳 Container Security${NC}"
echo "--------------------"

# Docker security check
total_checks=$((total_checks + 1))
if command_exists "docker"; then
    if [ -f "frontend/Dockerfile" ] && [ -f "backend/Dockerfile" ]; then
        echo -e "${GREEN}${CHECK} Dockerfiles present${NC}"
        passed_checks=$((passed_checks + 1))
        
        # Check if images exist for scanning
        if docker images | grep -q "proofile"; then
            echo -e "${INFO} Container images available for scanning${NC}"
        else
            echo -e "${YELLOW}${WARNING} No container images built yet${NC}"
        fi
    else
        echo -e "${RED}${CROSS} Dockerfiles missing${NC}"
    fi
else
    echo -e "${YELLOW}${WARNING} Docker not available${NC}"
fi

echo ""
echo -e "${BLUE}🏗️ Infrastructure Security${NC}"
echo "---------------------------"

# Check for security configurations
total_checks=$((total_checks + 1))
security_files=(".gitleaks.toml" "bandit.yaml" ".pre-commit-config.yaml" "SECURITY.md")
security_files_present=0

for file in "${security_files[@]}"; do
    if [ -f "$file" ]; then
        security_files_present=$((security_files_present + 1))
    fi
done

if [ $security_files_present -eq ${#security_files[@]} ]; then
    echo -e "${GREEN}${CHECK} All security configuration files present${NC}"
    passed_checks=$((passed_checks + 1))
else
    echo -e "${YELLOW}${WARNING} Some security configuration files missing${NC}"
fi

echo ""
echo -e "${BLUE}🚀 CI/CD Security${NC}"
echo "-----------------"

# Check GitHub Actions workflows
total_checks=$((total_checks + 1))
if [ -d ".github/workflows" ]; then
    workflow_count=$(find .github/workflows -name "*.yml" -o -name "*.yaml" | wc -l)
    if [ $workflow_count -gt 0 ]; then
        echo -e "${GREEN}${CHECK} GitHub Actions workflows configured ($workflow_count files)${NC}"
        passed_checks=$((passed_checks + 1))
        
        # Check for security workflow
        if [ -f ".github/workflows/security.yml" ]; then
            echo -e "${INFO} Dedicated security workflow present${NC}"
        fi
    else
        echo -e "${YELLOW}${WARNING} No GitHub Actions workflows found${NC}"
    fi
else
    echo -e "${RED}${CROSS} No .github/workflows directory${NC}"
fi

echo ""
echo -e "${BLUE}📊 Security Summary${NC}"
echo "==================="

# Calculate security score
security_score=$((passed_checks * 100 / total_checks))

echo "Security Checks: $passed_checks/$total_checks passed"
echo "Security Score: $security_score%"

if [ $security_score -ge 90 ]; then
    echo -e "${GREEN}${CHECK} Excellent security posture!${NC}"
elif [ $security_score -ge 75 ]; then
    echo -e "${YELLOW}${WARNING} Good security, minor improvements needed${NC}"
elif [ $security_score -ge 50 ]; then
    echo -e "${YELLOW}${WARNING} Moderate security, several improvements needed${NC}"
else
    echo -e "${RED}${CROSS} Poor security posture, immediate action required${NC}"
fi

echo ""
echo -e "${BLUE}🔧 Quick Actions${NC}"
echo "=================="
echo "Run comprehensive security scan: make security-full"
echo "Fix dependency issues: make security-fix"
echo "Generate security report: make security-report"
echo "Install pre-commit hooks: pre-commit install"
echo ""

# Exit with appropriate code
if [ $security_score -ge 75 ]; then
    exit 0
else
    exit 1
fi