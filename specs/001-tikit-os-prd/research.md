# Research: TiKiT OS V2 — Full PRD Implementation

**Branch**: `001-tikit-os-prd` | **Date**: 2026-02-25

## R-001: Campaign State Machine Migration

**Decision**: Migrate from current 5-stage model (draft/active/paused/completed/cancelled) to constitution-mandated 8-stage model (draft → in_review → pitching → live → reporting → closed) with hard-gated transitions.

**Rationale**: The constitution (Section IV) requires this exact state machine. The current `active/paused/completed/cancelled` states don't map cleanly to the spec's `in_review/pitching/live/reporting` stages. A full migration is needed rather than a mapping layer.

**Alternatives considered**:
- Mapping layer (active → pitching|live): Rejected — loses gate enforcement granularity
- Adding states alongside existing ones: Rejected — creates ambiguous dual-state model

**Implementation approach**:
1. Add new `status` enum values to Prisma schema
2. Create migration to map existing campaigns: `draft` stays, `active` → `live`, `completed` → `closed`, `paused/cancelled` → `draft` (with flag)
3. Implement `status-transition-helper.js` gate validation for each transition
4. Add `phase` field auto-calculated from status via backend logic

---

## R-002: Role System Expansion (2 → 6 Roles)

**Decision**: Expand from current 2-role system (`client_manager`, `influencer`) to full 6-role system (`director`, `campaign_manager`, `reviewer`, `finance`, `client`, `influencer`). Internal roles support multi-assignment; Client and Influencer are exclusive.

**Rationale**: Constitution Section III mandates exactly these 6 roles with hard enforcement at both UI and DB level. The current `client_manager` role roughly maps to `campaign_manager` but lacks the Director/Reviewer/Finance distinction.

**Alternatives considered**:
- Permission-based system (granular permissions per user): Rejected — constitution specifies named roles, not permissions
- Extend existing 2 roles with sub-permissions: Rejected — doesn't satisfy the 6-role mandate

**Implementation approach**:
1. Change `role` from single enum to a `UserRole` junction table (to support multi-role for internal users)
2. Add `isExclusive` constraint logic: Client/Influencer roles cannot coexist with other roles
3. Migrate existing `client_manager` users to `campaign_manager` role
4. Create role-checking middleware: `hasRole()`, `hasAnyRole()`, `isDirector()`, etc.
5. Frontend: `useRoleAccess` hook providing boolean flags and `canViewTab()` helper
6. Frontend: `ProtectedRoute` wrapper with `allowedRoles` prop

---

## R-003: Prisma Data Model Expansion

**Decision**: Expand from 11 current models to 20+ models to support full PRD. New models: `Strategy`, `BriefVersion`, `KPI`, `KPISchedule`, `Report`, `CXSurvey`, `PostMortem`, `AuditLog`, `BudgetRevision`, `Approval`, `Reminder`, `CompanyRegistration`, `InstagramConnection`, `UserRole`.

**Rationale**: The spec defines 14 key entities, and the constitution requires audit logging, version history, and budget tracking as separate append-only tables. The existing `CampaignInfluencer` model needs significant field additions.

**Alternatives considered**:
- JSON fields for versioning/audit: Rejected — constitution Section VII mandates append-only records as separate tables, not JSON
- Single `Approval` table for all approvals: Adopted — generic approval record linked to entity via type + entityId

**Implementation approach**: See `data-model.md` for complete Prisma schema.

---

## R-004: Instagram Meta Graph API Integration

**Decision**: Implement centralized agency-level Instagram connection using Meta Graph API for influencer discovery (3 search modes) and KPI auto-capture.

**Rationale**: Spec FR-016 and FR-027 require Instagram API for discovery and auto-capture. Constitution Section IX requires free-tier approach. Meta Graph API is free with app review.

**Alternatives considered**:
- Per-influencer OAuth: Rejected — spec describes centralized agency-level connection
- Third-party influencer API (Modash, HypeAuditor): Rejected — paid services violate constitution Section IX
- Scraping: Rejected — violates Meta ToS

**Implementation approach**:
1. Create `instagram-service.js` in backend services
2. Three search modes:
   - By Name: Facebook Pages API → find linked Instagram Business accounts
   - By Username: `business_discovery` endpoint (manual URL construction to prevent Deno/Node auto-encoding of brackets)
   - By Hashtag: Hashtag search → resolve media owners
3. Store agency connection in `InstagramConnection` model (token, refresh token, expiry)
4. OAuth flow via backend route `/auth/instagram/callback`
5. KPI auto-capture: scheduled function calls `business_discovery` for reach/impressions/engagement

**Technical note**: The `business_discovery` endpoint requires manual URL construction to prevent the HTTP client from auto-encoding brackets/parentheses in the `fields` parameter.

---

## R-005: Gemini AI Service Consolidation

**Decision**: Consolidate all AI operations into a single `gemini-service.js` that handles brief extraction, strategy generation, influencer scoring, report narratives, closure intelligence, and trade license OCR.

**Rationale**: Constitution Section VI mandates Gemini 2.0 Flash for all AI operations with advisory-only output and graceful degradation. Current codebase has brief extraction implemented inline in `brief-routes.js`. Centralizing avoids prompt duplication and respects the 1,500 req/day limit.

**Alternatives considered**:
- Separate AI services per feature: Rejected — risks exceeding daily request limit without central tracking
- External AI service (OpenAI, Claude): Rejected — constitution locks to Gemini 2.0 Flash

**Implementation approach**:
1. Create `gemini-service.js` with methods: `extractBrief()`, `generateStrategy()`, `scoreInfluencers()`, `generateReportNarrative()`, `generateClosureIntelligence()`, `extractTradeLicense()`
2. Add request counter/tracker to manage 1,500/day limit
3. All methods return structured JSON with confidence scores where applicable
4. Every method has a `try/catch` that returns `{ success: false, fallbackRequired: true }` on failure
5. Frontend always provides manual entry fallback when AI unavailable

---

## R-006: Content Two-Stage Approval with Gates

**Decision**: Enhance existing single-stage content approval to two-stage (internal → client) with filming and posting gates.

**Rationale**: Constitution Section VIII mandates exact gate rules: `filming_blocked` until script reaches `internal_approved`, `posting_blocked` until final reaches `client_approved`. Exception handling requires Director approval.

**Alternatives considered**:
- Three-stage approval (internal → reviewer → client): Rejected — spec defines exactly two stages
- Approval via comments/reactions: Rejected — needs explicit status field for gate enforcement

**Implementation approach**:
1. Add `approvalStatus` enum: `pending`, `internal_approved`, `client_approved`, `changes_requested`
2. Add `filmingBlocked` and `postingBlocked` boolean fields to Content model
3. Add `exceptionType` and `exceptionApprovedBy` fields for Director overrides
4. Backend validation: block status transitions that violate gate rules
5. Frontend: visual gate indicators on content cards

---

## R-007: Human-Readable ID Generation

**Decision**: Implement sequential human-readable IDs via backend service using database sequences.

**Rationale**: Constitution Section VII specifies exact formats: `TKT-YYYY-XXXX`, `CLI-XXXX`, `INF-XXXX`, `INV-YYYY-XXXX`. These are stored as separate `displayId` fields alongside the CUID primary key.

**Alternatives considered**:
- Database-level auto-increment: Rejected — CUID required as primary key per constitution
- UUID-based readable encoding: Rejected — constitution specifies sequential numeric format
- Frontend generation: Rejected — race conditions on concurrent creation

**Implementation approach**:
1. Create `id-generator-service.js`
2. Use Prisma `$queryRaw` to maintain counter tables per entity type
3. Format: `TKT-{currentYear}-{paddedSequence}`, `CLI-{paddedSequence}`, etc.
4. Generate in backend create handlers before Prisma insert
5. Add `displayId` field (unique, indexed) to Campaign, Client, Influencer, Invoice models

---

## R-008: Approval Escalation System

**Decision**: Implement time-based reminder and escalation for pending approvals: 24h reminder, 48h second reminder, 72h Director escalation. No auto-approval.

**Rationale**: Spec clarification session resolved that approvals must never auto-approve. The escalation system prevents campaigns from stalling silently.

**Alternatives considered**:
- Cron job polling: Adopted — simple, runs periodically to check pending approval timestamps
- Real-time websocket monitoring: Rejected — over-engineering for the use case
- Manual-only follow-up: Rejected — spec explicitly requires automated escalation

**Implementation approach**:
1. Create `escalation-service.js` that checks `createdAt` of pending approvals
2. Backend scheduled task (or Supabase cron) runs every hour
3. At 24h: create notification for original approver
4. At 48h: create second notification with "overdue" priority
5. At 72h: create notification for all Directors with escalation flag
6. Track escalation state in Notification metadata to prevent duplicate alerts

---

## R-009: Field-Level Concurrent Edit Merging

**Decision**: Implement optimistic concurrency with field-level merge for campaign edits.

**Rationale**: Spec clarification requires that concurrent edits to different fields merge automatically, while same-field conflicts prompt the second user.

**Alternatives considered**:
- Last-write-wins: Rejected — spec explicitly chose field-level merging
- Real-time collaborative editing (CRDT): Rejected — over-engineering for the use case
- Pessimistic locking: Rejected — blocks concurrent work unnecessarily

**Implementation approach**:
1. Add `version` integer field to Campaign model (incremented on each save)
2. Frontend sends `version` + only changed fields in PATCH request
3. Backend compares submitted version with current version
4. If versions match: save normally, increment version
5. If versions differ: compare field-by-field. For changed fields that don't conflict, merge. For conflicting fields, return `409 Conflict` with both values
6. Frontend conflict dialog shows both values and lets user choose

---

## R-010: Data Retention and Campaign Immutability

**Decision**: Implement campaign immutability via Prisma middleware and 3-year data retention tracking.

**Rationale**: Constitution Section IV requires closed campaigns to be immutable ("No exceptions. Database enforces this."). Spec adds 3-year retention with 30-day Director notice before archival.

**Alternatives considered**:
- Database trigger (PostgreSQL): Would work in production but not in SQLite dev mode
- Application-level check only: Rejected — constitution says "database enforces this"
- Prisma middleware: Adopted — works across both SQLite and PostgreSQL

**Implementation approach**:
1. Prisma middleware: intercept `update`/`delete` on Campaign where `status === 'closed'` and `closedAt` is set → throw error
2. Add `closedAt` DateTime field to Campaign model
3. For retention: add `retentionExpiresAt` computed as `closedAt + 3 years`
4. Scheduled task checks for campaigns approaching retention expiry, notifies Director 30 days before
5. Archival/purge requires explicit Director action via admin route

---

## R-011: Client and Influencer Portal Architecture

**Decision**: Implement portals as separate Next.js route groups within the same application, sharing the same backend API with role-filtered data.

**Rationale**: Constitution doesn't mandate separate apps. Using route groups (`/client-portal/`, `/influencer-portal/`) keeps the monorepo structure while providing distinct UX per role.

**Alternatives considered**:
- Separate Next.js applications: Rejected — violates monorepo structure, increases deployment complexity
- Same dashboard with conditional rendering: Rejected — Client/Influencer UX is fundamentally different from internal views
- Separate backend APIs per portal: Rejected — data is shared, one API with role filtering is sufficient

**Implementation approach**:
1. Frontend route groups: `/client-portal/*` and `/influencer-portal/*`
2. Backend: dedicated routes (`client-portal-routes.js`, `influencer-portal-routes.js`) that enforce role and scope data to assigned campaigns
3. `ProtectedRoute` wrapper with `allowedRoles={['client']}` or `allowedRoles={['influencer']}`
4. Portal-specific layouts with distinct navigation and branding
5. Client Portal: visible only for campaigns in `pitching` or `live` status (per FR-034)

---

## R-012: Audit Logging Strategy

**Decision**: Implement append-only audit logging via Prisma middleware that intercepts all state-changing operations.

**Rationale**: FR-041 requires logging all state-changing actions. Constitution Section VII mandates append-only records. FR-042 requires a dashboard activity feed.

**Alternatives considered**:
- Manual logging in each route handler: Rejected — error-prone, easy to miss
- Database triggers: Would work in PostgreSQL but not SQLite dev
- Prisma middleware: Adopted — intercepts create/update/delete across all models

**Implementation approach**:
1. Prisma middleware on `$allOperations` for tracked models
2. `AuditLog` model: action, entityType, entityId, userId, changes (JSON diff), timestamp
3. Capture `before` and `after` state for updates
4. Activity feed endpoint: `GET /audit-logs?limit=20` filtered by user's accessible entities
5. Dashboard component shows recent audit entries with entity links
