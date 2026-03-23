#!/bin/bash

# ============================================
# BluePrint SaaS - Security Check Script
# ============================================
# This script performs security checks on the codebase
# Run: chmod +x scripts/security-check.sh && ./scripts/security-check.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           BluePrint SaaS - Security Check                     ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================
# Helper Functions
# ============================================

pass() {
    echo -e "${GREEN}✓${NC} $1"
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

warn() {
    echo -e "${YELLOW}!${NC} $1"
    ((WARNINGS++))
}

# ============================================
# Environment Checks
# ============================================

echo ""
echo -e "${BLUE}=== Environment Variables ===${NC}"
echo ""

# Check .env file
if [ -f .env ]; then
    pass ".env file exists"
    
    # Check for placeholder values
    if grep -qi "change-me\|changeme\|secret123\|password123" .env 2>/dev/null; then
        fail "Placeholder values found in .env file"
    else
        pass "No placeholder values found"
    fi
    
    # Check JWT_SECRET length
    JWT_SECRET=$(grep "^JWT_SECRET=" .env 2>/dev/null | cut -d'=' -f2)
    if [ -n "$JWT_SECRET" ]; then
        if [ ${#JWT_SECRET} -ge 32 ]; then
            pass "JWT_SECRET is at least 32 characters"
        else
            fail "JWT_SECRET is less than 32 characters (${#JWT_SECRET} chars)"
        fi
    else
        warn "JWT_SECRET not found in .env"
    fi
    
    # Check ENCRYPTION_KEY
    ENCRYPTION_KEY=$(grep "^ENCRYPTION_KEY=" .env 2>/dev/null | cut -d'=' -f2)
    if [ -n "$ENCRYPTION_KEY" ]; then
        if [ ${#ENCRYPTION_KEY} -eq 64 ]; then
            pass "ENCRYPTION_KEY is properly formatted (64 hex chars)"
        else
            fail "ENCRYPTION_KEY should be 64 hex characters (${#ENCRYPTION_KEY} chars)"
        fi
    else
        warn "ENCRYPTION_KEY not found - sensitive data won't be encrypted"
    fi
else
    warn ".env file not found (using defaults)"
fi

# Check .env is in .gitignore
if [ -f .gitignore ]; then
    if grep -q ".env" .gitignore; then
        pass ".env is in .gitignore"
    else
        fail ".env is NOT in .gitignore - SECURITY RISK!"
    fi
else
    warn ".gitignore not found"
fi

# ============================================
# Code Security Checks
# ============================================

echo ""
echo -e "${BLUE}=== Code Security ===${NC}"
echo ""

# Check for hardcoded passwords in code
echo "Checking for hardcoded secrets..."
HARDCODED=$(grep -r --include="*.ts" --include="*.tsx" --include="*.js" \
    -E "(password\s*[:=]\s*['\"][^'\"]+['\"]|secret\s*[:=]\s*['\"][^'\"]+['\"]|api_key\s*[:=]\s*['\"][^'\"]+['\"])" \
    src/ 2>/dev/null | grep -v "type\|interface\|//" | head -5 || true)

if [ -z "$HARDCODED" ]; then
    pass "No hardcoded passwords/secrets found"
else
    fail "Potential hardcoded secrets found:"
    echo "$HARDCODED"
fi

# Check for console.log with sensitive data
SENSITIVE_LOGS=$(grep -r --include="*.ts" --include="*.tsx" \
    -E "console\.(log|error).*\(.*(password|token|secret|key|auth)" \
    src/ 2>/dev/null | grep -v "node_modules" | head -5 || true)

if [ -z "$SENSITIVE_LOGS" ]; then
    pass "No sensitive data in console.log statements"
else
    warn "Potential sensitive data logging found - review these:"
    echo "$SENSITIVE_LOGS"
fi

# Check for eval usage
EVAL_USAGE=$(grep -r --include="*.ts" --include="*.tsx" --include="*.js" \
    -E "eval\s*\(" src/ 2>/dev/null | head -5 || true)

if [ -z "$EVAL_USAGE" ]; then
    pass "No eval() usage found"
else
    fail "eval() usage found - potential security risk:"
    echo "$EVAL_USAGE"
fi

# Check for dangerouslySetInnerHTML
DANGEROUS_HTML=$(grep -r --include="*.tsx" \
    "dangerouslySetInnerHTML" src/ 2>/dev/null | head -5 || true)

if [ -z "$DANGEROUS_HTML" ]; then
    pass "No dangerouslySetInnerHTML usage found"
else
    warn "dangerouslySetInnerHTML usage found - ensure content is sanitized:"
    echo "$DANGEROUS_HTML"
fi

# ============================================
# Docker Security Checks
# ============================================

echo ""
echo -e "${BLUE}=== Docker Security ===${NC}"
echo ""

# Check docker-compose for exposed ports
if [ -f docker-compose.yml ]; then
    # Check if database ports are exposed to 0.0.0.0
    if grep -E "ports:.*-.*['\"]?0\.0\.0\.0:5432" docker-compose.yml 2>/dev/null; then
        fail "Database port exposed to all interfaces in docker-compose.yml"
    else
        pass "Database port not exposed to all interfaces"
    fi
    
    # Check for hardcoded passwords
    if grep -E "POSTGRES_PASSWORD.*:" docker-compose.yml 2>/dev/null | grep -v '\${' | grep -v '#' > /dev/null; then
        fail "Hardcoded database password in docker-compose.yml"
    else
        pass "Database password uses environment variable"
    fi
fi

if [ -f docker-compose.prod.yml ]; then
    # Check production compose file
    if grep -E "ports:.*-.*['\"]?5432" docker-compose.prod.yml 2>/dev/null; then
        warn "Database port exposed in production docker-compose"
    else
        pass "Database port not exposed in production config"
    fi
fi

# ============================================
# Dependency Security
# ============================================

echo ""
echo -e "${BLUE}=== Dependency Security ===${NC}"
echo ""

# Check for known vulnerabilities
if command -v npm &> /dev/null; then
    echo "Running npm audit..."
    if npm audit --audit-level=high 2>/dev/null | grep -q "0 vulnerabilities"; then
        pass "No high/critical vulnerabilities in dependencies"
    else
        warn "Vulnerabilities found in dependencies - run 'npm audit' for details"
    fi
fi

# ============================================
# File Permissions
# ============================================

echo ""
echo -e "${BLUE}=== File Permissions ===${NC}"
echo ""

# Check for sensitive files with wrong permissions
if [ -f .env ]; then
    ENV_PERMS=$(stat -c "%a" .env 2>/dev/null || stat -f "%Lp" .env 2>/dev/null)
    if [ "$ENV_PERMS" = "600" ] || [ "$ENV_PERMS" = "400" ]; then
        pass ".env has restricted permissions ($ENV_PERMS)"
    else
        warn ".env permissions should be 600 (current: $ENV_PERMS)"
        echo "  Fix: chmod 600 .env"
    fi
fi

# ============================================
# Summary
# ============================================

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                      Summary                                  ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}Errors: $ERRORS${NC}"
else
    echo -e "${GREEN}Errors: 0${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
else
    echo -e "${GREEN}Warnings: 0${NC}"
fi

echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}Security issues found! Please fix the errors above.${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}Security check passed with warnings. Review the items above.${NC}"
    exit 0
else
    echo -e "${GREEN}All security checks passed!${NC}"
    exit 0
fi
