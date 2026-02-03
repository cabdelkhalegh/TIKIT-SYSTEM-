# TiKiT MVP v1.2
**Internal-first Influencer Agency Operating System**

## ⚠️ Security Notice
**CRITICAL UPDATE**: Next.js upgraded to ^15.6.3 with React 19 - ALL security vulnerabilities resolved including RCE (Remote Code Execution). Zero known vulnerabilities. See [docs/SECURITY.md](docs/SECURITY.md) for complete details.

## Overview
TiKiT is a comprehensive platform for managing influencer marketing campaigns, content workflows, and performance tracking. Designed specifically for influencer agencies to streamline their operations.

## Current Status: TASK 2 Complete ✅

### Implemented Features
- ✅ **Role-Based Access Control (RBAC)**
  - Four user roles: Director, Account Manager, Influencer, Client
  - Backend enforcement via PostgreSQL Row Level Security
  - Frontend UI gating for routes and components

- ✅ **Invite-Only System**
  - No self-registration - invitation codes required
  - Director-managed invitation system
  - Auto-approval for most roles, manual approval for Directors
  - 7-day invitation expiration

- ✅ **Secure Authentication**
  - Email/password authentication via Supabase
  - JWT-based sessions
  - Protected routes and API endpoints

## Tech Stack
- **Frontend**: Next.js ^15.6.3 (latest stable, zero vulnerabilities), React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Database**: PostgreSQL with Row Level Security
- **Deployment**: Vercel (frontend), Supabase Cloud (backend)

## Project Structure
```
/
├── frontend/          # Next.js application
│   ├── app/           # App router pages
│   ├── components/    # Reusable components
│   ├── contexts/      # React contexts
│   ├── lib/           # Utilities and configs
│   ├── types/         # TypeScript types
│   └── utils/         # Helper functions
├── docs/              # Documentation
│   ├── ARCHITECTURE.md
│   ├── API_SPEC.md
│   ├── DB_SCHEMA.sql
│   ├── MVP_SPEC.md
│   ├── DECISIONS.md
│   └── BACKLOG.md
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Git

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/cabdelkhalegh/TIKIT-SYSTEM-.git
   cd TIKIT-SYSTEM-
   ```

2. **Set up Supabase**
   - Create a new Supabase project at https://supabase.com
   - Run the SQL from `docs/DB_SCHEMA.sql` in the Supabase SQL editor
   - Copy your project URL and anon key

3. **Configure Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.local.example .env.local
   ```

4. **Update environment variables**
   Edit `frontend/.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```
   
   Open http://localhost:3000

### First Time Setup

1. **Create the first Director**
   - Sign up manually through Supabase Auth UI or SQL
   - Update the profiles table to set role='director' and role_approved=true
   
   OR run this SQL (replace the email):
   ```sql
   -- After user signs up through Supabase
   UPDATE profiles 
   SET role = 'director', role_approved = true 
   WHERE email = 'your-director-email@example.com';
   ```

2. **Create invitations**
   - Log in as the Director
   - Navigate to `/invitations`
   - Create invitation codes for other users

3. **Share invitation codes**
   - Send invitation codes to team members
   - They can sign up at `/signup`

## User Roles

| Role             | Permissions                                      |
|------------------|--------------------------------------------------|
| **Director**     | Full access, user management, invitations       |
| **Account Manager** | Campaigns, clients, influencers, content, reports |
| **Influencer**   | Own campaigns and content                       |
| **Client**       | View own campaigns and reports                  |

## Documentation
- [Architecture](docs/ARCHITECTURE.md) - System design and data flows
- [API Specification](docs/API_SPEC.md) - API endpoints and usage
- [Database Schema](docs/DB_SCHEMA.sql) - Complete database DDL
- [MVP Specification](docs/MVP_SPEC.md) - Feature scope and acceptance criteria
- [Decisions](docs/DECISIONS.md) - Architectural decision log
- [Backlog](docs/BACKLOG.md) - Upcoming features and tasks

## Upcoming Features
- 🔄 Human-readable IDs (TASK 3)
- 🔄 Content workflow with approvals (TASK 4)
- 🔄 Manual KPI entry (TASK 5)
- 🔄 Instagram API integration (TASK 6)
- 🔄 Reporting and PDF exports (TASK 7)

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

## Security
- Row Level Security (RLS) enforced at database level
- JWT authentication for all API calls
- Role-based access control on frontend and backend
- Secure password hashing via Supabase Auth
- Environment variables for sensitive data

## License
Proprietary - All rights reserved

## Support
For issues or questions, contact the development team or create an issue in the repository.
