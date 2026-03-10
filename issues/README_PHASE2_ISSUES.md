# Phase 2 Data Model Issues - Creation Guide

This directory contains 9 comprehensive issue templates for Phase 2 data model implementation.

## Issue Files Created

1. **phase_2_2_campaign_entity_model.md** - Campaign as root entity with 23 statuses
2. **phase_2_3_influencer_profile_entity_model.md** - Influencer profiles (STUB/FULL)
3. **phase_2_4_contenttask_contentartifact_models.md** - Content delivery with versioning
4. **phase_2_5_approvalitem_entity_model.md** - Approval governance backbone
5. **phase_2_6_financialobject_entity_model.md** - Campaign financial spine
6. **phase_2_7_user_role_entity_models.md** - User authentication and RBAC
7. **phase_2_8_complete_database_migration_seed_data.md** - Consolidated migration & seeds
8. **phase_2_9_risk_engine_data_structure_preparation.md** - Risk calculation structures
9. **phase_2_10_complete_schema_validation_prd_compliance_check.md** - Schema validation suite

## How to Create GitHub Issues

Since GitHub issues cannot be created programmatically via the current setup, follow these steps:

### Option 1: Manual Creation
1. Go to https://github.com/cabdelkhalegh/TIKIT-SYSTEM-/issues/new
2. Copy content from each `.md` file
3. Extract the title from the first heading
4. Extract labels from the "Labels:" line
5. Create the issue and assign to @Copilot

### Option 2: GitHub CLI (if available)
```bash
# Example for Phase 2.2
gh issue create \
  --title "Phase 2.2: Campaign Entity Model (PRD Section 4.1)" \
  --body-file issues/phase_2_2_campaign_entity_model.md \
  --label "phase2,entity,campaign,prisma,backend,core" \
  --assignee Copilot

# Repeat for all 9 issues
```

### Option 3: Bulk Import Script
Use the provided script to create all issues at once:

```bash
# Run from repository root
cd /home/runner/work/TIKIT-SYSTEM-/TIKIT-SYSTEM-
node scripts/create-phase2-issues.js
```

(Note: Script needs to be created if bulk import is desired)

## Issue Dependencies

```
Phase 2.2 (Campaign) ← depends on: #17, #23
Phase 2.3 (Influencer) ← depends on: #17
Phase 2.4 (Content) ← depends on: Phase 2.2, Phase 2.3
Phase 2.5 (Approval) ← depends on: Phase 2.2, Phase 2.4
Phase 2.6 (Financial) ← depends on: Phase 2.2, Phase 2.3
Phase 2.7 (User/Role) ← depends on: #17
Phase 2.8 (Migration) ← depends on: Phase 2.1-2.7
Phase 2.9 (Risk) ← depends on: Phase 2.2
Phase 2.10 (Validation) ← depends on: Phase 2.1-2.9
```

## Implementation Order

Recommended sequential order:
1. Phase 2.2 & 2.3 & 2.7 (can be parallel - no interdependencies)
2. Phase 2.4 (needs Campaign & Influencer)
3. Phase 2.5 & 2.6 (can be parallel - both need Campaign)
4. Phase 2.9 (needs Campaign)
5. Phase 2.8 (needs all entity models)
6. Phase 2.10 (final validation)

## Labels Used

- `phase2` - All Phase 2 issues
- `entity` - Data model entities
- `prisma` - Prisma ORM related
- `backend` - Backend implementation
- `core` - Core system entities
- `campaign`, `influencer`, `content`, `approval`, `financial`, `user`, `role`, `auth` - Specific domains
- `migration`, `seed`, `testing`, `quality` - Supporting tasks
- `risk`, `preparation` - Risk engine
- `validation` - Validation tasks
- `versioning`, `governance` - Special features

## Success Metrics

- ✅ All 9 issues created in GitHub
- ✅ Each issue assigned to @Copilot
- ✅ Dependencies clearly mapped
- ✅ Labels applied correctly
- ✅ Complete Prisma schemas included
- ✅ Implementation steps documented
- ✅ Issues ready for agent execution

## Notes

- All issues follow the format established in #23 (Client Entity)
- Each issue includes complete Prisma schema code
- TypeScript types included where applicable
- Seed scripts provided for testing
- All issues are agent-ready with detailed context
