# TiKiT MVP v1.2
**Internal-first Influencer Agency Operating System**

## ⚠️ Security Notice
**CRITICAL UPDATE**: Next.js upgraded to ^15.6.3 with React 19 - ALL security vulnerabilities resolved including RCE (Remote Code Execution). Zero known vulnerabilities. See [docs/SECURITY.md](docs/SECURITY.md) for complete details.

## Overview
TiKiT is a comprehensive platform for managing influencer marketing campaigns, content workflows, and performance tracking. Designed specifically for influencer agencies to streamline their operations.

**PRD Compliance**: Aligned with PRD v1.2 (Canonical) - See [tikit_prd_v_1.md](tikit_prd_v_1.md)

## Current Status: Foundation Complete (30%)

### ✅ Implemented Features

#### 1. Role-Based Access Control (6-Role Model per PRD v1.2 Section 2)
**Roles with clear separation of responsibilities:**
- **Director**: Super-user with global visibility, budget overrides, exception approvals
- **Finance**: Financial control - create & approve invoices, mark as paid
- **Campaign Manager**: Runs campaigns - create/edit campaigns, manage workflows
- **Reviewer**: Quality & approvals - approve briefs, content, reports
- **Influencer**: External contributor - upload content, connect Instagram, view status
- **Client**: External approver - view & approve shortlist, content, reports

**Role Hierarchy**: director > finance > campaign_manager > reviewer > influencer > client

**Implementation**:
- Backend enforcement via PostgreSQL Row Level Security
- Frontend UI gating for routes and components
- Three-layer security model (Database RLS + API Auth + Frontend Guards)

#### 2. Invite-Only System
- No self-registration - invitation codes required
- Director-managed invitation system
- Auto-approval for most roles, manual approval for Directors
- 7-day invitation expiration
- Unique 8-character invitation codes

#### 3. Human-Readable IDs (PRD v1.2 Section 3)
**ID Generation System Implemented**:
- Campaign: `TKT-YYYY-####` (e.g., TKT-2026-0007)
- Client: `CLI-####` (e.g., CLI-0142)
- Influencer: `INF-####` (e.g., INF-0901)
- Invoice: `INV-YYYY-####` (e.g., INV-2026-0033)

Database sequences and generation functions created. Ready for use when entity tables are implemented.

#### 4. Secure Authentication
- Email/password authentication via Supabase
- JWT-based sessions
- Protected routes and API endpoints
- Zero security vulnerabilities

### 🔄 Next: P0 Features (Per PRD Section 15 Build Order)

1. **Campaign Management** (PRD Sections 4-7)
   - Campaign lifecycle: draft → in_review → pitching → live → reporting → closed
   - Brief intake with AI extraction
   - Strategy generation
   - Influencer matching & scoring
   - Client pitch & approval loop

2. **Content Workflow** (PRD Section 8) - P0
   - Upload, versioning, storage
   - Internal approval (reviewer role)
   - Client approval
   - Feedback loops
   - Overdue reminders

3. **KPI System** (PRD Section 9) - P0
   - Manual KPI entry forms
   - Instagram OAuth integration
   - Automated KPI snapshots (Day 1, 3, 7)
   - Fallback to manual entry

4. **Reporting & PDF** (PRD Section 10) - P1
   - KPI aggregation
   - AI narrative generation (editable)
   - PDF export for briefs, strategies, reports

5. **Finance & Invoicing** (PRD Section 11) - P1
   - Invoice management with INV-YYYY-#### IDs
   - Payment tracking
   - Finance role permissions

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
- [PRD v1.2](tikit_prd_v_1.md) - Product Requirements (Canonical)
- [PRD Compliance Analysis](docs/PRD_COMPLIANCE_ANALYSIS.md) - Gap analysis
- [MVP Specification](docs/MVP_SPEC.md) - Feature scope & acceptance criteria
- [Architecture](docs/ARCHITECTURE.md) - System design & data flows
- [Database Schema](docs/DB_SCHEMA.sql) - Complete DDL with RLS policies
- [API Specification](docs/API_SPEC.md) - Endpoints & request/response
- [Decisions Log](docs/DECISIONS.md) - Architectural decisions (ADR)
- [Backlog](docs/BACKLOG.md) - Development roadmap (P0/P1/P2)

### Testing & Security
- [Testing Guide](docs/TESTING_GUIDE.md) - Manual testing scenarios
- [Security Summary](docs/SECURITY.md) - Vulnerability history & resolution
- [Deliverable](DELIVERABLE.md) - TASK 2 completion summary

## Security Features
- ✅ Row Level Security (RLS) on all tables
- ✅ Six-role hierarchical access control per PRD
- ✅ Three-layer security (Database + API + Frontend)
- ✅ JWT authentication with Supabase
- ✅ Secure invitation code generation
- ✅ Zero security vulnerabilities (Next.js ^15.6.3 + React 19)
- ✅ Automatic security patch updates enabled

## Project Status

### Completed (30%)
- ✅ Authentication & RBAC foundation
- ✅ 6-role model implementation
- ✅ Invite-only system
- ✅ Human-readable ID generation
- ✅ Security hardening
- ✅ Complete documentation

### In Progress (0%)
- 🔄 Campaign management
- 🔄 Content workflow
- 🔄 KPI system

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
