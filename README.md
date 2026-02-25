# TIKIT-SYSTEM — AI-Powered Influencer Marketing Operating System

> **Status**: 🏗️ Phase 2 Complete — Foundational Layer Built | Phase 3 Starting

---

## 📊 Current Build Status

| Phase | Status | Commits | What Was Built |
|---|---|---|---|
| Phase 1 — Setup | ✅ Complete | `ef76312` | Baseline Prisma migration, monorepo verified |
| Phase 2 — Foundational | ✅ Complete | `87b5bb6`, `76c8b4c` | Schema (26 models), services, middleware, frontend types |
| Phase 3 — Campaign Lifecycle (US1) | 🔜 Next | — | 8-stage campaign workflow, detail hub, risk scoring UI |
| Phase 4–12 — User Stories 2–12 | ⏳ Pending Phase 3 | — | — |

**Full spec**: [`specs/001-tikit-os-prd/`](./specs/001-tikit-os-prd/)

---

## 🎯 What TiKiT OS Is

TiKiT OS is an enterprise influencer marketing **operating system** — a full-stack platform that manages the complete campaign lifecycle from brief intake to post-mortem, with AI assistance at every stage.

### Core Capabilities (Per Spec)
- 8-stage campaign lifecycle with hard-gated status transitions
- AI-powered brief extraction, strategy generation, and influencer scoring (Gemini)
- 6-role access control: Director, Campaign Manager, Reviewer, Finance, Client, Influencer
- Human-readable display IDs: `TKT-YYYY-XXXX`, `CLI-XXXX`, `INF-XXXX`, `INV-YYYY-XXXX`
- Optimistic concurrency for concurrent edits (field-level merge, version checks)
- Full audit trail via `AuditLog` model
- Client and Influencer self-serve portals (Phase 6+)

---

## ✅ Phase 2 — Foundational Layer (Complete)

> Commits: `87b5bb6` (partial — schema migration, middleware, status helper) + `76c8b4c` (complete — frontend types, hooks, route stubs)

### 2A: Prisma Schema — 11 → 26 Models

Expanded from baseline 11 models to **26 models** covering the full TiKiT OS domain:

**Existing models updated**: `User`, `Campaign`, `Client`, `Brief`, `Influencer`, `CampaignInfluencer`, `Content`, `Invoice`, `Notification`
- Added `displayId` fields, V2 status enums, risk scoring fields, version fields, closure/approval/gate/posting-schedule fields

**New models added**: `UserRole`, `Profile`, `CompanyRegistration`, `BriefVersion`, `Strategy`, `CampaignClientAssignment`, `KPI`, `KPISchedule`, `Report`, `BudgetRevision`, `Approval`, `Reminder`, `CXSurvey`, `PostMortem`, `AuditLog`, `InstagramConnection`

**New enums**: `CampaignStatus`, `CampaignPhase`, `RiskLevel`, `RoleName`, `InfluencerLifecycleStatus`, `ContentType`, `ContentApprovalStatus`, `InvoiceType`, `InvoiceStatus`, `ReportStatus`, `ApprovalType`, `KPISource`, `ProfileStatus`, `ClientType`, `RegistrationStatus`, `ExceptionType`

Migration applied to Supabase PostgreSQL (`v2-full-prd`).

### 2B: Backend Services (4 New Services)

| Service | File | Purpose |
|---|---|---|
| ID Generator | `backend/src/services/id-generator-service.js` | Atomic human-readable IDs (`TKT-`, `CLI-`, `INF-`, `INV-`) |
| Gemini AI Shell | `backend/src/services/gemini-service.js` | Centralized AI methods with fallback handling + 1,500/day tracking |
| Risk Scoring | `backend/src/services/risk-scoring-service.js` | Auto-calculate campaign risk score (low/medium/high thresholds) |
| Status Transition Helper | `backend/src/utils/status-transition-helper.js` | Validate 8-stage gate requirements before status changes |

### 2C: Middleware Enhancements

- **RBAC** (`backend/src/middleware/access-control.js`): Added `hasRole()`, `hasAnyRole()`, `isDirector()`, `isInternalUser()` helpers; multi-role union checks via `UserRole` junction table; Client/Influencer exclusivity enforcement
- **Role-Based Method** (`backend/src/middleware/role-based-method.js`): Multi-role union support; per-route role configuration
- **Prisma Campaign Immutability**: Middleware guard on `Campaign` — blocks update/delete when `status=closed`

### 2D: Frontend Foundations

- **TypeScript types** (`frontend/src/types/`): All 26 models and 16 enums typed for V2
- **`useRoleAccess` hook** (`frontend/src/hooks/useRoleAccess.ts`): Boolean flags (`isDirector`, `isCampaignManager`, `isReviewer`, `isFinance`, `isClient`, `isInfluencer`), `canViewTab()` helper, nav filtering
- **`ProtectedRoute` component** (`frontend/src/components/auth/ProtectedRoute.tsx`): `allowedRoles` prop, unauthorized redirect, uses `useRoleAccess`

### 2E: Backend Route Stubs Registered

All new route files registered in `backend/src/index.js`:
`strategy-routes`, `kpi-routes`, `report-routes`, `closure-routes`, `audit-routes`, `admin-routes`, `client-portal-routes`, `influencer-portal-routes`

---

## 🔜 Phase 3 — Campaign Lifecycle (US1) — Next

**Goal**: Campaign Managers create and manage campaigns through the full 8-stage workflow.

**What will be built** (T019–T032 from `specs/001-tikit-os-prd/tasks.md`):
- Enhanced campaign creation (3 modes: brief / wizard / quick) with display ID generation
- Status transition endpoint with gate validation and Director override for high-risk
- Risk assessment endpoint
- Optimistic concurrency (version + field-level merge, `409 Conflict`)
- Campaign detail hub page with 8-tab layout (Brief, Strategy, Influencers, Content, KPIs, Reports, Finance, Closure)
- `RiskBadge`, `ApprovalGateCards`, `CampaignHeader`, `CampaignTabs` components
- Campaign list updated with 8-stage status badges and risk indicators

---

## 📁 Spec & Documentation

Full product spec is in [`specs/001-tikit-os-prd/`](./specs/001-tikit-os-prd/):

| File | Contents |
|---|---|
| `spec.md` | Full product spec — 12 user stories, FRs, NFRs, UX flows |
| `plan.md` | Technical execution plan |
| `tasks.md` | 133 implementation tasks across 12 phases |
| `data-model.md` | 26 models, 16 enums, all relationships |
| `contracts/` | 11 API contracts (request/response schemas) |
| `constitution.md` | Development governance rules |

---

## 🏗️ Project Structure

```
TIKIT-SYSTEM-/
├── backend/
│   ├── src/
│   │   ├── routes/           # API endpoints (70+ existing + new stubs registered)
│   │   ├── middleware/       # Auth, RBAC (6-role), immutability guard
│   │   ├── services/         # id-generator, gemini-ai, risk-scoring
│   │   └── utils/            # status-transition-helper
│   └── prisma/
│       └── schema.prisma     # 26 models, 16 enums, v2-full-prd migration
├── frontend/
│   └── src/
│       ├── types/            # TypeScript types for all 26 models + 16 enums
│       ├── hooks/            # useRoleAccess (6-role access control)
│       ├── components/
│       │   └── auth/         # ProtectedRoute component
│       └── app/              # Next.js App Router pages
├── specs/
│   └── 001-tikit-os-prd/     # Full product spec + 133 tasks
└── docker-compose.yml
```

---

## 🛠️ Tech Stack

**Backend**: Node.js 18 · Express.js · Prisma ORM · PostgreSQL (Supabase) · JWT · Gemini AI (Google) · bcrypt · Multer  
**Frontend**: Next.js 14 (App Router) · TypeScript · Tailwind CSS · Radix UI · React Query  
**Infrastructure**: Docker · Docker Compose · npm workspaces · Vercel (frontend target)  
**Database**: Supabase PostgreSQL · 26 models · v2-full-prd migration applied

---

## ⚡ Quick Start (Local Dev)

```bash
# Backend
cd backend && npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run dev           # → http://localhost:3001

# Frontend (new terminal)
cd frontend && npm install
npm run dev           # → http://localhost:3000
```

---

## 🔒 Security & Access Control

- JWT authentication with short expiry + refresh pattern
- bcrypt password hashing (cost factor 12)
- **6-role RBAC**: Director · Campaign Manager · Reviewer · Finance · Client · Influencer
- Multi-role union support via `UserRole` junction table
- Client/Influencer mutual exclusivity enforced at middleware level
- Rate limiting on all public endpoints
- Campaign immutability enforced: closed campaigns cannot be modified

---

## 📈 Stats (Phase 2 Complete)

- **Backend**: 26 DB models · 16 enums · 4 new services · enhanced RBAC middleware
- **Frontend**: TypeScript types for all V2 models · `useRoleAccess` hook · `ProtectedRoute` component
- **Spec**: 133 tasks · 12 user stories · 11 API contracts

---

**Last Updated**: February 25, 2026  
**Version**: 2.0.0 — Phase 2 Foundational Complete  
**Active work**: Phase 3 — Campaign Lifecycle (US1)  
**Spec**: [`specs/001-tikit-os-prd/`](./specs/001-tikit-os-prd/)
