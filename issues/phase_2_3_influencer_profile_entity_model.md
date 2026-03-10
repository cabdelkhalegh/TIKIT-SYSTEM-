# Phase 2.3: Influencer Profile Entity Model (PRD Sections 4.3 & 4.4)

**Labels:** `phase2`, `entity`, `influencer`, `prisma`, `backend`
**Assignees:** @Copilot
**Issue Number:** (To be assigned)

## 🎯 Context for AI Agent

**PRD Reference:** 
- Section 4.3 (Influencer Profile Object)
- Section 4.4 (Influencer-Campaign Relationship)

**Depends On:** 
- #17 (Prisma Initialization)

**Blocks:** 
- ContentTask Entity (influencer assignment)
- FinancialObject Entity (influencer costs/invoices)

**Files to Create/Modify:**
- `prisma/schema.prisma` - Add Influencer, InfluencerPricing, InfluencerAssignment models
- `prisma/migrations/` - Auto-generated migration files

## ✅ Acceptance Criteria

- [ ] Influencer model with profileCompleteness enum (STUB/FULL)
- [ ] Support for both stub profiles (minimal data) and full profiles (complete data)
- [ ] InfluencerPricing model for campaign-specific pricing history
- [ ] InfluencerAssignment model for influencer-campaign relationship
- [ ] Social media platform data structures
- [ ] Performance metrics fields
- [ ] Unique constraints on social handles
- [ ] Prisma migration applies cleanly
- [ ] Schema validates successfully

## 📝 Complete Prisma Models

```prisma
// Profile Completeness Enum
enum ProfileCompleteness {
  STUB    // Minimal data for quick shortlisting
  FULL    // Complete profile with all details
}

// Social Platform Enum
enum SocialPlatform {
  INSTAGRAM
  TIKTOK
  YOUTUBE
  TWITTER
  FACEBOOK
  LINKEDIN
}

// Influencer Model
model Influencer {
  id                        String                  @id @default(uuid()) @map("influencer_id")
  
  // Profile Type
  profileCompleteness       ProfileCompleteness     @default(STUB) @map("profile_completeness")
  
  // Basic Information (STUB level)
  fullName                  String                  @map("full_name")
  email                     String?                 @unique
  phoneNumber               String?                 @map("phone_number")
  
  // Social Media Handles (STUB level)
  instagramHandle           String?                 @unique @map("instagram_handle")
  tiktokHandle              String?                 @unique @map("tiktok_handle")
  youtubeHandle             String?                 @unique @map("youtube_handle")
  twitterHandle             String?                 @unique @map("twitter_handle")
  
  // Follower Counts (STUB level - snapshot at creation)
  instagramFollowers        Int?                    @map("instagram_followers")
  tiktokFollowers           Int?                    @map("tiktok_followers")
  youtubeSubscribers        Int?                    @map("youtube_subscribers")
  twitterFollowers          Int?                    @map("twitter_followers")
  
  // FULL Profile Fields
  bio                       String?
  location                  String?
  categories                String[]                // e.g., ["Fashion", "Lifestyle", "Beauty"]
  languages                 String[]                // e.g., ["English", "Spanish"]
  timezone                  String?
  
  // Engagement Metrics (FULL profile)
  avgEngagementRate         Float?                  @map("avg_engagement_rate")
  avgViews                  Float?                  @map("avg_views")
  avgLikes                  Float?                  @map("avg_likes")
  avgComments               Float?                  @map("avg_comments")
  avgShares                 Float?                  @map("avg_shares")
  
  // Audience Demographics (FULL profile - JSON)
  audienceDemographics      Json?                   @map("audience_demographics")
  // Example: { "age": {"18-24": 30, "25-34": 45, ...}, "gender": {"F": 60, "M": 40}, "countries": {"US": 50, "CA": 20, ...} }
  
  // Performance History (FULL profile - JSON)
  performanceHistory        Json?                   @map("performance_history")
  // Example: [{ "campaignId": "...", "date": "2024-01-15", "reach": 50000, "engagement": 2500, ... }]
  
  // Contract & Payment Info (FULL profile)
  preferredPaymentMethod    String?                 @map("preferred_payment_method")
  taxId                     String?                 @map("tax_id")
  businessEntity            String?                 @map("business_entity")
  
  // Relations
  assignments               InfluencerAssignment[]
  pricingHistory            InfluencerPricing[]
  contentTasks              ContentTask[]
  financialObjects          FinancialObject[]
  
  // Metadata
  notes                     String?                 // Internal notes
  tags                      String[]                // For categorization/search
  
  // Audit Fields
  createdAt                 DateTime                @default(now()) @map("created_at")
  updatedAt                 DateTime                @updatedAt @map("updated_at")
  createdBy                 String?                 @map("created_by")
  updatedBy                 String?                 @map("updated_by")

  @@map("influencers")
  @@index([profileCompleteness])
  @@index([instagramHandle])
  @@index([tiktokHandle])
}

// Influencer Pricing Model - Campaign-specific pricing history
model InfluencerPricing {
  id                    String      @id @default(uuid())
  
  // Relationships
  influencerId          String      @map("influencer_id")
  influencer            Influencer  @relation(fields: [influencerId], references: [id])
  
  campaignId            String?     @map("campaign_id")
  campaign              Campaign?   @relation(fields: [campaignId], references: [id])
  
  // Pricing Details
  platform              SocialPlatform
  deliverableType       String      @map("deliverable_type")  // e.g., "Reel", "Story", "Post", "Video"
  quotedPrice           Float       @map("quoted_price")
  negotiatedPrice       Float?      @map("negotiated_price")
  finalPrice            Float?      @map("final_price")
  currency              String      @default("USD")
  
  // Context
  quotedAt              DateTime    @map("quoted_at")
  validUntil            DateTime?   @map("valid_until")
  notes                 String?
  
  // Audit
  createdAt             DateTime    @default(now()) @map("created_at")
  
  @@map("influencer_pricing")
  @@index([influencerId])
  @@index([campaignId])
}

// Influencer Assignment Model - Influencer-Campaign Relationship
model InfluencerAssignment {
  id                        String      @id @default(uuid())
  
  // Relationships
  influencerId              String      @map("influencer_id")
  influencer                Influencer  @relation(fields: [influencerId], references: [id])
  
  campaignId                String      @map("campaign_id")
  campaign                  Campaign    @relation(fields: [campaignId], references: [id])
  
  // Assignment Details
  role                      String?     // e.g., "Lead Creator", "Supporting Creator"
  status                    String      @default("SHORTLISTED")  // SHORTLISTED, CONTACTED, NEGOTIATING, CONTRACTED, ACTIVE, COMPLETED
  
  // Contract Details
  contractSigned            Boolean     @default(false) @map("contract_signed")
  contractSignedDate        DateTime?   @map("contract_signed_date")
  contractUrl               String?     @map("contract_url")
  
  // Deliverables Summary
  expectedDeliverables      Int?        @map("expected_deliverables")  // Number of content pieces
  completedDeliverables     Int         @default(0) @map("completed_deliverables")
  
  // Performance Tracking (populated post-campaign)
  totalReach                Int?        @map("total_reach")
  totalEngagement           Int?        @map("total_engagement")
  totalViews                Int?        @map("total_views")
  performanceRating         Float?      @map("performance_rating")    // 1-5 scale
  
  // Audit Fields
  assignedAt                DateTime    @default(now()) @map("assigned_at")
  completedAt               DateTime?   @map("completed_at")
  createdBy                 String?     @map("created_by")
  updatedBy                 String?     @map("updated_by")
  
  @@unique([influencerId, campaignId])
  @@map("influencer_assignments")
  @@index([campaignId])
  @@index([influencerId])
  @@index([status])
}
```

## 🔧 Implementation Steps

1. **Add models to schema.prisma**
   - Add ProfileCompleteness and SocialPlatform enums
   - Add Influencer model
   - Add InfluencerPricing model
   - Add InfluencerAssignment model
   - Ensure proper ordering (enums first, then models)

2. **Update Campaign model relationship**
   - Add to Campaign model:
   ```prisma
   influencerAssignments  InfluencerAssignment[]
   influencerPricing      InfluencerPricing[]
   ```

3. **Create and apply migration**
   ```bash
   cd backend
   npx prisma migrate dev --name add-influencer-models
   ```

4. **Validate schema**
   ```bash
   npx prisma validate
   npx prisma format
   ```

5. **Test with seed data**
   - Create 1 STUB profile (minimal data)
   - Create 2 FULL profiles (complete data)
   - Verify unique constraints work
   - Test assignment relationships

6. **Verify in Prisma Studio**
   ```bash
   npx prisma studio
   ```

## Dependencies

**Blocked By:**
- #17 - Prisma Initialization

**Blocks:**
- Phase 2.4 - ContentTask & ContentArtifact Models
- Phase 2.6 - FinancialObject Entity Model

## Notes for AI Agent

- **STUB vs FULL Profiles:** STUB profiles allow quick shortlisting without complete data collection. Profile can be upgraded from STUB to FULL.
- **Pricing History:** Track all pricing interactions per campaign to build historical data
- **Assignment Model:** The join table between Influencer and Campaign with rich metadata
- **Unique Constraints:** Social handles must be unique to prevent duplicates
- **JSON Fields:** Use for flexible demographic and performance data structures
- **Performance Metrics:** Some fields only populated post-campaign completion
- **Audit Trail:** Track who created/modified influencer records
