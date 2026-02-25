# Quickstart: TiKiT OS V2 Development

**Branch**: `001-tikit-os-prd` | **Date**: 2026-02-25

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm (package manager — locked by constitution)
- Git
- A code editor (VS Code recommended)

## Repository Setup

```bash
# Clone and switch to feature branch
git clone https://github.com/cabdelkhalegh/TIKIT-SYSTEM-.git
cd TIKIT-SYSTEM-
git checkout 001-tikit-os-prd

# Install dependencies (monorepo)
cd backend && npm install
cd ../frontend && npm install
cd ..
```

## Environment Configuration

### Backend (`backend/.env`)

```env
DATABASE_URL="file:./dev.db"
DIRECT_URL="file:./dev.db"
JWT_SECRET="your-dev-jwt-secret-minimum-32-chars"
GEMINI_API_KEY="your-google-gemini-api-key"
SUPABASE_URL="your-supabase-project-url"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
INSTAGRAM_APP_ID="2611391529235928"
INSTAGRAM_APP_SECRET="your-instagram-app-secret"
PORT=3001
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## Database Setup

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations (creates SQLite dev database)
npx prisma migrate dev

# Seed initial data (Director user + test data)
npx prisma db seed
```

## Running the Application

```bash
# Terminal 1: Backend (Express API server)
cd backend
npm run dev
# Runs on http://localhost:3001

# Terminal 2: Frontend (Next.js)
cd frontend
npm run dev
# Runs on http://localhost:3000
```

## Architecture Overview

```
Browser → Next.js (localhost:3000)
           ↓ API proxy routes (/app/api/v1/*)
         Express (localhost:3001)
           ↓ Prisma ORM
         SQLite (dev) / PostgreSQL (prod)
```

### Key Patterns

1. **Full-Stack Rule**: Every feature must have all 4 layers:
   - Prisma migration (`backend/prisma/schema.prisma`)
   - Express route (`backend/src/routes/*-routes.js`)
   - Next.js proxy route (`frontend/src/app/api/v1/*/route.ts`)
   - UI component (`frontend/src/components/*` or `frontend/src/app/dashboard/*`)

2. **API Proxy**: Frontend never calls Express directly. All API calls go through Next.js API routes at `/api/v1/*` which proxy to Express.

3. **Role Enforcement**: Every route must check user role via middleware. Every Prisma query must scope data to the user's authorized entities.

4. **AI Advisory**: All Gemini AI outputs are presented as suggestions. Users always review and confirm before data is saved. Manual fallback required when AI is unavailable.

5. **Append-Only Records**: BriefVersion, BudgetRevision, AuditLog, KPI — never update, only insert new records.

6. **Human-Readable IDs**: Generated in backend via `id-generator-service.js`, stored as `displayId` alongside CUID primary key.

## Key Files Reference

| Purpose | Backend | Frontend |
|---------|---------|----------|
| Entry point | `src/index.js` | `src/app/layout.tsx` |
| Auth middleware | `src/middleware/access-control.js` | `src/hooks/useAuth.ts` |
| Role checking | `src/middleware/role-based-method.js` | `src/hooks/useRoleAccess.ts` |
| Campaign routes | `src/routes/campaign-routes.js` | `src/services/campaign.service.ts` |
| AI service | `src/services/gemini-service.js` | — (backend only) |
| Instagram API | `src/services/instagram-service.js` | — (backend only) |
| ID generation | `src/services/id-generator-service.js` | — (backend only) |
| Risk scoring | `src/services/risk-scoring-service.js` | — (backend only) |
| Status gates | `src/utils/status-transition-helper.js` | — (validation in backend) |
| UI components | — | `src/components/ui/` (shadcn) |
| State management | — | `src/stores/` (Zustand) |

## Testing

Per constitution Section X, testing is manual verification:

1. Prisma migration runs without errors
2. Backend route returns correct response (test with curl or API client)
3. Frontend proxy route forwards correctly
4. UI renders data and handles loading/error states
5. No console errors
6. Verified on Vercel deploy (not just localhost)

```bash
# Quick backend test
curl http://localhost:3001/api/v1/campaigns -H "Authorization: Bearer <token>"

# Run Prisma migration check
cd backend && npx prisma migrate status
```

## Deployment

```bash
# Frontend: Vercel (rootDirectory=frontend)
# Configured via vercel.json at repo root

# Backend: Deploy to your preferred Node.js host
# Database: Supabase PostgreSQL (production)
```

## Constitution Reference

All development is governed by `.specify/memory/constitution.md`. Key rules:

- Technology stack is **locked** — no new dependencies without written approval
- Campaign state machine has **hard gates** — transitions are validated, not suggestions
- **Full-Stack or Nothing** — no partial implementations committed
- AI features use **Gemini 2.0 Flash** only (1,500 req/day free tier)
- **Cost-conscious** — free tier always preferred
- Closed campaigns are **immutable** — database enforces this
