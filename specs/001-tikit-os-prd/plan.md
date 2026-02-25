# Implementation Plan: TiKiT OS — Enterprise Influencer Marketing Operating System

**Branch**: `001-tikit-os-prd` | **Date**: 2026-02-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-tikit-os-prd/spec.md`

## Summary

TiKiT OS V2 is an enterprise-grade operating system for influencer marketing agencies that replaces fragmented tools (WhatsApp, Excel, email) with a single governed execution layer. Campaigns serve as the central operating container — every entity (briefs, influencers, content, approvals, finances, learnings) links back to a CampaignID. The system implements a strict 8-stage campaign state machine with mandatory gates, 6-role RBAC with row-level security, AI-powered brief extraction and strategy generation via Gemini 2.0 Flash, Instagram API integration for influencer discovery and KPI capture, two-stage content approval workflows, dedicated Client and Influencer portals, full financial tracking, and campaign closure with AI-generated intelligence documents.

The V2 codebase already has foundational infrastructure (auth, campaign CRUD, client/influencer management, collaboration workflows, brief upload + Gemini extraction, content management, invoicing, notifications, analytics). This plan addresses the gap between current implementation and full PRD parity across 5 phases defined in the constitution.

## Technical Context

**Language/Version**: TypeScript 5.6 (frontend), JavaScript ES2022 (backend)
**Primary Dependencies**: Next.js 14, React 18, Express.js 4.18, Prisma 5.x, TanStack React Query, React Hook Form, shadcn/ui (Radix), Recharts, Sonner, Zustand, Google Generative AI (Gemini 2.0 Flash)
**Storage**: SQLite (dev) → PostgreSQL via Supabase (production), Supabase Storage (files)
**Testing**: Manual verification on Vercel deploy (per constitution Section X)
**Target Platform**: Web application — Vercel (frontend, rootDirectory=frontend) + Node.js backend
**Project Type**: Full-stack web application (monorepo)
**Performance Goals**: 50 concurrent internal users + 200 concurrent portal users, campaign creation from brief in <5 min, influencer scoring in <3 min, notifications within 30 sec
**Constraints**: Free-tier architecture (Supabase, Vercel, Gemini 1,500 req/day), AED-only currency, UAE market, 1 GB max upload per content artifact
**Scale/Scope**: ~25 pages/views, 20+ Prisma models, 42 functional requirements, 12 user stories, 5 implementation phases

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Constitution Rule | Status | Notes |
|---|---|---|---|
| II | Technology Stack Locked | PASS | All technologies align: Next.js 14, Express, Prisma, Gemini 2.0 Flash, Supabase, Vercel, shadcn/ui, Recharts, Sonner, npm |
| III | 6 Roles Hard Enforced (UI + DB) | PASS | Spec defines same 6 roles. Current codebase has 2 roles (client_manager, influencer) — migration needed to expand to 6 |
| IV | Campaign State Machine (8 stages, hard gates) | PASS | Spec defines same 8-stage model with identical gate rules. Current codebase has 5-stage simplified model — migration needed |
| V | Full-Stack or Nothing | PASS | Plan ensures every feature ships with: Prisma migration + Express route + Next.js proxy + UI component |
| VI | AI Usage (Gemini, advisory, graceful degradation) | PASS | Spec requires all AI outputs as advisory with manual fallback. Gemini 1,500 req/day limit respected |
| VII | Data Model Standards (CUID, timestamps, human IDs, append-only) | PASS | Plan follows CUID primary keys, createdAt/updatedAt, human-readable IDs (TKT/CLI/INF/INV), append-only versioning |
| VIII | Approval Workflow Standards (filming/posting gates) | PASS | Spec defines identical gates: script→internal_approved before filming, final→client_approved before posting, Director exception with log |
| IX | Cost-Conscious Architecture (free tier) | PASS | All services on free tier. No paid services introduced |
| X | Definition of Done | PASS | Plan requires: migration runs, backend route responds, proxy forwards, UI renders with loading/error, no console errors, Vercel verified |
| XII | Governance (constitution is highest authority) | PASS | Plan defers to constitution on all conflicts |

**Pre-Research Gate: PASS** — No violations detected.

## Project Structure

### Documentation (this feature)

```text
specs/001-tikit-os-prd/
├── plan.md              # This file
├── research.md          # Phase 0: decisions and research findings
├── data-model.md        # Phase 1: complete Prisma data model
├── quickstart.md        # Phase 1: developer onboarding guide
├── contracts/           # Phase 1: API endpoint contracts
│   ├── auth.md
│   ├── campaigns.md
│   ├── briefs.md
│   ├── influencers.md
│   ├── content.md
│   ├── kpis.md
│   ├── finance.md
│   ├── reports.md
│   ├── portals.md
│   ├── admin.md
│   └── notifications.md
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── prisma/
│   ├── schema.prisma          # Data model (11 models → 20+ models)
│   ├── migrations/            # Migration history
│   └── seed.js                # Seed data for all 6 roles
├── src/
│   ├── index.js               # Express entry point
│   ├── routes/
│   │   ├── auth-routes.js           # Existing — enhance with trade license signup
│   │   ├── campaign-routes.js       # Existing — add state machine gates, risk scoring
│   │   ├── client-routes.js         # Existing — add display IDs
│   │   ├── influencer-routes.js     # Existing — add Instagram discovery, AI scoring
│   │   ├── collaboration-routes.js  # Existing — refactor to campaign-influencer lifecycle
│   │   ├── brief-routes.js          # Existing — add version history, confidence indicators
│   │   ├── content-routes.js        # Existing — add two-stage approval, gates
│   │   ├── invoice-routes.js        # Existing — add status flow, budget tracking
│   │   ├── media-routes.js          # Existing
│   │   ├── notification-routes.js   # Existing — add escalation rules
│   │   ├── analytics-routes.js      # Existing — enhance for KPI auto-capture
│   │   ├── strategy-routes.js       # NEW — AI strategy generation
│   │   ├── kpi-routes.js            # NEW — KPI tracking + auto-capture
│   │   ├── report-routes.js         # NEW — report generation + AI narrative
│   │   ├── closure-routes.js        # NEW — CX survey, post-mortem, AI learnings
│   │   ├── audit-routes.js          # NEW — audit log + activity feed
│   │   ├── admin-routes.js          # NEW — role management, registration approval
│   │   ├── client-portal-routes.js  # NEW — client portal API
│   │   └── influencer-portal-routes.js # NEW — influencer portal API
│   ├── middleware/
│   │   ├── access-control.js        # Existing — enhance for 6-role RBAC
│   │   ├── role-based-method.js     # Existing — enhance for role union
│   │   └── ...                      # Other existing middleware
│   ├── services/
│   │   ├── gemini-service.js        # NEW — centralized Gemini AI service
│   │   ├── instagram-service.js     # NEW — Meta Graph API integration
│   │   ├── id-generator-service.js  # NEW — human-readable ID generation
│   │   ├── risk-scoring-service.js  # NEW — campaign risk calculation
│   │   ├── escalation-service.js    # NEW — approval reminder/escalation
│   │   └── ...                      # Existing services
│   └── utils/
│       └── ...                      # Existing utilities
└── tests/

frontend/
├── src/
│   ├── app/
│   │   ├── api/                     # Existing proxy routes — extend for new endpoints
│   │   ├── dashboard/
│   │   │   ├── page.tsx             # Existing — enhance with role-aware stats
│   │   │   ├── campaigns/           # Existing — add 8-tab detail view
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx     # Campaign detail hub (8 tabs)
│   │   │   │   │   └── brief/
│   │   │   │   │       └── page.tsx # Brief intake page
│   │   │   ├── influencers/         # Existing — add Instagram discovery
│   │   │   ├── clients/             # Existing — add display IDs
│   │   │   ├── briefs/              # NEW — global brief tracking
│   │   │   ├── pitches/             # NEW — pitch management
│   │   │   ├── content/             # NEW — global content approval view
│   │   │   ├── reports/             # NEW — aggregated reporting
│   │   │   ├── finance/             # NEW — organization-wide finance
│   │   │   ├── reminders/           # NEW — campaign-linked reminders
│   │   │   ├── licensing/           # NEW — business licensing
│   │   │   └── roles/               # NEW — Director-only role management
│   │   ├── client-portal/           # NEW — client portal pages
│   │   ├── influencer-portal/       # NEW — influencer portal pages
│   │   ├── login/                   # Existing
│   │   └── register/                # Existing — enhance with trade license wizard
│   ├── components/
│   │   ├── campaigns/               # Existing — add status machine, risk, approval cards
│   │   │   ├── CampaignHeader.tsx
│   │   │   ├── CampaignTabs.tsx
│   │   │   ├── BriefTab.tsx
│   │   │   ├── StrategyTab.tsx
│   │   │   ├── InfluencersTab.tsx
│   │   │   ├── ContentTab.tsx
│   │   │   ├── KPIsTab.tsx
│   │   │   ├── ReportsTab.tsx
│   │   │   ├── FinanceTab.tsx
│   │   │   ├── ClosureTab.tsx
│   │   │   ├── ApprovalGateCards.tsx
│   │   │   └── RiskBadge.tsx
│   │   ├── influencers/             # Existing — add Instagram discovery dialog
│   │   ├── content/                 # Existing — add two-stage approval UI
│   │   ├── client-portal/           # NEW — portal components
│   │   ├── influencer-portal/       # NEW — portal components
│   │   ├── finance/                 # NEW — budget tracker, invoice management
│   │   ├── reports/                 # NEW — report builder, AI narrative
│   │   ├── closure/                 # NEW — CX survey, post-mortem, AI learnings
│   │   ├── admin/                   # NEW — role management, registration review
│   │   └── ui/                      # Existing shadcn/ui components
│   ├── services/                    # Existing — extend for new API calls
│   ├── stores/                      # Existing Zustand stores
│   ├── hooks/                       # NEW — custom hooks (useRoleAccess, useRiskCalculation)
│   ├── lib/                         # Existing utilities
│   └── types/                       # Existing — extend for new models
└── tests/
```

**Structure Decision**: Existing monorepo structure (frontend/ + backend/) is maintained per constitution. No new projects added. New features extend existing directories with new route files, components, and services. The constitution's Full-Stack or Nothing rule (Section V) means every feature adds all 4 layers: migration, backend route, frontend proxy, UI component.

## Complexity Tracking

No constitution violations to justify. All design decisions align with locked technology stack and architectural rules.

## Implementation Phases

Per constitution Section XI, features are organized into 5 phases:

### Phase A — Core Completion
- Campaign 8-stage state machine with hard gates
- Risk scoring (auto-calculated)
- Human-readable display IDs (TKT, CLI, INF, INV)
- 6-role RBAC expansion (from current 2 roles)
- Brief version history + confidence indicators
- Campaign detail hub with 8 tabs

### Phase B — Intelligence Layer
- Strategy generation (Gemini → editable output)
- Influencer AI scoring per campaign
- Instagram API discovery (name, username, hashtag)
- KPI tracking (manual + Day 1/3/7 auto-scheduled)
- Report generation with AI narrative
- Budget tracking (committed vs. spent)

### Phase C — Portals
- Client Portal (shortlist/content/report approval)
- Influencer Portal (brief acceptance, content submission)
- Approval escalation (24h/48h reminders, 72h Director escalation)

### Phase D — Closure & Governance
- Campaign closure flow (CX survey + post-mortem + AI learnings + intelligence doc)
- Audit logging (all state-changing actions + activity feed)
- Campaign immutability enforcement
- Data retention (3-year policy)

### Phase E — Auth & User Management
- Multi-step company signup with trade license upload + AI OCR
- Director-approves-registration flow
- Role management page (Director only)
- Session timeout (30 min), password policy, account lockout
