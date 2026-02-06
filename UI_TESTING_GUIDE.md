# 🧪 UI Testing Guide - Complete Feature Walkthrough

## Pre-Testing Setup

1. **Start the application**
   ```bash
   docker-compose up -d
   ```

2. **Wait for services** (check with `docker-compose ps`)
   - Database should be "healthy"
   - Backend should be "Up"
   - Frontend should be "Up"

3. **Open browser**: http://localhost:3000

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tikit.com | Admin123! |
| Client Manager | manager@tikit.com | Manager123! |
| Influencer Manager | influencer@tikit.com | Influencer123! |

---

## Feature Testing Checklist

### 1. Authentication Flow ✅

**Login**
- [ ] Navigate to http://localhost:3000
- [ ] Click "Sign In"
- [ ] Enter: admin@tikit.com / Admin123!
- [ ] Verify redirect to /dashboard
- [ ] Check user name displays in sidebar

**Register** (optional)
- [ ] Click "Sign Up"
- [ ] Fill in: Name, Email, Password, Role
- [ ] Submit and verify account creation
- [ ] Login with new account

**Logout**
- [ ] Click logout button in sidebar
- [ ] Verify redirect to home page
- [ ] Try accessing /dashboard (should redirect to login)

---

### 2. Dashboard Overview ✅

After logging in, verify:
- [ ] **Stat Cards** display:
  - Total Clients
  - Active Campaigns
  - Total Influencers
  - Active Collaborations
- [ ] **Trend Indicators** show (↑ or ↓)
- [ ] **Charts** render:
  - Campaign Performance (bar chart)
  - Collaboration Status (pie chart)
- [ ] **Recent Activity** list shows items
- [ ] **Quick Actions** cards are clickable

---

### 3. Client Management ✅

**List Clients**
- [ ] Click "Clients" in sidebar
- [ ] Verify table displays with columns:
  - Brand Name
  - Company Legal Name
  - Industry
  - Contact Email
  - Actions
- [ ] Search box works (type to filter)
- [ ] Pagination works if > 10 clients

**Create Client**
- [ ] Click "+ New Client"
- [ ] Fill in form:
  - **Company Legal Name**: "Tech Corp Inc"
  - **Brand Name**: "Tech Corp"
  - **Industry**: "Technology"
  - **Contact Person**: "John Doe"
  - **Contact Email**: "john@techcorp.com"
  - **Contact Phone**: "+1234567890"
  - **Website**: "https://techcorp.com"
- [ ] Click "Create Client"
- [ ] Verify toast notification appears
- [ ] Verify redirect to client list
- [ ] Verify new client appears in table

**View Client Details**
- [ ] Click on a client name
- [ ] Verify client detail page shows:
  - Company information
  - Contact details
  - Associated campaigns
  - Action buttons (Edit, Delete)

**Edit Client**
- [ ] Click "Edit" on client detail page
- [ ] Modify industry to "Software"
- [ ] Click "Save Changes"
- [ ] Verify toast notification
- [ ] Verify changes saved

**Delete Client** (optional)
- [ ] Click "Delete" on client detail
- [ ] Confirm deletion
- [ ] Verify client removed from list

---

### 4. Campaign Management ✅

**List Campaigns**
- [ ] Click "Campaigns" in sidebar
- [ ] Verify campaign cards display with:
  - Title
  - Status badge
  - Budget
  - Dates
  - Client name
- [ ] Filter by status works (All, Draft, Active, Paused, Completed)
- [ ] Search works

**Create Campaign (Multi-Step Wizard)**

**Step 1: Basic Info**
- [ ] Click "+ New Campaign"
- [ ] Fill in:
  - **Title**: "Summer Fashion Campaign 2026"
  - **Description**: "Promote summer collection"
  - **Client**: Select a client from dropdown
  - **Campaign Type**: "product_launch"
- [ ] Click "Next"

**Step 2: Strategy**
- [ ] Fill in:
  - **Goals**: "Increase brand awareness"
  - **Target Platforms**: Select Instagram, TikTok
  - **Target Audience**:
    - Age Range: 18-35
    - Gender: All
    - Locations: USA, Canada
- [ ] Add KPIs:
  - Impressions: 1000000
  - Engagement Rate: 5.5
- [ ] Click "Next"

**Step 3: Budget & Timeline**
- [ ] Fill in:
  - **Total Budget**: 50000
  - **Start Date**: Select a date
  - **End Date**: Select a later date
- [ ] Click "Next"

**Step 4: Review**
- [ ] Review all information
- [ ] Click "Create Campaign"
- [ ] Verify toast notification
- [ ] Verify redirect to campaign detail page

**Campaign Detail Page**
- [ ] Verify tabs work:
  - **Overview**: Shows campaign info
  - **Influencers**: Lists assigned influencers
  - **Budget**: Shows budget breakdown
  - **Analytics**: Shows performance metrics
- [ ] Test status actions:
  - [ ] Click "Activate Campaign"
  - [ ] Click "Pause Campaign"
  - [ ] Click "Resume Campaign"

**Edit Campaign**
- [ ] Click "Edit Campaign"
- [ ] Modify title or budget
- [ ] Save changes
- [ ] Verify updates appear

---

### 5. Influencer Discovery ✅

**Browse Influencers**
- [ ] Click "Influencers" in sidebar
- [ ] Verify grid of influencer cards
- [ ] Each card shows:
  - Profile image/avatar
  - Display name
  - Platform badges
  - Follower count
  - Engagement rate
  - Quality score indicator

**Create Influencer**
- [ ] Click "+ New Influencer"
- [ ] Fill in form:
  - **Full Name**: "Sarah Johnson"
  - **Display Name**: "@sarahjfashion"
  - **Primary Platform**: "Instagram"
  - **Categories**: Fashion, Lifestyle
  - **Social Handles**:
    - Instagram: "@sarahjfashion"
    - Followers: 150000
  - **Rates**:
    - Per Post: 2000
    - Per Video: 3500
- [ ] Save
- [ ] Verify influencer appears in list

**Advanced Search**
- [ ] Click "Advanced Search"
- [ ] Set filters:
  - Platform: Instagram
  - Followers: 100000-500000
  - Engagement: > 3%
  - Price: Max 5000
- [ ] Click "Search"
- [ ] Verify filtered results

**View Influencer Profile**
- [ ] Click on an influencer
- [ ] Verify profile shows:
  - Full information
  - Social media handles
  - Audience metrics
  - Quality score
  - Rate card
  - Similar influencers section

**Compare Influencers**
- [ ] Click "Compare Influencers"
- [ ] Search and add 2-4 influencers
- [ ] Verify comparison table shows:
  - Platform
  - Followers
  - Engagement rate
  - Rates
  - Quality scores
- [ ] Side-by-side comparison works

**AI Campaign Match**
- [ ] From a campaign page, click "Find Influencers"
- [ ] OR navigate to Influencers → Match Campaign
- [ ] Select a campaign
- [ ] Verify AI matching shows:
  - Match score (percentage)
  - Circular progress indicator
  - Reason for match
  - Recommended influencers

---

### 6. Collaboration Management ✅

**List Collaborations**
- [ ] Click "Collaborations" in sidebar
- [ ] Verify list shows:
  - Campaign name
  - Influencer name
  - Status badge
  - Payment status
  - Dates

**Create Collaboration**
- [ ] Click "+ New Collaboration"
- [ ] Select:
  - **Campaign**: Choose from dropdown
  - **Influencer**: Choose from dropdown
  - **Deliverables**: Add deliverables
  - **Payment**: Set amount and terms
- [ ] Save
- [ ] Verify collaboration created

**Bulk Invite Influencers**
- [ ] From campaign page, click "Invite Influencers"
- [ ] Select multiple influencers
- [ ] Set collaboration terms
- [ ] Send invitations
- [ ] Verify collaborations created

**Collaboration Detail Page**
- [ ] Click on a collaboration
- [ ] Verify tabs:
  - **Overview**: Shows basic info
  - **Deliverables**: List of deliverables
  - **Payment**: Payment tracking
  - **Analytics**: Performance metrics
  - **Notes**: Internal notes

**Deliverables Management**
- [ ] In Deliverables tab:
  - [ ] Add new deliverable
  - [ ] Set due date
  - [ ] Mark as submitted
  - [ ] Approve/Reject deliverable
  - [ ] View submission files

**Payment Tracking**
- [ ] In Payment tab:
  - [ ] View total amount
  - [ ] See payment status
  - [ ] Update payment status:
    - Pending → Processing → Paid
  - [ ] View payment history

**Notes**
- [ ] In Notes tab:
  - [ ] Add new note
  - [ ] View timestamp
  - [ ] See note author

---

### 7. Notifications ✅

**Notification Center**
- [ ] Click bell icon in header
- [ ] Dropdown shows recent notifications
- [ ] Each notification shows:
  - Type icon
  - Message
  - Time
  - Read/unread status
- [ ] Click "View All" to see notifications page
- [ ] Click notification to navigate to related item

**Notification Preferences**
- [ ] Navigate to Settings → Notifications
- [ ] Toggle preferences for:
  - Email notifications
  - In-app notifications
  - Notification frequency
- [ ] Save changes
- [ ] Verify toast confirmation

---

### 8. Media Management ✅

**Upload Files**
- [ ] Navigate to campaign or collaboration media page
- [ ] Click upload area or drag files
- [ ] Upload images/videos
- [ ] Verify upload progress bar
- [ ] Verify files appear in gallery

**Media Gallery**
- [ ] View uploaded files
- [ ] Click to preview
- [ ] Download files
- [ ] Delete files (if permitted)

---

### 9. Global Search ✅

**Keyboard Shortcut**
- [ ] Press `Cmd+K` (Mac) or `Ctrl+K` (Windows)
- [ ] Search modal opens
- [ ] Type "fashion" or any keyword
- [ ] See results from all entities:
  - Clients
  - Campaigns
  - Influencers
  - Collaborations
- [ ] Use arrow keys to navigate
- [ ] Press Enter to open result
- [ ] Press ESC to close

---

### 10. Settings & Profile ✅

**Settings Hub**
- [ ] Click "Settings" in sidebar
- [ ] Verify grid of settings sections:
  - Profile
  - Notifications
  - Security
  - Appearance
  - Language & Region
  - Billing

**Profile Management**
- [ ] Click "Profile"
- [ ] Verify current user info displayed
- [ ] Edit:
  - Full Name
  - Email
  - Phone
  - Company
  - Job Title
  - Bio
- [ ] Save changes
- [ ] Verify toast confirmation
- [ ] Verify changes reflected

**Account Information**
- [ ] Verify User ID shown
- [ ] Verify Role displayed
- [ ] Verify Member Since date

---

## Responsive Design Testing

### Desktop (1920x1080)
- [ ] All features accessible
- [ ] Sidebar always visible
- [ ] Tables show all columns

### Tablet (768x1024)
- [ ] Sidebar collapsible
- [ ] Cards stack appropriately
- [ ] Touch-friendly buttons

### Mobile (375x667)
- [ ] Hamburger menu works
- [ ] Cards stack vertically
- [ ] Forms are usable
- [ ] Tables scroll horizontally

---

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Performance Testing

- [ ] Page load < 3 seconds
- [ ] Navigation is smooth
- [ ] No console errors
- [ ] Images load properly
- [ ] Forms submit quickly
- [ ] Real-time updates work

---

## Error Handling

**Test Error States:**
- [ ] Invalid login credentials show error
- [ ] Required field validation works
- [ ] Network error handling (disconnect wifi)
- [ ] 404 pages display properly
- [ ] API errors show user-friendly messages

---

## Success Criteria

✅ All features functional  
✅ No critical bugs  
✅ UI is responsive  
✅ Performance is acceptable  
✅ Error handling works  
✅ Data persists correctly  

---

## Report Issues

If you find any issues:
1. Note the feature/page
2. Describe the issue
3. Include steps to reproduce
4. Check browser console for errors
5. Include screenshots if applicable

---

**Testing Status**: Ready for UAT  
**Version**: 1.0.0  
**Last Updated**: February 2026
