# TiKiT OS Constitution
**Governing principles for V2 development — binding on all contributors and AI agents**

---

## I. Product Identity (Non-Negotiable)

TiKiT OS is an **enterprise-grade operating system for influencer marketing agencies**.
It replaces WhatsApp + Excel + email chains with a single governed execution layer.
**The Campaign is the central container.** Every entity — briefs, influencers, content, approvals, finances, learnings — links back to a CampaignID.

**V1 Reference:** https://amplify-ops-hub.lovable.app (read-only — never touch this repo)
**V2 Target Deploy:** https://tikit-v2.vercel.app

---

## II. Technology Stack (Locked — No Exceptions)

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, TailwindCSS, shadcn/ui (Radix primitives) |
| State / Data | TanStack React Query, React Hook Form |
| API Layer | Next.js API routes as proxy → Express backend |
| Backend | Node.js + Express + Prisma ORM |
| Database | SQLite (dev) → PostgreSQL via Supabase (production) |
| Auth | JWT tokens (backend) + localStorage (frontend) |
| AI | Google Gemini 2.0 Flash — `@google/generative-ai` |
| File Storage | Supabase Storage |
| Deploy | Vercel (frontend, rootDirectory=frontend) + Supabase (DB + storage) |
| Package Manager | npm |
| Charts | Recharts |
| Notifications | Sonner (toast) |

**Adding any technology outside this table requires explicit written approval from AK.**

---

## III. Role System (6 Roles — Hard Enforced)

All six roles enforced at UI level (route guards + conditional rendering) AND database level (Prisma queries scoped by role):

| Role | Access Scope |
|---|---|
| Director | Everything. Budget overrides. Exception approvals. User management. High-risk overrides. |
| Campaign Manager | Create/edit campaigns. Manage workflows. Internal content approval. Influencer + client management. |
| Reviewer | View campaigns. Approve briefs/content/reports. Read-only otherwise. |
| Finance | Invoice management. Budget visibility. No campaign editing. |
| Client | Client Portal only. View assigned campaigns. Approve shortlists/content/reports. |
| Influencer | Influencer Portal only. View briefs. Submit content. Request adjustments. |

**RLS principle:** Every database query is scoped to what the user's role can see. No "give me all campaigns and filter in JS." Query correctly at the source.

---

## IV. Campaign State Machine (Mandatory Gates)

8 stages — transitions are hard-gated, not suggestions:

```
draft → in_review → pitching → live → reporting → closed
```

**Gate rules (non-negotiable):**
- `draft → in_review`: brief must be saved + reviewed
- `in_review → pitching`: Director must approve budget
- `pitching → live`: client must approve influencer shortlist
- `live → reporting`: all influencers must have live post URLs submitted
- `reporting → closed`: report must be client-approved + all invoices settled

**Director can override any gate with a written reason. Reason is logged.**
**Closed campaigns are immutable. No exceptions. Database enforces this.**

---

## V. Full-Stack or Nothing (Hard Rule)

Every feature ships with all four layers:
1. Database migration (Prisma schema + migration file)
2. Backend route (Express handler)
3. Frontend proxy route (Next.js `/api/v1/*`)
4. UI component (page or tab)

**No orphaned endpoints. No UI calling missing routes. No partial implementations committed.**
A feature is not "done" until all four layers are present and verified end-to-end.

---

## VI. AI Usage Rules

TiKiT uses Gemini 2.0 Flash for:
- Brief extraction (objectives, KPIs, audience, deliverables, budget signals, client info)
- Strategy generation (summary, key messages, content pillars, matching criteria)
- Influencer scoring (weighted match against strategy criteria)
- Report narrative generation
- Closure intelligence documents
- Trade license OCR extraction

**Hard rules:**
- All AI outputs are **advisory**. Human must confirm before any data is saved.
- AI features must **degrade gracefully**: if Gemini is unavailable, manual path always works.
- Never hard-code AI responses into UI. Always call the API.
- Gemini free tier: 1,500 req/day. Design prompts to be efficient.

---

## VII. Data Model Standards

Every Prisma model must have:
- `id String @id @default(cuid())` — never auto-increment integers
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Human-readable IDs (generate in backend logic, store as separate field):
- Campaigns: `TKT-YYYY-XXXX`
- Clients: `CLI-XXXX`
- Influencers: `INF-XXXX`
- Invoices: `INV-YYYY-XXXX`

Append-only records (version history, budget revisions, audit logs): **never update, only insert**.
JSON fields stored as `String` in SQLite, parsed in the service layer — not in components.

---

## VIII. Approval Workflow Standards

Three types of approvals exist in TiKiT:
1. **Brief approval** — Reviewer or Director confirms brief is ready
2. **Content approval** — Two-stage: internal (CM) → client
3. **Shortlist approval** — Client approves influencer list before outreach

**Hard gates:**
- Script must reach `internal_approved` before filming is allowed (`filming_blocked` flag)
- Final content must reach `client_approved` before posting is allowed (`posting_blocked` flag)
- Exceptions (urgent posting, verbal approval, client timeout): CM requests → Director approves → logged

---

## IX. Cost-Conscious Architecture

Free tier always preferred:
- Supabase free tier (PostgreSQL + Auth + Storage)
- Vercel free tier (frontend deploy)
- Gemini 2.0 Flash (1,500 req/day free)

**No paid service added without explicit approval from AK.**
V1 Lovable repo (`campaign-companion`): **read-only reference. Never touch. Never deploy from it.**

---

## X. Definition of Done (Per Feature)

A feature is DONE when:
- [ ] Prisma migration runs without errors
- [ ] Backend route returns correct response (tested with curl or Postman)
- [ ] Frontend proxy route forwards correctly
- [ ] UI renders data and handles loading/error states
- [ ] No console errors
- [ ] Manually verified on Vercel deploy (not just localhost)
- [ ] Committed with format: `feat: [feature name] — [what was built]`

A feature is NOT done because "it works on my machine."

---

## XI. What V2 Must Deliver (Full Feature Target)

V2 must reach full functional parity with V1. Remaining modules to build:

**Phase A — Core Completion (current)**
- [x] Campaign CRUD
- [x] Client management
- [x] Influencer management
- [x] Collaboration management
- [x] Content workflow (Script → Draft → Final + approval)
- [x] Invoice management
- [x] Brief upload + Gemini AI extraction
- [x] Campaign creation wizard (3 modes)
- [ ] Campaign status state machine with hard gates
- [ ] Risk scoring (auto-calculated)

**Phase B — Intelligence Layer**
- [ ] Strategy generation (from brief → Gemini → editable output)
- [ ] Influencer AI scoring per campaign
- [ ] KPI tracking (manual + auto-scheduled)
- [ ] Report generation with AI narrative

**Phase C — Portals**
- [ ] Client Portal
- [ ] Influencer Portal

**Phase D — Closure & Governance**
- [ ] Campaign closure flow (checklist + CX survey + post-mortem + AI learnings)
- [ ] Audit logging
- [ ] Row-level security (Supabase RLS migration)

**Phase E — Auth & User Management**
- [ ] Multi-step company signup with trade license upload + AI OCR
- [ ] Director-approves-registration flow
- [ ] Role management page (Director only)

---

## XII. Governance

This constitution is the highest-authority document in this project.
It supersedes any other convention, default, or AI suggestion.

**Amendments require:**
1. Written reason
2. Impact assessment on existing features
3. Explicit written approval from AK

**Every AI coding agent working on this project must:**
- Read this constitution before writing a single line of code
- Apply Section V (Full-Stack or Nothing) to every task
- Apply Section X (Definition of Done) before marking anything complete
- Never remove existing working features to add new ones

**Version**: 2.0.0 | **Ratified**: 2026-02-25 | **Last Amended**: 2026-02-25
