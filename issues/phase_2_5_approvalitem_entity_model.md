# Phase 2.5: ApprovalItem Entity Model (PRD Section 4.6)

**Labels:** `phase2`, `entity`, `approval`, `governance`, `prisma`, `backend`
**Assignees:** @Copilot
**Issue Number:** (To be assigned)

## 🎯 Context for AI Agent

**PRD Reference:** Section 4.6 (ApprovalItem - Governance Backbone)

**Depends On:** 
- Campaign Entity
- ContentTask/ContentArtifact Entities

**Blocks:** 
- Business logic (approval engine)
- Phase 3 workflows

**Files to Create/Modify:**
- `prisma/schema.prisma` - Add ApprovalItem model
- `prisma/migrations/` - Auto-generated migration files

## ✅ Acceptance Criteria

- [ ] ApprovalItem model with all approval types
- [ ] Type enum: brief/strategy/shortlist/script/content/exception/final_acceptance
- [ ] Version-aware references to ContentArtifact
- [ ] Status tracking: requested/approved/rejected/expired
- [ ] Audit trail fields (requestedBy, approvedBy, timestamps)
- [ ] Relations to Campaign, ContentTask, ContentArtifact
- [ ] Expiration date support
- [ ] Prisma migration applies cleanly
- [ ] Schema validates successfully

## 📝 Complete Prisma Model

```prisma
// Approval Type Enum
enum ApprovalType {
  BRIEF               // Campaign brief approval
  STRATEGY            // Campaign strategy approval
  SHORTLIST           // Influencer shortlist approval
  SCRIPT              // Script/storyboard approval
  CONTENT             // Content (draft/final) approval
  EXCEPTION           // Exception request approval
  FINAL_ACCEPTANCE    // Final campaign acceptance
  BUDGET_REVISION     // Budget change approval
  INFLUENCER_CHANGE   // Influencer substitution approval
}

// Approval Status Enum
enum ApprovalStatus {
  PENDING             // Awaiting decision
  APPROVED            // Approved
  REJECTED            // Rejected
  EXPIRED             // Approval deadline passed
  CANCELLED           // Cancelled (e.g., replaced by new version)
}

// ApprovalItem Model - Governance Backbone
model ApprovalItem {
  id                        String              @id @default(uuid()) @map("approval_id")
  
  // Relationships
  campaignId                String              @map("campaign_id")
  campaign                  Campaign            @relation(fields: [campaignId], references: [id])
  
  contentTaskId             String?             @map("content_task_id")
  contentTask               ContentTask?        @relation(fields: [contentTaskId], references: [id])
  
  contentArtifactId         String?             @map("content_artifact_id")
  contentArtifact           ContentArtifact?    @relation(fields: [contentArtifactId], references: [id])
  
  // Approval Details
  approvalType              ApprovalType        @map("approval_type")
  status                    ApprovalStatus      @default(PENDING)
  priority                  Int                 @default(0)  // Higher = more urgent
  
  // Approval Subject
  subject                   String              // e.g., "Script Approval - Instagram Reel #1"
  description               String?             // What needs approval
  requestNotes              String?             @map("request_notes")
  
  // Version Awareness (for content approvals)
  artifactVersion           Int?                @map("artifact_version")  // Which version is being approved
  
  // Approver Information
  approverRole              String?             @map("approver_role")     // e.g., "CM", "CLIENT", "DIR"
  approverUserId            String?             @map("approver_user_id")  // UserID who should approve
  
  // Request & Response
  requestedBy               String              @map("requested_by")      // UserID who requested
  requestedAt               DateTime            @default(now()) @map("requested_at")
  
  respondedBy               String?             @map("responded_by")      // UserID who approved/rejected
  respondedAt               DateTime?           @map("responded_at")
  responseNotes             String?             @map("response_notes")
  
  // Deadline & Expiration
  dueDate                   DateTime?           @map("due_date")
  expiresAt                 DateTime?           @map("expires_at")
  
  // Conditional Approval
  isConditional             Boolean             @default(false) @map("is_conditional")
  conditions                String[]            // List of conditions if approved conditionally
  conditionsMet             Boolean?            @map("conditions_met")
  
  // Escalation
  isEscalated               Boolean             @default(false) @map("is_escalated")
  escalatedTo               String?             @map("escalated_to")      // UserID or role
  escalatedAt               DateTime?           @map("escalated_at")
  escalationReason          String?             @map("escalation_reason")
  
  // Attachments/References
  attachmentUrls            String[]            @map("attachment_urls")
  referenceUrls             String[]            @map("reference_urls")
  
  // Audit Fields
  createdAt                 DateTime            @default(now()) @map("created_at")
  updatedAt                 DateTime            @updatedAt @map("updated_at")

  @@map("approval_items")
  @@index([campaignId])
  @@index([status])
  @@index([approvalType])
  @@index([approverUserId])
  @@index([dueDate])
  @@index([contentArtifactId, artifactVersion])
}
```

## 🔧 Implementation Steps

1. **Add enums and model to schema.prisma**
   - Add ApprovalType enum
   - Add ApprovalStatus enum
   - Add ApprovalItem model
   - Place after Campaign, ContentTask, and ContentArtifact models

2. **Update related models**
   - Add to Campaign model:
   ```prisma
   approvalItems  ApprovalItem[]
   ```
   - Add to ContentTask model:
   ```prisma
   approvalItems  ApprovalItem[]
   ```
   - Add to ContentArtifact model:
   ```prisma
   approvalItems  ApprovalItem[]
   ```

3. **Create and apply migration**
   ```bash
   cd backend
   npx prisma migrate dev --name add-approval-item
   ```

4. **Validate schema**
   ```bash
   npx prisma validate
   npx prisma format
   ```

5. **Test approval workflow**
   - Create a Campaign
   - Create an ApprovalItem for BRIEF type
   - Test status transitions (PENDING → APPROVED)
   - Test version-aware approvals with ContentArtifact references
   - Test expiration logic

6. **Verify in Prisma Studio**
   ```bash
   npx prisma studio
   ```

## Dependencies

**Blocked By:**
- Phase 2.2 - Campaign Entity Model
- Phase 2.4 - ContentTask & ContentArtifact Models

**Blocks:**
- Phase 3 - Business Logic (Approval Engine)
- Phase 3 - Workflow Automation

## Notes for AI Agent

- **Version Awareness:** ApprovalItems can reference specific ContentArtifact versions via contentArtifactId + artifactVersion
- **Multiple Approval Types:** Different approval types have different workflows:
  - BRIEF: Campaign-level, no artifact
  - SCRIPT/CONTENT: Task-level, references specific artifact version
  - EXCEPTION: Campaign or task-level, for policy violations
  - FINAL_ACCEPTANCE: Campaign-level, end of lifecycle
- **Approver Assignment:** Can assign to specific user (approverUserId) or role (approverRole)
- **Conditional Approvals:** Approvals can have conditions that must be met
- **Expiration:** Approvals can expire if not acted upon (auto-transition to EXPIRED status)
- **Escalation:** Overdue or high-priority approvals can be escalated
- **Audit Trail:** Track who requested, who responded, and when
- **Status Transitions:**
  - PENDING → APPROVED (normal flow)
  - PENDING → REJECTED (rejection)
  - PENDING → EXPIRED (deadline passed)
  - PENDING → CANCELLED (superseded by new request)
- **Composite Index:** [contentArtifactId, artifactVersion] for version-aware queries
