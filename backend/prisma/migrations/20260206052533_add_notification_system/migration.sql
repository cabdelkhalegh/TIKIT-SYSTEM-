-- CreateTable
CREATE TABLE "notifications" (
    "notification_id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "notification_type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "action_url" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "preference_id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "email_campaign" BOOLEAN NOT NULL DEFAULT true,
    "email_collaboration" BOOLEAN NOT NULL DEFAULT true,
    "email_payment" BOOLEAN NOT NULL DEFAULT true,
    "email_system" BOOLEAN NOT NULL DEFAULT true,
    "inapp_campaign" BOOLEAN NOT NULL DEFAULT true,
    "inapp_collaboration" BOOLEAN NOT NULL DEFAULT true,
    "inapp_payment" BOOLEAN NOT NULL DEFAULT true,
    "inapp_system" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");
