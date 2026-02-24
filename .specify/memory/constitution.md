# TiKiT OS Constitution

## Core Principles

### I. Full-Stack or Nothing
Every feature ships with all four layers: DB migration + backend route + frontend proxy + UI component.
No orphaned endpoints. No UI calling missing routes. No partial implementations merged to main.

### II. Spec-First Development
Every new feature starts with a written spec before any code is touched.
Specs live in `.specify/memory/`. Code follows the spec — not the other way around.
Changing the spec mid-implementation requires explicit approval and a new plan.

### III. AI-Augmented, Human-Approved
AI (Gemini 2.0 Flash) handles extraction, scoring, strategy generation, and matching suggestions.
All AI outputs are advisory — human review before any data is saved or acted upon.
AI features degrade gracefully: if Gemini is unavailable, the manual path always works.

### IV. Agency-First UX
TiKiT is built for agency operators (not end-users). Every flow is optimized for speed and clarity.
Primary persona: campaign manager at a mid-size influencer agency.
UI decisions: fewer clicks > more options. Approval gates are hard gates.

### V. Stable Before Extended
No new features until existing features are verified end-to-end on Vercel.
Every slice must pass: DB migration confirmed + API returns 200 + UI renders correctly + no console errors.
Bug fixes take priority over new slices.

### VI. Zero Regression Policy
Every commit must not break existing working features.
Before merging any new slice: manually verify the 5 core flows (login, create campaign, add influencer, invoice, brief extraction).

### VII. Cost-Conscious Architecture
Free tier first: Supabase (PostgreSQL + Auth + Storage), Vercel (frontend), Gemini 2.0 Flash (1,500 req/day free).
No paid services added without explicit approval.
Lovable `campaign-companion` repo: READ ONLY. Never touch it.

## Tech Stack (Locked)
- **Frontend:** Next.js 14, TypeScript, TailwindCSS, shadcn/ui, React Query
- **API layer:** Next.js API routes as proxy → Express backend
- **Backend:** Node.js + Express + Prisma ORM
- **Database:** SQLite (dev) → PostgreSQL via Supabase (production)
- **Auth:** JWT (backend) + localStorage (frontend) — Supabase Auth migration planned
- **AI:** Google Gemini 2.0 Flash (`@google/generative-ai`)
- **Deploy:** Vercel (frontend, rootDirectory=frontend) + Supabase (DB + storage)
- **Package manager:** npm

## Data Model Principles
- All IDs: cuid() — never auto-increment integers
- All timestamps: createdAt + updatedAt on every model
- Soft deletes: NOT used — hard delete with cascade rules
- JSON fields: stored as String in SQLite, parsed in service layer
- Audit trail: `audit_logs` table (planned — not yet implemented)

## Development Workflow
1. Write spec in `.specify/memory/`
2. Run `/speckit.plan` → get task breakdown
3. Build slice (all 4 layers)
4. Verify end-to-end before commit
5. Commit with format: `feat: [slice name] — [what was built]`
6. Push to GitHub → Vercel auto-deploys

## Governance
This constitution supersedes all other development practices for TiKiT OS.
Amendments require: written reason + impact on existing features + explicit approval from AK.
All AI-assisted builds must follow this constitution as their primary constraint document.

**Version**: 1.0.0 | **Ratified**: 2026-02-25 | **Last Amended**: 2026-02-25
