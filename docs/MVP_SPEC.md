# TiKiT MVP v1.2 - Specification

## Overview
TiKiT is an Internal-first Influencer Agency Operating System designed to streamline campaign management, content workflows, and performance tracking.

## Current Scope: TASK 2 - RBAC + Invite-Only System

### Features Implemented

#### 1. Role-Based Access Control (RBAC)
- **Four User Roles:**
  - **Director**: Full system access, can invite users and approve accounts
  - **Account Manager**: Manage campaigns, clients, influencers, content, and reports
  - **Influencer**: Access own campaigns and content
  - **Client**: View own campaigns and reports

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

## Acceptance Criteria

### ✅ Completed
- [x] Director role added to system
- [x] Self role-selection disabled on signup
- [x] Invite-only signup flow implemented
- [x] Invitation management dashboard (Director-only)
- [x] UI route protection based on role
- [x] UI component gating (RoleGate component)
- [x] Pending approval flow for directors
- [x] Backend RLS policies enforce RBAC
- [x] Frontend UI respects role permissions

### 🔄 Future Tasks
- [ ] Human-readable IDs (TASK 3)
- [ ] Content workflow (TASK 4)
- [ ] KPI manual entry (TASK 5)
- [ ] Instagram API integration (TASK 6)
- [ ] Reporting and PDF exports (TASK 7)

## Technical Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth

## Security Features
- Row Level Security (RLS) policies on all tables
- Role-based database access control
- Frontend and backend permission validation
- Secure invitation code generation
- Password-based authentication
