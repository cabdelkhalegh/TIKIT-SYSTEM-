# Supabase Database Schema - Fix Applied ✅

## Issue Fixed

**Error Message (Before Fix):**
```
Error: Failed to run sql query: ERROR: 42703: column "assigned_influencer_id" does not exist
```

**Status**: ✅ **RESOLVED**

---

## What Was Fixed

### Problem
The `content_items` table was missing the `assigned_influencer_id` column, which was being referenced in a Row Level Security (RLS) policy.

### Solution
Added the missing column to the `content_items` table:

```sql
-- Added at line 457 in DB_SCHEMA.sql
assigned_influencer_id UUID REFERENCES profiles(id),
```

---

## How to Deploy the Fixed Schema

### Step-by-Step Instructions

**1. Open Supabase Dashboard**
- Go to: https://supabase.com/dashboard
- Select your project

**2. Navigate to SQL Editor**
- Click "SQL Editor" in the left sidebar
- Click "+ New query"

**3. Copy the Schema**
- Open: `docs/DB_SCHEMA.sql` in this repository
- Copy the ENTIRE contents (Ctrl+A, Ctrl+C)

**4. Paste and Run**
- Paste into the Supabase SQL Editor
- Click "Run" button (or press Ctrl+Enter)

**5. Verify Success**
- ✅ You should see: "Success. No rows returned"
- ✅ Check the Tables section - you should have 13 tables

---

## Expected Tables After Successful Run

The schema creates the following 13 tables:

1. **profiles** - User profiles and roles
2. **invitations** - Invite codes for new users
3. **clients** - Client organizations
4. **campaigns** - Marketing campaigns
5. **content_items** - Content/deliverables (now with assigned_influencer_id ✅)
6. **content_versions** - Version history
7. **content_approvals** - Approval workflow
8. **feedback_threads** - Feedback discussions
9. **feedback_comments** - Thread replies
10. **kpis** - Performance metrics
11. **influencer_kpis** - Influencer-level KPIs
12. **reports** - Generated reports
13. **report_sections** - Report content sections

---

## Verification Checklist

After running the schema, verify:

- [ ] SQL query completed without errors
- [ ] 13 tables appear in the Tables list
- [ ] No error messages in the output
- [ ] RLS policies are created (check "Policies" tab)
- [ ] Can navigate to any table and see its structure

---

## What the Fixed Column Does

**`assigned_influencer_id` in content_items table:**

- **Purpose**: Tracks which influencer is responsible for creating/managing specific content
- **Type**: UUID (references profiles table)
- **Usage**: 
  - Allows assignment of content to specific influencers
  - Enables RLS policy: "Influencers can add KPIs for their assigned content"
  - Supports content ownership and accountability

**Example Usage:**
```sql
-- When creating content for an influencer
INSERT INTO content_items (
    title,
    campaign_id,
    assigned_influencer_id,
    ...
) VALUES (
    'Instagram Post for Campaign X',
    'campaign-uuid-here',
    'influencer-uuid-here',  -- Links content to influencer
    ...
);
```

---

## Troubleshooting

### If you still get errors:

**Error: "already exists"**
- Your database already has some tables
- Solution: Either drop existing tables first, or create a new Supabase project

**Error: "permission denied"**
- Make sure you're running the query as the project owner
- Check you're in the correct project

**Error: Different column missing**
- Make sure you're using the latest version of DB_SCHEMA.sql
- The file was updated on 2026-02-04

### How to Start Fresh (if needed)

If you want to completely reset:

1. Go to SQL Editor
2. Run this to drop all tables:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```
3. Then run the full DB_SCHEMA.sql again

---

## Additional Setup Steps

After the schema is created successfully:

### 1. Enable Realtime (for notifications)
```
1. Go to Database → Replication
2. Find table: notifications
3. Toggle "Realtime" to ON
4. Click Save
```

### 2. Create Storage Buckets
```
1. Go to Storage
2. Create these buckets:
   - content-files (public)
   - invoices (private)
   - reports (public)
   - briefs (private)
```

### 3. Get Your API Keys
```
1. Go to Settings → API
2. Copy:
   - Project URL
   - anon/public key
   - service_role key (keep secret!)
```

---

## Next Steps

Once the schema is deployed successfully:

1. ✅ Configure environment variables in Vercel
2. ✅ Deploy the application
3. ✅ Test the features
4. ✅ Create your first user account

---

**Need More Help?**

- Check: `docs/PRODUCTION_DEPLOYMENT_GUIDE.md` for complete deployment instructions
- Check: `docs/TROUBLESHOOTING_PRODUCTION.md` for common issues
- Check: `docs/ENVIRONMENT_SETUP_GUIDE.md` for configuration help

---

**Last Updated**: 2026-02-04  
**Fix Applied**: Added `assigned_influencer_id` column to `content_items` table  
**Status**: ✅ Ready to deploy
