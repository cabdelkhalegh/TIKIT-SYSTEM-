/*
  Warnings:

  - You are about to drop the column `active_client_id` on the `campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `campaign_title` on the `campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `completed_client_id` on the `campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `record_created_at` on the `campaigns` table. All the data in the column will be lost.
  - Added the required column `campaign_name` to the `campaigns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `client_id` to the `campaigns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `campaigns` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_campaigns" (
    "campaign_id" TEXT NOT NULL PRIMARY KEY,
    "campaign_name" TEXT NOT NULL,
    "campaign_description" TEXT,
    "campaign_objectives" TEXT,
    "client_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "total_budget" REAL,
    "allocated_budget" REAL DEFAULT 0,
    "spent_budget" REAL DEFAULT 0,
    "start_date" DATETIME,
    "end_date" DATETIME,
    "launch_date" DATETIME,
    "target_audience_json" TEXT,
    "target_platforms_json" TEXT,
    "performance_kpis_json" TEXT,
    "actual_performance_json" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "campaigns_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("client_id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_campaigns" ("campaign_id") SELECT "campaign_id" FROM "campaigns";
DROP TABLE "campaigns";
ALTER TABLE "new_campaigns" RENAME TO "campaigns";
CREATE INDEX "campaigns_client_id_idx" ON "campaigns"("client_id");
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
