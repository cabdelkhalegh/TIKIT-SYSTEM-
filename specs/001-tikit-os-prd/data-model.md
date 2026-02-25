# Data Model: TiKiT OS V2

**Branch**: `001-tikit-os-prd` | **Date**: 2026-02-25
**Standards**: Constitution Section VII — CUID primary keys, createdAt/updatedAt, human-readable IDs, append-only versioning

## Model Overview

| # | Model | Status | Purpose |
|---|---|---|---|
| 1 | User | MODIFY | Add session timeout, password policy fields |
| 2 | UserRole | NEW | Multi-role junction table (replaces single role enum) |
| 3 | Profile | NEW | Extended user profile (auto-created on signup) |
| 4 | CompanyRegistration | NEW | Trade license signup data |
| 5 | Campaign | MODIFY | 8-stage status, phase, risk, closure state, displayId, version |
| 6 | Client | MODIFY | Add displayId, type (company/individual) |
| 7 | Brief | MODIFY | Add confidence scores, review status, version tracking |
| 8 | BriefVersion | NEW | Append-only brief version history |
| 9 | Strategy | NEW | AI-generated campaign strategy |
| 10 | Influencer | MODIFY | Add displayId, profile status (complete/stub), new fields |
| 11 | CampaignInfluencer | MODIFY | 6-stage lifecycle, AI score, brief acceptance, pricing, posting schedule |
| 12 | Content | MODIFY | Two-stage approval, filming/posting gates, versioning |
| 13 | KPI | NEW | Performance metrics per campaign-influencer |
| 14 | KPISchedule | NEW | Auto-scheduled capture windows |
| 15 | Report | NEW | Campaign report with AI narrative |
| 16 | Invoice | MODIFY | Add displayId, 4-stage status, management fee link |
| 17 | BudgetRevision | NEW | Append-only budget change history |
| 18 | Approval | NEW | Generic approval records |
| 19 | Notification | MODIFY | Add escalation fields, entity references |
| 20 | Reminder | NEW | Campaign-linked reminders |
| 21 | CXSurvey | NEW | Client satisfaction survey |
| 22 | PostMortem | NEW | Campaign closure analysis |
| 23 | AuditLog | NEW | Append-only action audit trail |
| 24 | InstagramConnection | NEW | Agency-level Instagram API connection |
| 25 | Media | KEEP | Existing file management |
| 26 | NotificationPreferences | KEEP | Existing notification settings |

## Prisma Schema

### Enums

```prisma
enum CampaignStatus {
  draft
  in_review
  pitching
  live
  reporting
  closed
}

enum CampaignPhase {
  brief_intake
  ai_structuring
  budget_review
  influencer_matching
  client_pitching
  content_production
  performance_tracking
  report_generation
  closure
}

enum RiskLevel {
  low
  medium
  high
}

enum RoleName {
  director
  campaign_manager
  reviewer
  finance
  client
  influencer
}

enum InfluencerLifecycleStatus {
  proposed
  approved
  contracted
  brief_accepted
  live
  completed
}

enum ContentType {
  script
  video_draft
  final
}

enum ContentApprovalStatus {
  pending
  internal_approved
  client_approved
  changes_requested
}

enum InvoiceType {
  client
  influencer
}

enum InvoiceStatus {
  draft
  sent
  approved
  paid
}

enum ReportStatus {
  draft
  pending_approval
  approved
  exported
}

enum ApprovalType {
  budget
  shortlist
  content_internal
  content_client
  report
  exception
  high_risk_override
  registration
}

enum KPISource {
  manual
  auto
}

enum ProfileStatus {
  complete
  stub
}

enum ClientType {
  company
  individual
}

enum RegistrationStatus {
  pending
  approved
  rejected
}

enum ExceptionType {
  urgent_posting
  verbal_approval
  client_timeout
}
```

### Models

#### User (MODIFY)

```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  passwordHash      String
  displayName       String
  phone             String?
  profileImage      String?
  isActive          Boolean   @default(false)
  isEmailVerified   Boolean   @default(false)
  failedLoginCount  Int       @default(0)
  lockedUntil       DateTime?
  lastSignIn        DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  roles             UserRole[]
  profile           Profile?
  notifications     Notification[]
  preferences       NotificationPreferences?
  auditLogs         AuditLog[]
  reminders         Reminder[]
  ownedCampaigns    Campaign[]  @relation("CampaignOwner")
  companyRegistration CompanyRegistration?
  media             Media[]
}
```

#### UserRole (NEW)

```prisma
model UserRole {
  id        String   @id @default(cuid())
  userId    String
  role      RoleName
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id])

  @@unique([userId, role])
}
```

**Constraints**: Client and Influencer roles are exclusive (enforced in application logic — a user with `client` or `influencer` role cannot have any other role assigned).

#### Profile (NEW)

```prisma
model Profile {
  id        String   @id @default(cuid())
  userId    String   @unique
  fullName  String
  phone     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id])
}
```

#### CompanyRegistration (NEW)

```prisma
model CompanyRegistration {
  id              String             @id @default(cuid())
  userId          String             @unique
  companyName     String?
  vatTrnNumber    String?
  licenseNumber   String?
  expiryDate      DateTime?
  businessAddress String?
  activities      String?            // JSON array
  ownerNames      String?            // JSON array
  licenseFileUrl  String?
  status          RegistrationStatus @default(pending)
  reviewedBy      String?
  rejectionReason String?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  user            User               @relation(fields: [userId], references: [id])
}
```

#### Campaign (MODIFY)

```prisma
model Campaign {
  id              String          @id @default(cuid())
  displayId       String          @unique     // TKT-YYYY-XXXX
  name            String
  description     String?
  status          CampaignStatus  @default(draft)
  phase           CampaignPhase   @default(brief_intake)
  riskLevel       RiskLevel       @default(low)
  riskScore       Int             @default(0)
  budget          Float?
  managementFee   Float           @default(30)  // percentage
  startDate       DateTime?
  endDate         DateTime?
  closedAt        DateTime?
  isDeleted       Boolean         @default(false)  // soft delete
  version         Int             @default(1)      // optimistic concurrency
  ownerId         String
  clientId        String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  owner           User            @relation("CampaignOwner", fields: [ownerId], references: [id])
  client          Client?         @relation(fields: [clientId], references: [id])
  briefs          Brief[]
  strategy        Strategy?
  influencers     CampaignInfluencer[]
  content         Content[]
  kpis            KPI[]
  kpiSchedules    KPISchedule[]
  invoices        Invoice[]
  budgetRevisions BudgetRevision[]
  reports         Report[]
  approvals       Approval[]
  notifications   Notification[]
  reminders       Reminder[]
  cxSurvey        CXSurvey?
  postMortem      PostMortem?
}
```

**State transitions** (hard-gated per constitution Section IV):

| From | To | Gate |
|---|---|---|
| draft | in_review | Brief saved + reviewed |
| in_review | pitching | Director budget approval |
| pitching | live | Client shortlist approval |
| live | reporting | All influencers have live post URLs |
| reporting | closed | Report client-approved + all invoices settled |

**Risk scoring** (auto-calculated):

| Condition | Points |
|---|---|
| Missing budget | +3 |
| Missing start date | +2 |
| Missing end date | +2 |
| Missing client | +2 |
| Missing fields | up to +3 |
| **Thresholds** | Low (<2), Medium (2-4), High (5+) |

#### Client (MODIFY)

```prisma
model Client {
  id               String     @id @default(cuid())
  displayId        String     @unique  // CLI-XXXX
  type             ClientType @default(company)
  companyName      String
  brandDisplayName String?
  primaryContact   String?    // email
  secondaryContact String?    // email
  phone            String?
  industry         String?
  avatar           String?
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  campaigns        Campaign[]
  assignments      CampaignClientAssignment[]
}
```

#### CampaignClientAssignment (NEW)

```prisma
model CampaignClientAssignment {
  id           String   @id @default(cuid())
  campaignId   String
  clientId     String
  clientUserId String?  // the User account for this client
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  campaign     Campaign @relation(fields: [campaignId], references: [id])
  client       Client   @relation(fields: [clientId], references: [id])

  @@unique([campaignId, clientId])
}
```

#### Brief (MODIFY)

```prisma
model Brief {
  id              String   @id @default(cuid())
  campaignId      String
  rawText         String?
  fileName        String?
  fileUrl         String?
  objectives      String?  // JSON
  kpis            String?  // JSON
  targetAudience  String?  // JSON
  deliverables    String?  // JSON
  budgetSignals   String?  // JSON
  clientInfo      String?  // JSON
  keyMessages     String?  // JSON
  contentPillars  String?  // JSON
  matchingCriteria String? // JSON
  confidenceScores String? // JSON — per-field confidence from AI
  extractionStatus String  @default("pending") // pending/processing/completed/error
  isReviewed      Boolean  @default(false)
  reviewedBy      String?
  versionNumber   Int      @default(1)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  campaign        Campaign @relation(fields: [campaignId], references: [id])
  versions        BriefVersion[]
}
```

#### BriefVersion (NEW)

```prisma
model BriefVersion {
  id              String   @id @default(cuid())
  briefId         String
  versionNumber   Int
  objectives      String?  // JSON snapshot
  kpis            String?
  targetAudience  String?
  deliverables    String?
  budgetSignals   String?
  clientInfo      String?
  keyMessages     String?
  contentPillars  String?
  matchingCriteria String?
  changedBy       String?
  createdAt       DateTime @default(now())

  brief           Brief    @relation(fields: [briefId], references: [id])
}
```

**Append-only**: No `updatedAt`, no updates — insert only.

#### Strategy (NEW)

```prisma
model Strategy {
  id               String   @id @default(cuid())
  campaignId       String   @unique
  summary          String?
  keyMessages      String?  // JSON array
  contentPillars   String?  // JSON array
  matchingCriteria String?  // JSON — platform, follower range, engagement mins, niches, locations
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  campaign         Campaign @relation(fields: [campaignId], references: [id])
}
```

#### Influencer (MODIFY)

```prisma
model Influencer {
  id                String        @id @default(cuid())
  displayId         String        @unique  // INF-XXXX
  handle            String
  displayName       String?
  email             String?
  phone             String?
  platform          String        @default("instagram")
  niches            String?       // JSON array
  geo               String?
  language          String?
  followerCount     Int?
  engagementRate    Float?
  rateCard          String?       // JSON — per post/video/story pricing
  tier              String?
  gender            String?
  city              String?
  country           String?
  bio               String?
  profileImage      String?
  representation    String?       @default("direct") // direct or agency
  agentContact      String?
  tiktokHandle      String?
  tiktokLink        String?
  sociataProfileUrl String?
  profileStatus     ProfileStatus @default(stub)
  isActive          Boolean       @default(true)
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  campaigns         CampaignInfluencer[]
}
```

#### CampaignInfluencer (MODIFY)

```prisma
model CampaignInfluencer {
  id              String                    @id @default(cuid())
  campaignId      String
  influencerId    String
  status          InfluencerLifecycleStatus @default(proposed)
  aiMatchScore    Float?
  aiMatchRationale String?
  estimatedCost   Float?
  agreedCost      Float?
  briefAccepted   Boolean                  @default(false)
  briefAcceptedAt DateTime?
  contractStatus  String?                  // pending/signed/na
  invitedAt       DateTime?
  approvedAt      DateTime?
  contractedAt    DateTime?
  liveAt          DateTime?
  completedAt       DateTime?
  scheduledPostDate DateTime?                // agreed date/time the influencer will post
  postPlatform      String?                  // platform for this post (Instagram/TikTok/YouTube/Reels/Story)
  createdAt         DateTime                 @default(now())
  updatedAt         DateTime                 @updatedAt

  campaign        Campaign                 @relation(fields: [campaignId], references: [id])
  influencer      Influencer               @relation(fields: [influencerId], references: [id])
  content         Content[]
  kpis            KPI[]

  @@unique([campaignId, influencerId])
}
```

#### Content (MODIFY)

```prisma
model Content {
  id                   String                @id @default(cuid())
  campaignId           String
  campaignInfluencerId String?
  type                 ContentType
  versionNumber        Int                   @default(1)
  approvalStatus       ContentApprovalStatus @default(pending)
  filmingBlocked       Boolean               @default(true)
  postingBlocked       Boolean               @default(true)
  fileUrl              String?
  fileName             String?
  fileSizeBytes        Int?
  livePostUrl          String?
  internalFeedback     String?
  clientFeedback       String?
  exceptionType        ExceptionType?
  exceptionApprovedBy  String?
  exceptionEvidence    String?
  createdAt            DateTime              @default(now())
  updatedAt            DateTime              @updatedAt

  campaign             Campaign              @relation(fields: [campaignId], references: [id])
  campaignInfluencer   CampaignInfluencer?   @relation(fields: [campaignInfluencerId], references: [id])
}
```

**Gate logic** (enforced in backend):
- `filmingBlocked` = `true` until a `script` content for this influencer reaches `internal_approved`
- `postingBlocked` = `true` until `final` content reaches `client_approved`
- Exception override: requires Director approval — sets `exceptionType`, `exceptionApprovedBy`, `exceptionEvidence`

#### KPI (NEW)

```prisma
model KPI {
  id                   String             @id @default(cuid())
  campaignId           String
  campaignInfluencerId String?
  reach                Int?
  impressions          Int?
  engagement           Int?
  clicks               Int?
  captureDay           Int?               // 1, 3, or 7
  source               KPISource          @default(manual)
  createdAt            DateTime           @default(now())

  campaign             Campaign           @relation(fields: [campaignId], references: [id])
  campaignInfluencer   CampaignInfluencer? @relation(fields: [campaignInfluencerId], references: [id])
}
```

**Append-only**: No `updatedAt` — each capture creates a new record.

#### KPISchedule (NEW)

```prisma
model KPISchedule {
  id                   String   @id @default(cuid())
  campaignId           String
  campaignInfluencerId String
  captureDay           Int      // 1, 3, or 7
  scheduledAt          DateTime
  capturedAt           DateTime?
  isFailed             Boolean  @default(false)
  createdAt            DateTime @default(now())

  campaign             Campaign @relation(fields: [campaignId], references: [id])
}
```

#### Report (NEW)

```prisma
model Report {
  id           String       @id @default(cuid())
  campaignId   String
  status       ReportStatus @default(draft)
  kpiSummary   String?      // JSON — aggregated metrics
  highlights   String?
  aiNarrative  String?
  approvedBy   String?
  approvedAt   DateTime?
  exportedAt   DateTime?
  shareableUrl String?      // read-only web link
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  campaign     Campaign     @relation(fields: [campaignId], references: [id])
}
```

#### Invoice (MODIFY)

```prisma
model Invoice {
  id           String        @id @default(cuid())
  displayId    String        @unique  // INV-YYYY-XXXX
  campaignId   String
  type         InvoiceType
  status       InvoiceStatus @default(draft)
  amount       Float
  currency     String        @default("AED")
  dueDate      DateTime?
  notes        String?
  fileUrl      String?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  campaign     Campaign      @relation(fields: [campaignId], references: [id])
}
```

#### BudgetRevision (NEW)

```prisma
model BudgetRevision {
  id           String   @id @default(cuid())
  campaignId   String
  previousBudget Float
  newBudget    Float
  changedBy    String
  reason       String?
  createdAt    DateTime @default(now())

  campaign     Campaign @relation(fields: [campaignId], references: [id])
}
```

**Append-only**: No updates — insert only on every budget change.

#### Approval (NEW)

```prisma
model Approval {
  id           String       @id @default(cuid())
  campaignId   String
  type         ApprovalType
  entityId     String?      // ID of the entity being approved
  status       String       @default("pending") // pending/approved/rejected
  approvedBy   String?
  rejectedBy   String?
  reason       String?      // override reason for Director approvals
  evidence     String?      // file URL or text for exception evidence
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  campaign     Campaign     @relation(fields: [campaignId], references: [id])
}
```

#### Notification (MODIFY)

```prisma
model Notification {
  id           String   @id @default(cuid())
  userId       String
  campaignId   String?
  type         String   // content, script, shortlist, campaign_update, deadline, escalation
  title        String
  message      String
  isRead       Boolean  @default(false)
  priority     String   @default("normal") // normal, high, urgent
  entityType   String?  // campaign, content, invoice, etc.
  entityId     String?
  actionUrl    String?
  isEscalation Boolean  @default(false)
  escalationLevel Int?  // 1=24h, 2=48h, 3=72h Director
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user         User     @relation(fields: [userId], references: [id])
  campaign     Campaign? @relation(fields: [campaignId], references: [id])
}
```

#### Reminder (NEW)

```prisma
model Reminder {
  id           String   @id @default(cuid())
  userId       String
  campaignId   String?
  entityType   String?
  entityId     String?
  title        String
  description  String?
  dueDate      DateTime
  isSent       Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user         User     @relation(fields: [userId], references: [id])
  campaign     Campaign? @relation(fields: [campaignId], references: [id])
}
```

#### CXSurvey (NEW)

```prisma
model CXSurvey {
  id               String   @id @default(cuid())
  campaignId       String   @unique
  overallScore     Int      // 1-5
  communicationScore Int    // 1-5
  qualityScore     Int      // 1-5
  timelinessScore  Int      // 1-5
  valueScore       Int      // 1-5
  testimonial      String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  campaign         Campaign @relation(fields: [campaignId], references: [id])
}
```

#### PostMortem (NEW)

```prisma
model PostMortem {
  id              String   @id @default(cuid())
  campaignId      String   @unique
  wentWell        String?  // JSON array
  improvements    String?  // JSON array
  lessons         String?  // JSON array
  actionItems     String?  // JSON array
  riskNotes       String?
  budgetAnalysis  String?
  timelineAnalysis String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  campaign        Campaign @relation(fields: [campaignId], references: [id])
}
```

#### AuditLog (NEW)

```prisma
model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  action     String   // create, update, delete, login, logout, approve, reject, etc.
  entityType String   // campaign, content, invoice, user, etc.
  entityId   String?
  changes    String?  // JSON diff of before/after
  ipAddress  String?
  createdAt  DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id])
}
```

**Append-only**: No `updatedAt`, no updates — insert only.

#### InstagramConnection (NEW)

```prisma
model InstagramConnection {
  id            String   @id @default(cuid())
  accessToken   String
  refreshToken  String?
  tokenExpiry   DateTime?
  igUserId      String?
  igUsername     String?
  pageId        String?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

Agency-level connection — one active connection for the entire agency.

## Migration Strategy

1. **Phase A migrations**: Campaign status enum change, UserRole table, displayId fields, risk scoring fields
2. **Phase B migrations**: Strategy, KPI, KPISchedule, Report, BudgetRevision models
3. **Phase C migrations**: CampaignClientAssignment (for portal scoping)
4. **Phase D migrations**: CXSurvey, PostMortem, AuditLog, closedAt/retention fields
5. **Phase E migrations**: CompanyRegistration, Profile, security fields on User

Each migration is a separate Prisma migration file. Data migrations for existing records run as part of seed scripts to avoid breaking existing data.
