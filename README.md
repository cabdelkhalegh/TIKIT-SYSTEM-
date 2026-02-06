# TIKIT-SYSTEM-
This is the repository for the TIKIT Influencer Marketing Platform

## ✅ Phase 1 Complete!

**All Phase 1 infrastructure is now implemented:**
- ✅ Phase 1.1: Monorepo Setup (npm workspaces)
- ✅ Phase 1.2: Docker & Dev Environment (PostgreSQL, containers)
- ✅ Phase 1.3: Prisma ORM (schema, migrations, Client entity)

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

- **[DOCKER_GUIDE.md](./DOCKER_GUIDE.md)** - Complete Docker setup and usage guide
- **[ROADMAP.md](./ROADMAP.md)** - Complete development roadmap
- **[STATUS.md](./STATUS.md)** - Current project status dashboard
- **[PHASE_1_AUDIT.md](./PHASE_1_AUDIT.md)** - Phase 1 audit report (historical)
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Phase 2.1 summary

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

### Backend API (Port 3001)

**Client Endpoints:**
- `GET /health` - Health check
- `GET /` - API information
- `GET /api/v1/clients` - List all clients (with campaign summaries)
- `GET /api/v1/clients/:id` - Get single client with all campaigns

**Campaign Endpoints:**
- `GET /api/v1/campaigns` - List all campaigns (supports ?status=active&clientId={id})
- `GET /api/v1/campaigns/:id` - Get single campaign with client details
- `POST /api/v1/campaigns` - Create new campaign

**Influencer Endpoints:** ✨ NEW
- `GET /api/v1/influencers` - List all influencers (supports ?platform=instagram&status=available&verified=true)
- `GET /api/v1/influencers/:id` - Get single influencer with campaign history
- `POST /api/v1/influencers` - Create new influencer

**Collaboration Endpoints:** ✨ NEW
- `GET /api/v1/collaborations` - List campaign-influencer collaborations (supports ?campaignId={id}&influencerId={id}&status=active)
- `POST /api/v1/collaborations` - Create new collaboration

### Testing

```bash
# Health check
curl http://localhost:3001/health

# Get all clients
curl http://localhost:3001/api/v1/clients

# Get all campaigns
curl http://localhost:3001/api/v1/campaigns

# Get active campaigns only
curl "http://localhost:3001/api/v1/campaigns?status=active"

# Get campaigns for specific client
curl "http://localhost:3001/api/v1/campaigns?clientId={client-id}"

# Get all influencers
curl http://localhost:3001/api/v1/influencers

# Get Instagram influencers
curl "http://localhost:3001/api/v1/influencers?platform=instagram"

# Get available verified influencers
curl "http://localhost:3001/api/v1/influencers?status=available&verified=true"

# Get all collaborations
curl http://localhost:3001/api/v1/collaborations

# Get collaborations for a campaign
curl "http://localhost:3001/api/v1/collaborations?campaignId={campaign-id}"
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

**CampaignInfluencer** (Phase 2.3) ✨ NEW
- Many-to-many relationship (Campaign ↔ Influencer)
- Collaboration details (role, status, deliverables)
- Payment tracking (agreed amount, payment status)
- Performance metrics per collaboration
- Timeline (invited, accepted, completed)

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

**Phase 2.4: Content & Deliverables Entity** - Optional next step
- Track specific content pieces within collaborations
- Content approval workflows
- Performance metrics per content item

**Phase 3: API & Business Logic**
- Campaign management features
- Influencer discovery and search
- Analytics and reporting

See [ROADMAP.md](./ROADMAP.md) for complete development plan.

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
- **Phase 2.4**: ⏳ Optional (Content/Deliverables Entity)
- **Phase 3**: 🎯 Ready to start (API & Business Logic)

---

**Last Updated**: 2026-02-05  
**Current Phase**: Ready for Phase 2.2  
**Infrastructure**: Complete and Production-Ready
