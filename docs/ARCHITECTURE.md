# TiKiT Architecture

## System Architecture

### Overview
TiKiT follows a modern JAMstack architecture with a serverless backend and a React-based frontend.

```
┌─────────────────┐
│   Next.js App   │
│   (Frontend)    │
└────────┬────────┘
         │
         │ API Calls
         ▼
┌─────────────────┐
│   Supabase      │
│   - Auth        │
│   - Database    │
│   - Storage     │
│   - RLS         │
└─────────────────┘
```

## Components

### Frontend (Next.js 15.6.3)
- **Framework**: Next.js ^15.6.3 with App Router (security-hardened)
- **Runtime**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context (AuthContext)
- **Authentication**: Supabase Auth Client

#### Key Modules
1. **Authentication Layer**
   - `contexts/AuthContext.tsx` - Global auth state
   - `components/ProtectedRoute.tsx` - Route protection
   - `components/RoleGate.tsx` - Component-level RBAC
   - Helper components: DirectorOnly, FinanceOnly, CampaignManagerOnly, ReviewerOnly

2. **RBAC System (6-Role Model per PRD v1.2)**
   - `utils/rbac.ts` - Permission checking functions
   - `types/index.ts` - TypeScript type definitions
   - Role hierarchy: director > finance > campaign_manager > reviewer > influencer > client

3. **Pages**
   - `/login` - User login
   - `/signup` - Invite-based signup
   - `/dashboard` - Main dashboard (role-specific)
   - `/invitations` - Invitation management (Director-only)
   - `/pending-approval` - Waiting screen for unapproved users
   - `/profile` - User profile

### Backend (Supabase)

#### Database (PostgreSQL)
- **Tables:**
  - `profiles` - Extended user information
  - `invitations` - Invitation management

#### Authentication
- Email/password authentication
- JWT-based sessions
- Automatic user creation in `auth.users`

#### Row Level Security (RLS)
- Table-level access control
- Role-based query filtering
- Automatic enforcement at database level

## Data Flow

### Signup Flow
```
User receives invitation → 
User visits /signup → 
Enters invite code + credentials → 
Backend validates invitation → 
Creates auth.users record → 
Creates profiles record with role → 
Updates invitation status → 
Redirects to dashboard or pending-approval
```

### Login Flow
```
User visits /login → 
Enters credentials → 
Supabase Auth validates → 
Frontend fetches profile → 
Checks role_approved status → 
Redirects to appropriate page
```

### Authorization Flow
```
User navigates to route → 
ProtectedRoute component checks auth → 
Fetches user profile → 
Validates role_approved → 
Checks route permissions → 
Renders page or redirects
```

## Security Layers

### 1. Database Level (RLS)
- PostgreSQL Row Level Security policies
- Role-based SELECT/INSERT/UPDATE/DELETE permissions
- Automatic enforcement on every query

### 2. API Level
- Supabase Auth middleware
- JWT validation
- User context in queries

### 3. Application Level
- Route guards (`ProtectedRoute`)
- Component guards (`RoleGate`)
- Permission checking utilities

## Deployment Architecture

### Frontend
- Deployed as static site or serverless functions
- Environment variables for Supabase connection

### Backend
- Supabase cloud instance
- Managed PostgreSQL database
- Automatic scaling and backups

## Future Considerations
- Caching layer for frequently accessed data
- Real-time subscriptions for live updates
- File storage for content uploads
- Background job processing for KPI collection
- PDF generation service for reports
