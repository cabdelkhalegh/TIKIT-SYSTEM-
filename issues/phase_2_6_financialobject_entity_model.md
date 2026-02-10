# Phase 2.6: FinancialObject Entity Model (PRD Section 4.7)

**Labels:** `phase2`, `entity`, `financial`, `prisma`, `backend`
**Assignees:** @Copilot
**Issue Number:** (To be assigned)

## 🎯 Context for AI Agent

**PRD Reference:** Section 4.7 (FinancialObject - Campaign Financial Spine)

**Depends On:** 
- Campaign Entity
- Influencer Profile Entity

**Blocks:** 
- Financial services
- Budget tracking
- Invoice generation

**Files to Create/Modify:**
- `prisma/schema.prisma` - Add FinancialObject model
- `prisma/migrations/` - Auto-generated migration files

## ✅ Acceptance Criteria

- [ ] FinancialObject model with all financial transaction types
- [ ] Type enum: budget/budget_revision/expense/influencer_cost/client_invoice/influencer_invoice/payment
- [ ] CampaignID as required foreign key (all financial objects tied to campaigns)
- [ ] InfluencerID as optional foreign key (for influencer-specific costs)
- [ ] Revision tracking (revisionOf, revisionReason)
- [ ] Amount, currency, status tracking
- [ ] Audit trail with approval workflow
- [ ] Prisma migration applies cleanly
- [ ] Schema validates successfully

## 📝 Complete Prisma Model

```prisma
// Financial Object Type Enum
enum FinancialObjectType {
  BUDGET                  // Initial campaign budget
  BUDGET_REVISION         // Budget adjustment/revision
  EXPENSE                 // General campaign expense
  INFLUENCER_COST         // Cost for influencer services
  CLIENT_INVOICE          // Invoice to client
  INFLUENCER_INVOICE      // Invoice from influencer
  PAYMENT                 // Payment record (in/out)
  REFUND                  // Refund record
}

// Financial Status Enum
enum FinancialStatus {
  DRAFT                   // Not yet finalized
  PENDING_APPROVAL        // Awaiting approval
  APPROVED                // Approved but not executed
  COMMITTED               // Committed/booked
  PAID                    // Payment completed
  PARTIALLY_PAID          // Partial payment made
  OVERDUE                 // Payment overdue
  CANCELLED               // Cancelled
  REFUNDED                // Refunded
}

// FinancialObject Model - Campaign Financial Spine
model FinancialObject {
  id                        String                  @id @default(uuid()) @map("financial_id")
  
  // Relationships (CampaignID is REQUIRED - all financial objects must tie to a campaign)
  campaignId                String                  @map("campaign_id")
  campaign                  Campaign                @relation(fields: [campaignId], references: [id])
  
  influencerId              String?                 @map("influencer_id")
  influencer                Influencer?             @relation(fields: [influencerId], references: [id])
  
  // Financial Object Details
  objectType                FinancialObjectType     @map("object_type")
  status                    FinancialStatus         @default(DRAFT)
  
  // Amounts
  amount                    Float
  currency                  String                  @default("USD")
  taxAmount                 Float?                  @map("tax_amount")
  totalAmount               Float                   @map("total_amount")  // amount + taxAmount
  
  // Description
  description               String
  category                  String?                 // e.g., "Influencer Fee", "Production", "Platform Fee"
  notes                     String?
  
  // Dates
  transactionDate           DateTime                @map("transaction_date")
  dueDate                   DateTime?               @map("due_date")
  paidDate                  DateTime?               @map("paid_date")
  
  // Revision Tracking
  revisionOf                String?                 @map("revision_of")  // FinancialObjectID this revises
  revisionNumber            Int                     @default(1) @map("revision_number")
  revisionReason            String?                 @map("revision_reason")
  isLatestRevision          Boolean                 @default(true) @map("is_latest_revision")
  
  // Invoice/Payment Details
  invoiceNumber             String?                 @unique @map("invoice_number")
  invoiceUrl                String?                 @map("invoice_url")
  paymentMethod             String?                 @map("payment_method")  // e.g., "Wire", "Check", "PayPal"
  paymentReference          String?                 @map("payment_reference")
  paymentUrl                String?                 @map("payment_url")  // Receipt/confirmation URL
  
  // Vendor/Payee Information (for expenses/invoices)
  payeeName                 String?                 @map("payee_name")
  payeeEmail                String?                 @map("payee_email")
  payeeAccount              String?                 @map("payee_account")
  
  // Approval Workflow
  requiresApproval          Boolean                 @default(false) @map("requires_approval")
  approvedBy                String?                 @map("approved_by")  // UserID
  approvedAt                DateTime?               @map("approved_at")
  approvalNotes             String?                 @map("approval_notes")
  
  // Budget Tracking
  budgetLineItem            String?                 @map("budget_line_item")  // Which budget category
  isOverBudget              Boolean                 @default(false) @map("is_over_budget")
  
  // Attachments
  attachmentUrls            String[]                @map("attachment_urls")
  
  // Audit Fields
  createdAt                 DateTime                @default(now()) @map("created_at")
  updatedAt                 DateTime                @updatedAt @map("updated_at")
  createdBy                 String?                 @map("created_by")
  updatedBy                 String?                 @map("updated_by")

  @@map("financial_objects")
  @@index([campaignId])
  @@index([influencerId])
  @@index([objectType])
  @@index([status])
  @@index([transactionDate])
  @@index([dueDate])
  @@index([revisionOf])
}
```

## 🔧 Implementation Steps

1. **Add enums and model to schema.prisma**
   - Add FinancialObjectType enum
   - Add FinancialStatus enum
   - Add FinancialObject model
   - Place after Campaign and Influencer models

2. **Update related models**
   - Add to Campaign model:
   ```prisma
   financialObjects  FinancialObject[]
   ```
   - Add to Influencer model:
   ```prisma
   financialObjects  FinancialObject[]
   ```

3. **Create and apply migration**
   ```bash
   cd backend
   npx prisma migrate dev --name add-financial-object
   ```

4. **Validate schema**
   ```bash
   npx prisma validate
   npx prisma format
   ```

5. **Test financial workflows**
   - Create a Campaign with initial BUDGET
   - Create BUDGET_REVISION (revision of initial budget)
   - Create INFLUENCER_COST for an influencer
   - Create CLIENT_INVOICE
   - Create PAYMENT record
   - Verify revision chain (revisionOf, isLatestRevision)
   - Test invoice number uniqueness

6. **Verify in Prisma Studio**
   ```bash
   npx prisma studio
   ```

## Dependencies

**Blocked By:**
- Phase 2.2 - Campaign Entity Model
- Phase 2.3 - Influencer Profile Entity Model

**Blocks:**
- Phase 3 - Financial Services
- Phase 3 - Budget Tracking
- Phase 3 - Invoice Generation

## Notes for AI Agent

- **Campaign-Centric:** ALL FinancialObjects MUST have a campaignId - this is a critical business rule (PRD Section 4.7)
- **Revision Tracking:** Budget revisions create new FinancialObject with revisionOf pointing to original
  - Set isLatestRevision=false on old version
  - Set isLatestRevision=true on new version
  - Increment revisionNumber
- **Financial Object Types:**
  - BUDGET: Initial campaign budget allocation
  - BUDGET_REVISION: Changes to budget (up or down)
  - EXPENSE: General campaign expenses
  - INFLUENCER_COST: Specific costs for influencer services
  - CLIENT_INVOICE: Invoices sent to client
  - INFLUENCER_INVOICE: Invoices received from influencers
  - PAYMENT: Actual payment transactions
  - REFUND: Refund transactions
- **Status Flow Examples:**
  - Budget: DRAFT → APPROVED → COMMITTED
  - Invoice: DRAFT → APPROVED → PAID
  - Payment: PENDING_APPROVAL → APPROVED → PAID
- **Amounts:** 
  - amount: Base amount
  - taxAmount: Tax portion
  - totalAmount: amount + taxAmount (calculated or stored)
- **Approval Workflow:** High-value transactions may require approval
- **Budget Tracking:** Track which budget line item this affects
- **Invoice Numbers:** Must be unique across all financial objects
- **Audit Trail:** Track who created/modified financial records
