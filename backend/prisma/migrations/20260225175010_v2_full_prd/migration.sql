-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'in_review', 'pitching', 'live', 'reporting', 'closed', 'paused', 'cancelled');

-- CreateEnum
CREATE TYPE "CampaignPhase" AS ENUM ('brief_intake', 'ai_structuring', 'budget_review', 'influencer_matching', 'client_pitching', 'content_production', 'performance_tracking', 'report_generation', 'closure');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('director', 'campaign_manager', 'reviewer', 'finance', 'client', 'influencer');

-- CreateEnum
CREATE TYPE "InfluencerLifecycleStatus" AS ENUM ('proposed', 'approved', 'contracted', 'brief_accepted', 'live', 'completed');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('script', 'video_draft', 'final');

-- CreateEnum
CREATE TYPE "ContentApprovalStatus" AS ENUM ('pending', 'internal_approved', 'client_approved', 'changes_requested');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('client', 'influencer');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'sent', 'approved', 'paid');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('draft', 'pending_approval', 'approved', 'exported');

-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('budget', 'shortlist', 'content_internal', 'content_client', 'report', 'exception', 'high_risk_override', 'registration');

-- CreateEnum
CREATE TYPE "KPISource" AS ENUM ('manual', 'auto');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('complete', 'stub');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('company', 'individual');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "ExceptionType" AS ENUM ('urgent_posting', 'verbal_approval', 'client_timeout');

-- Data migration: map old campaign status values to V2 enum values BEFORE type conversion
UPDATE "campaigns" SET "status" = 'live' WHERE "status" = 'active';
UPDATE "campaigns" SET "status" = 'closed' WHERE "status" = 'completed';

-- Drop old index on status (will be recreated below)
DROP INDEX IF EXISTS "campaigns_status_idx";

-- AlterTable briefs
ALTER TABLE "briefs" ADD COLUMN     "budget_signals" TEXT,
ADD COLUMN     "client_info" TEXT,
ADD COLUMN     "confidence_scores" TEXT,
ADD COLUMN     "deliverables" TEXT,
ADD COLUMN     "extraction_status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "file_url" TEXT,
ADD COLUMN     "is_reviewed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reviewed_by" TEXT;

-- AlterTable campaign_influencers
ALTER TABLE "campaign_influencers" ADD COLUMN     "agreed_cost" DOUBLE PRECISION,
ADD COLUMN     "ai_match_rationale" TEXT,
ADD COLUMN     "ai_match_score" DOUBLE PRECISION,
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "brief_accepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "brief_accepted_at" TIMESTAMP(3),
ADD COLUMN     "contract_status" TEXT,
ADD COLUMN     "contracted_at" TIMESTAMP(3),
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "estimated_cost" DOUBLE PRECISION,
ADD COLUMN     "live_at" TIMESTAMP(3),
ADD COLUMN     "post_platform" TEXT,
ADD COLUMN     "scheduled_post_date" TIMESTAMP(3),
ADD COLUMN     "status" "InfluencerLifecycleStatus" NOT NULL DEFAULT 'proposed',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable campaigns (add new columns, make client_id nullable)
ALTER TABLE "campaigns" ADD COLUMN     "closed_at" TIMESTAMP(3),
ADD COLUMN     "display_id" TEXT,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "management_fee" DOUBLE PRECISION NOT NULL DEFAULT 30,
ADD COLUMN     "owner_id" TEXT,
ADD COLUMN     "phase" "CampaignPhase" NOT NULL DEFAULT 'brief_intake',
ADD COLUMN     "risk_level" "RiskLevel" NOT NULL DEFAULT 'low',
ADD COLUMN     "risk_score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "client_id" DROP NOT NULL;

-- Convert campaign status column from TEXT to CampaignStatus enum (preserving data)
ALTER TABLE "campaigns" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "campaigns" ALTER COLUMN "status" TYPE "CampaignStatus" USING "status"::"CampaignStatus";
ALTER TABLE "campaigns" ALTER COLUMN "status" SET DEFAULT 'draft'::"CampaignStatus";

-- AlterTable clients
ALTER TABLE "clients" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "display_id" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "type" "ClientType" NOT NULL DEFAULT 'company';

-- AlterTable content
ALTER TABLE "content" ADD COLUMN     "campaign_id" TEXT,
ADD COLUMN     "exception_approved_by" TEXT,
ADD COLUMN     "exception_evidence" TEXT,
ADD COLUMN     "exception_type" "ExceptionType",
ADD COLUMN     "file_name" TEXT,
ADD COLUMN     "file_size_bytes" INTEGER,
ADD COLUMN     "filming_blocked" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "posting_blocked" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable influencers
ALTER TABLE "influencers" ADD COLUMN     "agent_contact" TEXT,
ADD COLUMN     "display_id" TEXT,
ADD COLUMN     "engagement_rate" DOUBLE PRECISION,
ADD COLUMN     "follower_count" INTEGER,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "geo" TEXT,
ADD COLUMN     "handle" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "niches" TEXT,
ADD COLUMN     "platform" TEXT NOT NULL DEFAULT 'instagram',
ADD COLUMN     "profile_status" "ProfileStatus" NOT NULL DEFAULT 'stub',
ADD COLUMN     "rate_card" TEXT,
ADD COLUMN     "representation" TEXT DEFAULT 'direct',
ADD COLUMN     "sociata_profile_url" TEXT,
ADD COLUMN     "tier" TEXT,
ADD COLUMN     "tiktok_handle" TEXT,
ADD COLUMN     "tiktok_link" TEXT;

-- AlterTable invoices
ALTER TABLE "invoices" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'AED',
ADD COLUMN     "display_id" TEXT;

-- AlterTable notifications
ALTER TABLE "notifications" ADD COLUMN     "campaign_id" TEXT,
ADD COLUMN     "entity_id" TEXT,
ADD COLUMN     "entity_type" TEXT,
ADD COLUMN     "escalation_level" INTEGER,
ADD COLUMN     "is_escalation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable users
ALTER TABLE "users" ADD COLUMN     "failed_login_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "locked_until" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "RoleName" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_registrations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT,
    "vat_trn_number" TEXT,
    "license_number" TEXT,
    "expiry_date" TIMESTAMP(3),
    "business_address" TEXT,
    "activities" TEXT,
    "owner_names" TEXT,
    "license_file_url" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'pending',
    "reviewed_by" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "company_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_client_assignments" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "client_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "campaign_client_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brief_versions" (
    "id" TEXT NOT NULL,
    "brief_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "objectives" TEXT,
    "kpis" TEXT,
    "target_audience" TEXT,
    "deliverables" TEXT,
    "budget_signals" TEXT,
    "client_info" TEXT,
    "key_messages" TEXT,
    "content_pillars" TEXT,
    "matching_criteria" TEXT,
    "changed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "brief_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategies" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "summary" TEXT,
    "key_messages" TEXT,
    "content_pillars" TEXT,
    "matching_criteria" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "strategies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpis" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "campaign_influencer_id" TEXT,
    "reach" INTEGER,
    "impressions" INTEGER,
    "engagement" INTEGER,
    "clicks" INTEGER,
    "capture_day" INTEGER,
    "source" "KPISource" NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_schedules" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "campaign_influencer_id" TEXT NOT NULL,
    "capture_day" INTEGER NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "captured_at" TIMESTAMP(3),
    "is_failed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kpi_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'draft',
    "kpi_summary" TEXT,
    "highlights" TEXT,
    "ai_narrative" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "exported_at" TIMESTAMP(3),
    "shareable_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_revisions" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "previous_budget" DOUBLE PRECISION NOT NULL,
    "new_budget" DOUBLE PRECISION NOT NULL,
    "changed_by" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "budget_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "type" "ApprovalType" NOT NULL,
    "entity_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approved_by" TEXT,
    "rejected_by" TEXT,
    "reason" TEXT,
    "evidence" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" TIMESTAMP(3) NOT NULL,
    "is_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cx_surveys" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "overall_score" INTEGER NOT NULL,
    "communication_score" INTEGER NOT NULL,
    "quality_score" INTEGER NOT NULL,
    "timeliness_score" INTEGER NOT NULL,
    "value_score" INTEGER NOT NULL,
    "testimonial" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cx_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_mortems" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "went_well" TEXT,
    "improvements" TEXT,
    "lessons" TEXT,
    "action_items" TEXT,
    "risk_notes" TEXT,
    "budget_analysis" TEXT,
    "timeline_analysis" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "post_mortems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "changes" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instagram_connections" (
    "id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "token_expiry" TIMESTAMP(3),
    "ig_user_id" TEXT,
    "ig_username" TEXT,
    "page_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "instagram_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_key" ON "user_roles"("user_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_registrations_user_id_key" ON "company_registrations"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_client_assignments_campaign_id_client_id_key" ON "campaign_client_assignments"("campaign_id", "client_id");

-- CreateIndex
CREATE UNIQUE INDEX "strategies_campaign_id_key" ON "strategies"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "cx_surveys_campaign_id_key" ON "cx_surveys"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_mortems_campaign_id_key" ON "post_mortems"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_display_id_key" ON "campaigns"("display_id");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE UNIQUE INDEX "clients_display_id_key" ON "clients"("display_id");

-- CreateIndex
CREATE UNIQUE INDEX "influencers_display_id_key" ON "influencers"("display_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_display_id_key" ON "invoices"("display_id");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_registrations" ADD CONSTRAINT "company_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_client_assignments" ADD CONSTRAINT "campaign_client_assignments_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("campaign_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_client_assignments" ADD CONSTRAINT "campaign_client_assignments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brief_versions" ADD CONSTRAINT "brief_versions_brief_id_fkey" FOREIGN KEY ("brief_id") REFERENCES "briefs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategies" ADD CONSTRAINT "strategies_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("campaign_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content" ADD CONSTRAINT "content_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("campaign_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpis" ADD CONSTRAINT "kpis_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("campaign_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpis" ADD CONSTRAINT "kpis_campaign_influencer_id_fkey" FOREIGN KEY ("campaign_influencer_id") REFERENCES "campaign_influencers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_schedules" ADD CONSTRAINT "kpi_schedules_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("campaign_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("campaign_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_revisions" ADD CONSTRAINT "budget_revisions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("campaign_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("campaign_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("campaign_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("campaign_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cx_surveys" ADD CONSTRAINT "cx_surveys_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("campaign_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_mortems" ADD CONSTRAINT "post_mortems_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("campaign_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
