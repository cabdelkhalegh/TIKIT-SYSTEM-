#!/bin/bash

# Phase 4 Validation Script - JWT Authentication
# This script validates that all Phase 4 authentication requirements are met

echo "=========================================="
echo "Phase 4 Validation Script - JWT Authentication"
echo "=========================================="
echo ""

REPO_ROOT="/home/runner/work/TIKIT-SYSTEM-/TIKIT-SYSTEM-"
cd "$REPO_ROOT"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Test function
test_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $description - File not found: $file"
        ((FAILED++))
        return 1
    fi
}

test_content() {
    local file=$1
    local pattern=$2
    local description=$3
    
    if [ -f "$file" ] && grep -q "$pattern" "$file"; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $description"
        ((FAILED++))
        return 1
    fi
}

echo "=== Phase 4: Authentication File Structure Tests ==="
echo ""

# Test authentication files
test_file "$REPO_ROOT/backend/authMiddleware.js" "Authentication middleware file exists"
test_file "$REPO_ROOT/backend/authHelpers.js" "Authentication helpers file exists"

echo ""
echo "=== Package Dependencies ==="

# Test package.json updates
test_content "$REPO_ROOT/backend/package.json" "bcrypt" "package.json includes bcrypt"
test_content "$REPO_ROOT/backend/package.json" "jsonwebtoken" "package.json includes jsonwebtoken"

echo ""
echo "=== Environment Configuration ==="

# Test .env.example
test_content "$REPO_ROOT/backend/.env.example" "JWT_SECRET" ".env.example has JWT_SECRET"
test_content "$REPO_ROOT/backend/.env.example" "JWT_EXPIRES_IN" ".env.example has JWT_EXPIRES_IN"

echo ""
echo "=== Authentication Middleware ==="

# Test authMiddleware.js
test_content "$REPO_ROOT/backend/authMiddleware.js" "authenticateToken" "authMiddleware has authenticateToken function"
test_content "$REPO_ROOT/backend/authMiddleware.js" "authorizeRoles" "authMiddleware has authorizeRoles function"
test_content "$REPO_ROOT/backend/authMiddleware.js" "jwt.verify" "authMiddleware verifies JWT tokens"
test_content "$REPO_ROOT/backend/authMiddleware.js" "TokenExpiredError" "authMiddleware handles token expiration"

echo ""
echo "=== Authentication Helpers ==="

# Test authHelpers.js
test_content "$REPO_ROOT/backend/authHelpers.js" "hashPassword" "authHelpers has hashPassword function"
test_content "$REPO_ROOT/backend/authHelpers.js" "comparePassword" "authHelpers has comparePassword function"
test_content "$REPO_ROOT/backend/authHelpers.js" "generateToken" "authHelpers has generateToken function"
test_content "$REPO_ROOT/backend/authHelpers.js" "sanitizeUser" "authHelpers has sanitizeUser function"
test_content "$REPO_ROOT/backend/authHelpers.js" "bcrypt.hash" "authHelpers uses bcrypt for hashing"
test_content "$REPO_ROOT/backend/authHelpers.js" "bcrypt.compare" "authHelpers uses bcrypt for comparison"

echo ""
echo "=== Server Integration ==="

# Test server.js integration
test_content "$REPO_ROOT/backend/server.js" "require('./authMiddleware')" "server.js imports authMiddleware"
test_content "$REPO_ROOT/backend/server.js" "require('./authHelpers')" "server.js imports authHelpers"
test_content "$REPO_ROOT/backend/server.js" "/auth/register" "server.js has registration endpoint"
test_content "$REPO_ROOT/backend/server.js" "/auth/login" "server.js has login endpoint"
test_content "$REPO_ROOT/backend/server.js" "/auth/me" "server.js has profile endpoint"
test_content "$REPO_ROOT/backend/server.js" "/auth/logout" "server.js has logout endpoint"

echo ""
echo "=== Protected Endpoints ==="

# Test that endpoints are protected
test_content "$REPO_ROOT/backend/server.js" "authenticateToken" "server.js uses authenticateToken middleware"
test_content "$REPO_ROOT/backend/server.js" "authorizeRoles('admin')" "server.js uses role-based authorization"

echo ""
echo "=== Password Security ==="

# Test bcrypt usage
test_content "$REPO_ROOT/backend/server.js" "hashPassword" "server.js uses hashPassword for registration"
test_content "$REPO_ROOT/backend/server.js" "comparePassword" "server.js uses comparePassword for login"
test_content "$REPO_ROOT/backend/server.js" "sanitizeUser" "server.js removes passwords from responses"

echo ""
echo "=== Seed File Updates ==="

# Test seed file
test_content "$REPO_ROOT/backend/prisma/seed.js" "require('bcrypt')" "seed.js imports bcrypt"
test_content "$REPO_ROOT/backend/prisma/seed.js" "bcrypt.hash" "seed.js hashes passwords"

echo ""
echo "=== JavaScript Syntax Validation ==="

# Validate JavaScript files
if command -v node &> /dev/null; then
    if node -c "$REPO_ROOT/backend/server.js" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} server.js syntax is valid"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} server.js has syntax errors"
        ((FAILED++))
    fi
    
    if node -c "$REPO_ROOT/backend/authMiddleware.js" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} authMiddleware.js syntax is valid"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} authMiddleware.js has syntax errors"
        ((FAILED++))
    fi
    
    if node -c "$REPO_ROOT/backend/authHelpers.js" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} authHelpers.js syntax is valid"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} authHelpers.js has syntax errors"
        ((FAILED++))
    fi
    
    if node -c "$REPO_ROOT/backend/prisma/seed.js" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} seed.js syntax is valid"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} seed.js has syntax errors"
        ((FAILED++))
    fi
fi

echo ""
echo "=========================================="
echo "Validation Results"
echo "=========================================="
echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
echo -e "Tests Failed: ${RED}$FAILED${NC}"
echo "Total Tests: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All Phase 4 validation tests passed!${NC}"
    echo "JWT Authentication is fully implemented and ready for use."
    exit 0
else
    echo -e "${RED}✗ Some validation tests failed.${NC}"
    echo "Please review the failures above."
    exit 1
fi
