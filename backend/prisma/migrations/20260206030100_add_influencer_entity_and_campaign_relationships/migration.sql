-- CreateTable
CREATE TABLE "influencers" (
    "influencer_id" TEXT NOT NULL PRIMARY KEY,
    "full_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "bio" TEXT,
    "profile_image_url" TEXT,
    "city" TEXT,
    "country" TEXT,
    "social_media_handles" TEXT,
    "primary_platform" TEXT,
    "audience_metrics" TEXT,
    "content_categories" TEXT,
    "performance_history" TEXT,
    "availability_status" TEXT NOT NULL DEFAULT 'available',
    "rate_per_post" REAL,
    "rate_per_video" REAL,
    "rate_per_story" REAL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "quality_score" REAL,
    "internal_notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "campaign_influencers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaign_id" TEXT NOT NULL,
    "influencer_id" TEXT NOT NULL,
    "role" TEXT,
    "collaboration_status" TEXT NOT NULL DEFAULT 'invited',
    "agreed_deliverables" TEXT,
    "delivered_content" TEXT,
    "agreed_payment" REAL,
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "performance_metrics" TEXT,
    "invited_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" DATETIME,
    "completed_at" DATETIME,
    CONSTRAINT "campaign_influencers_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("campaign_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "campaign_influencers_influencer_id_fkey" FOREIGN KEY ("influencer_id") REFERENCES "influencers" ("influencer_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "influencers_email_key" ON "influencers"("email");

-- CreateIndex
CREATE INDEX "influencers_primary_platform_idx" ON "influencers"("primary_platform");

-- CreateIndex
CREATE INDEX "influencers_availability_status_idx" ON "influencers"("availability_status");

-- CreateIndex
CREATE INDEX "influencers_is_verified_idx" ON "influencers"("is_verified");

-- CreateIndex
CREATE INDEX "campaign_influencers_campaign_id_idx" ON "campaign_influencers"("campaign_id");

-- CreateIndex
CREATE INDEX "campaign_influencers_influencer_id_idx" ON "campaign_influencers"("influencer_id");

-- CreateIndex
CREATE INDEX "campaign_influencers_collaboration_status_idx" ON "campaign_influencers"("collaboration_status");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_influencers_campaign_id_influencer_id_key" ON "campaign_influencers"("campaign_id", "influencer_id");
