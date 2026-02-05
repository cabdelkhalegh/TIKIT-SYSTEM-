# TiKiT OS Phase 2 Data Model - Visual Dependency Map

## Issue Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FOUNDATION (Phase 1)                         │
├─────────────────────────────────────────────────────────────────────┤
│  #17: Prisma Initialization                                         │
│  #23: Client Entity (Phase 2.1) ──────────────┐                    │
└─────────────────────────────────────────────────────────────────────┘
                                                 │
┌────────────────────────────────────────────────┼────────────────────┐
│                   CORE ENTITIES (Phase 2.2-2.3-2.7)                 │
├────────────────────────────────────────────────┼────────────────────┤
│                                                ↓                     │
│  Phase 2.2: Campaign Entity ←──────────── Client Entity             │
│      ├─ 23 Campaign Statuses                                        │
│      ├─ Risk Level Tracking                                         │
│      └─ Policy Configuration                                        │
│                                                                      │
│  Phase 2.3: Influencer Profile                                      │
│      ├─ STUB Profiles (quick shortlist)                             │
│      ├─ FULL Profiles (complete data)                               │
│      └─ Pricing History                                             │
│                                                                      │
│  Phase 2.7: User & Role Models                                      │
│      ├─ 6 TiKiT Roles (CM/DIR/FIN/ADM/CLIENT/INF)                   │
│      ├─ RBAC with Permissions                                       │
│      └─ MFA Support                                                 │
└─────────────────────────────────────────────────────────────────────┘
                    │                          │
                    ├──────────────────────────┤
                    ↓                          ↓
┌─────────────────────────────────────────────────────────────────────┐
│              CONTENT & WORKFLOW (Phase 2.4-2.5-2.6)                 │
├─────────────────────────────────────────────────────────────────────┤
│  Phase 2.4: ContentTask & ContentArtifact                           │
│      ├─ Append-Only Versioning                                      │
│      ├─ Immutable Artifacts                                         │
│      └─ Version Constraint: [taskId, type, version]                 │
│                          │                                           │
│                          ↓                                           │
│  Phase 2.5: ApprovalItem ←──────────┐                              │
│      ├─ 7 Approval Types             │                              │
│      ├─ Version-Aware References     │                              │
│      └─ Expiration Support           │                              │
│                                      │                              │
│  Phase 2.6: FinancialObject          │                              │
│      ├─ Campaign-Centric (Required!) │                              │
│      ├─ Revision Tracking            │                              │
│      └─ 8 Financial Types            │                              │
└──────────────────────────────────────┼──────────────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ↓                                     ↓
┌────────────────────────────────────┐  ┌─────────────────────────────┐
│   RISK ENGINE (Phase 2.9)          │  │ CONSOLIDATION (Phase 2.8)   │
├────────────────────────────────────┤  ├─────────────────────────────┤
│  Risk Event Log                    │  │  Complete Migration         │
│  ├─ 12 Event Categories            │  │  ├─ All Entities            │
│  ├─ Severity Multipliers           │  │  ├─ Comprehensive Seeds     │
│  └─ Auto-Resolution                │  │  └─ Verification Queries    │
└────────────────────────────────────┘  └─────────────────────────────┘
                    │                                     │
                    └──────────────┬──────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    VALIDATION (Phase 2.10)                          │
├─────────────────────────────────────────────────────────────────────┤
│  Schema Validation & PRD Compliance                                 │
│  ├─ 20+ Unit Tests                                                  │
│  ├─ PRD Section 4 Compliance                                        │
│  ├─ System Invariants Tests                                         │
│  └─ CI/CD Integration                                               │
└─────────────────────────────────────────────────────────────────────┘
```

## Implementation Timeline

```
Week 1-2: PARALLEL IMPLEMENTATION
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Phase 2.2    │  │ Phase 2.3    │  │ Phase 2.7    │
│ Campaign     │  │ Influencer   │  │ User/Role    │
└──────┬───────┘  └──────┬───────┘  └──────────────┘
       │                 │
       └────────┬────────┘
                │
Week 3: CONTENT LAYER
                ↓
        ┌──────────────┐
        │ Phase 2.4    │
        │ Content      │
        └──────┬───────┘
               │
Week 4: PARALLEL WORKFLOW
               ├─────────────────┬─────────────────┐
               ↓                 ↓                 ↓
       ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
       │ Phase 2.5    │  │ Phase 2.6    │  │ Phase 2.9    │
       │ Approval     │  │ Financial    │  │ Risk Engine  │
       └──────────────┘  └──────────────┘  └──────────────┘
               │                 │                 │
               └────────┬────────┴─────────────────┘
                        │
Week 5: CONSOLIDATION & VALIDATION
                        ↓
               ┌──────────────────┐
               │ Phase 2.8        │
               │ Migration/Seeds  │
               └────────┬─────────┘
                        │
                        ↓
               ┌──────────────────┐
               │ Phase 2.10       │
               │ Validation       │
               └──────────────────┘
```

## Entity Relationship Overview

```
                           ┌──────────────┐
                           │   Client     │
                           └──────┬───────┘
                                  │
                                  │ 1:N
                                  ↓
                           ┌──────────────┐
                      ┌────┤   Campaign   ├────┐
                      │    └──────┬───────┘    │
                      │           │            │
                 1:N  │      1:N  │            │ 1:N
                      │           │            │
                      ↓           ↓            ↓
              ┌──────────┐ ┌──────────┐ ┌──────────────┐
              │Financial │ │Approval  │ │ContentTask   │
              │Object    │ │Item      │ │              │
              └──────────┘ └────┬─────┘ └──────┬───────┘
                                │              │
                                │              │ 1:N
                                │              ↓
                                │        ┌──────────────┐
                                │        │ContentArtifact│
                                │        └──────┬───────┘
                                │               │
                                └───────────────┤
                                                │
                                           (references)
                                                
┌──────────────┐          ┌─────────────────────┐
│  Influencer  │◄─────────┤InfluencerAssignment │
└──────┬───────┘   N:M    └──────────┬──────────┘
       │                              │
       │                              │
       │                      ┌───────┴───────┐
       │                      │   Campaign    │
       │                      └───────────────┘
       │
       │ 1:N
       ↓
┌──────────────┐
│ContentTask   │
└──────────────┘

┌──────────────┐          ┌─────────────────────┐
│  TiKiTUser   │◄─────────┤UserRoleBinding      │
└──────────────┘   N:M    └──────────┬──────────┘
                                     │
                                     │
                              ┌──────┴───────┐
                              │  TiKiTRole   │
                              └──────────────┘
```

## Key Technical Highlights

### 🎯 Campaign (Root Entity)
- **Central Hub**: All major entities reference Campaign
- **23 Statuses**: Complete state machine from PRD
- **Risk Tracking**: Real-time risk level calculation
- **Policy Config**: Controls approval workflows

### 👤 Influencer (Flexible Profiles)
- **STUB**: Minimal data for quick evaluation
- **FULL**: Complete demographic and performance data
- **Pricing History**: Per-campaign pricing tracking
- **Unique Handles**: Prevent duplicate influencers

### 📹 Content (Immutable Versioning)
- **Append-Only**: Never modify, always create new version
- **Version Constraint**: Unique [task, type, version]
- **Superseding Chain**: Track artifact evolution
- **Type Safety**: Enum-based artifact types

### ✅ Approval (Governance)
- **Version-Aware**: References specific artifact versions
- **7 Types**: From brief to final acceptance
- **Expiration**: Time-bound approval requests
- **Escalation**: Automatic escalation support

### 💰 Financial (Campaign-Centric)
- **Required Campaign**: All financial objects tied to campaigns
- **Revision Tracking**: Complete budget change history
- **8 Types**: Budget to payments
- **Approval Workflow**: Multi-level approvals

### 🔐 User/Role (RBAC)
- **6 Roles**: CM, DIR, FIN, ADM, CLIENT, INF
- **Permission Flags**: Explicit boolean permissions
- **Scoped Roles**: Global or entity-specific
- **MFA Ready**: TOTP support built-in

### 📊 Risk Engine (Event-Driven)
- **12 Categories**: Comprehensive risk tracking
- **Severity Multipliers**: 5 levels of severity
- **Auto-Resolution**: Time-based resolution
- **Real-Time Scoring**: Dynamic risk calculation

## File Size Breakdown

```
Issue File                                    Lines    Bytes
──────────────────────────────────────────────────────────────
phase_2_2_campaign_entity_model.md             200    7,117
phase_2_3_influencer_profile_entity_model.md   300    9,898
phase_2_4_contenttask_contentartifact_models   250    8,661
phase_2_5_approvalitem_entity_model.md         220    7,669
phase_2_6_financialobject_entity_model.md      240    8,528
phase_2_7_user_role_entity_models.md           380   13,151
phase_2_8_complete_database_migration.md       350   12,010
phase_2_9_risk_engine_data_structure.md        340   11,647
phase_2_10_complete_schema_validation.md       550   18,942
──────────────────────────────────────────────────────────────
TOTAL (9 issues)                             2,830   97,623

Supporting Files:
PHASE2_COMPLETE_SUMMARY.md                     320    9,771
README_PHASE2_ISSUES.md                        100    3,711
create-phase2-issues.sh                         90    3,030
──────────────────────────────────────────────────────────────
GRAND TOTAL                                  3,340  114,135
```

## Quick Start Commands

### Create All Issues
```bash
# Automated (recommended)
./scripts/create-phase2-issues.sh

# Manual with GitHub CLI
cd issues
for file in phase_2_*.md; do
  title=$(grep -m 1 "^# " "$file" | sed 's/^# //')
  labels=$(grep "^**Labels:**" "$file" | sed 's/.*Labels:\*\* //' | sed 's/`//g')
  gh issue create --title "$title" --body-file "$file" --label "$labels" --assignee Copilot
done
```

### Verify Schema After Implementation
```bash
cd backend
npx prisma validate
npx prisma format
npm test -- schema-validation.spec.ts
npx ts-node scripts/validate-schema.ts
```

### Apply Migrations
```bash
cd backend
npx prisma migrate dev --name tikit-phase2-complete
npx ts-node prisma/seeds/comprehensive.seed.ts
npx prisma studio
```

## Success Metrics

- ✅ **9 Issues Created**: All Phase 2 data model issues
- ✅ **10+ Prisma Models**: Complete canonical data model
- ✅ **3,300+ Lines**: Comprehensive documentation
- ✅ **100% PRD Coverage**: All Section 4 requirements
- ✅ **Agent-Ready**: Complete implementation instructions
- ✅ **Test Suite**: 20+ validation tests
- ✅ **Seed Scripts**: Realistic test data
- ✅ **CI/CD Ready**: Automated validation

## Contact & Support

- **Repository**: https://github.com/cabdelkhalegh/TIKIT-SYSTEM-
- **Issue Template**: See issue #23 for format reference
- **PRD Reference**: Section 4 (Canonical Data Model)

---

**Last Updated**: 2026-02-05  
**Status**: ✅ Complete and Ready  
**Next Action**: Create GitHub issues
