# TIKIT-SYSTEM- — AI-Powered Influencer Marketing Platform

> **Status**: 🚀 Demo-Ready | Backend 100% | Frontend 90% | Slice 5 in progress

---

## 📊 Current Build Status

| Layer | Status | Progress |
|---|---|---|
| Backend API (70+ endpoints) | ✅ Complete | 100% |
| Frontend Foundation (Next.js 14) | ✅ Complete | 100% |
| Slice 1 — Notification Proxy Routes | ✅ Complete | commit `510e493` |
| Slice 2 — Campaign Action Buttons | ✅ Complete | commit `6c3524a` |
| Slice 3 — Invoice Management Full Stack | ✅ Complete | commit `f3f4193` |
| Slice 4 — Content Workflow (script/draft/final) | ✅ Complete | commit `feb9723` |
| Slice 5 — Brief + AI Extraction | 🔄 In Progress | — |
| Production Deploy (Vercel) | ⏳ Pending Slice 5 | — |

**Last Hotfix**: Feb 21 2026 — null-safe rendering for influencers/collaborations (`1465a35`)

---

## 🎯 What TIKIT Does

TIKIT is a full-stack influencer marketing platform that allows agencies and brands to:
- Discover and match influencers to campaigns using AI
- Manage campaign lifecycle from brief to invoice
- Track deliverables, content workflow (script → draft → final), and payments
- Generate briefs with AI extraction and automate collaboration workflows

---

## ✅ Completed Slices (Feb 21, 2026)

### Slice 1 — Notification Proxy Routes (`510e493`)
- Notification proxy API routes wired through frontend
- Real-time notification delivery to campaign collaborators
- Mark-read, bulk-dismiss, and notification type filtering

### Slice 2 — Campaign Action Buttons (`6c3524a`)
- Campaign lifecycle action buttons fully wired (activate, pause, resume, complete, cancel)
- Status-aware button rendering (buttons shown based on current status)
- Confirmation dialogs + optimistic UI updates

### Slice 3 — Invoice Management Full Stack (`f3f4193`)
- Invoice creation, listing, status update (draft → sent → paid)
- Invoice line items, totals, tax calculation
- PDF-ready invoice structure; full CRUD wired frontend → backend

### Slice 4 — Content Workflow: Script / Draft / Final (`feb9723`)
- 3-stage content workflow per deliverable: Script → Draft → Final
- File upload at each stage with version history
- Stage-gated approval: brand must approve script before draft, draft before final
- Status tracking and timestamp logging per stage

---

## 🔄 Slice 5 — Brief + AI Extraction (In Progress)

**Goal**: Campaign brief creation with AI-powered field extraction
- Upload or paste brief document → AI extracts: campaign goals, target audience, deliverables, timeline, budget, tone
- Pre-fills campaign creation form with extracted data
- Human review + edit before saving
- Brief stored as artifact attached to campaign

---

## 🚀 Deploy

### One-Click Demo (No Config)
[![Deploy Demo to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cabdelkhalegh/TIKIT-SYSTEM-&project-name=tikit-demo&repository-name=tikit-demo&root-directory=frontend)

Works immediately — demo mode, no backend required.

### Deploy with Backend
[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cabdelkhalegh/TIKIT-SYSTEM-&project-name=tikit-system&repository-name=tikit-system&root-directory=frontend&env=NEXT_PUBLIC_API_URL&envDescription=Your%20backend%20API%20URL&envLink=https://github.com/cabdelkhalegh/TIKIT-SYSTEM-/blob/main/REQUIRED_VALUES_GUIDE.md)

Only requires: `NEXT_PUBLIC_API_URL` → your backend URL.

### Self-Hosted (Docker)
```bash
git clone https://github.com/cabdelkhalegh/TIKIT-SYSTEM-.git
cd TIKIT-SYSTEM-
cp .env.example .env
docker-compose up -d
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
```

---

## 🏗️ Project Structure

```
TIKIT-SYSTEM-/
├── backend/              # Express.js API (100% complete)
│   ├── src/
│   │   ├── routes/       # 70+ API endpoints
│   │   ├── middleware/   # Auth, validation, rate limiting
│   │   └── services/     # Business logic
│   └── prisma/           # DB schema + migrations
├── frontend/             # Next.js 14 App Router (90% complete)
│   └── src/
│       ├── app/          # Page components
│       ├── components/   # UI components
│       └── lib/          # API client, hooks, utils
└── docker-compose.yml
```

---

## 🔌 API Reference (Backend v0.6.0 — Port 3001)

All protected endpoints require: `Authorization: Bearer <token>`

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register user |
| POST | `/api/v1/auth/login` | Login, get JWT |
| GET | `/api/v1/auth/profile` | Get profile |
| PUT | `/api/v1/auth/profile` | Update profile |

### Campaigns
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/campaigns` | List (filter: status, clientId) |
| POST | `/api/v1/campaigns` | Create campaign |
| PUT | `/api/v1/campaigns/:id` | Update |
| POST | `/api/v1/campaigns/:id/activate` | Activate draft |
| POST | `/api/v1/campaigns/:id/pause` | Pause |
| POST | `/api/v1/campaigns/:id/resume` | Resume |
| POST | `/api/v1/campaigns/:id/complete` | Complete |
| POST | `/api/v1/campaigns/:id/brief` | Upload + extract brief (Slice 5) |

### Collaborations + Content Workflow
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/collaborations/:id/content/script` | Submit script |
| POST | `/api/v1/collaborations/:id/content/draft` | Submit draft |
| POST | `/api/v1/collaborations/:id/content/final` | Submit final |
| POST | `/api/v1/collaborations/:id/content/:stage/approve` | Approve stage |
| POST | `/api/v1/collaborations/:id/content/:stage/reject` | Reject stage |

### Invoices
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/invoices` | List invoices |
| POST | `/api/v1/invoices` | Create invoice |
| PUT | `/api/v1/invoices/:id` | Update |
| POST | `/api/v1/invoices/:id/send` | Mark as sent |
| POST | `/api/v1/invoices/:id/paid` | Mark as paid |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/notifications` | List notifications |
| PUT | `/api/v1/notifications/:id/read` | Mark read |
| PUT | `/api/v1/notifications/read-all` | Mark all read |

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/analytics/dashboard` | Platform-wide summary |
| GET | `/api/v1/analytics/campaigns/:id` | Campaign analytics |
| GET | `/api/v1/analytics/influencers/:id` | Influencer analytics |
| GET | `/api/v1/analytics/export` | Export all data |

---

## 🛠️ Tech Stack

**Backend**: Node.js 18 · Express.js · Prisma ORM · PostgreSQL · JWT · bcrypt · Multer  
**Frontend**: Next.js 14 (App Router) · TypeScript · Tailwind CSS · Radix UI · React Query · Recharts  
**Infrastructure**: Docker · Docker Compose · npm workspaces · Vercel (frontend)

---

## ⚡ Quick Start (Local Dev)

```bash
# Backend
cd backend && npm install
cp .env.example .env
npx prisma migrate dev
npm run db:seed
npm run dev           # → http://localhost:3001

# Frontend (new terminal)
cd frontend && npm install
npm run dev           # → http://localhost:3000
```

**Workspace commands:**
```bash
npm run dev           # Start all
npm run build         # Build all
npm run db:migrate    # Run migrations
npm run db:studio     # Prisma Studio
npm run docker:up     # Start containers
```

---

## 📈 Stats

- **Backend**: 6,000+ LOC · 70+ endpoints · 8 DB tables · 6 migrations
- **Frontend**: 4,500+ LOC · 25+ components · 4 complete feature slices
- **Docs**: 170,000+ words · 33 guides

---

## 📋 Known Issues / Open PRs

- **PR #39** (Copilot) — Route handler refactors (-264 lines). **DO NOT MERGE** until post-Vercel stable deploy (refactoring risk).
- **Main branch**: 4 high severity dependency vulnerabilities. Security fixes available in branches — merge after Slice 5.

---

## 🔒 Security

- JWT authentication with short expiry + refresh pattern
- bcrypt password hashing (cost factor 12)
- Role-based access control (admin / client_manager / influencer_manager)
- Rate limiting on all public endpoints
- Input validation + sanitization on all routes

---

**Last Updated**: February 22, 2026  
**Version**: 1.1.0 (Slices 1–4 complete)  
**Active work**: Slice 5 — Brief + AI Extraction  
**Next milestone**: Vercel production deploy (post-Slice 5)
