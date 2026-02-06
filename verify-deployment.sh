#!/bin/bash
# TIKIT Platform - Deployment Verification Script
# This script verifies that all deployment steps have been completed successfully

set -e

echo "=================================================="
echo "TIKIT Platform - Deployment Verification"
echo "=================================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

# Function to check if a service is running
check_service() {
    if docker compose ps | grep -q "$1.*Up"; then
        print_status 0 "$1 is running"
        return 0
    else
        print_status 1 "$1 is NOT running"
        return 1
    fi
}

# Function to check HTTP endpoint
check_http() {
    if curl -s -f "$1" > /dev/null 2>&1; then
        print_status 0 "$2 is accessible"
        return 0
    else
        print_status 1 "$2 is NOT accessible"
        return 1
    fi
}

echo "Step 1: Checking Docker and Docker Compose"
echo "-------------------------------------------"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_status 0 "Docker installed: $DOCKER_VERSION"
else
    print_status 1 "Docker is NOT installed"
    exit 1
fi

if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version)
    print_status 0 "Docker Compose installed: $COMPOSE_VERSION"
else
    print_status 1 "Docker Compose is NOT installed"
    exit 1
fi
echo ""

echo "Step 2: Checking Environment Files"
echo "-----------------------------------"
if [ -f ".env" ]; then
    print_status 0 ".env file exists"
else
    print_status 1 ".env file is MISSING"
fi

if [ -f "backend/.env" ]; then
    print_status 0 "backend/.env file exists"
else
    print_status 1 "backend/.env file is MISSING"
fi

if [ -f "frontend/.env.local" ]; then
    print_status 0 "frontend/.env.local file exists"
else
    print_status 1 "frontend/.env.local file is MISSING"
fi
echo ""

echo "Step 3: Checking Docker Containers"
echo "-----------------------------------"
if docker compose ps &> /dev/null; then
    check_service "tikit-db"
    check_service "tikit-backend"
    check_service "tikit-frontend"
else
    print_status 1 "Docker containers are NOT running"
    echo ""
    echo "${YELLOW}Run: docker compose up -d${NC}"
fi
echo ""

echo "Step 4: Checking Service Health"
echo "--------------------------------"
# Check if containers are running before checking endpoints
if docker compose ps | grep -q "Up"; then
    sleep 2  # Give services a moment to start
    
    # Check database
    if docker compose exec -T db pg_isready -U tikit_user &> /dev/null; then
        print_status 0 "Database is healthy"
    else
        print_status 1 "Database is NOT healthy"
    fi
    
    # Check backend API
    check_http "http://localhost:3001/health" "Backend API health endpoint"
    check_http "http://localhost:3001/api/auth/me" "Backend API (expects 401)"
    
    # Check frontend
    check_http "http://localhost:3000" "Frontend application"
else
    echo -e "${YELLOW}Services not running - skipping health checks${NC}"
fi
echo ""

echo "Step 5: Port Availability"
echo "-------------------------"
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_status 0 "Port 3000 (Frontend) is in use"
else
    print_status 1 "Port 3000 (Frontend) is NOT in use"
fi

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_status 0 "Port 3001 (Backend) is in use"
else
    print_status 1 "Port 3001 (Backend) is NOT in use"
fi

if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_status 0 "Port 5432 (Database) is in use"
else
    print_status 1 "Port 5432 (Database) is NOT in use"
fi
echo ""

echo "Step 6: Docker Images"
echo "---------------------"
if docker images | grep -q "tikit-system-backend"; then
    print_status 0 "Backend image built"
else
    print_status 1 "Backend image NOT built"
fi

if docker images | grep -q "tikit-system-frontend"; then
    print_status 0 "Frontend image built"
else
    print_status 1 "Frontend image NOT built"
fi
echo ""

echo "=================================================="
echo "Deployment Verification Complete"
echo "=================================================="
echo ""
echo "Next Steps:"
echo "1. If services are not running: docker compose up -d"
echo "2. Monitor logs: docker compose logs -f"
echo "3. Access frontend: http://localhost:3000"
echo "4. Login with: admin@tikit.com / Admin123!"
echo ""
echo "For detailed testing, see: UI_TESTING_GUIDE.md"
echo "=================================================="
