# TASK 2: RBAC + Invite-Only System - Testing Guide

## What Was Built

### Backend (Database)
- **Database Schema**: Complete PostgreSQL schema with RBAC
  - `profiles` table for extended user data
  - `invitations` table for invite-only system
  - Row Level Security (RLS) policies for all tables
  - Triggers and functions for automation

### Frontend (Next.js Application)
- **Authentication System**
  - Login page with email/password
  - Signup page with invite code validation
  - Pending approval screen for unapproved users
  - Sign out functionality

- **RBAC Implementation**
  - Four user roles: director, account_manager, influencer, client
  - Route protection via `ProtectedRoute` component
  - UI element gating via `RoleGate` component
  - Role-based navigation menus

- **Invitation Management** (Director-only)
  - Create invitations with role assignment
  - View all invitations
  - Revoke pending invitations
  - Automatic code generation

- **User Dashboard**
  - Role-specific welcome screen
  - Quick action cards based on permissions
  - Profile page

### Documentation
- Complete API specification
- Database schema documentation
- Architecture documentation
- Decision log
- Product backlog

## Files Changed

### New Directories
```
frontend/
docs/
backend/
```

### New Files

#### Documentation
- `docs/DB_SCHEMA.sql` - Complete database DDL
- `docs/API_SPEC.md` - API endpoint documentation
- `docs/ARCHITECTURE.md` - System architecture
- `docs/MVP_SPEC.md` - MVP specification
- `docs/DECISIONS.md` - Decision log
- `docs/BACKLOG.md` - Development backlog
- `README.md` - Updated project README

#### Frontend Configuration
- `frontend/package.json` - Dependencies
- `frontend/tsconfig.json` - TypeScript config
- `frontend/next.config.js` - Next.js config
- `frontend/tailwind.config.js` - Tailwind config
- `frontend/postcss.config.js` - PostCSS config
- `frontend/.env.local.example` - Environment template

#### Frontend Core
- `frontend/types/index.ts` - TypeScript types
- `frontend/lib/supabase.ts` - Supabase client
- `frontend/utils/rbac.ts` - RBAC utilities
- `frontend/contexts/AuthContext.tsx` - Authentication context
- `frontend/components/ProtectedRoute.tsx` - Route guard
- `frontend/components/RoleGate.tsx` - UI element guard

#### Frontend Pages
- `frontend/app/layout.tsx` - Root layout
- `frontend/app/globals.css` - Global styles
- `frontend/app/page.tsx` - Home page (redirects)
- `frontend/app/login/page.tsx` - Login page
- `frontend/app/signup/page.tsx` - Signup with invite code
- `frontend/app/dashboard/page.tsx` - Main dashboard
- `frontend/app/pending-approval/page.tsx` - Pending approval screen
- `frontend/app/invitations/page.tsx` - Invitation management (Director)
- `frontend/app/profile/page.tsx` - User profile

#### Other
- `.gitignore` - Git ignore rules

## How to Test Manually

### Prerequisites
1. **Supabase Account**
   - Sign up at https://supabase.com
   - Create a new project
   - Note your project URL and anon key

2. **Node.js**
   - Install Node.js 18+ from https://nodejs.org

### Step-by-Step Testing

#### 1. Database Setup

1. Go to your Supabase project dashboard
2. Click "SQL Editor" in the left sidebar
3. Create a new query
4. Copy the entire contents of `docs/DB_SCHEMA.sql`
5. Paste and run the SQL
6. Verify tables were created:
   - Go to "Table Editor"
   - You should see `profiles` and `invitations` tables

#### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd /home/runner/work/TIKIT-SYSTEM-/TIKIT-SYSTEM-/frontend

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Edit .env.local with your Supabase credentials
nano .env.local
# OR
vim .env.local
```

Add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

```bash
# Start development server
npm run dev
```

#### 3. Create First Director

**Option A: Via Supabase Auth UI**
1. In Supabase dashboard, go to "Authentication" > "Users"
2. Click "Add user" > "Create new user"
3. Enter email and password
4. Click "Create user"
5. Note the user ID

**Option B: Via Signup (requires initial invitation workaround)**

After creating the user, update their profile:

```sql
-- In Supabase SQL Editor
-- Replace 'director@example.com' with your email
UPDATE profiles 
SET role = 'director', role_approved = true 
WHERE email = 'director@example.com';
```

#### 4. Test Login Flow

1. Open http://localhost:3000
2. Should redirect to `/login`
3. Enter director credentials
4. Click "Sign in"
5. Should redirect to `/dashboard`
6. Verify:
   - ✅ Director role badge shows in header
   - ✅ "Invitations" tab is visible
   - ✅ "Manage Invitations" card is visible

#### 5. Test Invitation Creation (Director Only)

1. Click "Invitations" in navigation
2. Click "+ New Invitation" button
3. Fill in the form:
   - Email: `test-am@example.com`
   - Role: Account Manager
4. Click "Send Invitation"
5. Verify:
   - ✅ Success message appears with invite code
   - ✅ Invitation appears in the list below
   - ✅ Code is displayed in uppercase
   - ✅ Status shows as "pending"
   - ✅ Expiration date is 7 days from now

#### 6. Test Signup Flow with Invitation

1. Copy the invitation code from step 5
2. Open a new incognito/private browser window
3. Go to http://localhost:3000
4. Click "Sign up" or go to `/signup`
5. Fill in the form:
   - Invite Code: (paste the code)
   - Email: `test-am@example.com` (must match invitation)
   - Full Name: `Test Account Manager`
   - Password: (choose a password)
6. Click "Sign up"
7. Verify:
   - ✅ No errors
   - ✅ Redirects to `/dashboard`
   - ✅ Shows "Account Manager" role badge
   - ✅ Does NOT show "Invitations" tab (not a director)

#### 7. Test Invalid Invite Code

1. In incognito window, sign out
2. Go to `/signup`
3. Try to sign up with:
   - Invalid code: `INVALID1`
   - Different email: `wrong@example.com`
4. Click "Sign up"
5. Verify:
   - ✅ Error message: "Invalid or expired invite code"
   - ✅ User is not created

#### 8. Test Role-Based UI Gating

**As Account Manager:**
1. Log in as the Account Manager created in step 6
2. Navigate to `/dashboard`
3. Verify:
   - ✅ Can access `/dashboard`
   - ✅ Can access `/profile`
   - ✅ Cannot see "Invitations" tab
   - ✅ "Manage Invitations" card is NOT visible
4. Try to manually navigate to `/invitations`
5. Verify:
   - ✅ Redirects back to `/dashboard` (not authorized)

**As Director:**
1. Log in as the Director
2. Verify:
   - ✅ Can access `/invitations`
   - ✅ Can see invitation management UI
   - ✅ Can create new invitations

#### 9. Test Pending Approval Flow (Director Role)

1. As Director, create invitation for a new Director:
   - Email: `director2@example.com`
   - Role: Director
2. Copy the invite code
3. In incognito window, sign up with:
   - Invite code: (from step 1)
   - Email: `director2@example.com`
   - Full Name: `Second Director`
   - Password: (choose)
4. Click "Sign up"
5. Verify:
   - ✅ Redirects to `/pending-approval`
   - ✅ Shows "Pending Approval" message
   - ✅ Shows role as "Director"
   - ✅ Cannot access `/dashboard`

#### 10. Test Director Approval

1. As original Director, go to Supabase dashboard
2. Open SQL Editor
3. Run:
   ```sql
   UPDATE profiles 
   SET role_approved = true 
   WHERE email = 'director2@example.com';
   ```
4. As second director (refresh page or log out/in)
5. Verify:
   - ✅ Can now access `/dashboard`
   - ✅ Has full director permissions

#### 11. Test Invitation Revocation

1. As Director, go to `/invitations`
2. Create a new invitation for `revoke-test@example.com`
3. Click "Revoke" button on the invitation
4. Verify:
   - ✅ Status changes to "revoked"
   - ✅ "Revoke" button disappears
5. Try to sign up with the revoked code
6. Verify:
   - ✅ Signup fails with error

#### 12. Test Route Protection

Test these URLs manually (copy-paste in browser):
- `http://localhost:3000/login` - ✅ Accessible when logged out
- `http://localhost:3000/signup` - ✅ Accessible when logged out
- `http://localhost:3000/dashboard` - ✅ Redirects to login if not authenticated
- `http://localhost:3000/invitations` - ✅ Redirects to dashboard if not director
- `http://localhost:3000/profile` - ✅ Accessible when authenticated

## Known Limitations

1. **First Director Bootstrap**: Requires manual SQL to approve the first director
2. **Email Verification**: Not implemented - users can sign up without verifying email
3. **Password Reset**: Not implemented in MVP
4. **Invitation Email**: Codes must be manually shared (no email sending)
5. **Role Change**: No UI for changing user roles after creation
6. **User Deactivation**: No UI for deactivating users
7. **Invitation Resend**: Cannot resend expired invitations (must create new)

## Next Batch

The next batch will implement **TASK 3: Human-Readable IDs**:
- Campaign IDs: `TKT-YYYY-####`
- Client IDs: `CLI-####`
- Influencer IDs: `INF-####`
- Invoice IDs: `INV-YYYY-####`

This will require:
- Database sequences and ID generation functions
- UI updates to display IDs
- Testing of ID generation and uniqueness
