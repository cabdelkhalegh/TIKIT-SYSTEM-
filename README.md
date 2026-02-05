# TIKIT OS - Ticket Management System

A modern ticket management system built with a monorepo architecture, featuring a NestJS backend and React frontend.

## 🏗️ Project Structure

```
TIKIT-SYSTEM-/
├── backend/              # NestJS backend application
├── frontend/             # React + TypeScript frontend application
├── docker-compose.yml    # Docker orchestration configuration
├── package.json          # Root package.json with workspace configuration
└── README.md            # This file
```

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS (TypeScript)
- **Runtime**: Node.js 24.x
- **Database**: PostgreSQL 16

### Frontend
- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Create React App

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Package Manager**: npm (with workspaces)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v24.x or higher)
- npm (v11.x or higher)
- Docker and Docker Compose (for containerized development)

## 🚀 Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TIKIT-SYSTEM-
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

### Development

#### Running Locally (Without Docker)

**Start Backend:**
```bash
npm run backend:dev
```
The backend will be available at `http://localhost:3000`

**Start Frontend:**
```bash
npm run frontend:dev
```
The frontend will be available at `http://localhost:3001`

**Start Both Simultaneously:**
```bash
npm run dev
```

#### Running with Docker

**Start all services (backend, frontend, and PostgreSQL):**
```bash
docker-compose up
```

**Start services in detached mode:**
```bash
docker-compose up -d
```

**View logs:**
```bash
docker-compose logs -f
```

**Stop all services:**
```bash
docker-compose down
```

**Rebuild containers:**
```bash
docker-compose up --build
```

### Building for Production

**Build Backend:**
```bash
npm run backend:build
```

**Build Frontend:**
```bash
npm run frontend:build
```

**Build Both:**
```bash
npm run build
```

### Testing

**Test Backend:**
```bash
npm run backend:test
```

**Test Frontend:**
```bash
npm run frontend:test
```

**Test Both:**
```bash
npm run test
```

## 📦 Available Scripts

### Root Level Scripts
- `npm run install:all` - Install dependencies for all workspaces
- `npm run dev` - Start both backend and frontend in development mode
- `npm run build` - Build both backend and frontend
- `npm run test` - Run tests for both backend and frontend

### Backend Scripts
- `npm run backend:dev` - Start backend in development mode with hot-reload
- `npm run backend:build` - Build backend for production
- `npm run backend:start` - Start backend in production mode
- `npm run backend:test` - Run backend tests

### Frontend Scripts
- `npm run frontend:dev` - Start frontend development server
- `npm run frontend:build` - Build frontend for production
- `npm run frontend:start` - Start frontend development server
- `npm run frontend:test` - Run frontend tests

## 🐳 Docker Services

### Backend Service
- **Port**: 3000
- **Environment**: Development
- **Dependencies**: PostgreSQL

### Frontend Service
- **Port**: 3001 (mapped to internal 3000)
- **Environment**: Development
- **Dependencies**: Backend

### PostgreSQL Service
- **Port**: 5432
- **Database**: tikit_db
- **User**: tikit_user
- **Password**: tikit_password (change in production!)

## 🔧 Environment Variables

### Backend
Create a `.env` file in the `backend/` directory:
```env
NODE_ENV=development
DATABASE_URL=postgresql://tikit_user:tikit_password@localhost:5432/tikit_db
PORT=3000
```

### Frontend
Create a `.env` file in the `frontend/` directory:
```env
REACT_APP_API_URL=http://localhost:3000
```

## 📚 Documentation

- [NestJS Documentation](https://docs.nestjs.com/)
- [React Documentation](https://react.dev/)
- [Docker Documentation](https://docs.docker.com/)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test your changes
4. Submit a pull request

## 📝 License

ISC

## 🔗 Related Issues

- **Phase 2**: Docker Setup (#2)
- **Phase 3**: Prisma Initialization (#3)
- **Phase 4**: Authentication (#4)
- **Phase 5**: CI/CD Setup (#5)
