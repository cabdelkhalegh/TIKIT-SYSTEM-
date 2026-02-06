-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL PRIMARY KEY,
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
    "last_login_at" DATETIME,
    "password_reset_token" TEXT,
    "password_reset_expires" DATETIME,
    "email_verification_token" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "users_managed_client_id_fkey" FOREIGN KEY ("managed_client_id") REFERENCES "clients" ("client_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "users_managed_influencer_id_fkey" FOREIGN KEY ("managed_influencer_id") REFERENCES "influencers" ("influencer_id") ON DELETE SET NULL ON UPDATE CASCADE
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
