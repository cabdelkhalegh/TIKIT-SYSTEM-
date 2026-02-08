# ✅ Post-Deployment Testing Checklist

## Immediate Verification (5 Minutes)

After running `docker compose up -d`, verify:

### 1. All Services Running
```bash
docker compose ps
```

**Expected Output:**
```
NAME              STATUS    PORTS
tikit-db          Up        0.0.0.0:5432->5432/tcp
tikit-backend     Up        0.0.0.0:3001->3001/tcp
tikit-frontend    Up        0.0.0.0:3000->3000/tcp
```

✅ All three containers should show "Up" status

---

### 2. Database Health
```bash
docker compose exec db pg_isready -U tikit_user
```

**Expected Output:**
```
/var/run/postgresql:5432 - accepting connections
```

✅ Database should be accepting connections

---

### 3. Backend API Health
```bash
curl http://localhost:3001/health
```

**Expected Output:**
```json
{"status":"ok","timestamp":"..."}
```

✅ Backend API should return 200 OK

---

### 4. Frontend Accessibility
```bash
curl -I http://localhost:3000
```

**Expected Output:**
```
HTTP/1.1 200 OK
...
```

✅ Frontend should return 200 OK

---

## UI Testing (10 Minutes)

### Test 1: Access Landing Page
1. Open browser: http://localhost:3000
2. ✅ Landing page loads
3. ✅ "Sign In" button visible
4. ✅ No console errors (F12 → Console)

**Screenshot Needed:** Landing page

---

### Test 2: Login
1. Click "Sign In"
2. Enter credentials:
   - Email: `admin@tikit.com`
   - Password: `Admin123!`
3. Click "Sign In"
4. ✅ Redirects to /dashboard
5. ✅ Dashboard loads with data

**Screenshot Needed:** Dashboard after login

---

### Test 3: Dashboard Overview
Verify dashboard displays:
- ✅ 4 stat cards (Clients, Campaigns, Influencers, Collaborations)
- ✅ Charts render (Campaign Performance, Collaboration Status)
- ✅ Recent Activity list
- ✅ Quick Actions cards

**Screenshot Needed:** Full dashboard view

---

### Test 4: Navigation
Test sidebar navigation:
- ✅ Click "Clients" - loads client list
- ✅ Click "Campaigns" - loads campaign list
- ✅ Click "Influencers" - loads influencer list
- ✅ Click "Collaborations" - loads collaboration list
- ✅ Click "Settings" - loads settings page

**Screenshot Needed:** Each main page

---

### Test 5: Create Client
1. Navigate to Clients
2. Click "+ New Client"
3. Fill form:
   - Company Legal Name: "Test Corp Inc"
   - Brand Name: "Test Corp"
   - Industry: "Technology"
   - Contact Email: "test@testcorp.com"
4. Click "Create Client"
5. ✅ Success toast appears
6. ✅ Redirects to client list
7. ✅ New client appears in list

**Screenshot Needed:** Client creation form and result

---

### Test 6: Create Campaign
1. Navigate to Campaigns
2. Click "+ New Campaign"
3. **Step 1 - Basic Info:**
   - Title: "Test Campaign"
   - Description: "Test campaign description"
   - Client: Select from dropdown
   - Campaign Type: "product_launch"
   - Click "Next"

4. **Step 2 - Strategy:**
   - Goals: "Test goals"
   - Target Platforms: Instagram, TikTok
   - Age Range: 18-35
   - Click "Next"

5. **Step 3 - Budget:**
   - Total Budget: 10000
   - Start Date: Select today
   - End Date: Select future date
   - Click "Next"

6. **Step 4 - Review:**
   - Review all info
   - Click "Create Campaign"

7. ✅ Success toast appears
8. ✅ Redirects to campaign detail
9. ✅ Campaign shows in list

**Screenshot Needed:** Campaign wizard and result

---

### Test 7: Global Search
1. Press `Cmd+K` (Mac) or `Ctrl+K` (Windows)
2. ✅ Search modal opens
3. Type "test"
4. ✅ Search results appear
5. ✅ Results grouped by type
6. Click a result
7. ✅ Navigates to detail page

**Screenshot Needed:** Global search in action

---

### Test 8: Notifications
1. Click bell icon in header
2. ✅ Notification dropdown opens
3. ✅ Notifications listed (or "No notifications")
4. Click "View All"
5. ✅ Navigates to notifications page

**Screenshot Needed:** Notification center

---

### Test 9: Profile Settings
1. Navigate to Settings
2. Click "Profile"
3. ✅ Current user info displayed
4. Update phone number
5. Click "Save Changes"
6. ✅ Success toast appears
7. ✅ Changes saved

**Screenshot Needed:** Profile settings page

---

### Test 10: Logout
1. Click logout button in sidebar
2. ✅ Redirects to home page
3. Try accessing /dashboard
4. ✅ Redirects to login (protected route)

---

## Advanced Testing (20 Minutes)

### Test 11: Influencer Discovery
1. Navigate to Influencers
2. ✅ Grid of influencer cards displays
3. Click "Advanced Search"
4. Set filters and search
5. ✅ Filtered results appear
6. Click "Compare Influencers"
7. Add 2-3 influencers
8. ✅ Comparison table displays

**Screenshot Needed:** Influencer list and comparison

---

### Test 12: Collaboration Workflow
1. Create a collaboration
2. Navigate to detail page
3. Verify tabs:
   - ✅ Overview
   - ✅ Deliverables
   - ✅ Payment
   - ✅ Analytics
   - ✅ Notes
4. Add a note
5. ✅ Note appears in list

**Screenshot Needed:** Collaboration detail page

---

### Test 13: Campaign Management
1. Open a campaign
2. Click "Activate Campaign"
3. ✅ Status changes to "active"
4. Try "Pause Campaign"
5. ✅ Status changes to "paused"
6. Verify budget tracking displays
7. ✅ Budget progress bar visible

**Screenshot Needed:** Campaign detail with tabs

---

### Test 14: Media Upload
1. Navigate to campaign media page
2. Drag and drop an image
3. ✅ Upload progress shown
4. ✅ Image appears in gallery
5. Click to preview
6. ✅ Preview modal opens

**Screenshot Needed:** Media gallery

---

### Test 15: Different User Roles
1. Logout
2. Login as: `manager@tikit.com` / `Manager123!`
3. ✅ Dashboard loads for manager role
4. Verify permissions differ from admin
5. Logout
6. Login as: `influencer@tikit.com` / `Influencer123!`
7. ✅ Dashboard loads for influencer role

**Screenshot Needed:** Different role dashboards

---

## Performance Testing

### Load Time
- ✅ Landing page loads < 2 seconds
- ✅ Dashboard loads < 3 seconds
- ✅ Navigation between pages < 1 second
- ✅ Search results appear < 1 second

### Browser Testing
Test in:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

### Responsive Design
Test at resolutions:
- ✅ Desktop (1920x1080)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667)

---

## Error Testing

### Test Invalid Login
1. Try login with wrong password
2. ✅ Error message displays
3. ✅ Does not redirect

### Test Form Validation
1. Try submitting empty required fields
2. ✅ Validation errors show
3. ✅ Form does not submit

### Test 404 Pages
1. Navigate to /nonexistent
2. ✅ 404 page displays
3. ✅ Can navigate back

---

## Final Checklist

- ✅ All services running
- ✅ Database healthy
- ✅ Backend API responding
- ✅ Frontend accessible
- ✅ Can login with all 3 roles
- ✅ Can create clients
- ✅ Can create campaigns
- ✅ Can browse influencers
- ✅ Can create collaborations
- ✅ Global search works
- ✅ Notifications work
- ✅ Settings can be updated
- ✅ No console errors
- ✅ No network errors
- ✅ Responsive on mobile
- ✅ Works in all browsers

---

## Issue Reporting

If any test fails, report:
1. **Test Number**: e.g., "Test 5: Create Client"
2. **Expected Result**: What should happen
3. **Actual Result**: What actually happened
4. **Steps to Reproduce**: Exact steps taken
5. **Screenshot**: If applicable
6. **Browser**: Which browser/version
7. **Console Errors**: Any errors in browser console

---

## Success Criteria

✅ **All essential tests pass** (Tests 1-10)  
✅ **No critical errors** in console  
✅ **All services healthy** and responsive  
✅ **Can complete basic workflows** (create, read, update)  

**Status**: READY FOR PRODUCTION ✅

---

*Last Updated: February 2026*  
*Version: 1.0.0*
