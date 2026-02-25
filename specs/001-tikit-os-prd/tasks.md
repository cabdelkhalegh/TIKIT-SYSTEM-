# Tasks: TiKiT OS — Enterprise Influencer Marketing Operating System

**Input**: Design documents from `/specs/001-tikit-os-prd/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Manual verification per constitution Section X — no automated test tasks

**Organization**: Tasks grouped by user story (12 stories, P1→P2→P3 priority order). Each story follows the Full-Stack Rule: Prisma migration + Express route + Next.js proxy + UI component.

## Format: `[ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[USn]**: Maps to User Story n from spec.md
- Paths relative to repo root (`backend/`, `frontend/`)

---

## Phase 1: Setup

**Purpose**: Verify environment and prepare working branch

- [ ] T001 Verify monorepo dependencies are installed — run `npm install` in `backend/` and `frontend/`
- [ ] T002 Verify existing Prisma schema compiles — run `npx prisma generate` in `backend/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schema migration, shared services, middleware — MUST complete before any user story

**⚠️ CRITICAL**: All user story phases depend on this phase completing first

### 2A: Prisma Schema & Migration

- [ ] T003 Add all new enums (CampaignStatus, CampaignPhase, RiskLevel, RoleName, InfluencerLifecycleStatus, ContentType, ContentApprovalStatus, InvoiceType, InvoiceStatus, ReportStatus, ApprovalType, KPISource, ProfileStatus, ClientType, RegistrationStatus, ExceptionType) to `backend/prisma/schema.prisma` per data-model.md enums section
- [ ] T004 Update all existing models (User, Campaign, Client, Brief, Influencer, CampaignInfluencer, Content, Invoice, Notification) with new fields per data-model.md — includes displayId fields, status enums, risk scoring, version field, closure fields, approval fields, gate fields, posting schedule fields
- [ ] T005 Add all new models (UserRole, Profile, CompanyRegistration, BriefVersion, Strategy, CampaignClientAssignment, KPI, KPISchedule, Report, BudgetRevision, Approval, Reminder, CXSurvey, PostMortem, AuditLog, InstagramConnection) to `backend/prisma/schema.prisma` per data-model.md models section
- [ ] T006 Run Prisma migration: `npx prisma migrate dev --name v2-full-prd` in `backend/`
- [ ] T007 Create data migration for existing records: map campaign statuses (active→live, completed→closed, paused/cancelled→draft), migrate client_manager users to UserRole table as campaign_manager, generate displayIds for existing Campaign/Client/Influencer/Invoice records — update `backend/prisma/seed.js` with all 6 roles and representative test data

### 2B: Shared Backend Services

- [ ] T008 [P] Create human-readable ID generator service in `backend/src/services/id-generator-service.js` — formats: TKT-YYYY-XXXX (campaigns), CLI-XXXX (clients), INF-XXXX (influencers), INV-YYYY-XXXX (invoices); uses Prisma $queryRaw for atomic counter tables per entity type (per R-007)
- [ ] T009 [P] Create centralized Gemini AI service shell in `backend/src/services/gemini-service.js` — methods: extractBrief(), generateStrategy(), scoreInfluencers(), generateReportNarrative(), generateClosureIntelligence(), extractTradeLicense(); each with try/catch returning `{success: false, fallbackRequired: true}` on failure; add request counter for 1,500/day tracking (per R-005)
- [ ] T010 [P] Create campaign risk scoring service in `backend/src/services/risk-scoring-service.js` — auto-calculate risk score: missing budget +3, missing start date +2, missing end date +2, missing client +2, missing fields up to +3; thresholds: low (<2), medium (2-4), high (5+) (per data-model.md)
- [ ] T011 [P] Create campaign status transition helper in `backend/src/utils/status-transition-helper.js` — validate 8-stage gates: draft→in_review (brief saved+reviewed), in_review→pitching (Director budget approval), pitching→live (client shortlist approval), live→reporting (all influencers have live post URLs), reporting→closed (report client-approved + all invoices settled) (per R-001)

### 2C: Middleware

- [ ] T012 Enhance RBAC middleware in `backend/src/middleware/access-control.js` — add hasRole(), hasAnyRole(), isDirector(), isInternalUser() helpers; support multi-role union check against UserRole junction table; enforce Client/Influencer exclusivity (per R-002)
- [ ] T013 Enhance role-based method middleware in `backend/src/middleware/role-based-method.js` — support role union (user with multiple roles gets combined access); add per-route role configuration
- [ ] T014 [P] Add Prisma middleware for campaign immutability in `backend/src/middleware/` or Prisma client extension — intercept update/delete on Campaign where status=closed and closedAt is set → throw error (per R-010)

### 2D: Frontend Foundations

- [ ] T015 [P] Create/extend TypeScript types for all V2 models, enums, and API responses in `frontend/src/types/` — cover all 26 models and 16 enums from data-model.md
- [ ] T016 [P] Create useRoleAccess hook in `frontend/src/hooks/useRoleAccess.ts` — provide boolean flags (isDirector, isCampaignManager, isReviewer, isFinance, isClient, isInfluencer, isInternalUser), canViewTab() helper, and navigation filtering logic (per R-002)
- [ ] T017 [P] Create ProtectedRoute wrapper component in `frontend/src/components/auth/ProtectedRoute.tsx` — accepts allowedRoles prop, redirects unauthorized users, uses useRoleAccess hook

### 2E: Backend Registration

- [ ] T018 Register all new route files in `backend/src/index.js` — add imports and app.use() for: strategy-routes, kpi-routes, report-routes, closure-routes, audit-routes, admin-routes, client-portal-routes, influencer-portal-routes

**Checkpoint**: Foundation ready — all enums, models, shared services, middleware, and types in place. User story implementation can begin.

---

## Phase 3: User Story 1 — Campaign Lifecycle Management (Priority: P1) 🎯 MVP

**Goal**: Campaign Managers create campaigns, progress them through the 8-stage workflow with hard-gated transitions, and manage all linked entities from a campaign detail hub with 8 tabs.

**Independent Test**: Create a campaign → advance through each status gate → verify all 8 tabs render → verify risk scoring → verify immutability after closure.

**FRs**: FR-006, FR-007, FR-008, FR-009, FR-010

### Implementation

- [ ] T019 [US1] Enhance campaign creation in `backend/src/routes/campaign-routes.js` — support 3 creation modes (brief/wizard/quick), generate TKT-YYYY-XXXX display ID via id-generator-service, auto-calculate initial risk score, set default managementFee=30
- [ ] T020 [US1] Add campaign status transition endpoint POST `/campaigns/:id/status` in `backend/src/routes/campaign-routes.js` — validate gate requirements via status-transition-helper, check Director approval for high-risk overrides (score 5+), record status change, auto-calculate phase from status
- [ ] T021 [US1] Add risk assessment endpoint GET `/campaigns/:id/risk` in `backend/src/routes/campaign-routes.js` — call risk-scoring-service, return score breakdown and risk level
- [ ] T022 [US1] Update campaign PATCH in `backend/src/routes/campaign-routes.js` — implement optimistic concurrency with field-level merge (version check, field-by-field diff, 409 Conflict for same-field conflicts per R-009)
- [ ] T023 [US1] Add campaign soft-delete DELETE in `backend/src/routes/campaign-routes.js` — only draft status, only Director/Campaign Manager, set isDeleted=true (per FR-007)
- [ ] T024 [P] [US1] Create Next.js proxy route for campaign status transition in `frontend/src/app/api/v1/campaigns/[id]/status/route.ts`
- [ ] T025 [P] [US1] Create Next.js proxy route for campaign risk assessment in `frontend/src/app/api/v1/campaigns/[id]/risk/route.ts`
- [ ] T026 [P] [US1] Create campaign service functions (statusTransition, getRisk, softDelete) in `frontend/src/services/campaign.service.ts`
- [ ] T027 [P] [US1] Create RiskBadge component (color-coded Low=green/Medium=amber/High=red with score) in `frontend/src/components/campaigns/RiskBadge.tsx`
- [ ] T028 [P] [US1] Create ApprovalGateCards component (Budget Approval Card, Shortlist Approval Card, High-Risk Override Card with Director approval flow) in `frontend/src/components/campaigns/ApprovalGateCards.tsx`
- [ ] T029 [US1] Create CampaignHeader component (campaign name, displayId, status badge with transition button, phase indicator, risk badge, edit/delete actions) in `frontend/src/components/campaigns/CampaignHeader.tsx`
- [ ] T030 [US1] Create CampaignTabs component (8-tab layout: Brief, Strategy, Influencers, Content, KPIs, Reports, Finance, Closure — tabs enabled/disabled based on campaign status) in `frontend/src/components/campaigns/CampaignTabs.tsx`
- [ ] T031 [US1] Implement campaign detail hub page at `frontend/src/app/dashboard/campaigns/[id]/page.tsx` — fetch campaign data, render CampaignHeader + CampaignTabs, pass campaign context to tab content
- [ ] T032 [US1] Update campaign list page at `frontend/src/app/dashboard/campaigns/page.tsx` — show 8-stage status badges, risk indicators, display IDs, filter by status/phase

**Checkpoint**: Campaigns can be created with 3 modes, display IDs generated, risk auto-calculated, status transitions validated through 8 gates, detail hub shows 8 tabs, optimistic concurrency works, closed campaigns are immutable.

---

## Phase 4: User Story 2 — Brief Intake and AI Extraction (Priority: P1)

**Goal**: Upload or paste client briefs, AI-extract structured data with confidence indicators, review and save, optionally generate a strategy. Brief modifications create append-only version history.

**Independent Test**: Upload a PDF brief → verify AI extraction with confidence scores → edit and save → verify version created → generate strategy → verify strategy fields populated.

**FRs**: FR-011, FR-012, FR-013, FR-014, FR-015

### Implementation

- [ ] T033 [US2] Implement extractBrief() method in `backend/src/services/gemini-service.js` — extract objectives, KPIs, target audience, deliverables, budget signals, client info from raw text; return per-field confidence scores; graceful degradation on failure
- [ ] T034 [US2] Implement generateStrategy() method in `backend/src/services/gemini-service.js` — generate summary, key messages, content pillars, matching criteria (platform, follower range, engagement minimums, niches, locations) from brief data
- [ ] T035 [US2] Enhance brief routes in `backend/src/routes/brief-routes.js` — add confidence scores to extraction response, add POST re-run extraction endpoint, add POST review endpoint (mark brief as reviewed), add GET version history endpoint; auto-create BriefVersion on every update; auto-link/create Client records from extracted client info (FR-014)
- [ ] T036 [P] [US2] Create strategy routes in `backend/src/routes/strategy-routes.js` — POST `/campaigns/:campaignId/strategy` (generate via Gemini), GET (retrieve), PUT (update editable fields)
- [ ] T037 [P] [US2] Create Next.js proxy routes for strategy endpoints in `frontend/src/app/api/v1/campaigns/[campaignId]/strategy/route.ts`
- [ ] T038 [P] [US2] Create Next.js proxy routes for brief enhancements (re-extract, review, versions) in `frontend/src/app/api/v1/campaigns/[campaignId]/briefs/`
- [ ] T039 [P] [US2] Create brief and strategy service functions in `frontend/src/services/brief.service.ts` — reExtract, markReviewed, getVersions, generateStrategy, updateStrategy
- [ ] T040 [US2] Create BriefTab component in `frontend/src/components/campaigns/BriefTab.tsx` — upload/paste input, AI extraction cards with per-field confidence indicators (green/amber/red), inline editing, re-run extraction button, review flow, version history accordion
- [ ] T041 [US2] Create StrategyTab component in `frontend/src/components/campaigns/StrategyTab.tsx` — display AI-generated strategy (summary, key messages, content pillars), editable fields, matching criteria visualization, regenerate button with manual fallback
- [ ] T042 [US2] Update brief intake page at `frontend/src/app/dashboard/campaigns/[id]/brief/page.tsx` — integrate confidence indicators, re-run option, manual entry fallback on extraction failure

**Checkpoint**: Briefs can be uploaded/pasted, AI extraction returns structured data with confidence scores, users can review and edit, version history is append-only, strategy generation works with Gemini, manual fallback available.

---

## Phase 5: User Story 3 — Influencer Discovery, Scoring, and Shortlisting (Priority: P1)

**Goal**: Discover influencers via Instagram (3 search modes), add them to campaigns, AI-score against strategy criteria, present shortlist to client for approval.

**Independent Test**: Search Instagram by username → add influencer to campaign → run AI scoring → verify match score and rationale → view client presentation.

**FRs**: FR-016, FR-017, FR-018, FR-019

### Implementation

- [ ] T043 [US3] Create Instagram service in `backend/src/services/instagram-service.js` — three search modes: by name (Pages API → linked IG accounts), by username (business_discovery endpoint with manual URL construction), by hashtag (hashtag search → resolve media owners); KPI fetch method for auto-capture (per R-004)
- [ ] T044 [US3] Implement scoreInfluencers() method in `backend/src/services/gemini-service.js` — weighted scoring: Platform 25%, Followers 20%, Engagement 20%, Niche/Geo/Language remaining; return score (0-100) and rationale per influencer (per FR-017)
- [ ] T045 [US3] Add influencer discovery endpoint POST `/influencers/discover` in `backend/src/routes/influencer-routes.js` — accept search mode + query, call instagram-service, return profile data array
- [ ] T046 [US3] Add INF-XXXX display ID generation to influencer creation in `backend/src/routes/influencer-routes.js` — support both complete profiles and stub profiles for quick shortlisting (FR-019)
- [ ] T047 [US3] Refactor `backend/src/routes/collaboration-routes.js` for campaign-influencer lifecycle — add to campaign (POST), list campaign influencers with AI scores (GET), transition lifecycle status (PATCH, 6-stage: proposed→approved→contracted→brief_accepted→live→completed), set pricing (POST), send brief (POST)
- [ ] T048 [US3] Add AI scoring endpoint POST `/campaigns/:campaignId/influencers/score` in `backend/src/routes/collaboration-routes.js` — score all proposed influencers against campaign strategy criteria via Gemini
- [ ] T049 [P] [US3] Create Next.js proxy routes for influencer discovery and campaign-influencer endpoints in `frontend/src/app/api/v1/influencers/` and `frontend/src/app/api/v1/campaigns/[campaignId]/influencers/`
- [ ] T050 [P] [US3] Create influencer service functions (discover, addToCampaign, scoreInfluencers, transitionStatus, setPricing) in `frontend/src/services/influencer.service.ts`
- [ ] T051 [US3] Create InstagramDiscoveryDialog component in `frontend/src/components/influencers/InstagramDiscoveryDialog.tsx` — 3 search mode tabs (name/username/hashtag), search results cards, add-to-campaign action
- [ ] T052 [US3] Create InfluencersTab component in `frontend/src/components/campaigns/InfluencersTab.tsx` — campaign influencer table (handle, follower count, engagement rate, AI score, rationale, status, pricing), score button, shortlist presentation view for client, lifecycle status management
- [ ] T053 [US3] Update influencer list page at `frontend/src/app/dashboard/influencers/page.tsx` — add discovery dialog trigger, show display IDs, profile status badges (complete/stub)

**Checkpoint**: Instagram discovery works with 3 search modes, influencers can be added to campaigns with stub or complete profiles, AI scoring returns weighted match scores with rationale, shortlist presentation view is client-ready.

---

## Phase 6: User Story 4 — Role-Based Access Control and Authentication (Priority: P1)

**Goal**: 6-role system with multi-step signup (trade license upload + AI OCR), Director-approved registration, role management, session security (30min timeout, lockout).

**Independent Test**: Sign up with trade license → verify pending state → Director approves → log in as each of 6 roles → verify navigation and data access matches role matrix.

**FRs**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-040

### Implementation

- [ ] T054 [US4] Implement extractTradeLicense() method in `backend/src/services/gemini-service.js` — OCR trade license images/PDFs, extract company name, VAT/TRN number, license number, expiry date, business address, activities, owner names
- [ ] T055 [US4] Enhance auth routes in `backend/src/routes/auth-routes.js` — add multi-step signup (credentials → trade license upload → AI extraction → review → submit), password complexity validation (8+ chars, uppercase, lowercase, number), account lockout after 10 failed attempts, 30-minute session timeout, Instagram OAuth callback (per FR-001, FR-002)
- [ ] T056 [US4] Create admin routes in `backend/src/routes/admin-routes.js` — GET /admin/registrations (list pending with extracted license data), POST approve/reject registration, GET /admin/users (list with roles/status), PATCH roles (assign/remove), POST reset-password, POST send-reset-email, DELETE user (per FR-040, contracts/admin.md)
- [ ] T057 [P] [US4] Create Next.js proxy routes for admin endpoints in `frontend/src/app/api/v1/admin/`
- [ ] T058 [P] [US4] Create admin service functions (getRegistrations, approveRegistration, rejectRegistration, getUsers, updateRoles, resetPassword) in `frontend/src/services/admin.service.ts`
- [ ] T059 [US4] Enhance registration page with multi-step wizard (Step 1: credentials, Step 2: trade license upload with AI extraction preview, Step 3: review before submission) in `frontend/src/app/register/page.tsx`
- [ ] T060 [US4] Update login page with lockout handling (display remaining attempts, locked message with timer) in `frontend/src/app/login/page.tsx`
- [ ] T061 [US4] Create registration approval page (Director only) in `frontend/src/app/dashboard/licensing/page.tsx` — list pending registrations, show AI-extracted trade license data, approve/reject with reason
- [ ] T062 [US4] Create role management page (Director only) in `frontend/src/app/dashboard/roles/page.tsx` — user list with current roles, assign/remove roles (enforce Client/Influencer exclusivity), user status management
- [ ] T063 [US4] Update sidebar navigation to filter items by role using useRoleAccess hook — Directors see all, Campaign Managers see campaigns/briefs/influencers/content, Finance sees finance, Client/Influencer redirect to portals

**Checkpoint**: Multi-step signup works with AI trade license OCR, accounts require Director approval, 6 roles enforced at UI and data level, session security (timeout, lockout, password policy) active, role management page functional for Directors.

---

## Phase 7: User Story 5 — Content Workflow with Two-Stage Approval (Priority: P2)

**Goal**: Influencers submit content (Script/Draft/Final) through two-stage approval (internal → client) with filming and posting gates. Posting requires agreed schedule before live URL.

**Independent Test**: Submit script → approve internally → verify filming gate clears → submit draft → approve both stages → submit final → approve both stages → verify posting gate clears → set posting schedule → submit live URL.

**FRs**: FR-020, FR-021, FR-022, FR-023, FR-023a, FR-024

### Implementation

- [ ] T064 [US5] Enhance content routes in `backend/src/routes/content-routes.js` — add POST approve-internal, POST approve-client, POST request-changes (with feedback), POST exception (Director approval with evidence), POST live-url (validate posting gate + posting schedule), GET /content/pending (global pending content); enforce filming gate (script must be internal_approved) and posting gate (final must be client_approved) per R-006
- [ ] T065 [US5] Add posting schedule validation in `backend/src/routes/content-routes.js` — before accepting live URL submission, verify that scheduledPostDate and postPlatform are set on the CampaignInfluencer record (per FR-023a)
- [ ] T066 [P] [US5] Create Next.js proxy routes for content approval endpoints in `frontend/src/app/api/v1/campaigns/[campaignId]/content/[id]/` — approve-internal, approve-client, request-changes, exception, live-url routes
- [ ] T067 [P] [US5] Create content service functions (approveInternal, approveClient, requestChanges, requestException, submitLiveUrl, getPendingContent) in `frontend/src/services/content.service.ts`
- [ ] T068 [US5] Create ContentTab component in `frontend/src/components/campaigns/ContentTab.tsx` — content list grouped by type (script/draft/final), approval status badges, filming/posting gate indicators, upload button, approval action buttons per role, posting schedule form
- [ ] T069 [P] [US5] Create ContentApprovalCard component in `frontend/src/components/content/ContentApprovalCard.tsx` — two-stage flow visualization, feedback input for changes_requested, exception request dialog (type selection, evidence upload, Director approval)
- [ ] T070 [US5] Create global content approval view page at `frontend/src/app/dashboard/content/page.tsx` — list all pending content across campaigns with quick-approve actions

**Checkpoint**: Content artifacts flow through Script→Draft→Final with two-stage approval, filming gate blocks until script internally approved, posting gate blocks until final client-approved, posting schedule required before live URL submission, exception handling works with Director approval.

---

## Phase 8: User Story 8 — Finance and Invoicing (Priority: P2)

**Goal**: Invoice creation (client/influencer types) with 4-stage status flow, real-time budget tracking (committed vs. spent), management fee calculation, budget revision history.

**Independent Test**: Create campaign with budget → create invoices → advance through status flow → verify budget tracker matches → change budget → verify revision recorded.

**FRs**: FR-029, FR-030, FR-031, FR-032, FR-033

### Implementation

- [ ] T071 [US8] Enhance invoice routes in `backend/src/routes/invoice-routes.js` — add INV-YYYY-XXXX display ID generation, enforce 4-stage status flow (draft→sent→approved→paid), update campaign financial totals on status change, add budget tracker endpoint GET `/campaigns/:campaignId/budget` (budget vs. committed vs. spent with management fee calculation)
- [ ] T072 [US8] Add budget revision tracking — auto-create BudgetRevision record whenever campaign budget field is updated (in campaign PATCH handler or via Prisma middleware) in `backend/src/routes/campaign-routes.js`
- [ ] T073 [US8] Add budget revision history endpoint GET `/campaigns/:campaignId/budget/revisions` in `backend/src/routes/invoice-routes.js`
- [ ] T074 [P] [US8] Create finance overview endpoints (GET /finance/overview with totals, GET /finance/invoices with filters) — either extend `backend/src/routes/invoice-routes.js` or create new `backend/src/routes/finance-routes.js`
- [ ] T075 [P] [US8] Create Next.js proxy routes for finance endpoints in `frontend/src/app/api/v1/campaigns/[campaignId]/invoices/`, `frontend/src/app/api/v1/campaigns/[campaignId]/budget/`, and `frontend/src/app/api/v1/finance/`
- [ ] T076 [P] [US8] Create finance service functions (createInvoice, updateInvoiceStatus, getBudget, getBudgetRevisions, getFinanceOverview, getAllInvoices) in `frontend/src/services/finance.service.ts`
- [ ] T077 [US8] Create FinanceTab component in `frontend/src/components/campaigns/FinanceTab.tsx` — budget tracker bar (budget vs. committed vs. spent), management fee display (default 30%, adjustable), invoice table with status badges, create invoice dialog (client/influencer type), budget revision history
- [ ] T078 [US8] Create global finance page at `frontend/src/app/dashboard/finance/page.tsx` — organization-wide stats (Total Revenue, Pending Receivables, Pending Payables, Active Campaigns), filterable invoice table across all campaigns (restricted to Director/Finance roles)

**Checkpoint**: Invoices created with display IDs, 4-stage status flow works, budget tracker shows committed vs. spent accurately, management fee calculates correctly, budget revisions auto-recorded.

---

## Phase 9: User Story 9 — KPI Tracking and Auto-Capture (Priority: P2)

**Goal**: Track KPIs per campaign-influencer, auto-schedule capture at Day 1/3/7 when influencer goes live, auto-capture from Instagram for connected influencers, manual entry fallback.

**Independent Test**: Mark influencer as live → verify KPI schedules created for Day 1/3/7 → manually enter KPIs → verify aggregated summary → trigger auto-capture for connected influencer.

**FRs**: FR-025, FR-026, FR-027

### Implementation

- [ ] T079 [US9] Create KPI routes in `backend/src/routes/kpi-routes.js` — POST manual KPI entry, GET campaign KPIs (filterable by influencer/day), GET aggregated KPI summary, GET capture schedule status, POST manual auto-capture trigger (per contracts/kpis.md)
- [ ] T080 [US9] Add KPI auto-scheduling logic in `backend/src/routes/collaboration-routes.js` or `kpi-routes.js` — when CampaignInfluencer status transitions to `live`, auto-create KPISchedule entries for Day 1, Day 3, and Day 7 with calculated scheduledAt timestamps
- [ ] T081 [US9] Add KPI auto-capture function in `backend/src/services/instagram-service.js` — for each due KPISchedule, call business_discovery API for connected influencer, store reach/impressions/engagement/clicks as KPI record with source=auto, mark schedule as captured or failed
- [ ] T082 [P] [US9] Create Next.js proxy routes for KPI endpoints in `frontend/src/app/api/v1/campaigns/[campaignId]/kpis/`
- [ ] T083 [P] [US9] Create KPI service functions (addKPI, getKPIs, getSummary, getSchedules, triggerAutoCapture) in `frontend/src/services/kpi.service.ts`
- [ ] T084 [US9] Create KPIsTab component in `frontend/src/components/campaigns/KPIsTab.tsx` — aggregated KPI summary cards (total reach/impressions/engagement/clicks), per-influencer KPI table with capture day columns, add KPI dialog (manual entry), capture schedule status indicators (pending/captured/failed), auto-capture trigger button

**Checkpoint**: KPI capture schedules auto-created on influencer going live, manual entry works, Instagram auto-capture collects data for connected influencers, aggregated summaries display correctly.

---

## Phase 10: User Story 6 — Client Portal Experience (Priority: P2)

**Goal**: Clients access a premium dashboard showing assigned campaigns (pitching/live only), approve shortlists and content, review reports.

**Independent Test**: Log in as client → verify dashboard stats → approve shortlist → approve content → approve report → verify campaigns outside pitching/live are hidden.

**FRs**: FR-034

**Dependencies**: Requires US5 (content approval), US3 (shortlist), US12 (reports) for full integration — but portal structure is independently testable with mock data

### Implementation

- [ ] T085 [US6] Create client portal routes in `backend/src/routes/client-portal-routes.js` — GET dashboard (stats + KPI summary), GET campaigns (only assigned campaigns in pitching/live status), POST shortlist approve/reject, POST content approve/request-changes, POST report approve; enforce client role and campaign scoping (per contracts/portals.md)
- [ ] T086 [P] [US6] Create Next.js proxy routes for client portal endpoints in `frontend/src/app/api/v1/client-portal/`
- [ ] T087 [P] [US6] Create client portal service functions in `frontend/src/services/client-portal.service.ts`
- [ ] T088 [US6] Create client portal layout with distinct navigation and branding in `frontend/src/app/client-portal/layout.tsx` — wrap with ProtectedRoute allowedRoles={['client']}
- [ ] T089 [US6] Create client portal dashboard page in `frontend/src/app/client-portal/page.tsx` — stats cards (Active Campaigns, Pending Approvals, Contracted Creators, Reports Ready, Total Reach), consolidated KPI summary
- [ ] T090 [US6] Create client portal campaigns page in `frontend/src/app/client-portal/campaigns/page.tsx` — list assigned campaigns with status and quick-approve actions
- [ ] T091 [P] [US6] Create ShortlistApproval component in `frontend/src/components/client-portal/ShortlistApproval.tsx` — influencer cards with handle, followers, engagement, AI match score, rationale, estimated cost, budget impact; approve/reject shortlist
- [ ] T092 [P] [US6] Create ContentReview component in `frontend/src/components/client-portal/ContentReview.tsx` — view internally-approved content, approve or request changes with feedback
- [ ] T093 [P] [US6] Create ReportApproval component in `frontend/src/components/client-portal/ReportApproval.tsx` — view report with KPI summary, highlights, AI narrative; approve button

**Checkpoint**: Clients see only their assigned campaigns in pitching/live status, can approve shortlists with full influencer details, review and approve content, approve reports.

---

## Phase 11: User Story 7 — Influencer Portal Experience (Priority: P2)

**Goal**: Influencers access a portal showing assigned campaigns, accept briefs, submit content, track approval status, request deliverable adjustments.

**Independent Test**: Log in as influencer → verify assigned campaigns → accept brief → submit content → verify approval status updates → request deliverable adjustment.

**FRs**: FR-035

### Implementation

- [ ] T094 [US7] Create influencer portal routes in `backend/src/routes/influencer-portal-routes.js` — GET dashboard (stats), GET campaigns (assigned campaigns), POST brief accept, POST content submit (upload), GET content status, POST deliverable adjustment request; enforce influencer role and campaign scoping (per contracts/portals.md)
- [ ] T095 [P] [US7] Create Next.js proxy routes for influencer portal endpoints in `frontend/src/app/api/v1/influencer-portal/`
- [ ] T096 [P] [US7] Create influencer portal service functions in `frontend/src/services/influencer-portal.service.ts`
- [ ] T097 [US7] Create influencer portal layout with distinct navigation in `frontend/src/app/influencer-portal/layout.tsx` — wrap with ProtectedRoute allowedRoles={['influencer']}
- [ ] T098 [US7] Create influencer portal dashboard page in `frontend/src/app/influencer-portal/page.tsx` — stats cards (Active Campaigns, Briefs to Accept, Pending Review, Approved Content, Urgent Deadlines), campaign workflow cards
- [ ] T099 [US7] Create influencer portal campaigns page in `frontend/src/app/influencer-portal/campaigns/page.tsx` — list assigned campaigns with workflow status and pending actions
- [ ] T100 [P] [US7] Create BriefAcceptance component in `frontend/src/components/influencer-portal/BriefAcceptance.tsx` — display brief summary, accept/reject action; acceptance unlocks content submission
- [ ] T101 [P] [US7] Create ContentSubmission component in `frontend/src/components/influencer-portal/ContentSubmission.tsx` — upload script/video draft/final (max 1GB), view approval status and feedback for each submission, content status table
- [ ] T102 [P] [US7] Create DeliverableAdjustment component in `frontend/src/components/influencer-portal/DeliverableAdjustment.tsx` — request timeline or rate modification dialog, triggers notification to Campaign Manager

**Checkpoint**: Influencers see assigned campaigns, accept briefs before content submission, upload content artifacts, track approval status, request adjustments.

---

## Phase 12: User Story 12 — Reporting and AI Narrative Generation (Priority: P3)

**Goal**: Campaign Managers create reports with aggregated KPIs, AI-generated narrative summaries, 4-stage approval flow, and export to PDF/CSV/shareable link.

**Independent Test**: Create report for campaign with KPI data → verify AI narrative generated → submit for approval → approve → export as PDF/CSV → generate shareable link.

**FRs**: FR-028

**Dependencies**: Requires US9 (KPI data) for meaningful reports

### Implementation

- [ ] T103 [US12] Implement generateReportNarrative() method in `backend/src/services/gemini-service.js` — accept KPI summary and campaign context, return narrative text with highlights and recommendations
- [ ] T104 [US12] Create report routes in `backend/src/routes/report-routes.js` — POST create report (auto-aggregate KPIs, generate AI narrative), GET report details, PATCH status transition (draft→pending_approval→approved→exported), GET export/pdf (branded report), GET export/csv (raw KPI data), GET share (generate read-only link) (per contracts/reports.md)
- [ ] T105 [P] [US12] Create Next.js proxy routes for report endpoints in `frontend/src/app/api/v1/campaigns/[campaignId]/reports/`
- [ ] T106 [P] [US12] Create report service functions (createReport, getReport, transitionStatus, exportPdf, exportCsv, getShareLink) in `frontend/src/services/report.service.ts`
- [ ] T107 [US12] Create ReportsTab component in `frontend/src/components/campaigns/ReportsTab.tsx` — report builder (auto-populated KPI summary, editable highlights, AI narrative display with regenerate option), 4-stage approval flow buttons, export controls (PDF/CSV/shareable link)
- [ ] T108 [US12] Create global reports page at `frontend/src/app/dashboard/reports/page.tsx` — aggregated reporting across campaigns, filterable report list

**Checkpoint**: Reports created with aggregated KPIs and AI narrative, 4-stage approval flow works, PDF/CSV exports and shareable links functional.

---

## Phase 13: User Story 10 — Campaign Closure and Intelligence (Priority: P3)

**Goal**: Complete campaign closure with CX survey, post-mortem, AI-generated learnings, and final intelligence document. Closed campaigns become immutable.

**Independent Test**: Access closure tab for campaign in reporting status → complete CX survey → complete post-mortem → generate AI learnings → close campaign → verify all edits blocked.

**FRs**: FR-036, FR-037

**Dependencies**: Requires US8 (financial closure), US12 (report approval) for complete closure gates

### Implementation

- [ ] T109 [US10] Implement generateClosureIntelligence() method in `backend/src/services/gemini-service.js` — accept campaign data, CX survey, post-mortem, KPI summary; return learnings, best practices, and comprehensive wrap-up document
- [ ] T110 [US10] Create closure routes in `backend/src/routes/closure-routes.js` — GET closure status (checklist of required sub-sections), POST save CX survey, POST save post-mortem, POST generate AI learnings, POST close campaign (validate all closure requirements met: report approved, invoices settled, CX survey + post-mortem completed; set closedAt, status=closed, trigger immutability)
- [ ] T111 [P] [US10] Create Next.js proxy routes for closure endpoints in `frontend/src/app/api/v1/campaigns/[campaignId]/closure/`
- [ ] T112 [P] [US10] Create closure service functions (getClosureStatus, saveCXSurvey, savePostMortem, generateLearnings, closeCampaign) in `frontend/src/services/closure.service.ts`
- [ ] T113 [US10] Create ClosureTab component in `frontend/src/components/campaigns/ClosureTab.tsx` — 5 sub-sections with completion checklist: Campaign Lock (requirements status), CX Survey, Post-Mortem, AI Learnings, Final Intelligence Document; close campaign button (enabled when all sub-sections complete)
- [ ] T114 [P] [US10] Create CXSurveyCard component in `frontend/src/components/closure/CXSurveyCard.tsx` — 5 rating fields (overall, communication, quality, timeliness, value) on 1-5 scale, optional testimonial textarea
- [ ] T115 [P] [US10] Create PostMortemCard component in `frontend/src/components/closure/PostMortemCard.tsx` — text areas for what went well, improvements, lessons, action items, risk notes

**Checkpoint**: Complete closure flow works (CX survey, post-mortem, AI learnings, intelligence document), campaign becomes immutable after closure, all closure sub-sections validated.

---

## Phase 14: User Story 11 — Dashboard and Navigation (Priority: P3)

**Goal**: Role-aware dashboard with personalized stats, recent campaigns, upcoming deadlines, activity feed. Navigation filtered by role.

**Independent Test**: Log in as each role → verify dashboard shows role-appropriate stats → verify navigation items match role matrix → verify search returns role-filtered results.

**FRs**: FR-041, FR-042 (activity feed)

### Implementation

- [ ] T116 [US11] Enhance dashboard page at `frontend/src/app/dashboard/page.tsx` — render role-aware stat cards (Campaign Manager: Active Campaigns, Total Influencers, Pending Approvals, Completed This Month; Director: adds financial overview; Finance: financial focus; Reviewer: pending reviews)
- [ ] T117 [US11] Add recent campaigns section to dashboard — show latest campaign cards with status badges, risk indicators, and quick actions
- [ ] T118 [US11] Add upcoming deadlines section to dashboard — aggregate from KPI schedules, pending approvals, reminders
- [ ] T119 [US11] Add activity feed section to dashboard — display recent audit log entries with entity links (requires audit-routes from Phase 15)
- [ ] T120 [US11] Update sidebar navigation component to dynamically filter items by user role — use useRoleAccess hook, render different navigation trees per role (Director=all, CM=campaigns+content, Finance=finance, Client→client-portal redirect, Influencer→influencer-portal redirect)
- [ ] T121 [US11] Add header search with role-filtered results — search campaigns, clients, influencers scoped to user's authorized data

**Checkpoint**: Dashboard displays role-appropriate stats, recent campaigns, deadlines, and activity feed. Navigation filtered per role matrix.

---

## Phase 15: Polish & Cross-Cutting Concerns

**Purpose**: Audit logging, notifications/escalation, reminders, and final validation

### Audit & Notifications

- [ ] T122 Implement Prisma middleware for audit logging in `backend/` — intercept create/update/delete on tracked models (Campaign, Content, Invoice, CampaignInfluencer, Approval, User), capture action, entityType, entityId, userId, before/after JSON diff, write to AuditLog (per R-012)
- [ ] T123 Create audit routes in `backend/src/routes/audit-routes.js` — GET /audit-logs with role-based filtering, pagination, entity type filter (per contracts/notifications.md)
- [ ] T124 [P] Create Next.js proxy route for audit logs in `frontend/src/app/api/v1/audit-logs/route.ts`
- [ ] T125 Create escalation service in `backend/src/services/escalation-service.js` — check pending Approval records: at 24h create reminder notification, at 48h create overdue notification, at 72h create Director escalation notification; track escalation level to prevent duplicates (per R-008)
- [ ] T126 Enhance notification routes in `backend/src/routes/notification-routes.js` — add escalation fields, reminder CRUD endpoints (POST /reminders, GET /reminders), read-all endpoint
- [ ] T127 [P] Create Next.js proxy routes for reminder endpoints in `frontend/src/app/api/v1/reminders/`
- [ ] T128 Create reminders page at `frontend/src/app/dashboard/reminders/page.tsx` — campaign-linked reminder list, create/edit reminder dialog

### Client Display IDs

- [ ] T129 Add CLI-XXXX display ID generation to client creation in `backend/src/routes/client-routes.js` — use id-generator-service

### Data Retention

- [ ] T130 Add data retention check logic — compute retentionExpiresAt (closedAt + 3 years) for closed campaigns, scheduled check notifies Director 30 days before expiry (can be part of escalation-service or separate scheduled task)

### Validation

- [ ] T131 Verify Full-Stack Rule compliance — audit all new features have: Prisma model + Express route + Next.js proxy route + UI component (per constitution Section V)
- [ ] T132 Run quickstart.md validation — verify setup instructions in `specs/001-tikit-os-prd/quickstart.md` work end-to-end (install, migrate, seed, both servers start, login works)
- [ ] T133 Verify Vercel deployment — deploy frontend with rootDirectory=frontend, verify all proxy routes forward correctly, no console errors (per constitution Section X)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
  └── Phase 2 (Foundational) ← BLOCKS all user stories
        ├── Phase 3 (US1: Campaign Lifecycle) ← MVP
        ├── Phase 4 (US2: Brief & AI)
        ├── Phase 5 (US3: Influencer Discovery)
        ├── Phase 6 (US4: RBAC & Auth)
        ├── Phase 7 (US5: Content Workflow)
        ├── Phase 8 (US8: Finance)
        ├── Phase 9 (US9: KPI Tracking)
        ├── Phase 10 (US6: Client Portal) ← integrates US3, US5, US12
        ├── Phase 11 (US7: Influencer Portal) ← integrates US5
        ├── Phase 12 (US12: Reporting) ← needs US9 for KPI data
        ├── Phase 13 (US10: Closure) ← needs US8, US9, US12
        └── Phase 14 (US11: Dashboard) ← enhanced by all stories
              └── Phase 15 (Polish) ← cross-cutting, final validation
```

### User Story Dependencies

| Story | Can Start After | Integrates With | Independently Testable? |
|-------|-----------------|-----------------|------------------------|
| US1 (Campaign Lifecycle) | Phase 2 | None | ✅ Yes — MVP |
| US2 (Brief & AI) | Phase 2 | US1 (campaign context) | ✅ Yes |
| US3 (Influencer Discovery) | Phase 2 | US1 (campaign context) | ✅ Yes |
| US4 (RBAC & Auth) | Phase 2 | None | ✅ Yes |
| US5 (Content Workflow) | Phase 2 | US1, US3 (campaign+influencer) | ✅ Yes |
| US6 (Client Portal) | Phase 2 | US3 (shortlist), US5 (content), US12 (reports) | ⚠️ Structure testable, full flow needs US3/US5 |
| US7 (Influencer Portal) | Phase 2 | US5 (content submission) | ⚠️ Structure testable, full flow needs US5 |
| US8 (Finance) | Phase 2 | US1 (campaign budget) | ✅ Yes |
| US9 (KPI Tracking) | Phase 2 | US3 (campaign-influencer), US43 (Instagram) | ✅ Yes (manual entry) |
| US10 (Closure) | Phase 2 | US8 (financial), US9 (KPIs), US12 (reports) | ⚠️ Structure testable, full closure needs US8/US9/US12 |
| US11 (Dashboard) | Phase 2 | All stories (aggregate data) | ✅ Yes (basic stats) |
| US12 (Reporting) | Phase 2 | US9 (KPI data) | ⚠️ AI narrative testable, full reports need US9 |

### Within Each User Story

- Backend routes before frontend proxy routes
- Frontend proxy routes before service functions
- Service functions before UI components
- Shared components (marked [P]) can be built in parallel
- Each story checkpoint = independently testable increment

### Parallel Opportunities

**After Phase 2 completes, these stories can run in parallel:**
- US1 + US4 (no shared routes)
- US2 + US3 (different services, different routes)
- US5 + US8 + US9 (different route files)
- US6 + US7 (different portal routes)

---

## Parallel Examples

### Phase 2 Foundational (parallel services)

```
# These 4 services write to different files — run in parallel:
T008: id-generator-service.js
T009: gemini-service.js
T010: risk-scoring-service.js
T011: status-transition-helper.js

# These 3 frontend tasks write to different files — run in parallel:
T015: TypeScript types
T016: useRoleAccess hook
T017: ProtectedRoute component
```

### User Story 1 (parallel frontend components)

```
# These 4 components write to different files — run in parallel:
T027: RiskBadge.tsx
T028: ApprovalGateCards.tsx
T026: campaign.service.ts
T024: proxy route for status transition
T025: proxy route for risk assessment
```

### Cross-Story Parallelism

```
# After Phase 2, run P1 stories in parallel:
Story US1: Campaign Lifecycle (T019-T032)
Story US4: RBAC & Auth (T054-T063)

# Once US1 foundation is in place, run these in parallel:
Story US2: Brief & AI (T033-T042)
Story US3: Influencer Discovery (T043-T053)
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US1 — Campaign Lifecycle
4. **STOP and VALIDATE**: Create campaign, advance through all 8 gates, verify hub with 8 tabs
5. Deploy to Vercel and verify

### Incremental Delivery (Recommended)

1. **Foundation** → Setup + Foundational → All infrastructure ready
2. **P1 Core** → US1 (Campaigns) + US2 (Briefs) + US3 (Influencers) + US4 (Auth) → Core operating system functional
3. **P2 Workflows** → US5 (Content) + US8 (Finance) + US9 (KPIs) → Workflow layer complete
4. **P2 Portals** → US6 (Client Portal) + US7 (Influencer Portal) → External user access
5. **P3 Intelligence** → US12 (Reporting) + US10 (Closure) + US11 (Dashboard) → Intelligence and governance layer
6. **Polish** → Audit logging, escalation, data retention, final validation

### Parallel Team Strategy

With 2-3 developers after Phase 2:

- **Dev A**: US1 → US5 → US6 → US10
- **Dev B**: US2 + US3 → US8 + US9 → US12
- **Dev C**: US4 → US7 → US11 → Polish

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | 133 |
| **Setup Tasks** | 2 |
| **Foundational Tasks** | 18 |
| **User Story Tasks** | 103 |
| **Polish Tasks** | 12 |
| **Parallelizable Tasks** | 51 (marked [P]) |
| **User Stories** | 12 |
| **MVP Scope** | Phase 1 + 2 + 3 (US1) = 34 tasks |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in same phase
- [USn] label maps task to specific user story for traceability
- Each user story is independently testable after foundational phase
- Constitution Section V (Full-Stack Rule): every feature has 4 layers
- Constitution Section X (Definition of Done): migration runs + backend responds + proxy forwards + UI renders + no console errors + Vercel verified
- No automated test tasks — manual verification per constitution
- All AI features use Gemini 2.0 Flash with advisory-only output and manual fallback
- Commit after each task or logical group
