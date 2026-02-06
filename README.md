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

### Prisma Database Setup

After starting the containers, initialize the database:

1. **Generate Prisma Client:**
   ```bash
   docker compose exec backend npm run prisma:generate
   ```

2. **Run database migrations:**
   ```bash
   docker compose exec backend npm run prisma:migrate
   ```

3. **Seed the database with sample data:**
   ```bash
   docker compose exec backend npm run prisma:seed
   ```

4. **Open Prisma Studio (optional):**
   ```bash
   docker compose exec backend npm run prisma:studio
   ```

## 🧪 Testing the Setup

Once all containers are running, the frontend will display:
- Backend health status
- Database connectivity status
- API information

All three should show "ok" or "connected" status if everything is working correctly.

### Test Authentication

**Login with seeded users:**
```bash
# Admin user
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@tikit.com", "password": "admin123"}'

# Regular user
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@tikit.com", "password": "user123"}'
```

## 📚 API Endpoints

### 🔓 Authentication (Public)
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `POST /auth/logout` - Logout (requires auth)
- `GET /auth/me` - Get current user profile (requires auth)

### Health & Testing (Public)
- `GET /health` - Backend health check
- `GET /db-test` - Database connectivity test
- `GET /prisma-test` - Prisma ORM connectivity and stats
- `GET /api/info` - API information

### 🔒 Users API (Protected)
- `GET /api/users` - List all users (Admin only)
- `GET /api/users/:id` - Get user by ID (Own profile or Admin)

### 🔒 Tickets API (Protected)
- `GET /api/tickets` - List tickets (Own tickets for users, all for admin)
- `GET /api/tickets/:id` - Get ticket by ID (Own tickets or admin)
- `POST /api/tickets` - Create new ticket (Authenticated)
- `PUT /api/tickets/:id` - Update ticket (Own tickets or admin)
- `DELETE /api/tickets/:id` - Delete ticket (Own tickets or admin)

**Note:** 🔒 = Requires `Authorization: Bearer <token>` header

### Authentication Example
```bash
# 1. Register or Login to get token
TOKEN=$(curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@tikit.com", "password": "user123"}' \
  | jq -r '.token')

# 2. Use token for authenticated requests
curl http://localhost:3001/api/tickets \
  -H "Authorization: Bearer $TOKEN"
```

## 🐳 Docker Configuration

### Services
1. **Database (PostgreSQL 14)**
   - Port: 5432
   - Database: tikitdb
   - User: admin
   - Password: admin123

2. **Backend (Node.js + Prisma ORM + JWT Auth)**
   - Port: 3001
   - Framework: Express
   - ORM: Prisma
   - Authentication: JWT with bcrypt
   - Database Models: User, Ticket
   - Features: Role-based access control (RBAC)

3. **Frontend (React + Nginx)**
   - Port: 3000
   - Build tool: React Scripts

## 🛠️ Troubleshooting

- **Containers fail to start:** Check Docker logs with `docker-compose logs`
- **Port conflicts:** Ensure ports 3000, 3001, and 5432 are not in use
- **Database connection issues:** Wait for the database to be fully initialized (health checks are configured)
