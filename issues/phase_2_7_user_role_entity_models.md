# Phase 2.7: User & Role Entity Models (PRD Section 3)

**Labels:** `phase2`, `entity`, `user`, `role`, `auth`, `prisma`, `backend`
**Assignees:** @Copilot
**Issue Number:** (To be assigned)

## 🎯 Context for AI Agent

**PRD Reference:** Section 3 (User Roles & Permissions)

**Depends On:** 
- #17 (Prisma Initialization)

**Blocks:** 
- #19 (Auth framework will use these models)

**Files to Create/Modify:**
- `prisma/schema.prisma` - Add TiKiTUser, TiKiTRole, UserRoleBinding models
- `prisma/seeds/roles.seed.ts` - Seed script for default roles
- `prisma/migrations/` - Auto-generated migration files

## ✅ Acceptance Criteria

- [ ] TiKiTUser model with authentication fields
- [ ] TiKiTRole model with CM, DIR, FIN, ADM, CLIENT, INF roles
- [ ] UserRoleBinding model for many-to-many relationship
- [ ] Permission flags per role
- [ ] Seed script for default roles in `prisma/seeds/roles.seed.ts`
- [ ] Email uniqueness constraint
- [ ] Role-based access control structure
- [ ] Prisma migration applies cleanly
- [ ] Schema validates successfully

## 📝 Complete Prisma Models

```prisma
// TiKiT OS Role Types - Matches PRD Section 3
enum TiKiTRoleType {
  CM          // Campaign Manager - primary campaign operator
  DIR         // Director - oversight and approvals
  FIN         // Finance - budget and payment management
  ADM         // Admin - system administration
  CLIENT      // Client - external client user
  INF         // Influencer - content creator user
}

// Account Status for TiKiT Users
enum TiKiTAccountStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  PENDING_VERIFICATION
  LOCKED
}

// TiKiTUser Model - Authentication & Profile
model TiKiTUser {
  tikitUserId               String                  @id @default(uuid()) @map("tikit_user_id")
  
  // Authentication Credentials
  emailAddress              String                  @unique @map("email_address")
  passwordHashBcrypt        String                  @map("password_hash_bcrypt")
  totpSecretKey             String?                 @map("totp_secret_key")
  mfaEnabledFlag            Boolean                 @default(false) @map("mfa_enabled_flag")
  
  // Profile Information
  displayFullName           String                  @map("display_full_name")
  preferredFirstName        String?                 @map("preferred_first_name")
  phoneContact              String?                 @map("phone_contact")
  avatarImageUrl            String?                 @map("avatar_image_url")
  
  // Account Management
  accountStatusCode         TiKiTAccountStatus      @default(PENDING_VERIFICATION) @map("account_status_code")
  emailVerifiedFlag         Boolean                 @default(false) @map("email_verified_flag")
  emailVerificationToken    String?                 @map("email_verification_token")
  emailVerifiedTimestamp    DateTime?               @map("email_verified_timestamp")
  
  // Password Reset
  passwordResetToken        String?                 @map("password_reset_token")
  passwordResetExpiresAt    DateTime?               @map("password_reset_expires_at")
  
  // Session & Security
  lastLoginTimestamp        DateTime?               @map("last_login_timestamp")
  lastLoginIpAddress        String?                 @map("last_login_ip_address")
  failedLoginAttempts       Int                     @default(0) @map("failed_login_attempts")
  accountLockedUntil        DateTime?               @map("account_locked_until")
  
  // Preferences
  timezonePreference        String                  @default("UTC") @map("timezone_preference")
  localePreference          String                  @default("en-US") @map("locale_preference")
  notificationSettings      Json?                   @map("notification_settings")
  
  // Relations
  roleBindings              UserRoleBinding[]
  
  // Audit Trail
  accountCreatedAt          DateTime                @default(now()) @map("account_created_at")
  accountUpdatedAt          DateTime                @updatedAt @map("account_updated_at")
  createdByUserId           String?                 @map("created_by_user_id")
  lastModifiedByUserId      String?                 @map("last_modified_by_user_id")

  @@map("tikit_users")
  @@index([emailAddress])
  @@index([accountStatusCode])
}

// TiKiTRole Model - Role Definitions with Permissions
model TiKiTRole {
  tikitRoleId               String                  @id @default(uuid()) @map("tikit_role_id")
  
  // Role Identity
  roleTypeCode              TiKiTRoleType           @unique @map("role_type_code")
  roleDisplayName           String                  @map("role_display_name")
  roleDescription           String?                 @map("role_description")
  
  // Permission Flags - Campaign Management
  canCreateCampaigns        Boolean                 @default(false) @map("can_create_campaigns")
  canEditCampaigns          Boolean                 @default(false) @map("can_edit_campaigns")
  canDeleteCampaigns        Boolean                 @default(false) @map("can_delete_campaigns")
  canViewAllCampaigns       Boolean                 @default(false) @map("can_view_all_campaigns")
  
  // Permission Flags - Approvals
  canApproveBriefs          Boolean                 @default(false) @map("can_approve_briefs")
  canApproveScripts         Boolean                 @default(false) @map("can_approve_scripts")
  canApproveContent         Boolean                 @default(false) @map("can_approve_content")
  canApproveBudgets         Boolean                 @default(false) @map("can_approve_budgets")
  
  // Permission Flags - Financial
  canViewFinancials         Boolean                 @default(false) @map("can_view_financials")
  canEditFinancials         Boolean                 @default(false) @map("can_edit_financials")
  canApprovePayments        Boolean                 @default(false) @map("can_approve_payments")
  canGenerateInvoices       Boolean                 @default(false) @map("can_generate_invoices")
  
  // Permission Flags - Influencers
  canManageInfluencers      Boolean                 @default(false) @map("can_manage_influencers")
  canViewInfluencerData     Boolean                 @default(false) @map("can_view_influencer_data")
  canContactInfluencers     Boolean                 @default(false) @map("can_contact_influencers")
  
  // Permission Flags - Users & Admin
  canManageUsers            Boolean                 @default(false) @map("can_manage_users")
  canAssignRoles            Boolean                 @default(false) @map("can_assign_roles")
  canViewSystemLogs         Boolean                 @default(false) @map("can_view_system_logs")
  canConfigureSystem        Boolean                 @default(false) @map("can_configure_system")
  
  // Permission Flags - Clients
  canManageClients          Boolean                 @default(false) @map("can_manage_clients")
  canViewClientData         Boolean                 @default(false) @map("can_view_client_data")
  
  // Relations
  userBindings              UserRoleBinding[]
  
  // Metadata
  isSystemRole              Boolean                 @default(true) @map("is_system_role")
  isActiveRole              Boolean                 @default(true) @map("is_active_role")
  
  // Audit
  roleCreatedAt             DateTime                @default(now()) @map("role_created_at")
  roleUpdatedAt             DateTime                @updatedAt @map("role_updated_at")

  @@map("tikit_roles")
  @@index([roleTypeCode])
}

// UserRoleBinding Model - Many-to-Many with Context
model UserRoleBinding {
  bindingId                 String                  @id @default(uuid()) @map("binding_id")
  
  // Relationships
  tikitUserId               String                  @map("tikit_user_id")
  tikitUser                 TiKiTUser               @relation(fields: [tikitUserId], references: [tikitUserId])
  
  tikitRoleId               String                  @map("tikit_role_id")
  tikitRole                 TiKiTRole               @relation(fields: [tikitRoleId], references: [tikitRoleId])
  
  // Binding Context
  scopeType                 String?                 @map("scope_type")  // "GLOBAL", "CAMPAIGN", "CLIENT"
  scopeEntityId             String?                 @map("scope_entity_id")  // CampaignID or ClientID if scoped
  
  // Temporal Validity
  effectiveFrom             DateTime                @default(now()) @map("effective_from")
  effectiveUntil            DateTime?               @map("effective_until")
  isCurrentlyActive         Boolean                 @default(true) @map("is_currently_active")
  
  // Assignment Details
  assignedByUserId          String?                 @map("assigned_by_user_id")
  assignmentReason          String?                 @map("assignment_reason")
  
  // Audit
  bindingCreatedAt          DateTime                @default(now()) @map("binding_created_at")
  bindingUpdatedAt          DateTime                @updatedAt @map("binding_updated_at")

  @@unique([tikitUserId, tikitRoleId, scopeType, scopeEntityId])
  @@map("user_role_bindings")
  @@index([tikitUserId])
  @@index([tikitRoleId])
  @@index([isCurrentlyActive])
}
```

## 🔧 Implementation Steps

1. **Add models to schema.prisma**
   - Add TiKiTRoleType and TiKiTAccountStatus enums
   - Add TiKiTUser model
   - Add TiKiTRole model
   - Add UserRoleBinding model

2. **Create roles seed script**
   - Create `prisma/seeds/roles.seed.ts`:
   ```typescript
   import { PrismaClient, TiKiTRoleType } from '@prisma/client';

   const prismaClient = new PrismaClient();

   async function seedTiKiTRoles() {
     const roleDefinitions = [
       {
         roleTypeCode: TiKiTRoleType.CM,
         roleDisplayName: 'Campaign Manager',
         roleDescription: 'Primary campaign operator - manages day-to-day campaign execution',
         canCreateCampaigns: true,
         canEditCampaigns: true,
         canViewAllCampaigns: true,
         canManageInfluencers: true,
         canViewInfluencerData: true,
         canContactInfluencers: true,
       },
       {
         roleTypeCode: TiKiTRoleType.DIR,
         roleDisplayName: 'Director',
         roleDescription: 'Oversight and strategic approvals',
         canViewAllCampaigns: true,
         canApproveBriefs: true,
         canApproveScripts: true,
         canApproveContent: true,
         canApproveBudgets: true,
         canViewFinancials: true,
       },
       {
         roleTypeCode: TiKiTRoleType.FIN,
         roleDisplayName: 'Finance Manager',
         roleDescription: 'Budget and payment management',
         canViewFinancials: true,
         canEditFinancials: true,
         canApprovePayments: true,
         canGenerateInvoices: true,
         canApproveBudgets: true,
       },
       {
         roleTypeCode: TiKiTRoleType.ADM,
         roleDisplayName: 'System Administrator',
         roleDescription: 'Full system administration',
         canManageUsers: true,
         canAssignRoles: true,
         canViewSystemLogs: true,
         canConfigureSystem: true,
         canViewAllCampaigns: true,
       },
       {
         roleTypeCode: TiKiTRoleType.CLIENT,
         roleDisplayName: 'Client User',
         roleDescription: 'External client with limited access',
         canApproveContent: true,
         canApproveBriefs: true,
       },
       {
         roleTypeCode: TiKiTRoleType.INF,
         roleDisplayName: 'Influencer',
         roleDescription: 'Content creator user',
       },
     ];

     for (const roleDef of roleDefinitions) {
       await prismaClient.tiKiTRole.upsert({
         where: { roleTypeCode: roleDef.roleTypeCode },
         update: roleDef,
         create: roleDef,
       });
     }

     console.log('✅ TiKiT OS roles seeded successfully');
   }

   seedTiKiTRoles()
     .catch((err) => {
       console.error('❌ Error seeding roles:', err);
       process.exit(1);
     })
     .finally(async () => {
       await prismaClient.$disconnect();
     });
   ```

3. **Create and apply migration**
   ```bash
   cd backend
   npx prisma migrate dev --name add-user-role-models
   ```

4. **Run seed script**
   ```bash
   cd backend
   npx ts-node prisma/seeds/roles.seed.ts
   ```

5. **Validate schema**
   ```bash
   npx prisma validate
   npx prisma format
   ```

6. **Verify in Prisma Studio**
   ```bash
   npx prisma studio
   ```

## Dependencies

**Blocked By:**
- #17 - Prisma Initialization

**Blocks:**
- #19 - Authentication & Authorization Framework

## Notes for AI Agent

- **TiKiT-Specific Naming:** All models use "TiKiT" prefix to avoid namespace conflicts
- **Role Scoping:** UserRoleBinding supports global or scoped roles (campaign/client specific)
- **Permission Model:** Explicit boolean flags for each permission (easier to audit than JSON)
- **Role Definitions:** Six core roles per PRD Section 3
- **Temporal Roles:** effectiveFrom/effectiveUntil support time-bound role assignments
- **Security:** Password stored as bcrypt hash, MFA support via TOTP
- **Account Locking:** Failed login attempts trigger account locking
- **Email Verification:** Token-based email verification workflow
- **Unique Constraint:** User can't have same role twice for same scope
