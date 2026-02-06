## 🎯 Context for AI Agent

**PRD Reference:** Backend/Architecture Requirements – Section 8, PRD Appendix A  
**Depends On:** #13 (Monorepo Setup)  
**Blocks:** #15 (Prisma Setup)  
**Files to Create/Modify:**  
- `Dockerfile`, `docker-compose.yml`, `.env.example`, `.dockerignore`  

---

Create Dockerfiles for backend and frontend, configure docker-compose for backend, frontend, and postgres. Add development `.env.example` and ensure Dev/Prod parity.

## ✅ Acceptance Criteria  
- [x] Dockerfile for backend and frontend (multi-stage if needed)  
- [x] `docker-compose.yml` runs all services together  
- [x] `.env.example` for both backend and frontend  
- [x] All containers build and run locally  
- [x] README updated with docker commands

## 🔧 Implementation Steps  
1. Create `backend/Dockerfile` and `frontend/Dockerfile`  
2. Create root `docker-compose.yml`  
3. Create `.env.example` for both services  
4. Update README with Docker usage

## 📝 Example docker-compose.yml  
```yaml
version: '3.8'
services:
  db:
    image: postgres:14
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: tikitdb
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin123
  backend:
    build: ./backend
    depends_on:
      - db
    environment:
      DATABASE_URL: postgres://admin:admin123@db:5432/tikitdb
    ports:
      - "3001:3001"
  frontend:
    build: ./frontend
    depends_on:
      - backend
    ports:
      - "3000:3000"
```
