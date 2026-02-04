# PRD v1.2 Alignment Action Plan

**Priority**: CRITICAL  
**Created**: 2024-02-03  
**Status**: PENDING APPROVAL

---

## Critical Issue: Role Model Mismatch

### Problem
Current implementation has **4 roles**, but PRD v1.2 requires **6 distinct roles**:

**Current**: director, account_manager, influencer, client  
**Required**: director, campaign_manager, reviewer, finance, client, influencer

This is a **BREAKING CHANGE** that affects:
- Database schema
- TypeScript types
- RBAC logic
- RLS policies
- All UI components
- Existing user data (if any)

---

## Proposed Solution

### Option A: Full Migration to 6-Role Model (RECOMMENDED)

**Pros**:
- ✅ Full PRD compliance
- ✅ Clear separation of responsibilities
- ✅ Future-proof for finance workflows
- ✅ Scalable for team growth

**Cons**:
- ⚠️ Breaking change
- ⚠️ Need to migrate existing users
- ⚠️ More complex RBAC logic

**Migration Strategy**:
1. Add new roles to enum
2. Keep `account_manager` temporarily for backward compatibility
3. Migrate existing `account_manager` users to appropriate new role
4. Remove `account_manager` in next major version

### Option B: Map Existing Roles to PRD (NOT RECOMMENDED)

Keep 4 roles but map them differently - **Not aligned with PRD**

---

## Implementation Plan - Option A

### Phase 1: Database Updates (2-3 hours)

#### 1.1 Update Role Enum
```sql
-- Step 1: Add new roles
ALTER TYPE user_role ADD VALUE 'campaign_manager';
ALTER TYPE user_role ADD VALUE 'reviewer';
ALTER TYPE user_role ADD VALUE 'finance';

-- Note: PostgreSQL doesn't allow removing enum values easily
-- Keep account_manager for now, mark as deprecated
```

#### 1.2 Update RLS Policies
- Review all policies for new roles
- Add finance-specific policies
- Add reviewer-specific policies
- Add campaign_manager-specific policies

### Phase 2: Frontend Updates (2-3 hours)

#### 2.1 TypeScript Types
```typescript
export type UserRole = 
  | 'director'
  | 'campaign_manager'
  | 'reviewer'
  | 'finance'
  | 'client'
  | 'influencer'
  | 'account_manager'; // deprecated
```

#### 2.2 RBAC Utilities
- Update role hierarchy
- Update permission maps
- Update role display names
- Update role badge colors

#### 2.3 UI Components
- Update invitation form (new role options)
- Update dashboard navigation
- Update role gates

### Phase 3: Documentation Updates (1 hour)

- Update all docs to reflect 6-role model
- Add migration guide
- Update API spec
- Update testing guide

### Phase 4: Testing (1-2 hours)

- Test all role combinations
- Test RLS policies
- Test UI gating
- Test invitation flow
- Manual verification

---

## Timeline

### Recommended Approach: Implement Now

**Total Time**: 6-9 hours

**Schedule**:
- Phase 1: Database (2-3 hours)
- Phase 2: Frontend (2-3 hours)
- Phase 3: Docs (1 hour)
- Phase 4: Testing (1-2 hours)

**Completion Target**: Within current sprint

---

## Risk Assessment

### Risks
1. **Data Migration**: Existing `account_manager` users need role reassignment
2. **Breaking Change**: May affect any deployed instances
3. **Testing Coverage**: Need comprehensive testing of all 6 roles

### Mitigation
1. **Migration Script**: Provide SQL script to migrate users
2. **Documentation**: Clear migration guide
3. **Testing**: Comprehensive manual testing before merge
4. **Backward Compatibility**: Keep `account_manager` temporarily

---

## Decision Required

**Question**: Should we implement the 6-role model now to align with PRD?

**Options**:
- [ ] **YES** - Implement 6-role model now (breaking change, PRD compliant)
- [ ] **NO** - Defer to later (technical debt, not PRD compliant)
- [ ] **PARTIAL** - Keep 4 roles, map to PRD responsibilities (not true compliance)

**Recommendation**: **YES** - Implement now before building more features on wrong foundation

---

## After Role Update: Next P0 Tasks

Once roles are fixed, proceed with PRD Section 15 build order:

1. **Human-Readable IDs** (4-6 hours)
   - TKT-YYYY-XXXX for campaigns
   - CLI-XXXX for clients
   - INF-XXXX for influencers
   - INV-YYYY-XXXX for invoices

2. **Content Workflow** (12-16 hours)
   - Upload, version, approve (internal + client)
   - Feedback loops
   - Status tracking

3. **KPI Manual + Instagram** (16-20 hours)
   - Manual entry forms
   - Instagram OAuth
   - Automated snapshots

---

## Approval Checkpoint

**WAITING FOR APPROVAL TO PROCEED WITH ROLE MODEL UPDATE**

Once approved, implementation will begin immediately following the plan above.

---

**Document Status**: Awaiting decision on role model update
