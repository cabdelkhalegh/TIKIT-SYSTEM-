# TIKIT-SYSTEM- 🎫

This is the repository for the TIKIT APP - A modern ticket management system.

## 🚀 Quick Start with Docker

### Prerequisites
- Docker installed on your system
- Docker Compose installed

### Running the Application

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TIKIT-SYSTEM-
   ```

2. **Configure environment variables (optional)**
   ```bash
   cp .env.example .env
   # Edit .env to customize settings (database password, ports, etc.)
   ```
   
   **Note**: The system will work with default values if you skip this step.

3. **Start all services**
   ```bash
   docker compose up --build
   ```

   This command will:
   - Build and start the PostgreSQL database
   - Build and start the backend API server
   - Build and start the frontend application

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: localhost:5432

### Available Docker Commands

- **Start services in detached mode:**
  ```bash
  docker-compose up -d
  ```

- **Stop all services:**
  ```bash
  docker-compose down
  ```

- **Stop and remove volumes (clean slate):**
  ```bash
  docker-compose down -v
  ```

- **View logs:**
  ```bash
  docker-compose logs -f
  ```

- **Rebuild containers:**
  ```bash
  docker-compose up --build
  ```

## 📋 Project Structure

```
TIKIT-SYSTEM-/
├── backend/              # Node.js/Express backend
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   └── .env.example
├── frontend/             # React frontend
│   ├── Dockerfile
│   ├── package.json
│   ├── nginx.conf
│   ├── public/
│   ├── src/
│   └── .env.example
├── docker-compose.yml    # Docker orchestration
└── README.md
```

## 🔧 Development Setup

### Backend Environment Variables
Copy `.env.example` to `.env` in the backend directory:
```bash
cp backend/.env.example backend/.env
```

### Frontend Environment Variables
Copy `.env.example` to `.env` in the frontend directory:
```bash
cp frontend/.env.example frontend/.env
```

## 🧪 Testing the Setup

Once all containers are running, the frontend will display:
- Backend health status
- Database connectivity status
- API information

All three should show "ok" or "connected" status if everything is working correctly.

## 📚 API Endpoints

- `GET /health` - Backend health check
- `GET /db-test` - Database connectivity test
- `GET /api/info` - API information

## 🐳 Docker Configuration

### Services
1. **Database (PostgreSQL 14)**
   - Port: 5432
   - Database: tikitdb
   - User: admin
   - Password: admin123

2. **Backend (Node.js)**
   - Port: 3001
   - Framework: Express

3. **Frontend (React + Nginx)**
   - Port: 3000
   - Build tool: React Scripts

## 🛠️ Troubleshooting

- **Containers fail to start:** Check Docker logs with `docker-compose logs`
- **Port conflicts:** Ensure ports 3000, 3001, and 5432 are not in use
- **Database connection issues:** Wait for the database to be fully initialized (health checks are configured)
