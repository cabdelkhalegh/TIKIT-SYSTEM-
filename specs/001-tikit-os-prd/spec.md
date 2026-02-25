# Feature Specification: TiKiT OS — Enterprise Influencer Marketing Operating System

**Feature Branch**: `001-tikit-os-prd`
**Created**: 2026-02-25
**Status**: Draft
**Input**: User description: "TiKiT OS — complete application PRD for an enterprise-grade operating system for influencer marketing agencies, replacing fragmented tools with a single governed execution layer where campaigns are the central operating container."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Campaign Lifecycle Management (Priority: P1)

A Campaign Manager creates a new campaign from a client brief, progresses it through the 8-stage workflow (Draft → In Review → Pitching → Live → Reporting → Closed), and manages all linked entities (influencers, content, KPIs, invoices) from a single campaign hub.

**Why this priority**: Campaigns are the central operating container of TiKiT OS. Every other feature — briefs, influencers, content, approvals, finance — is linked to a CampaignID. Without campaign lifecycle management, the system has no backbone.

**Independent Test**: Can be fully tested by creating a campaign, advancing it through each status gate, and verifying that all tabs (Brief, Strategy, Influencers, Content, KPIs, Reports, Finance, Closure) render and accept data at appropriate stages.

**Acceptance Scenarios**:

1. **Given** a logged-in Campaign Manager, **When** they click "New Campaign" and select "Full Wizard" mode, **Then** they can fill in name, client, budget, dates, and management fee to create a campaign in `draft` status.
2. **Given** a campaign in `draft` status with a reviewed brief, **When** the Campaign Manager requests status change to `in_review`, **Then** the system validates that the brief is present and reviewed before allowing the transition.
3. **Given** a campaign in `in_review` status, **When** a Director approves the budget, **Then** the campaign can advance to `pitching` status and the Budget Approval Card is dismissed.
4. **Given** a campaign in `pitching` status, **When** the client approves the influencer shortlist via the Client Portal, **Then** the campaign can advance to `live` status.
5. **Given** a campaign in `live` status with all content posted and KPIs captured, **When** the Campaign Manager moves it to `reporting`, **Then** a report can be generated and submitted for client approval.
6. **Given** a campaign in `reporting` status with an approved report, financial closure, completed CX survey, and post-mortem, **When** the Campaign Manager closes the campaign, **Then** the status becomes `closed`, `closed_at` is set, and the immutability trigger prevents further edits.
7. **Given** a campaign with a risk score of 5 or higher, **When** any user attempts to advance the campaign, **Then** a High-Risk Override Card is shown requiring Director approval with a documented reason.

---

### User Story 2 — Brief Intake and AI Extraction (Priority: P1)

A Campaign Manager uploads or pastes a client brief. The system uses AI to extract structured data (objectives, KPIs, target audience, deliverables, budget signals, client info), which the user reviews and saves. Optionally, an AI-generated strategy is produced from the brief.

**Why this priority**: Brief intake is the entry point for every campaign. AI extraction eliminates manual data entry and accelerates campaign setup from hours to minutes.

**Independent Test**: Can be tested by uploading a sample brief PDF, verifying AI extraction returns structured fields, confirming the user can review and edit extracted data, and saving successfully links the brief to the campaign.

**Acceptance Scenarios**:

1. **Given** a campaign in draft status, **When** the Campaign Manager uploads a PDF brief, **Then** the system extracts raw text via `parse-pdf` and structures it via `extract-brief` into objectives, KPIs, target audience, deliverables, budget signals, and client info.
2. **Given** extracted brief data, **When** the user reviews inline cards on the Review Tab, **Then** they can edit any extracted field before saving.
3. **Given** a saved brief with client info, **When** the system processes client auto-linking, **Then** it finds an existing client or creates a new client record and links it to the campaign.
4. **Given** a saved brief, **When** the user clicks "Save & Generate Strategy," **Then** the AI produces a strategy with summary, key messages, content pillars, and matching criteria.
5. **Given** a brief that has been saved, **When** any subsequent edit is made, **Then** a version is appended to the brief version history automatically.

---

### User Story 3 — Influencer Discovery, Scoring, and Shortlisting (Priority: P1)

A Campaign Manager discovers influencers via Instagram search (by name, username, or hashtag), adds them to a campaign, scores them against strategy criteria using AI, and presents a shortlist to the client for approval.

**Why this priority**: Influencer matching is the core value proposition — connecting the right creators to campaigns using data-driven scoring replaces gut-feel decisions and WhatsApp-based coordination.

**Independent Test**: Can be tested by searching for an influencer via Instagram discovery, adding them to a campaign, running AI scoring, and verifying the shortlist presentation view displays match scores and rationale.

**Acceptance Scenarios**:

1. **Given** a campaign with a generated strategy, **When** the Campaign Manager opens the Instagram Discovery Dialog and searches by username, **Then** the system calls the discovery service using Instagram's business_discovery API and returns profile data.
2. **Given** search results, **When** the user selects an influencer to add, **Then** the influencer is created (or linked if existing) and a campaign-influencer record is created with status `proposed`.
3. **Given** proposed influencers on a campaign, **When** the Campaign Manager clicks "Score Influencers," **Then** the AI evaluates each influencer against matching criteria (Platform 25%, Followers 20%, Engagement 20%, Niche, Geo, Language) and returns a score with rationale.
4. **Given** scored influencers, **When** the Client Presentation View is generated, **Then** each influencer card shows handle, follower count, engagement rate, AI match score, rationale, and estimated cost.
5. **Given** a shortlist presented to the client, **When** the client approves via the Client Portal, **Then** approved influencers advance to `approved` status and the campaign can progress to contracting.

---

### User Story 4 — Role-Based Access Control and Authentication (Priority: P1)

Users authenticate via email/password, complete a multi-step signup with trade license verification, and access only the features permitted by their assigned role (Director, Campaign Manager, Reviewer, Finance, Client, Influencer).

**Why this priority**: Security and access control are foundational. Without RBAC, sensitive financial data, client information, and campaign operations are unprotected.

**Independent Test**: Can be tested by logging in as each of the six roles and verifying that navigation items, page access, and action buttons are correctly shown/hidden per role matrix.

**Acceptance Scenarios**:

1. **Given** a new user, **When** they complete the signup wizard (credentials, trade license upload, review), **Then** the account is created in a "no role" pending state and appears in the Director's Pending Registrations queue.
2. **Given** a pending registration, **When** a Director reviews the AI-extracted trade license data and approves, **Then** the user is assigned the `client` role and can log in to the Client Portal.
3. **Given** a logged-in Campaign Manager, **When** they navigate to `/finance`, **Then** they are denied access and redirected, as Finance is restricted to Director and Finance roles.
4. **Given** a logged-in Client, **When** they access the application, **Then** they see only the Client Portal with their assigned campaigns in `pitching` or `live` status.
5. **Given** a logged-in Influencer, **When** they access the application, **Then** they see only the Influencer Portal with their assigned campaigns, brief acceptance gates, and content submission tools.
6. **Given** any authenticated user, **When** data access policies are evaluated on queries, **Then** only data the user is authorized to see is returned.

---

### User Story 5 — Content Workflow with Two-Stage Approval (Priority: P2)

Content creators (influencers) submit content artifacts (Script, Video Draft, Final) which progress through a two-stage approval: internal review by the Campaign Manager, then client approval. Filming and posting gates enforce that scripts are approved before filming and final content is approved before posting.

**Why this priority**: Content approval is the quality control mechanism. Without it, unapproved content could go live, damaging client relationships and brand reputation.

**Independent Test**: Can be tested by submitting a script artifact, approving it internally, submitting a final artifact, approving it through both stages, and verifying that the posting gate lifts only after full approval.

**Acceptance Scenarios**:

1. **Given** an influencer assigned to a campaign who has accepted the brief, **When** they upload a script via the Influencer Portal, **Then** a content record is created with type `script` and status `pending`.
2. **Given** a pending script, **When** the Campaign Manager approves it internally, **Then** the status changes to `internal_approved` and the filming gate is cleared.
3. **Given** an internally approved script, **When** the client reviews and approves it in the Client Portal, **Then** the status changes to `client_approved`.
4. **Given** a final content artifact with status `client_approved`, **When** the posting gate is checked, **Then** it is cleared and the influencer can submit a live post URL.
5. **Given** an urgent situation where client approval is delayed, **When** the Campaign Manager requests an exception (urgent posting, verbal approval, client timeout), **Then** the exception requires Director approval with evidence before the posting gate can be bypassed.

---

### User Story 6 — Client Portal Experience (Priority: P2)

Clients access a premium dashboard showing their active campaigns, consolidated KPIs, influencer shortlists for approval, content approval status, and reports. They can approve shortlists and content that has passed internal review.

**Why this priority**: Client satisfaction drives retention and revenue. A self-service portal eliminates email/WhatsApp approval chains and gives clients real-time visibility into their campaigns.

**Independent Test**: Can be tested by logging in as a client, verifying the dashboard shows correct stats, approving a shortlist, and approving content.

**Acceptance Scenarios**:

1. **Given** a logged-in client with assigned campaigns, **When** they access the Client Portal dashboard, **Then** they see stats (Active Campaigns, Pending Approvals, Contracted Creators, Reports Ready, Total Reach) and consolidated KPIs.
2. **Given** a campaign in `pitching` status with a pending shortlist, **When** the client views the Shortlist Approval Banner, **Then** they see influencer cards with AI scores, rationale, pricing, and budget impact, and can approve or reject the shortlist.
3. **Given** content with status `internal_approved`, **When** the client reviews it in the Content Review section, **Then** they can approve it (changing status to `client_approved`) or request changes with feedback.
4. **Given** a campaign in `reporting` status, **When** the client accesses the Reports section, **Then** they can view the report with KPI summary, highlights, and AI narrative, and approve it.
5. **Given** a campaign not in `pitching` or `live` status, **When** the client accesses the portal, **Then** that campaign is not visible.

---

### User Story 7 — Influencer Portal Experience (Priority: P2)

Influencers access a dedicated portal showing their assigned campaigns, pending briefs to accept, content submission tools, approval status tracking, and the ability to request deliverable adjustments.

**Why this priority**: Streamlining the influencer workflow reduces coordination overhead and ensures briefs are formally accepted before work begins.

**Independent Test**: Can be tested by logging in as an influencer, accepting a brief, submitting content artifacts, and viewing approval status.

**Acceptance Scenarios**:

1. **Given** a logged-in influencer with assigned campaigns, **When** they access the Influencer Portal, **Then** they see stats (Active Campaigns, Briefs to Accept, Pending Review, Approved Content, Urgent Deadlines) and campaign workflow cards.
2. **Given** a pending brief, **When** the influencer views and accepts it, **Then** the brief acceptance flag is set on their campaign assignment and content submission is unlocked.
3. **Given** an accepted brief, **When** the influencer uploads content (Script, Video Draft, or Final), **Then** the artifact is stored and a content record is created with status `pending`.
4. **Given** submitted content, **When** the influencer checks the Content Status Table, **Then** they see the current approval status (Pending, Internal Approved, Client Approved, Changes Requested) with any feedback.
5. **Given** a need to adjust deliverables, **When** the influencer opens the Deliverable Adjustment Dialog, **Then** they can request timeline or rate modifications, which triggers a notification to the Campaign Manager.

---

### User Story 8 — Finance and Invoicing (Priority: P2)

Finance users and Directors manage organization-wide invoicing (client and influencer), track budgets per campaign with real-time committed vs. spent visualization, and manage the management fee calculation.

**Why this priority**: Financial control ensures profitability and prevents budget overruns. Centralized invoicing replaces scattered spreadsheets.

**Independent Test**: Can be tested by creating invoices for a campaign, advancing them through the status flow, and verifying the budget tracker reflects committed and spent amounts accurately.

**Acceptance Scenarios**:

1. **Given** a campaign with a set budget, **When** the Finance user accesses the campaign Finance Tab, **Then** they see the Budget Tracker showing budget vs. committed vs. spent, and management fee calculation (default 30%).
2. **Given** a campaign, **When** a user creates an invoice (Client or Influencer type) with amount, currency (AED), due date, and notes, **Then** the invoice is created in `draft` status with an auto-generated display ID (INV-YYYY-XXXX).
3. **Given** an invoice in `draft` status, **When** it progresses through `sent` → `approved` → `paid`, **Then** each status change is recorded and the campaign's financial totals update accordingly.
4. **Given** a budget change on a campaign, **When** the budget field is updated, **Then** a budget revision is automatically recorded in the revision history.
5. **Given** the global Finance page, **When** a Finance user or Director accesses it, **Then** they see Total Revenue, Pending Receivables, Pending Payables, Active Campaigns, and a filterable invoice table.

---

### User Story 9 — KPI Tracking and Auto-Capture (Priority: P2)

KPIs (Reach, Impressions, Engagement, Clicks) are tracked per campaign-influencer, with auto-scheduled capture at Day 1, 3, and 7 after an influencer goes live. Instagram-connected influencers have KPIs collected automatically.

**Why this priority**: Performance measurement is essential for report generation, client satisfaction, and campaign learnings. Auto-capture reduces manual data collection.

**Independent Test**: Can be tested by marking an influencer as `live`, verifying KPI capture schedules are created, manually entering KPIs, and confirming aggregated KPI summaries display correctly.

**Acceptance Scenarios**:

1. **Given** a campaign influencer whose status changes to `live`, **When** the KPI scheduling mechanism fires, **Then** KPI capture schedules are created for Day 1, Day 3, and Day 7.
2. **Given** a scheduled KPI capture window, **When** the auto-capture service runs for an Instagram-connected influencer, **Then** KPIs (Reach, Impressions, Engagement, Clicks) are fetched via Instagram API and stored.
3. **Given** a non-connected influencer, **When** the Campaign Manager opens the Add KPI Dialog, **Then** they can manually enter Reach, Impressions, Engagement, and Clicks values.
4. **Given** KPI data for multiple influencers on a campaign, **When** the KPIs Tab is viewed, **Then** an aggregated KPI summary is displayed for the campaign.

---

### User Story 10 — Campaign Closure and Intelligence (Priority: P3)

After all deliverables are complete and reports approved, the Campaign Manager completes closure: financial closure, CX survey, post-mortem, AI-generated learnings, and a final intelligence document. Once closed, the campaign becomes immutable.

**Why this priority**: Closure ensures institutional learning. Post-mortems and AI learnings feed into future campaign strategy. Immutability protects historical records.

**Independent Test**: Can be tested by completing all closure sub-sections (lock checklist, CX survey, post-mortem, AI learnings), closing the campaign, and verifying edits are blocked.

**Acceptance Scenarios**:

1. **Given** a campaign in `reporting` status with an approved report, **When** the Campaign Manager accesses the Closure Tab, **Then** they see five sub-sections: Campaign Lock, CX Survey, Post-Mortem, AI Learnings, Final Intelligence Document.
2. **Given** the CX Survey Card, **When** the Campaign Manager enters scores (overall, communication, quality, timeliness, value) and an optional testimonial, **Then** the survey is saved.
3. **Given** the Post-Mortem Card, **When** the Campaign Manager documents what went well, improvements, lessons, action items, and risk notes, **Then** the post-mortem is saved.
4. **Given** a completed closure checklist, **When** the Campaign Manager clicks to close the campaign, **Then** the status becomes `closed`, `closed_at` is set, and the immutability enforcement activates.
5. **Given** a closed campaign, **When** any user attempts to modify campaign data, **Then** the modification is rejected.

---

### User Story 11 — Dashboard and Navigation (Priority: P3)

All authenticated users land on a role-aware dashboard showing personalized stats, recent campaigns, upcoming deadlines, recent activity, and quick actions. Navigation is filtered by role.

**Why this priority**: The dashboard is the daily starting point but depends on data from other modules being available first.

**Independent Test**: Can be tested by logging in as different roles and verifying that the dashboard stats, navigation items, and quick actions match the role matrix.

**Acceptance Scenarios**:

1. **Given** a logged-in Campaign Manager, **When** they access the Dashboard, **Then** they see Active Campaigns, Total Influencers, Pending Approvals, Completed This Month, recent campaign cards, upcoming deadlines, and performance metrics.
2. **Given** a logged-in Client, **When** they access the Dashboard, **Then** they see only Client Portal navigation and client-relevant stats.
3. **Given** any user, **When** they view the sidebar, **Then** only navigation items permitted by their role are displayed.
4. **Given** any user, **When** they use the header search, **Then** results are filtered to entities they have access to.

---

### User Story 12 — Reporting and AI Narrative Generation (Priority: P3)

Campaign Managers create reports that aggregate KPI data, add highlights, and include AI-generated narrative summaries. Reports follow an approval flow (draft → pending_approval → approved → exported) with client sign-off required before campaign closure.

**Why this priority**: Reporting is a downstream output that depends on KPI data and campaign progression being functional first.

**Independent Test**: Can be tested by creating a report for a campaign with KPI data, verifying AI narrative generation, and advancing the report through the approval flow.

**Acceptance Scenarios**:

1. **Given** a campaign with KPI data, **When** the Campaign Manager creates a report, **Then** the report includes a KPI summary, editable highlights section, and an AI-generated narrative.
2. **Given** a draft report, **When** it is submitted for approval, **Then** the status changes to `pending_approval` and the client is notified.
3. **Given** a client-approved report, **When** the status changes to `approved`, **Then** the campaign can proceed toward closure.

---

### Edge Cases

- What happens when a Campaign Manager tries to advance a campaign but mandatory gates are not met? The system displays specific validation messages indicating which requirements are unfulfilled and blocks the transition.
- What happens when an influencer submits content for a campaign where the brief has not been accepted? The system blocks content submission and displays the Brief Acceptance Gate requiring acceptance first.
- What happens when a Director is unavailable to approve a high-risk override? The campaign remains blocked at the current status. No fallback approver exists — only the Director role can override.
- What happens when the Instagram API is unavailable during auto-capture? The KPI capture schedule entry is marked as failed, and the system falls back to manual KPI entry.
- What happens when a user's trade license has expired? The system displays the extracted expiry date during Director review; the Director decides whether to approve or reject the registration.
- What happens when a campaign budget is revised after invoices have been sent? The budget revision is tracked automatically, and the Budget Tracker updates to show the new budget vs. already committed/spent amounts. Existing invoices are not retroactively modified.
- What happens when a client rejects a shortlist? The Campaign Manager is notified, the campaign remains in `pitching` status, and the shortlist can be revised and resubmitted.
- What happens when content receives "Changes Requested" feedback? The influencer sees the feedback in their portal and can resubmit a new version of the artifact.
- What happens when AI brief extraction fails or returns low-confidence results? The system displays partial results with per-field confidence indicators. The user can correct low-confidence fields and re-run extraction. If extraction fails entirely, manual entry of all brief fields is available.
- What happens when two users edit the same campaign simultaneously? Concurrent changes to different fields are merged automatically. If two users modify the same field, the second user is prompted with a conflict notification showing both values and must choose which to keep before saving.

---

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & Authorization**

- **FR-001**: System MUST support email/password authentication with session management. Sessions expire after 30 minutes of inactivity. Passwords require minimum 8 characters with complexity (uppercase, lowercase, number). Accounts lock after 10 consecutive failed login attempts.
- **FR-002**: System MUST implement a multi-step signup wizard that collects credentials, processes trade license uploads via AI extraction, and allows review before submission.
- **FR-003**: System MUST enforce six distinct roles (Director, Campaign Manager, Reviewer, Finance, Client, Influencer) at both UI navigation and data access levels. Internal roles (Director, Campaign Manager, Reviewer, Finance) may be combined — a user's effective access is the union of all assigned roles. Client and Influencer roles are exclusive and cannot be combined with any other role.
- **FR-004**: System MUST require Director approval for new user registrations before granting access.
- **FR-005**: System MUST enforce row-level data access policies ensuring users only see data they are authorized to view.

**Campaign Management**

- **FR-006**: System MUST support campaign creation through three modes: Start from Brief, Full Wizard, and Quick Create.
- **FR-007**: System MUST enforce an 8-stage campaign status model (draft → in_review → pitching → live → reporting → closed) with validation gates at each transition. Campaigns may only be soft-deleted while in `draft` status, by a Director or Campaign Manager. Campaigns in any other status cannot be deleted.
- **FR-008**: System MUST auto-calculate campaign risk scores based on missing data (budget, dates, client, fields) and enforce Director override for high-risk campaigns (score 5+).
- **FR-009**: System MUST generate human-readable display IDs for campaigns (TKT-YYYY-XXXX), clients (CLI-XXXX), influencers (INF-XXXX), and invoices (INV-YYYY-XXXX).
- **FR-010**: System MUST prevent modification of campaign data once a campaign is closed (immutability enforcement). Closed campaign data (including linked briefs, content files, invoices, KPIs, reports, and audit logs) MUST be retained for 3 years after closure. After 3 years, the system MUST notify the Director 30 days in advance before archiving or purging.

**Brief Intake**

- **FR-011**: System MUST accept briefs via text paste or PDF upload.
- **FR-012**: System MUST use AI to extract structured data from briefs: objectives, KPIs, target audience, deliverables, budget signals, and client info. When extraction is partial or low-confidence, the system MUST display per-field confidence indicators, allow the user to correct low-confidence fields, and offer a re-run extraction option. If extraction fails entirely, the system MUST allow manual entry of all brief fields.
- **FR-013**: System MUST maintain an append-only version history for all brief modifications.
- **FR-014**: System MUST auto-link or create client records from extracted brief data.

**Strategy & Influencer Management**

- **FR-015**: System MUST generate AI-powered campaign strategies (summary, key messages, content pillars, matching criteria) from brief data.
- **FR-016**: System MUST support influencer discovery via Instagram API using three search modes: by name, by username, and by hashtag.
- **FR-017**: System MUST score influencers against campaign strategy criteria using AI with weighted factors (Platform 25%, Followers 20%, Engagement 20%, Niche, Geo, Language).
- **FR-018**: System MUST support an influencer lifecycle within a campaign: Proposed → Approved → Contracted → Brief Accepted → Live → Completed.
- **FR-019**: System MUST support both complete influencer profiles and stub profiles for quick shortlisting.

**Content Workflow**

- **FR-020**: System MUST support three content artifact types: Script, Video Draft, and Final, each versioned. Maximum upload file size is 1 GB per artifact.
- **FR-021**: System MUST enforce two-stage content approval: internal (Campaign Manager) then client.
- **FR-022**: System MUST block filming until the script is internally approved (filming gate).
- **FR-023**: System MUST block posting until final content receives client approval (posting gate).
- **FR-023a**: Once the posting gate clears, the system MUST require an agreed posting schedule (date/time and platform) to be recorded per campaign-influencer before the live post URL can be submitted.
- **FR-024**: System MUST support exception handling for approval bypass (urgent posting, verbal approval, client timeout) requiring Director approval with evidence.

**Content Production Cycle** (end-to-end sequence):

> Client shortlist approval → Outreach → Briefing (influencer accepts) → Script submission → Internal review → Client approval → **Filming gate clears** → Editing → Draft v1 submission → Internal review → Client review (if `changes_requested` → Draft v2 → same cycle) → Final submission → Internal review → Client approval → **Posting gate clears** → Posting schedule agreed → Live post URL submitted → **KPI capture starts** (Day 1/3/7).

**KPIs & Reporting**

- **FR-025**: System MUST track KPIs (Reach, Impressions, Engagement, Clicks) per campaign-influencer.
- **FR-026**: System MUST auto-schedule KPI capture at Day 1, 3, and 7 when an influencer status changes to `live`.
- **FR-027**: System MUST support automated KPI collection from Instagram API for connected influencers.
- **FR-028**: System MUST support report creation with AI-generated narrative summaries and a four-stage approval flow (draft → pending_approval → approved → exported). Export formats: PDF (branded narrative report), CSV (raw KPI data tables), and shareable read-only web link for client access.

**Finance**

- **FR-029**: System MUST support invoice creation for both client and influencer types with auto-generated display IDs.
- **FR-030**: System MUST track invoice status through four stages: draft → sent → approved → paid.
- **FR-031**: System MUST provide real-time budget tracking showing budget vs. committed vs. spent per campaign.
- **FR-032**: System MUST automatically record budget revision history when campaign budgets change.
- **FR-033**: System MUST calculate management fees (default 30%, adjustable per campaign).

**Portals**

- **FR-034**: System MUST provide a Client Portal restricted to the client role showing only assigned campaigns in `pitching` or `live` status, with shortlist and content approval capabilities.
- **FR-035**: System MUST provide an Influencer Portal restricted to the influencer role with brief acceptance, content submission, and status tracking capabilities.

**Closure & Intelligence**

- **FR-036**: System MUST support campaign closure with mandatory sub-sections: Campaign Lock checklist, CX Survey, Post-Mortem, AI Learnings, and Final Intelligence Document.
- **FR-037**: System MUST generate AI-powered closure intelligence: learnings, best practices, and comprehensive wrap-up documents.

**Notifications & Settings**

- **FR-038**: System MUST provide an in-app notification center with unread count, auto-generated notifications (content uploads, shortlist approvals), and manual reminders. For pending approvals (shortlist, content, report, budget), the system MUST send automated reminder notifications at 24 hours and 48 hours, then escalate to the Director at 72 hours. No auto-approval occurs — human sign-off is always required.
- **FR-039**: System MUST support user settings for profile management, notification preferences, security (password change), and integrations (Instagram OAuth).

**Audit & Observability**

- **FR-041**: System MUST log all state-changing actions in an audit trail, including: campaign status changes, approvals (content, shortlist, budget, report), content uploads, invoice status changes, budget revisions, role assignments, user login/logout, and administrative operations.
- **FR-042**: System MUST surface recent audit entries in a dashboard activity feed accessible to internal users.

**Administration**

- **FR-040**: System MUST allow Directors to manage user roles, approve/reject registrations, reset passwords, send reset emails, and delete users.

### Key Entities

- **Campaign**: Central container linking all operational entities. Key attributes: name, display ID, status (8 stages), phase, risk level, budget, management fee, start/end dates, owner, closure state.
- **Brief**: AI-extracted structured brief data. Key attributes: objectives, KPIs, target audience, deliverables, budget signals, client info, review status. Versioned via append-only history.
- **Strategy**: AI-generated campaign strategy. Key attributes: summary, key messages, content pillars, matching criteria (platform, follower range, engagement minimums, niches, locations).
- **Influencer**: Content creator profile. Key attributes: handle, platform, niche(s), geo, language, follower count, engagement rate, rate card, tier, representation type, profile status (complete/stub).
- **Campaign-Influencer**: Junction entity tracking influencer lifecycle within a campaign. Key attributes: status (6 stages), AI match score, rationale, estimated cost, brief acceptance flag, contract status, scheduled post date, post platform.
- **Content**: Versioned content artifact. Key attributes: type (script/draft/final), version, approval status (pending/internal_approved/client_approved/changes_requested), filming gate, posting gate, file reference, live post URL. Posting requires an agreed schedule (date/time + platform) before URL submission.
- **Client**: External company or individual. Key attributes: display ID, type (company/individual), primary contact, secondary contact, campaign count.
- **Invoice**: Financial record. Key attributes: display ID, type (client/influencer), amount, currency (AED), status (4 stages), due date, campaign link.
- **KPI**: Performance metric per campaign-influencer. Key attributes: reach, impressions, engagement, clicks, capture day, source (manual/auto).
- **Report**: Campaign performance report. Key attributes: KPI summary, highlights, AI narrative, status (4 stages), client approval.
- **Notification**: In-app notification. Key attributes: type, message, read status, entity reference.
- **User/Profile**: Authenticated user with role. Key attributes: name, email, role, company registration, trade license data.
- **CX Survey**: Client satisfaction record. Key attributes: overall/communication/quality/timeliness/value scores, testimonial.
- **Post-Mortem**: Closure analysis record. Key attributes: what went well, improvements, lessons, action items, risk notes.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Campaign Managers can create a new campaign from a client brief in under 5 minutes, including AI-powered brief extraction and strategy generation.
- **SC-002**: Influencer discovery and scoring for a campaign shortlist of 10 influencers completes in under 3 minutes from search to scored presentation.
- **SC-003**: 100% of campaign status transitions are validated against mandatory gates, preventing any non-compliant progression.
- **SC-004**: Content approval turnaround (submission to client approval) is visible and trackable, with notifications sent at each stage within 30 seconds of a status change.
- **SC-005**: Client Portal enables self-service shortlist and content approvals, reducing email/WhatsApp approval chains by 80% compared to pre-system workflow.
- **SC-006**: All six user roles can access only their authorized features and data, with zero unauthorized data exposure verified across all access paths.
- **SC-007**: KPI auto-capture collects performance data from Instagram for connected influencers at Day 1, 3, and 7 with a success rate of 95% or higher when the API is available.
- **SC-008**: Campaign closure captures institutional knowledge (CX survey, post-mortem, AI learnings) for 100% of closed campaigns, building a searchable knowledge base.
- **SC-009**: Financial tracking provides real-time budget accuracy — committed and spent amounts match invoice records with zero discrepancy.
- **SC-010**: System supports 50 concurrent internal users and 200 concurrent portal users (clients + influencers) without performance degradation.
- **SC-011**: New user onboarding (signup to active access) completes within one business day, including AI trade license extraction and Director approval.
- **SC-012**: The system replaces at least 4 previously fragmented tools (WhatsApp, Excel, email, file sharing) with integrated equivalents, consolidating all campaign operations into a single platform.

---

## Assumptions

- **Currency**: All financial transactions are denominated in AED (UAE Dirham) as the primary currency.
- **Market**: The primary market is the UAE, given trade license requirements and AED currency.
- **Instagram Focus**: Instagram is the primary social platform for influencer operations, with TikTok as a planned future integration.
- **Agency Model**: The system operates under a centralized agency model where one agency manages multiple clients and influencer relationships.
- **Management Fee**: The default management fee is 30% of campaign budget, adjustable per campaign by authorized users.
- **AI Availability**: AI features (brief extraction, strategy generation, influencer scoring, intelligence generation) are available without external API key management.
- **Director Availability**: At least one Director-role user is available to process approvals, overrides, and registrations within one business day.
- **Auto-Confirm**: User accounts are auto-confirmed on signup to enable immediate file upload during registration, then signed out pending Director approval.

---

## Dependencies

- **Instagram/Meta Graph API**: Required for influencer discovery (name/username/hashtag search) and automated KPI capture. Subject to Meta API rate limits and policy changes.
- **Backend Platform**: PostgreSQL database, authentication, serverless functions, file storage, and row-level security are provided by the backend infrastructure.
- **AI Models**: Brief extraction, strategy generation, influencer scoring, and intelligence generation depend on AI model availability.

---

## Clarifications

### Session 2026-02-25

- Q: Can a user hold multiple roles simultaneously? → A: Multiple roles allowed for internal users (Director, CM, Reviewer, Finance) with union-of-access; Client and Influencer roles are exclusive and cannot be combined with any other role.
- Q: Should all user actions be logged in an audit trail? → A: Yes — all state-changing actions are audit-logged (campaign status changes, approvals, content uploads, invoice changes, role assignments, login/logout). Added FR-041 and FR-042.
- Q: What format are campaign reports exported in? → A: PDF (branded narrative), CSV (raw KPI data), and shareable read-only web link. Updated FR-028.
- Q: What is the maximum file size for content uploads? → A: 1 GB per artifact. Updated FR-020.
- Q: What happens when two users edit the same campaign simultaneously? → A: Field-level merging — concurrent changes to different fields merge automatically; same-field conflicts prompt the second user to choose. Added to Edge Cases.
- Q: What is the session timeout policy? → A: 30-minute idle timeout, 8+ char passwords with complexity (uppercase, lowercase, number), 10 failed login lockout. Updated FR-001.
- Q: What happens when AI brief extraction fails or returns low-confidence results? → A: Show partial results with per-field confidence indicators; user corrects low-confidence fields and can re-run extraction; full manual entry fallback on total failure. Updated FR-012 and Edge Cases.
- Q: Are there approval escalation rules when approvers don't respond? → A: Automated reminders at 24h and 48h, Director escalation at 72h, no auto-approval. Updated FR-038.
- Q: How long are closed campaign data and files retained? → A: 3 years after campaign closure, then archived/purged with 30-day advance notice to Director. Updated FR-010.
- Q: Can campaigns be deleted, and under what constraints? → A: Soft-delete allowed only in `draft` status by Director or Campaign Manager; all other statuses are undeletable. Updated FR-007.

---

## Out of Scope

- TikTok API integration (marked as "coming soon" in Settings).
- Multi-currency support beyond AED.
- Multi-language/i18n support.
- Mobile native applications (web responsive only).
- Third-party analytics integrations beyond Instagram.
- Automated payment processing or gateway integration (invoices are tracked, not processed).
- White-labeling or multi-tenant agency support.
