#!/bin/bash

# Phase 3 Validation Script - Prisma ORM Setup
# This script validates that all Phase 3 Prisma requirements are met

echo "=========================================="
echo "Phase 3 Validation Script - Prisma ORM"
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

echo "=== Phase 3: Prisma File Structure Tests ==="
echo ""

# Test Prisma files
test_file "$REPO_ROOT/backend/prisma/schema.prisma" "Prisma schema file exists"
test_file "$REPO_ROOT/backend/prisma/seed.js" "Prisma seed file exists"
test_file "$REPO_ROOT/backend/prismaClient.js" "Prisma client wrapper exists"

echo ""
echo "=== Prisma Schema Configuration ==="

# Test Prisma schema content
test_content "$REPO_ROOT/backend/prisma/schema.prisma" "generator client" "Schema has client generator"
test_content "$REPO_ROOT/backend/prisma/schema.prisma" "datasource db" "Schema has datasource configuration"
test_content "$REPO_ROOT/backend/prisma/schema.prisma" "provider = \"postgresql\"" "Schema uses PostgreSQL"
test_content "$REPO_ROOT/backend/prisma/schema.prisma" "model User" "Schema has User model"
test_content "$REPO_ROOT/backend/prisma/schema.prisma" "model Ticket" "Schema has Ticket model"

echo ""
echo "=== Package.json Configuration ==="

# Test package.json updates
test_content "$REPO_ROOT/backend/package.json" "@prisma/client" "package.json includes @prisma/client"
test_content "$REPO_ROOT/backend/package.json" "\"prisma\"" "package.json includes prisma dev dependency"
test_content "$REPO_ROOT/backend/package.json" "prisma:generate" "package.json has prisma:generate script"
test_content "$REPO_ROOT/backend/package.json" "prisma:migrate" "package.json has prisma:migrate script"
test_content "$REPO_ROOT/backend/package.json" "prisma:seed" "package.json has prisma:seed script"

echo ""
echo "=== Server Integration ==="

# Test server.js integration
test_content "$REPO_ROOT/backend/server.js" "require('./prismaClient')" "server.js imports Prisma client"
test_content "$REPO_ROOT/backend/server.js" "/prisma-test" "server.js has Prisma test endpoint"
test_content "$REPO_ROOT/backend/server.js" "/api/users" "server.js has users API endpoint"
test_content "$REPO_ROOT/backend/server.js" "/api/tickets" "server.js has tickets API endpoint"
test_content "$REPO_ROOT/backend/server.js" "prisma.user.findMany" "server.js uses Prisma user queries"
test_content "$REPO_ROOT/backend/server.js" "prisma.ticket" "server.js uses Prisma ticket queries"

echo ""
echo "=== Dockerfile Updates ==="

# Test Dockerfile
test_content "$REPO_ROOT/backend/Dockerfile" "COPY prisma" "Dockerfile copies Prisma schema"
test_content "$REPO_ROOT/backend/Dockerfile" "npx prisma generate" "Dockerfile generates Prisma client"

echo ""
echo "=== Seed File Validation ==="

# Test seed file
test_content "$REPO_ROOT/backend/prisma/seed.js" "PrismaClient" "Seed file uses PrismaClient"
test_content "$REPO_ROOT/backend/prisma/seed.js" "user.upsert" "Seed file creates users"
test_content "$REPO_ROOT/backend/prisma/seed.js" "ticket.create" "Seed file creates tickets"

echo ""
echo "=== Prisma Client Wrapper ==="

# Test Prisma client
test_content "$REPO_ROOT/backend/prismaClient.js" "PrismaClient" "Prisma client imports PrismaClient"
test_content "$REPO_ROOT/backend/prismaClient.js" "module.exports" "Prisma client exports instance"
test_content "$REPO_ROOT/backend/prismaClient.js" "\$disconnect" "Prisma client handles disconnection"

echo ""
echo "=== JSON Syntax Validation ==="

# Validate package.json
if command -v node &> /dev/null; then
    if node -e "JSON.parse(require('fs').readFileSync('$REPO_ROOT/backend/package.json', 'utf8'))" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} backend/package.json is valid JSON"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} backend/package.json has invalid JSON"
        ((FAILED++))
    fi
fi

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
    
    if node -c "$REPO_ROOT/backend/prismaClient.js" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} prismaClient.js syntax is valid"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} prismaClient.js has syntax errors"
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
    echo -e "${GREEN}✓ All Phase 3 validation tests passed!${NC}"
    echo "Prisma ORM setup is complete and ready for use."
    exit 0
else
    echo -e "${RED}✗ Some validation tests failed.${NC}"
    echo "Please review the failures above."
    exit 1
fi
