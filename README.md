# TIKIT SYSTEM

Modern ticketing platform for event management and ticket sales.

## 🏗️ Architecture

This is a monorepo containing:
- **Backend API** (`/backend`) - Node.js + Express REST API
- **Web Client** (`/frontend`) - Next.js React application
- **PostgreSQL Database** - Managed via Docker

## 🚀 Quick Start with Docker

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+

### Initial Setup

1. **Clone and configure environment:**
```bash
git clone <repository-url>
cd TIKIT-SYSTEM-
cp .env.example .env
```

2. **Start all services:**
```bash
docker-compose up --build
```

3. **Access the applications:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database: localhost:5432

### Development Commands

```bash
# Start services in detached mode
docker-compose up -d

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f tikit-backend
docker-compose logs -f tikit-frontend

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Rebuild specific service
docker-compose build tikit-backend
docker-compose up -d tikit-backend
```

### Testing Health

```bash
# Check backend health endpoint
curl http://localhost:3001/health

# Check backend info
curl http://localhost:3001/api/info
```

### Production Deployment

```bash
# Use production configuration
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Note: In production, consider using managed database services
# instead of running PostgreSQL in a container
```

## 📁 Project Structure

```
TIKIT-SYSTEM-/
├── backend/              # Express.js API server
│   ├── src/
│   │   └── server.js    # Main server entry point
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── frontend/            # Next.js web application
│   ├── src/app/
│   │   ├── page.js     # Home page
│   │   └── layout.js   # Root layout
│   ├── Dockerfile
│   ├── next.config.js
│   ├── package.json
│   └── .env.example
├── docker-compose.yml   # Service orchestration
└── .env.example        # Environment template
```

## 🔧 Environment Variables

See `.env.example` for all available configuration options. Key variables:

- `DB_NAME` - PostgreSQL database name
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `BACKEND_PORT` - Backend API port (default: 3001)
- `FRONTEND_PORT` - Frontend port (default: 3000)

## 🛠️ Development

### Running without Docker

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📝 License

MIT
