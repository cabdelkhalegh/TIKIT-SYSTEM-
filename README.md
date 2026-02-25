# TiKiT OS — Enterprise Influencer Marketing Operating System

> **Powered by PrecisionFlow by AK** · Built with SpecKit spec-driven methodology

TiKiT OS replaces fragmented agency tools (WhatsApp, Excel, email chains) with a single governed execution layer. Every entity — briefs, influencers, content, approvals, finances, and learnings — links back to a Campaign as the central operating container.

---

## 🔴 Live URL
> [https://tikit-v2.vercel.app](https://tikit-v2.vercel.app)

---

## 🏗️ Build Status

| Phase | Scope | Status |
|---|---|---|
| **Phase 1** | Setup & environment verification | ✅ Complete |
| **Phase 2** | Foundational — schema, services, middleware, types | ✅ Complete |
| **Phase 3** | US1 — Campaign Lifecycle (8-stage state machine) | 🔜 Next |
| Phase 4 | US2 — Brief Intake & AI Extraction | 🔜 Queued |
| Phase 5 | US3 — Influencer Discovery & AI Scoring | 🔜 Queued |
| Phase 6 | US4 — RBAC & Authentication | 🔜 Queued |
| Phase 7 | US5 — Content Workflow (Script→Draft→Final) | 🔜 Queued |
| Phase 8 | US8 — Finance & Invoicing | 🔜 Queued |
| Phase 9 | US9 — KPI Tracking & Auto-Capture | 🔜 Queued |
| Phase 10 | US6 — Client Portal | 🔜 Queued |
| Phase 11 | US7 — Influencer Portal | 🔜 Queued |
| Phase 12–15 | Reporting, Closure, Dashboard, Polish | 🔜 Queued |

**Full task breakdown:** [`specs/001-tikit-os-prd/tasks.md`](./specs/001-tikit-os-prd/tasks.md) — 133 tasks across 15 phases

---

## ✅ Phase 2 — What Was Built

### Prisma Schema (26 models, migrated to Supabase)
- **11 models enhanced:** User, Campaign, Client, Brief, Influencer, CampaignInfluencer, Content, Invoice, Notification, Media, NotificationPreferences
- **15 new models added:** UserRole, Profile, CompanyRegistration, BriefVersion, Strategy, CampaignClientAssignment, KPI, KPISchedule, Report, BudgetRevision, Approval, Reminder, CXSurvey, PostMortem, AuditLog
- **Migration applied:** `20260225175010_v2_full_prd` → Supabase PostgreSQL

### Backend Services
| File | Purpose |
|---|---|
| `backend/src/services/id-generator-service.js` | Generates TKT-/CLI-/INF-/INV- human-readable IDs |
| `backend/src/services/gemini-service.js` | Centralized Gemini 2.0 Flash AI service (6 methods) |
| `backend/src/services/risk-scoring-service.js` | Auto-calculates campaign risk score (Low/Medium/High) |
| `backend/src/utils/status-transition-helper.js` | Validates 8-stage campaign gate requirements |
| `backend/src/middleware/campaign-immutability.js` | Blocks edits on closed campaigns |

### Middleware
- **RBAC:** `access-control.js` enhanced — 6-role union support, `hasRole()`, `hasAnyRole()`, `isDirector()`, `isInternalUser()`
- **Route methods:** `role-based-method.js` — supports role array per route

### Frontend
| File | Purpose |
|---|---|
| `frontend/src/types/index.ts` | TypeScript interfaces for all 26 models + 16 enums |
| `frontend/src/hooks/useRoleAccess.ts` | Role access flags + `canViewTab()` + `canPerformAction()` |
| `frontend/src/components/auth/ProtectedRoute.tsx` | Route guard with role-based redirect logic |

### Route Registration
- `backend/src/index.js` updated with safe stubs for all 8 future routes (strategy, KPI, reports, closure, audit, admin, portals)

---

## 🏛️ Architecture

```
frontend/ (Next.js 14, TypeScript, TailwindCSS, shadcn/ui)
    ↕ proxy via /api/v1/*
backend/ (Node.js + Express + Prisma ORM)
    ↕
Supabase PostgreSQL (mijkhorasrdbwjgjmakg.supabase.co)
Supabase Storage (briefs, content, trade licenses)
Google Gemini 2.0 Flash (AI extraction, scoring, strategy)
```

**Deploy:** Vercel (frontend, rootDirectory=frontend) + Supabase (DB + storage)

---

## 🔐 Roles

| Role | Access |
|---|---|
| Director | Full access, overrides, user management |
| Campaign Manager | Campaigns, briefs, influencers, content approval |
| Reviewer | View + approve briefs/content/reports |
| Finance | Invoices, budget visibility |
| Client | Client Portal only (assigned campaigns) |
| Influencer | Influencer Portal only (assigned briefs/content) |

Multi-role supported for internal users (Director+CM, Reviewer+Finance). Client and Influencer roles are exclusive — cannot be combined with internal roles.

---

## 📊 Campaign Lifecycle (8 stages)

```
draft → in_review → pitching → live → reporting → closed
              ↕                    ↕
           paused              cancelled
```

Hard gates enforced at each transition. Director can override with documented reason.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, TailwindCSS, shadcn/ui, TanStack React Query |
| Backend | Node.js + Express + Prisma ORM |
| Database | PostgreSQL via Supabase |
| AI | Google Gemini 2.0 Flash |
| File Storage | Supabase Storage (1 GB per file) |
| Auth | JWT + localStorage |
| Deploy | Vercel + Supabase |
| Package Manager | npm |

---

## 📁 Repository Structure

```
TIKIT-SYSTEM-/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # 26 models
│   │   ├── migrations/            # Migration history
│   │   └── seed.js                # All 6 roles + test data
│   └── src/
│       ├── routes/                # 11 route files (+ 8 stubs registered)
│       ├── services/              # Gemini, ID generator, risk scoring
│       ├── middleware/            # RBAC, immutability, rate limiting
│       └── utils/                 # Status transition helper
├── frontend/
│   └── src/
│       ├── app/                   # Next.js pages + /api/v1 proxy routes
│       ├── components/            # UI components + ProtectedRoute
│       ├── hooks/                 # useRoleAccess
│       ├── services/              # API service layer
│       └── types/                 # TypeScript types (26 models + 16 enums)
└── specs/
    └── 001-tikit-os-prd/          # Full SpecKit spec
        ├── spec.md                # 12 user stories, 40 FRs
        ├── plan.md                # Architecture + 5 phases
        ├── tasks.md               # 133 tasks
        ├── data-model.md          # 26 Prisma models
        ├── research.md            # 12 key technical decisions
        ├── quickstart.md          # Developer onboarding
        └── contracts/             # 11 API contract files (90+ endpoints)
```

---

## 🚀 Local Development

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Set up environment
cp backend/.env.example backend/.env  # Fill in Supabase credentials
cp frontend/.env.local.example frontend/.env.local

# 3. Generate Prisma client
cd backend && npx prisma generate

# 4. Start backend
cd backend && npm run dev  # Port 3001

# 5. Start frontend
cd frontend && npm run dev  # Port 3000
```

For full setup: [`specs/001-tikit-os-prd/quickstart.md`](./specs/001-tikit-os-prd/quickstart.md)

---

## 📚 Spec Documentation

The full product spec lives in [`specs/001-tikit-os-prd/`](./specs/001-tikit-os-prd/):
- **[spec.md](./specs/001-tikit-os-prd/spec.md)** — 12 user stories, 40 functional requirements, success criteria
- **[tasks.md](./specs/001-tikit-os-prd/tasks.md)** — 133 implementation tasks ordered by dependency
- **[data-model.md](./specs/001-tikit-os-prd/data-model.md)** — Complete Prisma schema with all relationships
- **[contracts/](./specs/001-tikit-os-prd/contracts/)** — 11 API contract files (90+ endpoints)
- **[.specify/memory/constitution.md](./.specify/memory/constitution.md)** — 12 governing principles

---

*Built with SpecKit spec-driven methodology · Powered by Anthropic Claude · Supabase · Google Gemini*
