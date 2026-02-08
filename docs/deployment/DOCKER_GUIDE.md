# TIKIT System - Docker Setup Guide

## 📦 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Node.js 18+ (for local development without Docker)

## 🚀 Quick Start with Docker

### 1. Clone and Configure

```bash
git clone https://github.com/cabdelkhalegh/TIKIT-SYSTEM-.git
cd TIKIT-SYSTEM-
cp .env.example .env
```

### 2. Start All Services

```bash
# Build and start all containers
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 3. Access Services

- **Backend API**: http://localhost:3001
- **Frontend**: http://localhost:3000 (placeholder)
- **PostgreSQL**: localhost:5432
- **Health Check**: http://localhost:3001/health
- **API Clients**: http://localhost:3001/api/v1/clients

## 🗂️ Project Structure

```
TIKIT-SYSTEM-/
├── backend/                 # Backend API service
│   ├── src/
│   │   └── index.js        # Express server
│   ├── prisma/             # Database schema & migrations
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   ├── seed.js
│   │   └── verify.js
│   ├── Dockerfile          # Backend container config
│   ├── .dockerignore
│   ├── .env.example
│   └── package.json
├── frontend/               # Frontend application (placeholder)
│   ├── src/
│   │   └── index.js
│   ├── Dockerfile         # Frontend container config
│   ├── .dockerignore
│   └── package.json
├── packages/              # Shared packages (future)
│   └── shared/
├── docker-compose.yml     # Multi-service orchestration
├── .env.example          # Environment variables template
└── package.json          # Workspace configuration
```

## 🐳 Docker Services

### Database (PostgreSQL)
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Database**: tikitdb
- **User**: tikit_user
- **Volume**: postgres_data (persistent)

### Backend API
- **Build**: ./backend/Dockerfile
- **Port**: 3001
- **Depends on**: PostgreSQL (with health check)
- **Auto-migrations**: Runs on startup

### Frontend (Placeholder)
- **Build**: ./frontend/Dockerfile
- **Port**: 3000
- **Status**: Placeholder for React/Next.js

## 📋 Docker Commands

### Container Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Rebuild and start
docker-compose up -d --build

# View logs
docker-compose logs -f [service]

# Execute command in container
docker-compose exec backend sh
docker-compose exec db psql -U tikit_user -d tikitdb
```

### Database Operations

```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose exec backend npm run db:seed

# Open Prisma Studio
docker-compose exec backend npx prisma studio

# Reset database
docker-compose exec backend npx prisma migrate reset
```

### Development Workflow

```bash
# Start with logs visible
docker-compose up

# Rebuild specific service
docker-compose up -d --build backend

# View backend logs
docker-compose logs -f backend

# Restart service
docker-compose restart backend
```

## 🔧 Local Development (Without Docker)

### Setup

```bash
# Install dependencies
npm install

# Setup backend
cd backend
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run db:seed
```

### Run Services

```bash
# From root directory

# Start backend
npm run backend:dev

# Or from backend directory
cd backend
npm run dev

# View database
npm run db:studio
```

## 🌍 Environment Variables

### Root `.env` (Docker Compose)

```env
# Database
POSTGRES_DB=tikitdb
POSTGRES_USER=tikit_user
POSTGRES_PASSWORD=tikit_password
POSTGRES_PORT=5432

# Backend
BACKEND_PORT=3001
DATABASE_URL=postgresql://tikit_user:tikit_password@db:5432/tikitdb

# Frontend
FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# Environment
NODE_ENV=development
```

### Backend `.env`

```env
# For local development with SQLite
DATABASE_URL="file:./prisma/dev_tikit.db"

# For Docker with PostgreSQL
DATABASE_URL="postgresql://tikit_user:tikit_password@db:5432/tikitdb"

PORT=3001
NODE_ENV=development
```

## 🧪 Testing the Setup

### 1. Check Health

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "TIKIT Backend API",
  "timestamp": "2026-02-05T...",
  "version": "0.1.0"
}
```

### 2. Get Clients

```bash
curl http://localhost:3001/api/v1/clients
```

### 3. Verify Database

```bash
docker-compose exec backend npx prisma studio
# Opens at http://localhost:5555
```

## 🔍 Troubleshooting

### Containers Won't Start

```bash
# Check logs
docker-compose logs

# Check specific service
docker-compose logs backend

# Remove and rebuild
docker-compose down -v
docker-compose up -d --build
```

### Database Connection Issues

```bash
# Check database is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Verify connection string in .env
cat .env | grep DATABASE_URL
```

### Port Already in Use

```bash
# Change ports in .env
BACKEND_PORT=3002
FRONTEND_PORT=3001
POSTGRES_PORT=5433

# Restart
docker-compose down
docker-compose up -d
```

## 🚦 Next Steps

1. ✅ Phase 1.1: Monorepo setup - **COMPLETE**
2. ✅ Phase 1.2: Docker environment - **COMPLETE**
3. ⏳ Phase 1.3: Verify Prisma with PostgreSQL
4. ⏳ Phase 2.2: Implement Campaign entity model
5. ⏳ Phase 2.3: Implement Influencer entity model

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Express.js Documentation](https://expressjs.com/)

---

**Last Updated**: 2026-02-05
**Phase**: 1.2 Complete - Docker Infrastructure Ready
