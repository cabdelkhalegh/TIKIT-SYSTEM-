# TIKIT-SYSTEM 🎫

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

2. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.example frontend/.env
   ```

3. **Build and run all services**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: localhost:5432

### Docker Commands

#### Start services
```bash
docker-compose up
```

#### Start services in detached mode (background)
```bash
docker-compose up -d
```

#### Stop services
```bash
docker-compose down
```

#### View logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs frontend
docker-compose logs backend
docker-compose logs db
```

#### Rebuild containers
```bash
docker-compose up --build
```

#### Remove all containers and volumes
```bash
docker-compose down -v
```

## 🏗️ Architecture

The TIKIT System consists of three main services:

- **Frontend**: React application (Port 3000)
- **Backend**: Express.js API server (Port 3001)
- **Database**: PostgreSQL (Port 5432)

## 📁 Project Structure

```
TIKIT-SYSTEM-/
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   ├── package.json
│   ├── public/
│   └── src/
├── docker-compose.yml
└── README.md
```

## 🔧 Development

### Backend Development
The backend is an Express.js application that provides:
- RESTful API endpoints
- Database connectivity to PostgreSQL
- CORS enabled for frontend communication

### Frontend Development
The frontend is a React application with:
- Modern UI with responsive design
- API integration with backend
- Real-time status monitoring

## 📝 Environment Variables

### Backend (.env)
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Backend server port (default: 3001)
- `NODE_ENV`: Environment mode
- `JWT_SECRET`: Secret for JWT authentication
- `CORS_ORIGIN`: Allowed CORS origin

### Frontend (.env)
- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_NAME`: Application name
- `NODE_ENV`: Environment mode

## 🧪 Testing

Coming soon - Test infrastructure will be added in future phases.

## 📄 License

This project is proprietary software.

## 👥 Contributors

- Development Team
