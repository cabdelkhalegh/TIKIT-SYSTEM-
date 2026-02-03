# TiKiT MVP v1.2 - Specification

## Overview
TiKiT is an Internal-first Influencer Agency Operating System designed to streamline campaign management, content workflows, and performance tracking.

**PRD Compliance**: Aligned with PRD v1.2 (Canonical)

## Completed Features

### ✅ TASK 2: RBAC + Invite-Only System (PRD v1.2 Section 2)

#### 1. Role-Based Access Control (6-Role Model)
**Roles per PRD v1.2 Section 2:**
- **Director**: Super-user with global visibility, budget overrides, exception approvals
- **Finance**: Financial control - create & approve invoices, mark as paid
- **Campaign Manager**: Runs campaigns - create/edit campaigns, manage workflows
- **Reviewer**: Quality & approvals - approve briefs, content, reports
- **Influencer**: External contributor - upload content, connect Instagram, view status
- **Client**: External approver - view & approve shortlist, content, reports

**Role Hierarchy**: director > finance > campaign_manager > reviewer > influencer > client

#### 2. Invite-Only System
- **No self-registration**: Users must have an invitation code to sign up
- **Invitation Management**: Directors can create, send, and revoke invitations
- **Invite Codes**: Unique 8-character codes tied to specific email addresses
- **Expiration**: Invitations expire after 7 days
- **Role Assignment**: Role is pre-assigned in the invitation

#### 3. Pending Approval Workflow
- **Director Accounts**: Require manual approval after signup (security measure)
- **Other Roles**: Auto-approved upon accepting invitation
- **Pending State**: Users with unapproved roles see a waiting screen

#### 4. UI Role Gating
- **Route Protection**: Users can only access routes allowed for their role
- **Component Gating**: UI elements (buttons, tabs, pages) are hidden based on role
- **Navigation**: Dynamic menu items based on user permissions

### ✅ Human-Readable IDs (PRD v1.2 Section 3)

**ID Generation System Implemented**:
- Campaign: `TKT-YYYY-####` (e.g., TKT-2026-0007)
- Client: `CLI-####` (e.g., CLI-0142)
- Influencer: `INF-####` (e.g., INF-0901)
- Invoice: `INV-YYYY-####` (e.g., INV-2026-0033)

**Status**: Database sequences and generation functions created. Ready for use when entity tables are implemented.

## Acceptance Criteria

### ✅ Completed
- [x] Six-role model per PRD v1.2 (director, campaign_manager, reviewer, finance, client, influencer)
- [x] Self role-selection disabled on signup
- [x] Invite-only signup flow implemented
- [x] Invitation management dashboard (Director-only)
- [x] UI route protection based on role
- [x] UI component gating (RoleGate component with helpers)
- [x] Pending approval flow for directors
- [x] Backend RLS policies enforce RBAC
- [x] Frontend UI respects role permissions
- [x] Human-readable ID generation functions

### 🔄 Next Tasks (Per PRD Section 15 Build Order)
- [ ] Content workflow (P0) - Internal + client approval, versioning
- [ ] KPI manual entry (P0) - Forms per post and influencer
- [ ] Instagram API integration (P0) - OAuth, auto-snapshots
- [ ] Reporting and PDF exports (P1) - AI narrative, PDF generation
- [ ] Notifications (P1) - In-app center, deadline reminders

## Technical Stack
- **Frontend**: Next.js ^15.6.3 (security-hardened), React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth

## Security Features
- Row Level Security (RLS) policies on all tables
- Six-role hierarchical access control per PRD
- Frontend and backend permission validation
- Secure invitation code generation
- Password-based authentication
- Zero security vulnerabilities (Next.js ^15.6.3 + React 19)
