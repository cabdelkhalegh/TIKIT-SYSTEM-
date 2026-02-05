# Phase 2.8: Complete Database Migration & Seed Data

**Labels:** `phase2`, `migration`, `seed`, `testing`, `prisma`, `backend`
**Assignees:** @Copilot
**Issue Number:** (To be assigned)

## 🎯 Context for AI Agent

**PRD Reference:** All of Section 4 (Canonical Data Model)

**Depends On:** 
- Phase 2.1 - Client Entity (#23)
- Phase 2.2 - Campaign Entity
- Phase 2.3 - Influencer Profile Entity
- Phase 2.4 - ContentTask & ContentArtifact Models
- Phase 2.5 - ApprovalItem Entity
- Phase 2.6 - FinancialObject Entity
- Phase 2.7 - User & Role Entity Models

**Blocks:** 
- Phase 3 (Business Logic)
- All testing and development work

**Files to Create/Modify:**
- `prisma/schema.prisma` - Verify complete schema
- `prisma/seeds/comprehensive.seed.ts` - Main seed script
- `prisma/migrations/` - Consolidated migration
- `README_DATABASE.md` - Database documentation

## ✅ Acceptance Criteria

- [ ] Single consolidated migration with all Phase 2 entities
- [ ] Comprehensive seed script at `prisma/seeds/comprehensive.seed.ts`
- [ ] Seed data includes:
  - All 6 default TiKiT roles (CM, DIR, FIN, ADM, CLIENT, INF)
  - 2-3 test users with role assignments
  - 1-2 test clients with complete profiles
  - 1 test campaign per client with varied statuses
  - 2-3 test influencers (1 STUB, 2 FULL profiles)
  - Sample content tasks and artifacts with versioning
  - Sample approval items showing workflow
  - Sample financial objects (budget, costs, invoices)
- [ ] Migration applies cleanly on fresh database
- [ ] Seed script is idempotent (can run multiple times)
- [ ] All foreign key constraints validated
- [ ] Database documentation created
- [ ] Verification queries documented

## 📝 Comprehensive Seed Script Structure

```typescript
// prisma/seeds/comprehensive.seed.ts

import { PrismaClient, TiKiTRoleType, CampaignStatus, ProfileCompleteness, ArtifactType } from '@prisma/client';

const tikitPrisma = new PrismaClient();

async function seedComprehensiveTiKiTData() {
  console.log('🌱 Starting TiKiT OS comprehensive seed...');

  // Step 1: Seed Roles
  console.log('📋 Seeding TiKiT roles...');
  const rolesCM = await tikitPrisma.tiKiTRole.upsert({
    where: { roleTypeCode: TiKiTRoleType.CM },
    update: {},
    create: {
      roleTypeCode: TiKiTRoleType.CM,
      roleDisplayName: 'Campaign Manager',
      roleDescription: 'Campaign execution specialist',
      canCreateCampaigns: true,
      canEditCampaigns: true,
      canViewAllCampaigns: true,
      canManageInfluencers: true,
      canContactInfluencers: true,
    },
  });

  const rolesDIR = await tikitPrisma.tiKiTRole.upsert({
    where: { roleTypeCode: TiKiTRoleType.DIR },
    update: {},
    create: {
      roleTypeCode: TiKiTRoleType.DIR,
      roleDisplayName: 'Director',
      roleDescription: 'Strategic oversight and approvals',
      canViewAllCampaigns: true,
      canApproveBriefs: true,
      canApproveScripts: true,
      canApproveContent: true,
      canApproveBudgets: true,
    },
  });

  // Step 2: Seed Users
  console.log('👤 Seeding test users...');
  const userAlice = await tikitPrisma.tiKiTUser.upsert({
    where: { emailAddress: 'alice.manager@tikit.example' },
    update: {},
    create: {
      emailAddress: 'alice.manager@tikit.example',
      passwordHashBcrypt: '$2b$10$examplehashfordemopurposes',
      displayFullName: 'Alice Campaign Manager',
      accountStatusCode: 'ACTIVE',
      emailVerifiedFlag: true,
      roleBindings: {
        create: {
          tikitRoleId: rolesCM.tikitRoleId,
          scopeType: 'GLOBAL',
        },
      },
    },
  });

  const userBob = await tikitPrisma.tiKiTUser.upsert({
    where: { emailAddress: 'bob.director@tikit.example' },
    update: {},
    create: {
      emailAddress: 'bob.director@tikit.example',
      passwordHashBcrypt: '$2b$10$examplehashfordemopurposes',
      displayFullName: 'Bob Director',
      accountStatusCode: 'ACTIVE',
      emailVerifiedFlag: true,
      roleBindings: {
        create: {
          tikitRoleId: rolesDIR.tikitRoleId,
          scopeType: 'GLOBAL',
        },
      },
    },
  });

  // Step 3: Seed Clients
  console.log('🏢 Seeding test clients...');
  const clientAcmeBrand = await tikitPrisma.client.upsert({
    where: { id: 'seed-client-acme' },
    update: {},
    create: {
      id: 'seed-client-acme',
      companyLegalName: 'Acme Brand Corporation',
      brandName: 'Acme',
      industry: 'Consumer Goods',
      primaryContacts: ['sarah@acmebrand.example'],
      billingContacts: ['finance@acmebrand.example'],
    },
  });

  // Step 4: Seed Campaign
  console.log('📢 Seeding test campaigns...');
  const campaignSummerLaunch = await tikitPrisma.campaign.create({
    data: {
      id: 'seed-campaign-summer',
      campaignName: 'Summer Product Launch 2026',
      campaignObjective: 'Generate 1M impressions for new product line',
      targetAudience: 'Gen Z, ages 18-25, fashion-forward',
      clientId: clientAcmeBrand.id,
      status: CampaignStatus.INFLUENCER_SOURCING,
      riskLevel: 'LOW',
      missingInfoList: [],
      totalBudget: 50000,
      spentBudget: 0,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-08-31'),
      createdByUserId: userAlice.tikitUserId,
    },
  });

  // Step 5: Seed Influencers
  console.log('⭐ Seeding test influencers...');
  const influencerStub = await tikitPrisma.influencer.create({
    data: {
      id: 'seed-inf-stub-emma',
      profileCompleteness: ProfileCompleteness.STUB,
      fullName: 'Emma Fashion Stub',
      instagramHandle: '@emmafashionstub',
      instagramFollowers: 150000,
    },
  });

  const influencerFullMike = await tikitPrisma.influencer.create({
    data: {
      id: 'seed-inf-full-mike',
      profileCompleteness: ProfileCompleteness.FULL,
      fullName: 'Mike Lifestyle Creator',
      emailAddress: 'mike@creator.example',
      instagramHandle: '@mikelifestyle',
      instagramFollowers: 500000,
      tiktokHandle: '@mikelifestyle',
      tiktokFollowers: 750000,
      bio: 'Lifestyle creator focused on fashion and travel',
      categories: ['Fashion', 'Lifestyle', 'Travel'],
      avgEngagementRate: 4.2,
      audienceDemographics: {
        age: { '18-24': 35, '25-34': 45, '35-44': 15 },
        gender: { F: 65, M: 35 },
      },
    },
  });

  // Step 6: Seed Influencer Assignment
  console.log('🤝 Seeding influencer assignments...');
  const assignmentMike = await tikitPrisma.influencerAssignment.create({
    data: {
      influencerId: influencerFullMike.id,
      campaignId: campaignSummerLaunch.id,
      role: 'Lead Creator',
      status: 'CONTRACTED',
      contractSigned: true,
      expectedDeliverables: 3,
    },
  });

  // Step 7: Seed Content Task
  console.log('📹 Seeding content tasks...');
  const contentTaskReel1 = await tikitPrisma.contentTask.create({
    data: {
      id: 'seed-task-reel1',
      campaignId: campaignSummerLaunch.id,
      influencerId: influencerFullMike.id,
      taskName: 'Instagram Reel - Product Unboxing',
      platform: 'INSTAGRAM_REEL',
      deliverableType: 'Reel',
      status: 'SCRIPT_APPROVED',
      scriptDueDate: new Date('2026-06-15'),
      contentDueDate: new Date('2026-06-25'),
    },
  });

  // Step 8: Seed Content Artifacts with Versioning
  console.log('🎨 Seeding content artifacts...');
  const artifactScriptV1 = await tikitPrisma.contentArtifact.create({
    data: {
      contentTaskId: contentTaskReel1.id,
      artifactType: ArtifactType.SCRIPT,
      version: 1,
      fileUrl: 'https://storage.tikit.example/scripts/reel1-v1.pdf',
      submittedBy: influencerFullMike.id,
      reviewStatus: 'SUPERSEDED',
      isSuperseded: true,
    },
  });

  const artifactScriptV2 = await tikitPrisma.contentArtifact.create({
    data: {
      contentTaskId: contentTaskReel1.id,
      artifactType: ArtifactType.SCRIPT,
      version: 2,
      fileUrl: 'https://storage.tikit.example/scripts/reel1-v2.pdf',
      submittedBy: influencerFullMike.id,
      reviewStatus: 'APPROVED',
    },
  });

  // Set supersededBy on v1
  await tikitPrisma.contentArtifact.update({
    where: { id: artifactScriptV1.id },
    data: { supersededBy: artifactScriptV2.id },
  });

  // Step 9: Seed Approval Items
  console.log('✅ Seeding approval items...');
  await tikitPrisma.approvalItem.create({
    data: {
      campaignId: campaignSummerLaunch.id,
      contentTaskId: contentTaskReel1.id,
      contentArtifactId: artifactScriptV2.id,
      approvalType: 'SCRIPT',
      status: 'APPROVED',
      subject: 'Script Approval - Reel #1',
      requestedBy: userAlice.tikitUserId,
      respondedBy: userBob.tikitUserId,
      respondedAt: new Date(),
    },
  });

  // Step 10: Seed Financial Objects
  console.log('💰 Seeding financial objects...');
  await tikitPrisma.financialObject.create({
    data: {
      campaignId: campaignSummerLaunch.id,
      objectType: 'BUDGET',
      status: 'APPROVED',
      amount: 50000,
      currency: 'USD',
      totalAmount: 50000,
      description: 'Initial campaign budget allocation',
      transactionDate: new Date('2026-05-01'),
      createdByUserId: userAlice.tikitUserId,
    },
  });

  await tikitPrisma.financialObject.create({
    data: {
      campaignId: campaignSummerLaunch.id,
      influencerId: influencerFullMike.id,
      objectType: 'INFLUENCER_COST',
      status: 'COMMITTED',
      amount: 5000,
      currency: 'USD',
      totalAmount: 5000,
      description: 'Mike - 3 Instagram Reels',
      category: 'Influencer Fee',
      transactionDate: new Date('2026-05-15'),
    },
  });

  console.log('✅ Comprehensive TiKiT seed completed successfully!');
}

seedComprehensiveTiKiTData()
  .catch((err) => {
    console.error('❌ Seed error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await tikitPrisma.$disconnect();
  });
```

## 🔧 Implementation Steps

1. **Verify complete schema**
   ```bash
   cd backend
   npx prisma validate
   npx prisma format
   ```

2. **Create consolidated migration**
   ```bash
   npx prisma migrate dev --name tikit-phase2-complete-schema
   ```

3. **Create comprehensive seed script**
   - Create file `prisma/seeds/comprehensive.seed.ts` with content above
   - Ensure all relationships are properly seeded
   - Add idempotency checks (upsert where possible)

4. **Run seed script**
   ```bash
   npx ts-node prisma/seeds/comprehensive.seed.ts
   ```

5. **Create verification queries**
   - Document queries in `README_DATABASE.md`:
   ```sql
   -- Verify all entities seeded
   SELECT 'Roles' as entity, COUNT(*) as count FROM tikit_roles
   UNION ALL
   SELECT 'Users', COUNT(*) FROM tikit_users
   UNION ALL
   SELECT 'Clients', COUNT(*) FROM clients
   UNION ALL
   SELECT 'Campaigns', COUNT(*) FROM campaigns
   UNION ALL
   SELECT 'Influencers', COUNT(*) FROM influencers
   UNION ALL
   SELECT 'Content Tasks', COUNT(*) FROM content_tasks
   UNION ALL
   SELECT 'Artifacts', COUNT(*) FROM content_artifacts
   UNION ALL
   SELECT 'Approvals', COUNT(*) FROM approval_items
   UNION ALL
   SELECT 'Financial Objects', COUNT(*) FROM financial_objects;
   ```

6. **Test fresh database setup**
   ```bash
   # Reset and reapply
   npx prisma migrate reset --force
   npx ts-node prisma/seeds/comprehensive.seed.ts
   ```

7. **Verify in Prisma Studio**
   ```bash
   npx prisma studio
   ```

## Dependencies

**Blocked By:**
- Phase 2.1 through 2.7 (all entity models)

**Blocks:**
- Phase 3 - Business Logic Implementation
- All development and testing

## Notes for AI Agent

- **Idempotency:** Use upsert with unique identifiers to allow re-running seed
- **Realistic Data:** Create interconnected data that represents real usage
- **Version Examples:** Show artifact versioning in action
- **Status Variety:** Use different statuses to test workflows
- **Foreign Keys:** Verify all relationships work correctly
- **Test Coverage:** Seed data should cover common scenarios
- **Documentation:** Document seed data structure for other developers
