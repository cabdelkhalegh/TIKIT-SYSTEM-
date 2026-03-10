# Phase 2.2: Campaign Entity Model (PRD Section 4.1)

**Labels:** `phase2`, `entity`, `campaign`, `prisma`, `backend`, `core`
**Assignees:** @Copilot
**Issue Number:** (To be assigned)

## 🎯 Context for AI Agent

**PRD Reference:** Section 4.1 (Campaign Entity - Root Object)

**Depends On:** 
- #17 (Prisma Initialization)
- #23 (Client Entity)

**Blocks:** 
- ContentTask Entity
- ApprovalItem Entity
- FinancialObject Entity

**Files to Create/Modify:**
- `prisma/schema.prisma` - Add Campaign model with all fields
- `prisma/migrations/` - Auto-generated migration files

## ✅ Acceptance Criteria

- [ ] Campaign model defined in `prisma/schema.prisma` with all required fields from PRD Section 4.1
- [ ] CampaignID as UUID primary key
- [ ] ClientID foreign key relationship to Client entity
- [ ] Status enum with all 23 statuses from PRD Section 5.1
- [ ] RiskLevel enum (Low, Medium, High)
- [ ] MissingInfoList array field for tracking gaps
- [ ] Policy configuration fields (clientContentApprovalRequired, publishingGraceWindowHours, etc.)
- [ ] Relations to Client, ApprovalItems, ContentTasks, FinancialObjects, InfluencerAssignments
- [ ] Prisma migration applies cleanly with `npx prisma migrate dev`
- [ ] Schema validates with `npx prisma validate`

## 📝 Complete Prisma Model

```prisma
// Campaign Status Enum - 23 statuses from PRD Section 5.1
enum CampaignStatus {
  DRAFT                           // Initial creation state
  BRIEF_PENDING                   // Awaiting brief approval
  BRIEF_APPROVED                  // Brief approved, ready for influencer sourcing
  INFLUENCER_SOURCING             // Searching for influencers
  SHORTLIST_PENDING               // Shortlist created, awaiting approval
  SHORTLIST_APPROVED              // Shortlist approved
  INFLUENCER_OUTREACH             // Contacting influencers
  NEGOTIATION                     // Price/terms negotiation
  CONTRACT_PENDING                // Contract sent, awaiting signature
  CONTRACTED                      // Influencer contracted
  SCRIPT_DEVELOPMENT              // Script/storyboard creation
  SCRIPT_PENDING_APPROVAL         // Script awaiting approval
  SCRIPT_APPROVED                 // Script approved
  CONTENT_PRODUCTION              // Content being created
  CONTENT_REVIEW                  // Content submitted for review
  CONTENT_REVISION                // Revisions requested
  CONTENT_APPROVED                // Content approved for publishing
  SCHEDULED                       // Scheduled for publishing
  LIVE                            // Content published
  MONITORING                      // Post-publish monitoring
  COMPLETED                       // Campaign objectives met
  CANCELLED                       // Campaign cancelled
  ON_HOLD                         // Campaign paused
}

// Risk Level Enum
enum RiskLevel {
  LOW
  MEDIUM
  HIGH
}

// Campaign Model - Root Entity
model Campaign {
  id                              String            @id @default(uuid()) @map("campaign_id")
  
  // Client Relationship
  clientId                        String            @map("client_id")
  client                          Client            @relation(fields: [clientId], references: [id])
  
  // Core Campaign Information
  campaignName                    String            @map("campaign_name")
  campaignObjective               String?           @map("campaign_objective")
  targetAudience                  String?           @map("target_audience")
  brandGuidelines                 String?           @map("brand_guidelines")
  keyMessages                     String[]          @map("key_messages")
  
  // Status & Risk
  status                          CampaignStatus    @default(DRAFT)
  riskLevel                       RiskLevel         @default(LOW) @map("risk_level")
  missingInfoList                 String[]          @map("missing_info_list")
  
  // Dates & Timeline
  startDate                       DateTime?         @map("start_date")
  endDate                         DateTime?         @map("end_date")
  launchDate                      DateTime?         @map("launch_date")
  
  // Budget
  totalBudget                     Float?            @map("total_budget")
  spentBudget                     Float             @default(0) @map("spent_budget")
  
  // Policy Configuration
  clientContentApprovalRequired   Boolean           @default(true) @map("client_content_approval_required")
  publishingGraceWindowHours      Int               @default(24) @map("publishing_grace_window_hours")
  autoApprovalEnabled             Boolean           @default(false) @map("auto_approval_enabled")
  scriptApprovalRequired          Boolean           @default(true) @map("script_approval_required")
  
  // Relations
  contentTasks                    ContentTask[]
  approvalItems                   ApprovalItem[]
  financialObjects                FinancialObject[]
  influencerAssignments           InfluencerAssignment[]
  
  // Audit Fields
  createdAt                       DateTime          @default(now()) @map("created_at")
  updatedAt                       DateTime          @updatedAt @map("updated_at")
  createdBy                       String?           @map("created_by")
  updatedBy                       String?           @map("updated_by")

  @@map("campaigns")
  @@index([clientId])
  @@index([status])
  @@index([riskLevel])
}
```

## 🔧 Implementation Steps

1. **Add Campaign model to schema.prisma**
   - Copy the complete Prisma model above into `prisma/schema.prisma`
   - Ensure it's placed after the Client model definition
   - Verify all enum types are defined before the model

2. **Update Client model relationship**
   - Add the reverse relation in Client model:
   ```prisma
   campaigns  Campaign[]
   ```

3. **Create and apply migration**
   ```bash
   cd backend
   npx prisma migrate dev --name add-campaign-entity
   ```

4. **Validate schema**
   ```bash
   npx prisma validate
   npx prisma format
   ```

5. **Verify in Prisma Studio**
   ```bash
   npx prisma studio
   ```
   - Confirm Campaign table exists
   - Verify all fields and relationships

6. **Test migration rollback safety**
   - Ensure migration can be rolled back if needed
   - Document any data migration considerations

## Dependencies

**Blocked By:**
- #17 - Prisma Initialization & Base Configuration
- #23 - Client Entity Model (foreign key dependency)

**Blocks:**
- Phase 2.4 - ContentTask & ContentArtifact Models
- Phase 2.5 - ApprovalItem Entity Model  
- Phase 2.6 - FinancialObject Entity Model
- Phase 2.3 - Influencer Profile Entity Model (InfluencerAssignment relation)

## Notes for AI Agent

- **Critical:** Campaign is the root entity - most other entities will reference CampaignID
- The 23 campaign statuses follow the PRD's state machine (Section 5.1)
- Risk level is calculated but stored for performance (see Phase 2.9)
- Missing info list drives the risk calculation
- Policy fields control approval workflows
- All monetary values use Float (consider Decimal for production)
- Audit fields (createdBy, updatedBy) will reference User entity (Phase 2.7)
