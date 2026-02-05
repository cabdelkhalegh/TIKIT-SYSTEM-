-- CreateTable
CREATE TABLE "clients" (
    "client_id" TEXT NOT NULL PRIMARY KEY,
    "legal_company_name" TEXT NOT NULL,
    "brand_display_name" TEXT NOT NULL,
    "industry_vertical" TEXT,
    "primary_contact_emails" TEXT NOT NULL,
    "billing_contact_emails" TEXT NOT NULL,
    "preferred_comm_channels" TEXT NOT NULL,
    "total_ad_spend" REAL DEFAULT 0,
    "performance_metrics_json" TEXT,
    "account_created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "campaigns" (
    "campaign_id" TEXT NOT NULL PRIMARY KEY,
    "campaign_title" TEXT NOT NULL,
    "active_client_id" TEXT,
    "completed_client_id" TEXT,
    "record_created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "campaigns_active_client_id_fkey" FOREIGN KEY ("active_client_id") REFERENCES "clients" ("client_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "campaigns_completed_client_id_fkey" FOREIGN KEY ("completed_client_id") REFERENCES "clients" ("client_id") ON DELETE SET NULL ON UPDATE CASCADE
);
