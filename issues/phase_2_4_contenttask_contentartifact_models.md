# Phase 2.4: ContentTask & ContentArtifact Models (PRD Sections 4.5 & 6F.1)

**Labels:** `phase2`, `entity`, `content`, `versioning`, `prisma`, `backend`
**Assignees:** @Copilot
**Issue Number:** (To be assigned)

## 🎯 Context for AI Agent

**PRD Reference:** 
- Section 4.5 (ContentTask - Deliverable Container)
- Section 6F.1 (ContentArtifact - Versioned Submissions)

**Depends On:** 
- Campaign Entity (#phase2-campaign)
- Influencer Profile Entity (#phase2-influencer)

**Blocks:** 
- ApprovalItem Entity (needs ContentArtifact references)

**Files to Create/Modify:**
- `prisma/schema.prisma` - Add ContentTask and ContentArtifact models
- `prisma/migrations/` - Auto-generated migration files

## ✅ Acceptance Criteria

- [ ] ContentTask model as deliverable-level execution unit
- [ ] ContentArtifact model with append-only versioning
- [ ] Artifact type enum (SCRIPT, VIDEO_DRAFT, FINAL_CONTENT)
- [ ] Unique constraint on [contentTaskId, artifactType, version]
- [ ] Immutable artifact design (no updates, only new versions)
- [ ] Relations to Campaign, Influencer, and ApprovalItem
- [ ] Prisma migration applies cleanly
- [ ] Schema validates successfully

## 📝 Complete Prisma Models

```prisma
// Content Task Status Enum
enum ContentTaskStatus {
  NOT_STARTED
  IN_PROGRESS
  SUBMITTED
  UNDER_REVIEW
  REVISION_REQUESTED
  APPROVED
  PUBLISHED
  REJECTED
}

// Artifact Type Enum
enum ArtifactType {
  SCRIPT              // Written script/storyboard
  VIDEO_DRAFT         // Draft video submission
  FINAL_CONTENT       // Final approved content
  THUMBNAIL           // Content thumbnail
  CAPTION             // Written caption/description
  HASHTAGS            // Hashtag list
}

// Content Platform Enum
enum ContentPlatform {
  INSTAGRAM_REEL
  INSTAGRAM_POST
  INSTAGRAM_STORY
  TIKTOK_VIDEO
  YOUTUBE_SHORT
  YOUTUBE_VIDEO
  TWITTER_POST
  FACEBOOK_POST
}

// ContentTask Model - Deliverable Container
model ContentTask {
  id                    String              @id @default(uuid()) @map("content_task_id")
  
  // Relationships
  campaignId            String              @map("campaign_id")
  campaign              Campaign            @relation(fields: [campaignId], references: [id])
  
  influencerId          String              @map("influencer_id")
  influencer            Influencer          @relation(fields: [influencerId], references: [id])
  
  // Task Details
  taskName              String              @map("task_name")
  description           String?
  platform              ContentPlatform
  deliverableType       String              @map("deliverable_type")  // e.g., "Reel", "Story", "Post"
  
  // Status & Workflow
  status                ContentTaskStatus   @default(NOT_STARTED)
  priority              Int                 @default(0)  // For sorting/ordering
  
  // Deadlines
  dueDate               DateTime?           @map("due_date")
  scriptDueDate         DateTime?           @map("script_due_date")
  contentDueDate        DateTime?           @map("content_due_date")
  publishDate           DateTime?           @map("publish_date")
  
  // Brief/Guidelines
  briefUrl              String?             @map("brief_url")
  guidelines            String?
  keyMessages           String[]            @map("key_messages")
  brandHashtags         String[]            @map("brand_hashtags")
  
  // Publishing Details
  publishedUrl          String?             @map("published_url")
  publishedAt           DateTime?           @map("published_at")
  
  // Performance Metrics (populated post-publish)
  views                 Int?
  likes                 Int?
  comments              Int?
  shares                Int?
  saves                 Int?
  reach                 Int?
  impressions           Int?
  engagementRate        Float?              @map("engagement_rate")
  
  // Relations
  artifacts             ContentArtifact[]
  approvalItems         ApprovalItem[]
  
  // Audit Fields
  createdAt             DateTime            @default(now()) @map("created_at")
  updatedAt             DateTime            @updatedAt @map("updated_at")
  createdBy             String?             @map("created_by")
  updatedBy             String?             @map("updated_by")

  @@map("content_tasks")
  @@index([campaignId])
  @@index([influencerId])
  @@index([status])
  @@index([dueDate])
}

// ContentArtifact Model - Versioned, Immutable Submissions
model ContentArtifact {
  id                    String              @id @default(uuid()) @map("artifact_id")
  
  // Relationships
  contentTaskId         String              @map("content_task_id")
  contentTask           ContentTask         @relation(fields: [contentTaskId], references: [id])
  
  // Artifact Identity
  artifactType          ArtifactType        @map("artifact_type")
  version               Int                 @default(1)
  
  // File Details
  fileUrl               String              @map("file_url")
  fileName              String?             @map("file_name")
  fileSize              Int?                @map("file_size")     // bytes
  mimeType              String?             @map("mime_type")
  duration              Int?                // seconds (for video/audio)
  
  // Content Metadata
  caption               String?
  hashtags              String[]
  mentions              String[]
  thumbnail             String?             // URL for video thumbnail
  
  // Submission Details
  submittedBy           String              @map("submitted_by")  // InfluencerID or UserID
  submittedAt           DateTime            @default(now()) @map("submitted_at")
  submissionNotes       String?             @map("submission_notes")
  
  // Review Status
  reviewStatus          String              @default("PENDING")  // PENDING, APPROVED, REJECTED, SUPERSEDED
  reviewedBy            String?             @map("reviewed_by")
  reviewedAt            DateTime?           @map("reviewed_at")
  reviewNotes           String?             @map("review_notes")
  
  // Relations
  approvalItems         ApprovalItem[]
  
  // Immutability Marker
  isSuperseded          Boolean             @default(false) @map("is_superseded")
  supersededBy          String?             @map("superseded_by")  // ArtifactID of newer version
  
  // Audit Fields
  createdAt             DateTime            @default(now()) @map("created_at")

  @@unique([contentTaskId, artifactType, version])
  @@map("content_artifacts")
  @@index([contentTaskId])
  @@index([artifactType])
  @@index([reviewStatus])
}
```

## 🔧 Implementation Steps

1. **Add enums and models to schema.prisma**
   - Add ContentTaskStatus, ArtifactType, ContentPlatform enums
   - Add ContentTask model
   - Add ContentArtifact model
   - Ensure proper ordering

2. **Update related models**
   - Add to Campaign model:
   ```prisma
   contentTasks  ContentTask[]
   ```
   - Add to Influencer model:
   ```prisma
   contentTasks  ContentTask[]
   ```

3. **Create and apply migration**
   ```bash
   cd backend
   npx prisma migrate dev --name add-content-models
   ```

4. **Validate schema**
   ```bash
   npx prisma validate
   npx prisma format
   ```

5. **Test versioning logic**
   - Create a ContentTask
   - Create version 1 of a SCRIPT artifact
   - Create version 2 of the same SCRIPT artifact
   - Verify unique constraint prevents duplicate versions
   - Mark version 1 as superseded

6. **Verify in Prisma Studio**
   ```bash
   npx prisma studio
   ```

## Dependencies

**Blocked By:**
- Phase 2.2 - Campaign Entity Model
- Phase 2.3 - Influencer Profile Entity Model

**Blocks:**
- Phase 2.5 - ApprovalItem Entity Model (requires artifact references)

## Notes for AI Agent

- **Append-Only Versioning:** ContentArtifacts are NEVER updated. New versions are created with incremented version number.
- **Unique Constraint:** The combination of [contentTaskId, artifactType, version] must be unique to prevent version conflicts.
- **Immutability:** Once created, artifacts should not be modified. Use `isSuperseded` and `supersededBy` for version tracking.
- **Version Management:** When a new version is submitted:
  1. Create new artifact with version = previous version + 1
  2. Set `isSuperseded = true` on previous version
  3. Set `supersededBy` on previous version to new artifact ID
- **Review Workflow:** Artifacts start as PENDING, move to APPROVED/REJECTED, or SUPERSEDED when new version uploaded
- **File Storage:** fileUrl should point to cloud storage (S3, Azure Blob, etc.)
- **Performance Metrics:** Only populated after content is published
- **Audit Trail:** ContentTask has updatedAt (mutable), ContentArtifact only has createdAt (immutable)
