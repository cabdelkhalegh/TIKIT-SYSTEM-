# TiKiT Decision Log

## Overview
This document tracks key architectural and implementation decisions made during the development of TiKiT MVP v1.2.

---

## Decision Log

### DEC-001: Technology Stack Selection
**Date**: 2024-01-08  
**Status**: Accepted  
**Context**: Need to choose a modern, scalable stack for rapid MVP development  

**Decision**: Use Next.js 14 + Supabase  

**Rationale**:
- **Next.js 14**: Modern React framework with App Router, server components, and excellent TypeScript support
- **Supabase**: Provides authentication, PostgreSQL database, storage, and Row Level Security out of the box
- **Tailwind CSS**: Rapid UI development with utility-first approach
- **TypeScript**: Type safety and better developer experience

**Alternatives Considered**:
- Django + React: More complex setup, requires separate backend
- Firebase: Less flexible database, vendor lock-in concerns
- Custom Node.js backend: More development time required

**Consequences**:
- ✅ Rapid development
- ✅ Built-in authentication and security
- ✅ Automatic API generation
- ⚠️ Learning curve for Supabase-specific features
- ⚠️ Dependency on Supabase platform

---

### DEC-002: RBAC Implementation Strategy
**Date**: 2024-01-08  
**Status**: Accepted  
**Context**: Need to implement role-based access control with multiple security layers

**Decision**: Implement RBAC at three layers:
1. Database level (Row Level Security policies)
2. API level (Supabase Auth middleware)
3. Application level (Route guards and component gates)

**Rationale**:
- Defense in depth - multiple security layers
- Database RLS prevents unauthorized data access even if frontend is bypassed
- Frontend gates provide good UX by hiding unavailable features
- Clear separation of concerns

**Alternatives Considered**:
- Frontend-only: Not secure, easily bypassed
- Backend-only: Poor UX, users would see errors for unauthorized actions
- Middleware-only: Less granular control

**Consequences**:
- ✅ Strong security
- ✅ Good user experience
- ✅ Automatic enforcement
- ⚠️ More complex to implement
- ⚠️ Must maintain consistency across layers

---

### DEC-003: Invite-Only vs. Role Approval
**Date**: 2024-01-08  
**Status**: Accepted  
**Context**: Need to control user registration and role assignment

**Decision**: Implement invite-only system with hybrid approval:
- All signups require invitation code
- Directors require manual approval after signup
- Other roles are auto-approved upon accepting invitation

**Rationale**:
- Prevents unauthorized signups
- Directors have elevated privileges, need extra verification
- Streamlines onboarding for other roles
- Email in invitation ensures correct recipient

**Alternatives Considered**:
- All roles require approval: Too much admin overhead
- No approvals: Security risk for director role
- Open registration with role requests: Spam risk

**Consequences**:
- ✅ Secure registration process
- ✅ Controlled access
- ✅ Reduced director workload for most users
- ⚠️ Directors must wait for approval

---

### DEC-004: User Roles Definition
**Date**: 2024-01-08  
**Status**: Accepted  
**Context**: Need to define user roles for the influencer agency OS

**Decision**: Four roles with hierarchical permissions:
1. **Director**: Full system access, user management
2. **Account Manager**: Campaign and client management
3. **Influencer**: Own campaigns and content
4. **Client**: View own campaigns and reports

**Rationale**:
- Maps to real agency structure
- Clear permission boundaries
- Scalable for future features
- Simple enough for MVP

**Alternatives Considered**:
- More granular roles (e.g., separate content manager): Too complex for MVP
- Fewer roles: Not enough separation of concerns
- Permission-based instead of role-based: More flexible but harder to manage

**Consequences**:
- ✅ Clear role definitions
- ✅ Easy to understand and communicate
- ✅ Room for expansion
- ⚠️ May need role customization in future

---

### DEC-005: Frontend Routing Strategy
**Date**: 2024-01-08  
**Status**: Accepted  
**Context**: Need to protect routes and provide role-based navigation

**Decision**: Use Next.js App Router with ProtectedRoute wrapper component

**Implementation**:
- `ProtectedRoute` component wraps protected pages
- Checks authentication status
- Validates role approval
- Redirects to appropriate page based on user state

**Rationale**:
- Consistent protection across all routes
- Single source of truth for route access logic
- Easy to apply to new pages
- Works well with Next.js App Router

**Alternatives Considered**:
- Middleware-based routing: Less granular control
- Individual page-level checks: Code duplication
- Next.js middleware: Doesn't work well with client-side state

**Consequences**:
- ✅ Consistent route protection
- ✅ Easy to maintain
- ✅ Good developer experience
- ⚠️ Client-side routing only (SSR would need different approach)

---

### DEC-006: Database Schema Approach
**Date**: 2024-01-08  
**Status**: Accepted  
**Context**: Need to extend Supabase auth.users with custom profile data

**Decision**: Create separate `profiles` table with 1:1 relationship to auth.users

**Implementation**:
- `profiles.id` references `auth.users.id`
- Profile created during signup
- Role and approval data stored in profiles
- Cascade delete when user is deleted

**Rationale**:
- Supabase best practice
- Separates auth data from app data
- Allows custom fields without modifying auth schema
- Better for migrations and backups

**Alternatives Considered**:
- Use auth.users.raw_user_meta_data: Limited query capabilities
- Custom auth table: Would duplicate Supabase functionality
- Single table with all data: Violates separation of concerns

**Consequences**:
- ✅ Clean separation of concerns
- ✅ Easy to add custom fields
- ✅ Works with Supabase patterns
- ⚠️ Requires join for complete user data
- ⚠️ Must ensure profile creation in signup flow

---

### DEC-007: Invitation Code Format
**Date**: 2024-01-08  
**Status**: Accepted  
**Context**: Need secure but user-friendly invitation codes

**Decision**: 8-character alphanumeric codes (uppercase)

**Example**: `ABC12345`, `XYZ98765`

**Rationale**:
- Long enough to be secure (36^8 = ~2.8 trillion combinations)
- Short enough to type manually if needed
- Uppercase avoids confusion (0 vs O, 1 vs l)
- Easy to communicate verbally

**Alternatives Considered**:
- UUID: Too long, not user-friendly
- 4-6 characters: Not secure enough
- Special characters: Harder to type and communicate

**Consequences**:
- ✅ Good balance of security and usability
- ✅ Easy to share
- ⚠️ Still need collision checking

---

## Decision Status Definitions

- **Proposed**: Under consideration
- **Accepted**: Decision made and implemented
- **Deprecated**: No longer valid, superseded by another decision
- **Rejected**: Considered but not chosen

---

## Future Decisions Needed

- ID generation strategy for campaigns, clients, etc. (TASK 3)
- File storage structure for content uploads (TASK 4)
- Instagram API rate limiting strategy (TASK 6)
- PDF generation library selection (TASK 7)
- AI provider selection for narrative generation (TASK 7)
