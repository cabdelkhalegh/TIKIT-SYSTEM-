# TiKiT Decision Log

## Overview
This document tracks key architectural and implementation decisions made during the development of TiKiT MVP v1.2.

---

## Decision Log

### DEC-001: Technology Stack Selection
**Date**: 2024-01-08  
**Updated**: 2024-02-03 (Security hardening)  
**Status**: Accepted  
**Context**: Need to choose a modern, scalable stack for rapid MVP development  

**Decision**: Use Next.js ^15.6.3 + React 19 + Supabase  

**Rationale**:
- **Next.js ^15.6.3**: Security-hardened (zero vulnerabilities), modern React framework with App Router
- **React 19**: Required for Next.js 15.6+ security fixes, backward compatible
- **Supabase**: Provides authentication, PostgreSQL database, storage, and Row Level Security out of the box
- **Tailwind CSS**: Rapid UI development with utility-first approach
- **TypeScript**: Type safety and better developer experience

**Security Update (2024-02-03)**:
- Upgraded from Next.js 14.1.0 to ^15.6.3 to address critical vulnerabilities
- Fixed RCE (Remote Code Execution) vulnerability
- Fixed multiple DoS vulnerabilities
- Fixed authorization bypass issues
- Automatic security patches enabled via caret versioning

**Alternatives Considered**:
- Django + React: More complex setup, requires separate backend
- Firebase: Less flexible database, vendor lock-in concerns
- Custom Node.js backend: More development time required

**Consequences**:
- ✅ Rapid development
- ✅ Built-in authentication and security
- ✅ Automatic API generation
- ✅ Zero known security vulnerabilities
- ✅ Auto-patching for security updates
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
**Status**: Deprecated → Superseded by DEC-008  
**Context**: Need to define user roles for the influencer agency OS

**Original Decision**: Four roles with hierarchical permissions:
1. **Director**: Full system access, user management
2. **Account Manager**: Campaign and client management
3. **Influencer**: Own campaigns and content
4. **Client**: View own campaigns and reports

**Note**: This decision has been superseded by DEC-008 which aligns with PRD v1.2 requirements for six distinct roles.

---

### DEC-008: PRD v1.2 Alignment - Six-Role Model
**Date**: 2024-02-03  
**Status**: Accepted  
**Context**: PRD v1.2 (canonical) specifies six distinct roles with clear separation of responsibilities. Previous 4-role model conflated multiple responsibilities into "account_manager".

**Decision**: Implement six-role model per PRD v1.2 Section 2:
1. **Director**: Super-user (global visibility, budget overrides, exception approvals)
2. **Finance**: Financial control (create & approve invoices, mark paid)
3. **Campaign Manager**: Runs campaigns (create/edit campaigns, manage workflows)
4. **Reviewer**: Quality & approvals (approve briefs, content, reports)
5. **Influencer**: External contributor (upload content, connect Instagram, view status)
6. **Client**: External approver (view & approve shortlist, content, reports)

**Role Hierarchy**: director > finance > campaign_manager > reviewer > influencer > client

**Rationale**:
- Aligns with PRD v1.2 canonical requirements
- Clear separation of financial control from operational roles
- Reviewer role enables dedicated quality assurance workflow
- Campaign Manager focuses on campaign execution
- Finance role has distinct permissions for invoicing and payment tracking
- Supports future finance and approval workflows per PRD

**Migration from 4-role model**:
- `account_manager` deprecated but kept for backward compatibility
- New deployments use 6-role model exclusively
- Existing users must be migrated to appropriate new roles
- See DB_SCHEMA.sql for migration commands

**Alternatives Considered**:
- Keep 4 roles, map to PRD: Not true compliance, technical debt
- Add roles incrementally: Partial alignment, confusing state
- Custom role permissions: More complex, not PRD-compliant

**Consequences**:
- ✅ Full PRD v1.2 compliance
- ✅ Future-proof for finance workflows (Section 11)
- ✅ Clear separation of concerns
- ✅ Scalable for team growth
- ⚠️ Breaking change for existing deployments
- ⚠️ More complex RBAC logic
- ⚠️ Requires user migration for existing systems

---

### DEC-009: Human-Readable ID System
**Date**: 2024-02-03  
**Status**: Accepted  
**Context**: PRD v1.2 Section 3 mandates human-readable, immutable IDs for all core entities to improve communication and traceability.

**Decision**: Implement formatted ID generation system:
- **Campaign**: `TKT-YYYY-####` (e.g., TKT-2026-0007)
- **Client**: `CLI-####` (e.g., CLI-0142)
- **Influencer**: `INF-####` (e.g., INF-0901)
- **Invoice**: `INV-YYYY-####` (e.g., INV-2026-0033)

**Implementation**:
- PostgreSQL sequences for auto-increment counters
- Database functions for ID generation
- Year component for campaigns and invoices (yearly reset)
- 4-digit zero-padded sequential numbers
- IDs assigned on record creation via DEFAULT
- Immutable after creation

**Rationale**:
- Human-readable for communication (emails, reports, discussions)
- Year-based for campaigns/invoices aids in organization
- Sequential within year keeps IDs reasonably short
- Immutable provides stable references
- Database-level generation ensures consistency
- Per PRD v1.2 requirement for all entities

**Alternatives Considered**:
- UUIDs only: Not human-friendly
- Simple incrementing numbers: Less context
- Custom format per entity type: Inconsistent
- Client-side generation: Race conditions risk

**Consequences**:
- ✅ Easy to communicate and reference
- ✅ Professional appearance in exports/PDFs
- ✅ Yearly organization for campaigns/invoices
- ✅ Database-enforced uniqueness
- ⚠️ Sequences need maintenance (unlikely to overflow)
- ⚠️ Year reset requires monitoring for campaigns/invoices

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

- File storage structure for content uploads (TASK 4 - Content Workflow)
- Instagram API rate limiting strategy (TASK 6 - KPI Integration)
- PDF generation library selection (TASK 7 - Reporting)
- AI provider selection for narrative generation (TASK 7 - Reporting)
- Campaign lifecycle state machine implementation (PRD Section 4)
- Brief intake AI extraction provider (PRD Section 5)
