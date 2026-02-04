# TiKiT MVP v1.2
**Internal-first Influencer Agency Operating System**

## ⚠️ Security Notice
**CRITICAL UPDATE**: Next.js upgraded to ^15.6.3 with React 19 - ALL security vulnerabilities resolved including RCE (Remote Code Execution). Zero known vulnerabilities. See [docs/SECURITY.md](docs/SECURITY.md) for complete details.

## Overview
TiKiT is a comprehensive platform for managing influencer marketing campaigns, content workflows, and performance tracking. Designed specifically for influencer agencies to streamline their operations.

**PRD Compliance**: Aligned with PRD v1.2 (Canonical) - See [tikit_prd_v_1.md](tikit_prd_v_1.md)

## Current Status: 45% PRD Compliance

**Progress**: Foundation Complete + Content Workflow 60%  
**Last Updated**: February 3, 2026

### ✅ Completed Features

#### 1. Role-Based Access Control (6-Role Model per PRD v1.2 Section 2)
**Roles with clear separation of responsibilities:**
- **Director** (Level 6): Super-user with global visibility, budget overrides, exception approvals
- **Finance** (Level 5): Financial control - create & approve invoices, mark as paid
- **Campaign Manager** (Level 4): Runs campaigns - create/edit campaigns, manage workflows
- **Reviewer** (Level 3): Quality & approvals - approve briefs, content, reports
- **Influencer** (Level 2): External contributor - upload content, connect Instagram, view status
- **Client** (Level 1): External approver - view & approve shortlist, content, reports

**Implementation**:
- Backend enforcement via PostgreSQL Row Level Security (18+ policies)
- Frontend UI gating for routes and components
- Three-layer security model (Database RLS + API Auth + Frontend Guards)
- Role-specific route allowlists
- Helper functions (DirectorOnly, FinanceOnly, CampaignManagerOnly, ReviewerOnly)

#### 2. Invite-Only System
- No self-registration - invitation codes required
- Director-managed invitation system
- Auto-approval for most roles, manual approval for Directors
- 7-day invitation expiration
- Unique 8-character invitation codes
- Invite revocation support

#### 3. Human-Readable IDs (PRD v1.2 Section 3)
**Auto-Generated Professional IDs**:
- Campaign: `TKT-YYYY-####` (e.g., TKT-2026-0007)
- Client: `CLI-####` (e.g., CLI-0142)
- Influencer: `INF-####` (e.g., INF-0901)
- Invoice: `INV-YYYY-####` (e.g., INV-2026-0033)

**Features**:
- PostgreSQL sequences with auto-increment
- Database functions for generation
- Integrated into all entity tables
- Unique constraints enforced

#### 4. Content Workflow System (60% Complete - PRD Section 8)
**Database Schema Complete (6 Tables)**:
- **clients**: Client database with business info, contact details
- **campaigns**: Campaign management with 7-state workflow (draft → archived)
- **content_items**: Deliverables with platform, type, deadlines
- **content_versions**: File versioning with auto-increment
- **content_approvals**: Two-stage approval (internal → client)
- **content_feedback**: Threaded comments with annotations

**Frontend Pages Built**:
- `/campaigns` - List all campaigns with search & filters
- `/campaigns/new` - Create new campaign form
- `/clients` - Client database management

**Features**:
- Two-stage approval workflow (reviewer → client)
- Version management with change tracking
- Status tracking (7 states per content lifecycle)
- Role-based permissions
- Search and filtering

**Remaining (40%)**:
- Campaign detail page
- Content upload interface
- Approval workflow UI
- Feedback system UI
- Overdue reminders

#### 5. Secure Authentication
- Email/password authentication via Supabase
- JWT-based sessions
- Protected routes and API endpoints
- Zero security vulnerabilities

### 🔄 Remaining Work (55% to MVP)

**Immediate Priority: Complete Content Workflow (40% remaining)**
- Campaign detail page with content list
- Content upload with Supabase Storage
- Approval workflow UI (internal + client)
- Feedback/comment system
- Overdue tracking and reminders

**P0 Features (Per PRD Section 15)**

1. **Content Workflow Completion** (PRD Section 8) - 8-10 hours
   - ✅ Database schema (complete)
   - ✅ Campaign & client pages (complete)
   - 📋 Campaign details
   - 📋 Content upload interface
   - 📋 Approval workflow UI
   - 📋 Feedback system

2. **KPI Manual Entry** (PRD Section 9) - 6-8 hours
   - Manual KPI entry forms (per post, per influencer)
   - Campaign KPI rollups
   - Data validation & historical tracking

3. **Instagram API Integration** (PRD Section 9) - 16-20 hours
   - OAuth connection flow
   - Profile + media fetch
   - Automated KPI snapshots (Day 1, 3, 7)
   - Token storage
   - Fallback to manual entry

**P1 Features**

4. **Reporting & PDF** (PRD Section 10) - 12-16 hours
   - KPI aggregation
   - AI narrative generation (editable)
   - PDF export (briefs, strategies, reports)

5. **Finance & Invoicing** (PRD Section 11) - 8-12 hours
   - Invoice management (INV-YYYY-####)
   - Payment tracking
   - Finance role permissions

6. **Notifications** (PRD Section 12) - 6-8 hours
   - In-app notifications
   - Email reminders
   - Overdue alerts

**P2 Features** (Future)
- Advanced analytics
- Bulk operations
- Mobile app
- API integrations

## Tech Stack
- **Frontend**: Next.js ^15.6.3 (security-hardened), React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Database**: PostgreSQL with Row Level Security
- **Deployment**: Vercel (frontend), Supabase Cloud (backend)

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account (https://supabase.com)
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/cabdelkhalegh/TIKIT-SYSTEM-.git
   cd TIKIT-SYSTEM-
   ```

2. **Set up Supabase**
   - Create a new project at https://supabase.com
   - Run the SQL in `docs/DB_SCHEMA.sql` in your Supabase SQL Editor
   - Get your project URL and anon key from Settings > API

3. **Configure Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   
   Open http://localhost:3000

5. **Create First Director** (Manual SQL required)
   - Sign up through the UI first
   - In Supabase SQL Editor, run:
   ```sql
   UPDATE profiles 
   SET role = 'director', role_approved = TRUE 
   WHERE email = 'your@email.com';
   ```

### Testing the System

See [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md) for comprehensive testing instructions.

**Quick Test**:
1. Create first director (manual SQL above)
2. Log in as director
3. Go to `/invitations` and create invitations
4. Test signup with invitation codes
5. Verify role-based permissions

## User Roles (PRD v1.2 Section 2)

| Role | Hierarchy | Description | Special Rights |
|------|-----------|-------------|----------------|
| **Director** | 6 | Super-user | Global visibility, budget overrides, exception approvals |
| **Finance** | 5 | Financial control | Create & approve invoices, mark paid |
| **Campaign Manager** | 4 | Runs campaigns | Create/edit campaigns, manage workflows |
| **Reviewer** | 3 | Quality & approvals | Approve briefs, content, reports |
| **Influencer** | 2 | External contributor | Upload content, connect Instagram, view status |
| **Client** | 1 | External approver | View & approve shortlist, content, reports |

## Documentation

### Core Documents
- [**Implementation Summary**](docs/IMPLEMENTATION_SUMMARY.md) - Complete overview of all work ⭐
- [PRD v1.2](tikit_prd_v_1.md) - Product Requirements (Canonical)
- [PRD Compliance Analysis](docs/PRD_COMPLIANCE_ANALYSIS.md) - Gap analysis
- [MVP Specification](docs/MVP_SPEC.md) - Feature scope & acceptance criteria
- [Architecture](docs/ARCHITECTURE.md) - System design & data flows
- [Database Schema](docs/DB_SCHEMA.sql) - Complete DDL with RLS policies (830 lines)
- [API Specification](docs/API_SPEC.md) - Endpoints & request/response
- [Decisions Log](docs/DECISIONS.md) - Architectural decisions (ADR)
- [Backlog](docs/BACKLOG.md) - Development roadmap (P0/P1/P2)

### Progress Tracking
- [Content Workflow Progress](docs/CONTENT_WORKFLOW_PROGRESS.md) - Detailed phase tracking
- [Foundation Fix Summary](docs/FOUNDATION_FIX_SUMMARY.md) - 6-role model migration
- [PRD Alignment Plan](docs/PRD_ALIGNMENT_PLAN.md) - Implementation roadmap
- [PRD Check Summary](docs/PRD_CHECK_SUMMARY.md) - Executive summary

### Testing & Security
- [Testing Guide](docs/TESTING_GUIDE.md) - Manual testing scenarios
- [Security Summary](docs/SECURITY.md) - Vulnerability history & resolution
- [Deliverable](DELIVERABLE.md) - TASK 2 completion summary

## Security Features
- ✅ Row Level Security (RLS) - 18+ policies across 8 tables
- ✅ Six-role hierarchical access control per PRD
- ✅ Three-layer security (Database + API + Frontend)
- ✅ JWT authentication with Supabase
- ✅ Secure invitation code generation
- ✅ **Zero security vulnerabilities** (Next.js ^15.6.3 + React 19)
- ✅ Automatic security patch updates enabled (caret versioning)
- ✅ Protected routes with role validation
- ✅ RLS policy enforcement on all data access

## Project Status

### Completed (45% PRD Compliance)
- ✅ Authentication & RBAC foundation (100%)
- ✅ 6-role model implementation (100%)
- ✅ Invite-only system (100%)
- ✅ Human-readable ID generation (100%)
- ✅ Security hardening (100%)
- ✅ Complete documentation (13 files)
- ✅ Content workflow database (100%)
- ✅ Campaign & client management UI (100%)

### In Progress (Content Workflow - 60%)
- ⚙️ Campaign detail page (next)
- ⚙️ Content upload interface
- ⚙️ Approval workflow UI
- ⚙️ Feedback system

### Planned (70%)
See [docs/BACKLOG.md](docs/BACKLOG.md) for detailed roadmap.

## Development

### Build for Production
```bash
cd frontend
npm run build
npm run start
```

### Linting
```bash
npm run lint
```

## Contributing

This is an internal project. For questions or issues, please contact the development team.

## License

Proprietary - All rights reserved

---

**Last Updated**: 2024-02-03  
**Version**: 1.2  
**PRD Compliance**: 30% (Foundation complete)
