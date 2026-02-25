-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "display_name" TEXT,
    "profile_image_url" TEXT,
    "role" TEXT NOT NULL DEFAULT 'client_manager',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "managed_client_id" TEXT,
    "managed_influencer_id" TEXT,
    "last_login_at" TIMESTAMP(3),
    "password_reset_token" TEXT,
    "password_reset_expires" TIMESTAMP(3),
    "email_verification_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "clients" (
    "client_id" TEXT NOT NULL,
    "legal_company_name" TEXT NOT NULL,
    "brand_display_name" TEXT NOT NULL,
    "industry_vertical" TEXT,
    "primary_contact_emails" TEXT NOT NULL,
    "billing_contact_emails" TEXT NOT NULL,
    "preferred_comm_channels" TEXT NOT NULL,
    "total_ad_spend" DOUBLE PRECISION DEFAULT 0,
    "performance_metrics_json" TEXT,
    "account_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("client_id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "campaign_id" TEXT NOT NULL,
    "campaign_name" TEXT NOT NULL,
    "campaign_description" TEXT,
    "campaign_objectives" TEXT,
    "client_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "total_budget" DOUBLE PRECISION,
    "allocated_budget" DOUBLE PRECISION DEFAULT 0,
    "spent_budget" DOUBLE PRECISION DEFAULT 0,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "launch_date" TIMESTAMP(3),
    "target_audience_json" TEXT,
    "target_platforms_json" TEXT,
    "performance_kpis_json" TEXT,
    "actual_performance_json" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("campaign_id")
);

-- CreateTable
CREATE TABLE "influencers" (
    "influencer_id" TEXT NOT NULL,
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
    "rate_per_post" DOUBLE PRECISION,
    "rate_per_video" DOUBLE PRECISION,
    "rate_per_story" DOUBLE PRECISION,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "quality_score" DOUBLE PRECISION,
    "internal_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "influencers_pkey" PRIMARY KEY ("influencer_id")
);

-- CreateTable
CREATE TABLE "campaign_influencers" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "influencer_id" TEXT NOT NULL,
    "role" TEXT,
    "collaboration_status" TEXT NOT NULL DEFAULT 'invited',
    "agreed_deliverables" TEXT,
    "delivered_content" TEXT,
    "agreed_payment" DOUBLE PRECISION,
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "performance_metrics" TEXT,
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "campaign_influencers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notification_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "notification_type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "action_url" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "preference_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email_campaign" BOOLEAN NOT NULL DEFAULT true,
    "email_collaboration" BOOLEAN NOT NULL DEFAULT true,
    "email_payment" BOOLEAN NOT NULL DEFAULT true,
    "email_system" BOOLEAN NOT NULL DEFAULT true,
    "inapp_campaign" BOOLEAN NOT NULL DEFAULT true,
    "inapp_collaboration" BOOLEAN NOT NULL DEFAULT true,
    "inapp_payment" BOOLEAN NOT NULL DEFAULT true,
    "inapp_system" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("preference_id")
);

-- CreateTable
CREATE TABLE "media" (
    "media_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "purpose" TEXT NOT NULL DEFAULT 'general',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("media_id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "amount" DOUBLE PRECISION NOT NULL,
    "due_date" TIMESTAMP(3),
    "file_url" TEXT,
    "notes" TEXT,
    "campaign_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "approval_status" TEXT NOT NULL DEFAULT 'pending',
    "internal_feedback" TEXT,
    "client_feedback" TEXT,
    "live_post_url" TEXT,
    "file_url" TEXT,
    "description" TEXT,
    "collaboration_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "briefs" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "raw_text" TEXT,
    "file_name" TEXT,
    "objectives" TEXT,
    "kpis" TEXT,
    "target_audience" TEXT,
    "key_messages" TEXT,
    "content_pillars" TEXT,
    "matching_criteria" TEXT,
    "strategy" TEXT,
    "ai_status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "briefs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_managed_client_id_idx" ON "users"("managed_client_id");

-- CreateIndex
CREATE INDEX "users_managed_influencer_id_idx" ON "users"("managed_influencer_id");

-- CreateIndex
CREATE INDEX "campaigns_client_id_idx" ON "campaigns"("client_id");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

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

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE INDEX "media_user_id_idx" ON "media"("user_id");

-- CreateIndex
CREATE INDEX "media_entity_type_entity_id_idx" ON "media"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "media_purpose_idx" ON "media"("purpose");

-- CreateIndex
CREATE INDEX "invoices_campaign_id_idx" ON "invoices"("campaign_id");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "content_collaboration_id_idx" ON "content"("collaboration_id");

-- CreateIndex
CREATE INDEX "content_type_idx" ON "content"("type");

-- CreateIndex
CREATE INDEX "content_approval_status_idx" ON "content"("approval_status");

-- CreateIndex
CREATE INDEX "briefs_campaign_id_idx" ON "briefs"("campaign_id");

-- CreateIndex
CREATE INDEX "briefs_ai_status_idx" ON "briefs"("ai_status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_managed_client_id_fkey" FOREIGN KEY ("managed_client_id") REFERENCES "clients"("client_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_managed_influencer_id_fkey" FOREIGN KEY ("managed_influencer_id") REFERENCES "influencers"("influencer_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_influencers" ADD CONSTRAINT "campaign_influencers_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("campaign_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_influencers" ADD CONSTRAINT "campaign_influencers_influencer_id_fkey" FOREIGN KEY ("influencer_id") REFERENCES "influencers"("influencer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("campaign_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content" ADD CONSTRAINT "content_collaboration_id_fkey" FOREIGN KEY ("collaboration_id") REFERENCES "campaign_influencers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "briefs" ADD CONSTRAINT "briefs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("campaign_id") ON DELETE CASCADE ON UPDATE CASCADE;
