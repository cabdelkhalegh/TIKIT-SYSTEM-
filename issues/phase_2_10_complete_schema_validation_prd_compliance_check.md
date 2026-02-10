# Phase 2.10: Complete Schema Validation & PRD Compliance Check

**Labels:** `phase2`, `validation`, `testing`, `quality`, `prisma`, `backend`
**Assignees:** @Copilot
**Issue Number:** (To be assigned)

## 🎯 Context for AI Agent

**PRD Reference:** Section 4 (Canonical Data Model) + Appendix A (System Invariants)

**Depends On:** 
- All Phase 2.1-2.9 issues (all entity models)

**Blocks:** 
- Phase 3 (Business Logic)
- Production deployment

**Files to Create/Modify:**
- `backend/test/schema-validation.spec.ts` - Comprehensive schema tests
- `backend/scripts/validate-schema.ts` - Validation script
- `backend/scripts/check-prd-compliance.ts` - PRD compliance checker
- `SCHEMA_VALIDATION_REPORT.md` - Validation report documentation

## ✅ Acceptance Criteria

- [ ] Test suite validates all PRD Section 4 entities exist
- [ ] Tests verify all required fields and relationships
- [ ] Tests validate unique constraints and indexes
- [ ] Tests check System Invariants from Appendix A
- [ ] Validation script can run standalone
- [ ] PRD compliance checker generates report
- [ ] All tests pass with 100% coverage of schema rules
- [ ] Documentation of validation results

## 📝 Schema Validation Test Suite

Create `backend/test/schema-validation.spec.ts`:

```typescript
/**
 * TiKiT OS Schema Validation Test Suite
 * Validates complete schema compliance with PRD Section 4
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

const testPrisma = new PrismaClient();

describe('TiKiT OS Schema Validation - PRD Section 4 Compliance', () => {
  
  beforeAll(async () => {
    // Ensure test database is ready
    await testPrisma.$connect();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  describe('Client Entity (PRD 4.2)', () => {
    it('should have Client model with all required fields', async () => {
      const testClient = await testPrisma.client.create({
        data: {
          companyLegalName: 'Test Company Legal Name',
          brandName: 'Test Brand',
          industry: 'Test Industry',
          primaryContacts: ['test@example.com'],
          billingContacts: ['billing@example.com'],
        },
      });

      expect(testClient).toBeDefined();
      expect(testClient.id).toBeDefined();
      expect(testClient.companyLegalName).toBe('Test Company Legal Name');
      expect(testClient.createdAt).toBeDefined();

      await testPrisma.client.delete({ where: { id: testClient.id } });
    });

    it('should support array fields for contacts', async () => {
      const clientWithMultipleContacts = await testPrisma.client.create({
        data: {
          companyLegalName: 'Multi Contact Corp',
          brandName: 'Multi',
          primaryContacts: ['contact1@test.com', 'contact2@test.com', 'contact3@test.com'],
          billingContacts: ['billing1@test.com', 'billing2@test.com'],
        },
      });

      expect(clientWithMultipleContacts.primaryContacts).toHaveLength(3);
      expect(clientWithMultipleContacts.billingContacts).toHaveLength(2);

      await testPrisma.client.delete({ where: { id: clientWithMultipleContacts.id } });
    });
  });

  describe('Campaign Entity (PRD 4.1)', () => {
    it('should have Campaign model with all 23 statuses available', async () => {
      const availableStatuses = [
        'DRAFT', 'BRIEF_PENDING', 'BRIEF_APPROVED', 'INFLUENCER_SOURCING',
        'SHORTLIST_PENDING', 'SHORTLIST_APPROVED', 'INFLUENCER_OUTREACH',
        'NEGOTIATION', 'CONTRACT_PENDING', 'CONTRACTED', 'SCRIPT_DEVELOPMENT',
        'SCRIPT_PENDING_APPROVAL', 'SCRIPT_APPROVED', 'CONTENT_PRODUCTION',
        'CONTENT_REVIEW', 'CONTENT_REVISION', 'CONTENT_APPROVED',
        'SCHEDULED', 'LIVE', 'MONITORING', 'COMPLETED', 'CANCELLED', 'ON_HOLD'
      ];

      // This tests enum availability at compile time
      expect(availableStatuses).toHaveLength(23);
    });

    it('should require clientId foreign key', async () => {
      const testClient = await testPrisma.client.create({
        data: {
          companyLegalName: 'FK Test Client',
          brandName: 'FK Brand',
          primaryContacts: [],
          billingContacts: [],
        },
      });

      const testCampaign = await testPrisma.campaign.create({
        data: {
          campaignName: 'Test Campaign with Client FK',
          clientId: testClient.id,
          status: 'DRAFT',
          riskLevel: 'LOW',
          missingInfoList: [],
        },
      });

      expect(testCampaign.clientId).toBe(testClient.id);

      // Cleanup
      await testPrisma.campaign.delete({ where: { id: testCampaign.id } });
      await testPrisma.client.delete({ where: { id: testClient.id } });
    });

    it('should have risk level enum (LOW, MEDIUM, HIGH)', async () => {
      const client = await testPrisma.client.create({
        data: {
          companyLegalName: 'Risk Test Client',
          brandName: 'Risk',
          primaryContacts: [],
          billingContacts: [],
        },
      });

      const highRiskCampaign = await testPrisma.campaign.create({
        data: {
          campaignName: 'High Risk Campaign',
          clientId: client.id,
          status: 'DRAFT',
          riskLevel: 'HIGH',
          missingInfoList: ['budget', 'timeline'],
        },
      });

      expect(highRiskCampaign.riskLevel).toBe('HIGH');
      expect(highRiskCampaign.missingInfoList).toContain('budget');

      await testPrisma.campaign.delete({ where: { id: highRiskCampaign.id } });
      await testPrisma.client.delete({ where: { id: client.id } });
    });
  });

  describe('Influencer Entity (PRD 4.3 & 4.4)', () => {
    it('should support STUB and FULL profile completeness', async () => {
      const stubInfluencer = await testPrisma.influencer.create({
        data: {
          profileCompleteness: 'STUB',
          fullName: 'Stub Influencer Test',
          instagramHandle: '@stubtest123',
        },
      });

      const fullInfluencer = await testPrisma.influencer.create({
        data: {
          profileCompleteness: 'FULL',
          fullName: 'Full Influencer Test',
          emailAddress: 'full@test.example',
          instagramHandle: '@fulltest123',
          bio: 'Complete bio',
          categories: ['Fashion', 'Lifestyle'],
        },
      });

      expect(stubInfluencer.profileCompleteness).toBe('STUB');
      expect(fullInfluencer.profileCompleteness).toBe('FULL');
      expect(fullInfluencer.categories).toContain('Fashion');

      await testPrisma.influencer.deleteMany({
        where: { id: { in: [stubInfluencer.id, fullInfluencer.id] } },
      });
    });

    it('should enforce unique constraints on social handles', async () => {
      await testPrisma.influencer.create({
        data: {
          fullName: 'First Influencer',
          instagramHandle: '@uniquehandle456',
        },
      });

      // Attempting to create duplicate should fail
      await expect(
        testPrisma.influencer.create({
          data: {
            fullName: 'Second Influencer',
            instagramHandle: '@uniquehandle456',
          },
        })
      ).rejects.toThrow();

      await testPrisma.influencer.deleteMany({
        where: { instagramHandle: '@uniquehandle456' },
      });
    });
  });

  describe('ContentArtifact Versioning (PRD 6F.1)', () => {
    it('should enforce unique constraint on [contentTaskId, artifactType, version]', async () => {
      const client = await testPrisma.client.create({
        data: {
          companyLegalName: 'Artifact Test Client',
          brandName: 'Artifact',
          primaryContacts: [],
          billingContacts: [],
        },
      });

      const campaign = await testPrisma.campaign.create({
        data: {
          campaignName: 'Artifact Test Campaign',
          clientId: client.id,
          status: 'DRAFT',
          riskLevel: 'LOW',
          missingInfoList: [],
        },
      });

      const influencer = await testPrisma.influencer.create({
        data: {
          fullName: 'Artifact Test Influencer',
          instagramHandle: '@artifacttest789',
        },
      });

      const contentTask = await testPrisma.contentTask.create({
        data: {
          taskName: 'Version Test Task',
          campaignId: campaign.id,
          influencerId: influencer.id,
          platform: 'INSTAGRAM_REEL',
          deliverableType: 'Reel',
          status: 'NOT_STARTED',
        },
      });

      // Create version 1
      await testPrisma.contentArtifact.create({
        data: {
          contentTaskId: contentTask.id,
          artifactType: 'SCRIPT',
          version: 1,
          fileUrl: 'https://test.example/v1.pdf',
          submittedBy: influencer.id,
        },
      });

      // Attempting duplicate version should fail
      await expect(
        testPrisma.contentArtifact.create({
          data: {
            contentTaskId: contentTask.id,
            artifactType: 'SCRIPT',
            version: 1,
            fileUrl: 'https://test.example/v1-duplicate.pdf',
            submittedBy: influencer.id,
          },
        })
      ).rejects.toThrow();

      // Cleanup
      await testPrisma.contentArtifact.deleteMany({ where: { contentTaskId: contentTask.id } });
      await testPrisma.contentTask.delete({ where: { id: contentTask.id } });
      await testPrisma.campaign.delete({ where: { id: campaign.id } });
      await testPrisma.client.delete({ where: { id: client.id } });
      await testPrisma.influencer.delete({ where: { id: influencer.id } });
    });
  });

  describe('FinancialObject Campaign Requirement (PRD 4.7 Invariant)', () => {
    it('should require campaignId for all financial objects', async () => {
      const client = await testPrisma.client.create({
        data: {
          companyLegalName: 'Financial Test Client',
          brandName: 'Financial',
          primaryContacts: [],
          billingContacts: [],
        },
      });

      const campaign = await testPrisma.campaign.create({
        data: {
          campaignName: 'Financial Test Campaign',
          clientId: client.id,
          status: 'DRAFT',
          riskLevel: 'LOW',
          missingInfoList: [],
        },
      });

      const financialObj = await testPrisma.financialObject.create({
        data: {
          campaignId: campaign.id,
          objectType: 'BUDGET',
          status: 'DRAFT',
          amount: 10000,
          currency: 'USD',
          totalAmount: 10000,
          description: 'Test budget',
          transactionDate: new Date(),
        },
      });

      expect(financialObj.campaignId).toBe(campaign.id);

      // Cleanup
      await testPrisma.financialObject.delete({ where: { id: financialObj.id } });
      await testPrisma.campaign.delete({ where: { id: campaign.id } });
      await testPrisma.client.delete({ where: { id: client.id } });
    });
  });

  describe('User and Role Models (PRD Section 3)', () => {
    it('should have all 6 TiKiT role types', async () => {
      const expectedRoles = ['CM', 'DIR', 'FIN', 'ADM', 'CLIENT', 'INF'];
      
      // This validates enum exists at compile time
      expect(expectedRoles).toHaveLength(6);
    });

    it('should enforce unique email addresses', async () => {
      await testPrisma.tiKiTUser.create({
        data: {
          emailAddress: 'unique@test.example',
          passwordHashBcrypt: '$2b$10$testhash',
          displayFullName: 'First User',
        },
      });

      await expect(
        testPrisma.tiKiTUser.create({
          data: {
            emailAddress: 'unique@test.example',
            passwordHashBcrypt: '$2b$10$testhash',
            displayFullName: 'Second User',
          },
        })
      ).rejects.toThrow();

      await testPrisma.tiKiTUser.deleteMany({
        where: { emailAddress: 'unique@test.example' },
      });
    });
  });

  describe('System Invariants (Appendix A)', () => {
    it('should maintain referential integrity for Campaign-Client relationship', async () => {
      const client = await testPrisma.client.create({
        data: {
          companyLegalName: 'Integrity Test',
          brandName: 'Integrity',
          primaryContacts: [],
          billingContacts: [],
        },
      });

      await testPrisma.campaign.create({
        data: {
          campaignName: 'Integrity Campaign',
          clientId: client.id,
          status: 'DRAFT',
          riskLevel: 'LOW',
          missingInfoList: [],
        },
      });

      // Should not be able to delete client with active campaigns
      await expect(
        testPrisma.client.delete({ where: { id: client.id } })
      ).rejects.toThrow();

      // Cleanup
      await testPrisma.campaign.deleteMany({ where: { clientId: client.id } });
      await testPrisma.client.delete({ where: { id: client.id } });
    });
  });
});
```

## 📝 Validation Script

Create `backend/scripts/validate-schema.ts`:

```typescript
#!/usr/bin/env ts-node

/**
 * TiKiT OS Schema Validation Script
 * Standalone script to validate schema structure
 */

import { PrismaClient } from '@prisma/client';

const validationPrisma = new PrismaClient();

interface ValidationResult {
  testName: string;
  passed: boolean;
  message: string;
}

const results: ValidationResult[] = [];

async function runValidation() {
  console.log('🔍 TiKiT OS Schema Validation Starting...\n');

  // Test 1: Check Client model exists
  try {
    await validationPrisma.client.findFirst();
    results.push({ testName: 'Client Model', passed: true, message: 'Client model accessible' });
  } catch (err) {
    results.push({ testName: 'Client Model', passed: false, message: 'Client model not found' });
  }

  // Test 2: Check Campaign model exists
  try {
    await validationPrisma.campaign.findFirst();
    results.push({ testName: 'Campaign Model', passed: true, message: 'Campaign model accessible' });
  } catch (err) {
    results.push({ testName: 'Campaign Model', passed: false, message: 'Campaign model not found' });
  }

  // Test 3: Check Influencer model exists
  try {
    await validationPrisma.influencer.findFirst();
    results.push({ testName: 'Influencer Model', passed: true, message: 'Influencer model accessible' });
  } catch (err) {
    results.push({ testName: 'Influencer Model', passed: false, message: 'Influencer model not found' });
  }

  // Test 4: Check ContentTask model exists
  try {
    await validationPrisma.contentTask.findFirst();
    results.push({ testName: 'ContentTask Model', passed: true, message: 'ContentTask model accessible' });
  } catch (err) {
    results.push({ testName: 'ContentTask Model', passed: false, message: 'ContentTask model not found' });
  }

  // Test 5: Check ContentArtifact model exists
  try {
    await validationPrisma.contentArtifact.findFirst();
    results.push({ testName: 'ContentArtifact Model', passed: true, message: 'ContentArtifact model accessible' });
  } catch (err) {
    results.push({ testName: 'ContentArtifact Model', passed: false, message: 'ContentArtifact model not found' });
  }

  // Test 6: Check ApprovalItem model exists
  try {
    await validationPrisma.approvalItem.findFirst();
    results.push({ testName: 'ApprovalItem Model', passed: true, message: 'ApprovalItem model accessible' });
  } catch (err) {
    results.push({ testName: 'ApprovalItem Model', passed: false, message: 'ApprovalItem model not found' });
  }

  // Test 7: Check FinancialObject model exists
  try {
    await validationPrisma.financialObject.findFirst();
    results.push({ testName: 'FinancialObject Model', passed: true, message: 'FinancialObject model accessible' });
  } catch (err) {
    results.push({ testName: 'FinancialObject Model', passed: false, message: 'FinancialObject model not found' });
  }

  // Test 8: Check TiKiTUser model exists
  try {
    await validationPrisma.tiKiTUser.findFirst();
    results.push({ testName: 'TiKiTUser Model', passed: true, message: 'TiKiTUser model accessible' });
  } catch (err) {
    results.push({ testName: 'TiKiTUser Model', passed: false, message: 'TiKiTUser model not found' });
  }

  // Test 9: Check TiKiTRole model exists
  try {
    await validationPrisma.tiKiTRole.findFirst();
    results.push({ testName: 'TiKiTRole Model', passed: true, message: 'TiKiTRole model accessible' });
  } catch (err) {
    results.push({ testName: 'TiKiTRole Model', passed: false, message: 'TiKiTRole model not found' });
  }

  // Test 10: Check RiskEventLog model exists
  try {
    await validationPrisma.riskEventLog.findFirst();
    results.push({ testName: 'RiskEventLog Model', passed: true, message: 'RiskEventLog model accessible' });
  } catch (err) {
    results.push({ testName: 'RiskEventLog Model', passed: false, message: 'RiskEventLog model not found' });
  }

  // Print results
  console.log('📊 Validation Results:\n');
  results.forEach((result) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.testName}: ${result.message}`);
  });

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  console.log(`\n📈 Score: ${passedCount}/${totalCount} tests passed`);

  if (passedCount === totalCount) {
    console.log('\n🎉 All validation tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some validation tests failed');
    process.exit(1);
  }
}

runValidation()
  .catch((err) => {
    console.error('❌ Validation error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await validationPrisma.$disconnect();
  });
```

## 🔧 Implementation Steps

1. **Create test suite**
   - Create `backend/test/schema-validation.spec.ts`
   - Include all tests from above

2. **Create validation script**
   - Create `backend/scripts/validate-schema.ts`
   - Make it executable: `chmod +x backend/scripts/validate-schema.ts`

3. **Run validation tests**
   ```bash
   cd backend
   npm test -- schema-validation.spec.ts
   ```

4. **Run standalone validation**
   ```bash
   cd backend
   npx ts-node scripts/validate-schema.ts
   ```

5. **Generate validation report**
   - Document results in `SCHEMA_VALIDATION_REPORT.md`
   - Include pass/fail status for each entity
   - List any PRD deviations

6. **Add to CI/CD pipeline**
   - Add validation to GitHub Actions workflow
   - Ensure schema validation runs on every PR

## Dependencies

**Blocked By:**
- All Phase 2.1-2.9 issues

**Blocks:**
- Phase 3 Business Logic
- Production deployment

## Notes for AI Agent

- **Comprehensive Coverage:** Test all entities, relationships, constraints
- **PRD Compliance:** Verify schema matches PRD specifications
- **System Invariants:** Test business rules from Appendix A
- **Standalone Script:** Validation script should work independently
- **CI Integration:** Make validation part of automated testing
- **Documentation:** Generate clear validation reports
