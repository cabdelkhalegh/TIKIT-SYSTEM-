#!/bin/bash

# Phase 1 & 2 Validation Script
# This script validates that all Phase 1 and Phase 2 requirements are met

echo "=========================================="
echo "Phase 1 & 2 Validation Script"
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

test_directory() {
    local dir=$1
    local description=$2
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $description - Directory not found: $dir"
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

echo "=== Phase 1: File Structure Tests ==="
echo ""

# Test directory structure
test_directory "$REPO_ROOT/backend" "Backend directory exists"
test_directory "$REPO_ROOT/frontend" "Frontend directory exists"
test_directory "$REPO_ROOT/frontend/src" "Frontend src directory exists"
test_directory "$REPO_ROOT/frontend/public" "Frontend public directory exists"

echo ""
echo "=== Backend Files ==="
test_file "$REPO_ROOT/backend/Dockerfile" "Backend Dockerfile exists"
test_file "$REPO_ROOT/backend/package.json" "Backend package.json exists"
test_file "$REPO_ROOT/backend/server.js" "Backend server.js exists"
test_file "$REPO_ROOT/backend/.env.example" "Backend .env.example exists"
test_file "$REPO_ROOT/backend/.dockerignore" "Backend .dockerignore exists"

echo ""
echo "=== Frontend Files ==="
test_file "$REPO_ROOT/frontend/Dockerfile" "Frontend Dockerfile exists"
test_file "$REPO_ROOT/frontend/package.json" "Frontend package.json exists"
test_file "$REPO_ROOT/frontend/public/index.html" "Frontend index.html exists"
test_file "$REPO_ROOT/frontend/src/index.js" "Frontend index.js exists"
test_file "$REPO_ROOT/frontend/src/App.js" "Frontend App.js exists"
test_file "$REPO_ROOT/frontend/src/App.css" "Frontend App.css exists"
test_file "$REPO_ROOT/frontend/.env.example" "Frontend .env.example exists"
test_file "$REPO_ROOT/frontend/.dockerignore" "Frontend .dockerignore exists"

echo ""
echo "=== Root Files ==="
test_file "$REPO_ROOT/docker-compose.yml" "docker-compose.yml exists"
test_file "$REPO_ROOT/.gitignore" ".gitignore exists"
test_file "$REPO_ROOT/README.md" "README.md exists"

echo ""
echo "=== Phase 2: Configuration Content Tests ==="
echo ""

# Backend configuration
test_content "$REPO_ROOT/backend/Dockerfile" "FROM node:18-alpine" "Backend Dockerfile uses Node 18 Alpine"
test_content "$REPO_ROOT/backend/Dockerfile" "EXPOSE 3001" "Backend Dockerfile exposes port 3001"
test_content "$REPO_ROOT/backend/package.json" "express" "Backend package.json includes Express"
test_content "$REPO_ROOT/backend/package.json" "pg" "Backend package.json includes PostgreSQL client"
test_content "$REPO_ROOT/backend/server.js" "/health" "Backend server has health endpoint"
test_content "$REPO_ROOT/backend/server.js" "/db-test" "Backend server has database test endpoint"
test_content "$REPO_ROOT/backend/.env.example" "DATABASE_URL" "Backend .env.example has DATABASE_URL"
test_content "$REPO_ROOT/backend/.env.example" "PORT" "Backend .env.example has PORT"

echo ""
# Frontend configuration
test_content "$REPO_ROOT/frontend/Dockerfile" "FROM node:18-alpine" "Frontend Dockerfile uses Node 18 Alpine"
test_content "$REPO_ROOT/frontend/Dockerfile" "EXPOSE 3000" "Frontend Dockerfile exposes port 3000"
test_content "$REPO_ROOT/frontend/package.json" "react" "Frontend package.json includes React"
test_content "$REPO_ROOT/frontend/src/App.js" "TIKIT System" "Frontend App shows TIKIT branding"
test_content "$REPO_ROOT/frontend/.env.example" "REACT_APP_API_URL" "Frontend .env.example has API URL"

echo ""
# Docker Compose configuration
test_content "$REPO_ROOT/docker-compose.yml" "services:" "docker-compose.yml has services section"
test_content "$REPO_ROOT/docker-compose.yml" "db:" "docker-compose.yml has database service"
test_content "$REPO_ROOT/docker-compose.yml" "backend:" "docker-compose.yml has backend service"
test_content "$REPO_ROOT/docker-compose.yml" "frontend:" "docker-compose.yml has frontend service"
test_content "$REPO_ROOT/docker-compose.yml" "postgres:14" "docker-compose.yml uses PostgreSQL 14"
test_content "$REPO_ROOT/docker-compose.yml" "tikitdb" "docker-compose.yml configures tikitdb database"
# Updated to handle environment variables with defaults
if grep -q "3001" "$REPO_ROOT/docker-compose.yml"; then
    echo -e "${GREEN}✓${NC} docker-compose.yml maps backend port 3001"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} docker-compose.yml maps backend port 3001"
    ((FAILED++))
fi
test_content "$REPO_ROOT/docker-compose.yml" "3000:3000" "docker-compose.yml maps frontend port 3000"
test_content "$REPO_ROOT/docker-compose.yml" "5432:5432" "docker-compose.yml maps database port 5432"
test_content "$REPO_ROOT/docker-compose.yml" "depends_on:" "docker-compose.yml has service dependencies"
test_content "$REPO_ROOT/docker-compose.yml" "healthcheck:" "docker-compose.yml has health checks"

echo ""
# README updates
test_content "$REPO_ROOT/README.md" "Docker" "README mentions Docker"
test_content "$REPO_ROOT/README.md" "docker-compose" "README has docker-compose instructions"
test_content "$REPO_ROOT/README.md" "localhost:3000" "README documents frontend port"
test_content "$REPO_ROOT/README.md" "localhost:3001" "README documents backend port"

echo ""
echo "=== Docker Compose Syntax Validation ==="
if command -v docker &> /dev/null && command -v docker compose &> /dev/null; then
    if docker compose -f "$REPO_ROOT/docker-compose.yml" config > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} docker-compose.yml syntax is valid"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} docker-compose.yml has syntax errors"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⊘${NC} Docker not available for syntax validation"
fi

echo ""
echo "=== JSON Syntax Validation ==="

# Validate package.json files
for pkg in "$REPO_ROOT/backend/package.json" "$REPO_ROOT/frontend/package.json"; do
    if command -v node &> /dev/null; then
        if node -e "JSON.parse(require('fs').readFileSync('$pkg', 'utf8'))" 2>/dev/null; then
            echo -e "${GREEN}✓${NC} $(basename $(dirname $pkg))/package.json is valid JSON"
            ((PASSED++))
        else
            echo -e "${RED}✗${NC} $(basename $(dirname $pkg))/package.json has invalid JSON"
            ((FAILED++))
        fi
    else
        # Fallback to basic check
        if grep -q "^{" "$pkg" && grep -q "^}" "$pkg"; then
            echo -e "${GREEN}✓${NC} $(basename $(dirname $pkg))/package.json has basic JSON structure"
            ((PASSED++))
        else
            echo -e "${RED}✗${NC} $(basename $(dirname $pkg))/package.json missing JSON structure"
            ((FAILED++))
        fi
    fi
done

echo ""
echo "=========================================="
echo "Validation Results"
echo "=========================================="
echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
echo -e "Tests Failed: ${RED}$FAILED${NC}"
echo "Total Tests: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All validation tests passed!${NC}"
    echo "Phase 1 & 2 requirements are fully met."
    exit 0
else
    echo -e "${RED}✗ Some validation tests failed.${NC}"
    echo "Please review the failures above."
    exit 1
fi
