# TIKIT-SYSTEM-
This is the repository for the TIKIT Influencer Marketing Platform

## ✅ Current Status: Phase 3.2 Complete!

**Phase 1: Infrastructure** ✅ (100%)
- ✅ Phase 1.1: Monorepo Setup (npm workspaces)
- ✅ Phase 1.2: Docker & Dev Environment (PostgreSQL, containers)
- ✅ Phase 1.3: Prisma ORM (schema, migrations)

**Phase 2: Core Data Model** ✅ (100%)
- ✅ Phase 2.1: Client Entity Model
- ✅ Phase 2.2: Campaign Entity Model
- ✅ Phase 2.3: Influencer Entity Model

**Phase 3: Business Logic** 🚧 (40%)
- ✅ Phase 3.1: Authentication & Authorization
- ✅ Phase 3.2: Campaign Lifecycle Management
- ⏳ Phase 3.3: Influencer Discovery & Matching
- ⏳ Phase 3.4: Collaboration Management
- ⏳ Phase 3.5: Data Validation & Error Handling

## 🏗️ Project Structure

```
TIKIT-SYSTEM-/
├── backend/              # Backend API service
│   ├── src/             # Express API server
│   ├── prisma/          # Database schema & migrations
│   ├── Dockerfile
│   └── package.json
├── frontend/            # Frontend application (placeholder)
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── packages/            # Shared packages
│   └── shared/
├── docker-compose.yml   # Multi-service orchestration
└── package.json         # Workspace configuration
```

## 🚀 Quick Start

### With Docker (Recommended)

```bash
# Clone and setup
git clone https://github.com/cabdelkhalegh/TIKIT-SYSTEM-.git
cd TIKIT-SYSTEM-
cp .env.example .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Access services
# Backend API: http://localhost:3001
# Frontend: http://localhost:3000
# Database: PostgreSQL on localhost:5432
```

### Without Docker (Local Development)

```bash
# Install dependencies
npm install

# Setup backend
cd backend
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run db:seed

# Start backend
npm run dev

# Backend API: http://localhost:3001
```

## 📚 Documentation

**Current Status & Planning:**
- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Comprehensive project status report
- **[WHATS_NEXT.md](./WHATS_NEXT.md)** - Detailed next steps and timeline
- **[PROGRESS_DASHBOARD.md](./PROGRESS_DASHBOARD.md)** - Visual progress tracking
- **[ROADMAP.md](./ROADMAP.md)** - Complete development roadmap

**Phase Documentation:**
- **[PHASE_1_COMPLETE.md](./PHASE_1_COMPLETE.md)** - Phase 1 completion report
- **[PHASE_2.2_CAMPAIGN_ENTITY.md](./PHASE_2.2_CAMPAIGN_ENTITY.md)** - Campaign entity guide
- **[PHASE_2.3_INFLUENCER_ENTITY.md](./PHASE_2.3_INFLUENCER_ENTITY.md)** - Influencer entity guide
- **[PHASE_3.1_AUTHENTICATION.md](./PHASE_3.1_AUTHENTICATION.md)** - Authentication system guide
- **[PHASE_3.2_CAMPAIGN_LIFECYCLE.md](./PHASE_3.2_CAMPAIGN_LIFECYCLE.md)** - Campaign lifecycle guide

**Setup Guides:**
- **[DOCKER_GUIDE.md](./DOCKER_GUIDE.md)** - Complete Docker setup and usage guide
- **[PHASE_1_CHECKLIST.md](./PHASE_1_CHECKLIST.md)** - Phase 1 implementation checklist

## 📝 Available Commands

### Workspace Commands (from root)

```bash
npm run dev              # Start backend and frontend
npm run backend:dev      # Start backend only
npm run frontend:dev     # Start frontend only
npm run build            # Build all workspaces
npm run db:migrate       # Run database migrations
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database
```

### Docker Commands

```bash
npm run docker:up        # Start all containers
npm run docker:down      # Stop all containers
npm run docker:build     # Rebuild containers
```

## 🔌 API Endpoints

### Backend API (Port 3001) - v0.4.0

All endpoints except authentication require JWT token in `Authorization: Bearer <token>` header.

**Authentication Endpoints:** (Public)
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token
- `GET /api/v1/auth/profile` - Get user profile (protected)
- `PUT /api/v1/auth/profile` - Update user profile (protected)
- `POST /api/v1/auth/change-password` - Change password (protected)

**Client Endpoints:** (Protected)
- `GET /api/v1/clients` - List all clients
- `GET /api/v1/clients/:id` - Get single client
- `POST /api/v1/clients` - Create client (admin/client_manager)
- `PUT /api/v1/clients/:id` - Update client (admin/client_manager)
- `DELETE /api/v1/clients/:id` - Delete client (admin only)

**Campaign Endpoints:** (Protected)
- `GET /api/v1/campaigns` - List campaigns (filters: status, clientId)
- `GET /api/v1/campaigns/:id` - Get single campaign
- `POST /api/v1/campaigns` - Create campaign
- `PUT /api/v1/campaigns/:id` - Update campaign
- `DELETE /api/v1/campaigns/:id` - Delete campaign (admin only)
- `POST /api/v1/campaigns/:id/activate` - Activate draft campaign 🆕
- `POST /api/v1/campaigns/:id/pause` - Pause active campaign 🆕
- `POST /api/v1/campaigns/:id/resume` - Resume paused campaign 🆕
- `POST /api/v1/campaigns/:id/complete` - Complete campaign 🆕
- `POST /api/v1/campaigns/:id/cancel` - Cancel campaign 🆕
- `GET /api/v1/campaigns/:id/budget` - Get budget status 🆕

**Influencer Endpoints:** (Protected)
- `GET /api/v1/influencers` - List influencers (filters: platform, status, verified)
- `GET /api/v1/influencers/:id` - Get single influencer
- `POST /api/v1/influencers` - Create influencer (admin/influencer_manager)
- `PUT /api/v1/influencers/:id` - Update influencer (admin/influencer_manager)
- `DELETE /api/v1/influencers/:id` - Delete influencer (admin only)

**Collaboration Endpoints:** (Protected)
- `GET /api/v1/collaborations` - List collaborations (filters: campaignId, influencerId, status)
- `GET /api/v1/collaborations/:id` - Get single collaboration
- `POST /api/v1/collaborations` - Create collaboration
- `PUT /api/v1/collaborations/:id` - Update collaboration
- `DELETE /api/v1/collaborations/:id` - Delete collaboration (admin only)
- `POST /api/v1/collaborations/:id/accept` - Accept invitation 🆕
- `POST /api/v1/collaborations/:id/decline` - Decline invitation 🆕
- `POST /api/v1/collaborations/:id/start` - Start collaboration 🆕
- `POST /api/v1/collaborations/:id/complete` - Complete collaboration 🆕
- `POST /api/v1/collaborations/:id/cancel` - Cancel collaboration 🆕

### Testing

```bash
# 1. Register and get token
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@tikit.com","password":"Test123!","fullName":"Test User","role":"admin"}' \
  | jq -r '.data.authToken')

# 2. Use token for protected endpoints
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/v1/clients

# 3. Campaign lifecycle
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/campaigns/{id}/activate

# 4. Check budget
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/campaigns/{id}/budget
```

## 🗄️ Database

### Current Data Model

**Client Entity** (Phase 2.1)
- Client company profiles
- Contact information (JSON)
- Financial tracking
- Campaign relationships

**Campaign Entity** (Phase 2.2)
- Campaign metadata and objectives
- Budget tracking (total, allocated, spent)
- Timeline management (start, end, launch dates)
- Target audience and platforms (JSON)
- Campaign status (draft, active, paused, completed, cancelled)
- Performance metrics and KPIs (JSON)
- Client relationship

**Influencer Entity** (Phase 2.3) ✨ NEW
- Influencer profiles and bios
- Social media handles (JSON - Instagram, TikTok, YouTube, etc.)
- Audience metrics per platform (followers, engagement rates)
- Content categories and niches
- Availability status and rates (per post/video/story)
- Quality score and verification
- Performance history

**CampaignInfluencer** (Phase 2.3)
- Many-to-many relationship (Campaign ↔ Influencer)
- Collaboration details (role, status, deliverables)
- Payment tracking (agreed amount, payment status)
- Performance metrics per collaboration
- Timeline (invited, accepted, completed)

**User Entity** (Phase 3.1) 🆕
- User authentication and profiles
- Email/password with bcrypt hashing
- JWT token generation and validation
- Role-based access (admin, client_manager, influencer_manager)
- Links to Client and Influencer entities

### Key Features

**Campaign Lifecycle Management** (Phase 3.2) 🆕
- Status transitions: draft → active → paused/completed
- Lifecycle endpoints: activate, pause, resume, complete, cancel
- Budget tracking with utilization metrics
- Automatic date handling (launch date, end date)
- Validation of status transitions

**Collaboration Workflow** (Phase 3.2) 🆕
- Status workflow: invited → accepted → active → completed
- Workflow endpoints: accept, decline, start, complete, cancel
- Transition validation
- Timeline tracking

**Authentication & Authorization** (Phase 3.1) 🆕
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Protected API endpoints
- User profile management

### Database Operations

```bash
# With Docker
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run db:seed
docker-compose exec backend npx prisma studio

# Local
cd backend
npx prisma migrate dev
npm run db:seed
npx prisma studio
```

## 🎯 What's Next

**Phase 3.3: Influencer Discovery & Matching** - Next priority
- Advanced search and filtering
- Recommendation algorithms
- Campaign-influencer matching
- Discovery dashboard

**Phase 3.4: Collaboration Management** 
- Enhanced workflow automation
- Notification system
- Approval workflows

**Phase 3.5: Data Validation & Error Handling**
- Comprehensive input validation
- Consistent error responses
- Request sanitization

See [ROADMAP.md](./ROADMAP.md) and [WHATS_NEXT.md](./WHATS_NEXT.md) for complete development plan.

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, Prisma ORM
- **Database**: PostgreSQL (Docker), SQLite (local dev)
- **Frontend**: React/Next.js (to be implemented)
- **Infrastructure**: Docker, Docker Compose, npm workspaces

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker & Docker Compose (for containerized setup)

## 🤝 Development Workflow

1. Make changes in `backend/src/` or `frontend/src/`
2. Docker volumes enable hot-reload in development
3. Database changes require migrations: `npm run db:migrate`
4. Test endpoints with curl or Postman
5. View data with Prisma Studio: `npm run db:studio`

## 📊 Project Status

- **Phase 1**: ✅ Complete (Infrastructure)
- **Phase 2.1**: ✅ Complete (Client Entity)
- **Phase 2.2**: ✅ Complete (Campaign Entity)
- **Phase 2.3**: ✅ Complete (Influencer Entity)
- **Phase 3.1**: 🚧 In Progress (Authentication & Authorization - Core Complete)
- **Phase 3.2**: ⏳ Next (Campaign Management Enhancement)
- **Phase 3.3**: ⏳ Pending (Influencer Discovery)

---

**Last Updated**: 2026-02-05  
**Current Phase**: Ready for Phase 2.2  
**Infrastructure**: Complete and Production-Ready
