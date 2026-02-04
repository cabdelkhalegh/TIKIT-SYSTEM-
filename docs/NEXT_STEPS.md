# Next Steps on PRD v1.2 - Action Plan

**Document Created**: February 3, 2026  
**Current Status**: 50% PRD Compliance  
**Priority**: Complete Content Workflow → KPI System → Reporting

---

## 🎯 Current Position

### Completed (50%)
- ✅ **Foundation**: 6-role RBAC model + Human-readable IDs (100%)
- ✅ **Security**: Zero vulnerabilities (Next.js 16.1.6 + React 19)
- ✅ **Content Workflow**: Database + Campaign/Client UI (85%)
- ✅ **Testing**: All automated tests passing
- ✅ **Documentation**: 16 comprehensive documents

### In Progress (15% remaining)
- ⚙️ **Content Workflow Phase 4-6**: File upload, approvals, feedback

### Not Started (35%)
- 📋 KPI Manual Entry (TASK 5)
- 📋 Instagram API Integration (TASK 6)
- 📋 Reporting & PDF Export (TASK 7)
- 📋 Finance & Invoicing (TASK 10)
- 📋 Notifications (TASK 11)

---

## 🚀 Immediate Next Step: Complete Content Workflow

### TASK 4 - Phases 4-6 (6-8 hours)

**Priority**: CRITICAL (P0)  
**PRD Reference**: Section 8  
**Status**: 85% complete, 15% remaining

#### Phase 4: File Upload & Versioning (3-4 hours)

**Setup Requirements:**
```bash
# Supabase Storage bucket configuration
- Bucket name: "content-files"
- Public access: No (authenticated users only)
- File size limit: 50MB
- Allowed types: images/*, video/*, application/pdf
```

**Components to Build:**
1. **ContentUploadForm.tsx**
   - Drag-and-drop file upload
   - File type validation
   - Size validation
   - Upload progress indicator
   - Multiple file support
   - Preview thumbnails

2. **VersionHistory.tsx**
   - List all versions for a content item
   - Display version number, uploader, date
   - Download buttons for each version
   - Preview links
   - Change description display

3. **FilePreview.tsx**
   - Image preview (inline display)
   - Video preview (embedded player)
   - PDF preview (embed or link)
   - Fallback for unsupported types

**Database Integration:**
```typescript
// On upload:
1. Upload file to Supabase Storage
2. Insert into content_versions table
3. Auto-increment version number (trigger handles this)
4. Update content_items.current_version
5. Set initial status to 'draft'
```

**Pages to Update:**
- `/campaigns/[id]` - Add upload button for each content item
- `/campaigns/[id]/content/[contentId]` - New detail page with version history

---

#### Phase 5: Approval Workflow & Feedback (2-3 hours)

**Internal Approval (Reviewer Role):**

**Components:**
1. **InternalApprovalCard.tsx**
   ```tsx
   // Shows when content is in 'pending_internal' status
   - Content preview
   - Approve button (green)
   - Reject button (red)
   - Decision notes textarea
   - Submit action
   ```

2. **ApprovalHistory.tsx**
   ```tsx
   // Shows all approval attempts
   - Timeline view
   - Approver name and role
   - Decision (approved/rejected)
   - Notes/comments
   - Timestamp
   ```

**Client Approval (Client Role):**

**Components:**
1. **ClientApprovalCard.tsx**
   ```tsx
   // Shows when content is in 'pending_client' status
   - Clean, professional UI
   - Large content preview
   - Simple approve/reject buttons
   - Comment field
   - Submit action
   ```

**Feedback System:**

**Components:**
1. **FeedbackThread.tsx**
   ```tsx
   // Threaded comment system
   - Display all feedback for a version
   - Reply functionality
   - Resolve/unresolve toggle
   - Visual annotations (optional Phase 6)
   - Author info and timestamp
   ```

2. **AddFeedback.tsx**
   ```tsx
   // Comment input form
   - Rich text editor (optional) or textarea
   - Attach to specific version
   - Optional parent_feedback_id for replies
   - Submit button
   ```

**Database Operations:**
```typescript
// Approval flow:
1. Create content_approvals record
2. Update content_items.status
3. Trigger notifications (future)
4. Log approval history

// Feedback flow:
1. Insert into content_feedback
2. Link to content version
3. Increment unread counter
4. Send notification (future)
```

---

#### Phase 6: Dashboard Integration & Reminders (1-2 hours)

**Dashboard Widgets:**

1. **PendingApprovalsWidget.tsx**
   ```tsx
   // On /dashboard page
   - Count of items pending my approval
   - Grouped by type (internal/client)
   - Quick links to approval pages
   - Color-coded urgency (red for overdue)
   ```

2. **OverdueItemsWidget.tsx**
   ```tsx
   // Warning for overdue items
   - List campaigns with overdue content
   - Days overdue calculation
   - Link to campaign details
   - Filter: internal vs client deadlines
   ```

**Overdue Calculation:**
```typescript
// Add to content_items query
const overdueInternal = internal_deadline < now() && status in ['draft', 'pending_internal']
const overdueClient = client_deadline < now() && status === 'pending_client'
```

**Update Existing Pages:**
- `/dashboard` - Add widgets
- `/campaigns` - Add overdue indicator badges
- `/campaigns/[id]` - Show overdue warnings

---

## 📊 After Content Workflow: KPI System

### TASK 5: KPI Manual Entry (6-8 hours)

**PRD Reference**: Section 9  
**Priority**: P0 (Critical)

#### Database Schema

```sql
-- KPIs at post level
CREATE TABLE kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_item_id UUID REFERENCES content_items(id),
    snapshot_date DATE NOT NULL,
    source VARCHAR(50) DEFAULT 'manual', -- 'manual' or 'instagram_api'
    
    -- Metrics
    views BIGINT,
    likes BIGINT,
    comments BIGINT,
    shares BIGINT,
    saves BIGINT,
    reach BIGINT,
    impressions BIGINT,
    engagement_rate DECIMAL(5,2),
    
    -- Metadata
    captured_by UUID REFERENCES profiles(id),
    captured_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    
    UNIQUE(content_item_id, snapshot_date, source)
);

-- KPIs at campaign level (rollups)
CREATE TABLE campaign_kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id),
    
    -- Aggregated metrics
    total_views BIGINT,
    total_likes BIGINT,
    total_comments BIGINT,
    total_shares BIGINT,
    total_saves BIGINT,
    avg_engagement_rate DECIMAL(5,2),
    total_reach BIGINT,
    
    -- Calculated
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);
```

#### Pages to Create

1. **`/campaigns/[id]/kpis`** - KPI Dashboard
   - Campaign-level metrics summary
   - Individual post metrics table
   - Charts/graphs (optional)
   - Export to CSV button
   - "Add KPI Snapshot" button

2. **`/campaigns/[id]/kpis/add`** - Manual Entry Form
   - Select content item
   - Snapshot date picker
   - All metric fields (views, likes, comments, etc.)
   - Notes field
   - Submit button
   - Validation (all fields optional but at least one metric required)

3. **`/campaigns/[id]/content/[contentId]/kpis`** - Post-level KPI History
   - Timeline of all snapshots
   - Line chart showing metric trends
   - Compare snapshots
   - Edit/delete actions

#### Features

- **Auto-calculation**: Engagement rate = (likes + comments + shares + saves) / reach * 100
- **Validation**: Numbers only, non-negative
- **Rollup**: Trigger to recalculate campaign_kpis when kpis are inserted/updated
- **History**: Track changes over time (Day 1, 3, 7, 30)

---

### TASK 6: Instagram API Integration (16-20 hours)

**PRD Reference**: Section 9  
**Priority**: P0 (Critical)

#### Setup Phase (2-3 hours)

**Requirements:**
1. Facebook Developer Account
2. Create Facebook App
3. Add Instagram Basic Display API
4. Configure OAuth redirect URLs
5. Get App ID and App Secret

**Environment Variables:**
```bash
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_REDIRECT_URI=https://yourdomain.com/api/instagram/callback
```

#### Database Schema (1 hour)

```sql
-- Instagram account connections
CREATE TABLE instagram_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id),
    instagram_user_id VARCHAR(255) UNIQUE,
    username VARCHAR(255),
    account_type VARCHAR(50), -- 'BUSINESS' or 'CREATOR'
    is_eligible BOOLEAN DEFAULT false,
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_sync TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'active'
);

-- Encrypted token storage
CREATE TABLE instagram_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID REFERENCES instagram_connections(id),
    access_token_encrypted TEXT NOT NULL,
    token_type VARCHAR(50),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raw API responses (for debugging/audit)
CREATE TABLE instagram_raw_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID REFERENCES instagram_connections(id),
    endpoint VARCHAR(255),
    request_params JSONB,
    response_data JSONB,
    fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled jobs for KPI snapshots
CREATE TABLE scheduled_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type VARCHAR(100), -- 'instagram_kpi_snapshot'
    content_item_id UUID REFERENCES content_items(id),
    scheduled_for TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    attempts INT DEFAULT 0,
    last_attempt TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### API Endpoints (4-6 hours)

**1. `/api/instagram/connect` - OAuth Initiation**
```typescript
// GET endpoint
// Redirects to Instagram OAuth
export async function GET(request: Request) {
  const { userId } = await getSession(request);
  
  const authUrl = `https://api.instagram.com/oauth/authorize
    ?client_id=${INSTAGRAM_APP_ID}
    &redirect_uri=${INSTAGRAM_REDIRECT_URI}
    &scope=user_profile,user_media
    &response_type=code
    &state=${userId}`; // Prevent CSRF
    
  return Response.redirect(authUrl);
}
```

**2. `/api/instagram/callback` - OAuth Callback**
```typescript
// GET endpoint
// Exchanges code for access token
export async function GET(request: Request) {
  const { code, state } = getQueryParams(request);
  
  // Exchange code for token
  const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    body: {
      client_id: INSTAGRAM_APP_ID,
      client_secret: INSTAGRAM_APP_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: INSTAGRAM_REDIRECT_URI,
      code
    }
  });
  
  const { access_token, user_id } = await tokenResponse.json();
  
  // Encrypt and store token
  const encrypted = await encrypt(access_token);
  await supabase.from('instagram_tokens').insert({
    connection_id,
    access_token_encrypted: encrypted,
    expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
  });
  
  return Response.redirect('/profile?instagram=connected');
}
```

**3. `/api/instagram/fetch-profile` - Get Profile Data**
```typescript
// POST endpoint
// Fetches user profile from Instagram
export async function POST(request: Request) {
  const { connectionId } = await request.json();
  const token = await getDecryptedToken(connectionId);
  
  const profile = await fetch(
    `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${token}`
  );
  
  // Store raw response
  await supabase.from('instagram_raw_data').insert({
    connection_id: connectionId,
    endpoint: '/me',
    response_data: profile
  });
  
  // Update connection
  await supabase.from('instagram_connections').update({
    username: profile.username,
    account_type: profile.account_type,
    is_eligible: ['BUSINESS', 'CREATOR'].includes(profile.account_type),
    last_sync: new Date()
  }).eq('id', connectionId);
  
  return Response.json(profile);
}
```

**4. `/api/instagram/fetch-media` - Get Media Posts**
```typescript
// POST endpoint
// Fetches recent media for an influencer
export async function POST(request: Request) {
  const { connectionId, limit = 25 } = await request.json();
  const token = await getDecryptedToken(connectionId);
  
  const media = await fetch(
    `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=${limit}&access_token=${token}`
  );
  
  // Store raw response
  await supabase.from('instagram_raw_data').insert({
    connection_id: connectionId,
    endpoint: '/me/media',
    response_data: media
  });
  
  return Response.json(media);
}
```

**5. `/api/instagram/snapshot-kpis` - Capture KPIs for a Post**
```typescript
// POST endpoint
// Captures KPIs for a specific Instagram post
export async function POST(request: Request) {
  const { contentItemId, instagramMediaId } = await request.json();
  
  const contentItem = await getContentItem(contentItemId);
  const connection = await getInfluencerConnection(contentItem.assigned_influencer_id);
  const token = await getDecryptedToken(connection.id);
  
  // Fetch media insights
  const insights = await fetch(
    `https://graph.instagram.com/${instagramMediaId}/insights?metric=impressions,reach,engagement,saved,likes,comments,shares&access_token=${token}`
  );
  
  // Store in kpis table
  await supabase.from('kpis').insert({
    content_item_id: contentItemId,
    snapshot_date: new Date(),
    source: 'instagram_api',
    views: insights.impressions,
    reach: insights.reach,
    likes: insights.likes,
    comments: insights.comments,
    shares: insights.shares,
    saves: insights.saved,
    engagement_rate: calculateEngagementRate(insights)
  });
  
  return Response.json({ success: true });
}
```

#### Job Scheduler (3-4 hours)

**Cron Job Setup:**
```typescript
// /api/cron/process-kpi-jobs
// Run every hour
export async function GET(request: Request) {
  // Verify cron secret
  if (request.headers.get('Authorization') !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Find pending jobs
  const jobs = await supabase
    .from('scheduled_jobs')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date())
    .limit(50);
    
  for (const job of jobs.data) {
    try {
      if (job.job_type === 'instagram_kpi_snapshot') {
        await captureKPISnapshot(job.content_item_id);
        
        await supabase
          .from('scheduled_jobs')
          .update({ status: 'completed' })
          .eq('id', job.id);
      }
    } catch (error) {
      await supabase
        .from('scheduled_jobs')
        .update({ 
          status: 'failed',
          attempts: job.attempts + 1,
          last_attempt: new Date(),
          error_message: error.message
        })
        .eq('id', job.id);
    }
  }
  
  return Response.json({ processed: jobs.data.length });
}
```

**Job Creation:**
```typescript
// When content is published, create Day 1, 3, 7 jobs
async function scheduleKPIJobs(contentItemId: string, publishDate: Date) {
  const jobs = [
    { day: 1, scheduled_for: addDays(publishDate, 1) },
    { day: 3, scheduled_for: addDays(publishDate, 3) },
    { day: 7, scheduled_for: addDays(publishDate, 7) }
  ];
  
  for (const job of jobs) {
    await supabase.from('scheduled_jobs').insert({
      job_type: 'instagram_kpi_snapshot',
      content_item_id: contentItemId,
      scheduled_for: job.scheduled_for
    });
  }
}
```

#### UI Components (3-4 hours)

**1. Instagram Connect Button**
```tsx
// On /profile page
<button onClick={() => window.location.href = '/api/instagram/connect'}>
  Connect Instagram
</button>
```

**2. Connection Status**
```tsx
// Show connection status
{connection?.is_eligible ? (
  <Badge color="green">✓ Connected - Business Account</Badge>
) : (
  <Badge color="yellow">⚠ Personal Account - Switch to Business for API access</Badge>
)}
```

**3. KPI Source Indicator**
```tsx
// In KPI display
{kpi.source === 'instagram_api' ? (
  <Badge>📱 Auto-captured</Badge>
) : (
  <Badge>✏️ Manual entry</Badge>
)}
```

#### Error Handling & Fallbacks (2-3 hours)

**Scenarios:**
1. **Personal Account**: Show message to convert to Business account
2. **Token Expired**: Prompt to reconnect
3. **API Rate Limit**: Queue for retry
4. **Media Not Found**: Log error, don't retry
5. **Network Error**: Retry up to 3 times

**Fallback Logic:**
```typescript
// Always allow manual entry
// If API fails after 3 attempts, notify user to enter manually
if (job.attempts >= 3) {
  await sendNotification(
    contentItem.campaign_manager_id,
    `Instagram KPI capture failed for ${contentItem.title}. Please enter manually.`
  );
}
```

---

## 📈 After KPI System: Reporting & PDF

### TASK 7: Reporting & PDF Export (12-16 hours)

**PRD Reference**: Section 10  
**Priority**: P1 (High)

#### Phase 1: Report Data Model (2-3 hours)

**Database Schema:**
```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id),
    report_type VARCHAR(50), -- 'campaign', 'monthly', 'custom'
    title VARCHAR(500),
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'review', 'approved', 'sent'
    
    -- Date range
    period_start DATE,
    period_end DATE,
    
    -- Metadata
    created_by UUID REFERENCES profiles(id),
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE report_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports(id),
    section_type VARCHAR(100), -- 'summary', 'kpis', 'deliverables', 'narrative', 'insights'
    title VARCHAR(500),
    content TEXT, -- Markdown or HTML
    order_index INT,
    is_ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Phase 2: AI Narrative Generation (3-4 hours)

**OpenAI Integration:**
```typescript
import OpenAI from 'openai';

async function generateReportNarrative(campaignId: string): Promise<string> {
  const campaign = await getCampaignWithKPIs(campaignId);
  
  const prompt = `
    Generate a professional campaign report narrative for:
    
    Campaign: ${campaign.name}
    Client: ${campaign.client.name}
    Period: ${campaign.start_date} to ${campaign.end_date}
    
    KPIs:
    - Total Reach: ${campaign.kpis.total_reach}
    - Total Engagement: ${campaign.kpis.total_engagement}
    - Avg Engagement Rate: ${campaign.kpis.avg_engagement_rate}%
    
    Deliverables:
    ${campaign.content_items.map(item => 
      `- ${item.title}: ${item.status}`
    ).join('\\n')}
    
    Write a 3-paragraph executive summary highlighting:
    1. Campaign objectives and execution
    2. Key performance metrics and achievements
    3. Insights and recommendations
  `;
  
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 800
  });
  
  return completion.choices[0].message.content;
}
```

**API Endpoint:**
```typescript
// POST /api/reports/[id]/generate-narrative
export async function POST(request: Request, { params }) {
  const { id } = params;
  const report = await getReport(id);
  
  const narrative = await generateReportNarrative(report.campaign_id);
  
  await supabase.from('report_sections').insert({
    report_id: id,
    section_type: 'narrative',
    title: 'Executive Summary',
    content: narrative,
    is_ai_generated: true,
    order_index: 1
  });
  
  return Response.json({ narrative });
}
```

#### Phase 3: Report Builder UI (3-4 hours)

**Pages:**

**1. `/reports` - Reports List**
- All reports for user's campaigns
- Filter by status, campaign, date range
- Create new report button

**2. `/reports/new` - Create Report**
- Select campaign
- Select date range
- Select report type
- Generate button

**3. `/reports/[id]` - Report Editor**
- Preview mode / Edit mode toggle
- Section management:
  - Add section
  - Reorder sections (drag & drop)
  - Edit section content
  - Delete section
- Generate AI narrative button
- Export to PDF button
- Submit for approval button

**Components:**

**ReportSection.tsx**
```tsx
interface ReportSectionProps {
  section: ReportSection;
  isEditing: boolean;
  onUpdate: (content: string) => void;
  onDelete: () => void;
}

// Rich text editor for content
// Preview for view mode
```

#### Phase 4: PDF Export (3-4 hours)

**Library Choice**: Puppeteer or react-pdf

**Using Puppeteer** (headless Chrome):

```typescript
import puppeteer from 'puppeteer';

async function generatePDF(reportId: string): Promise<Buffer> {
  const report = await getReportWithSections(reportId);
  
  // Render HTML template
  const html = renderReportTemplate(report);
  
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    }
  });
  
  await browser.close();
  
  return pdf;
}

// API endpoint
// GET /api/reports/[id]/export-pdf
export async function GET(request: Request, { params }) {
  const { id } = params;
  const pdf = await generatePDF(id);
  
  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="report-${id}.pdf"`
    }
  });
}
```

**PDF Template** (HTML/CSS):
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    @page { size: A4; margin: 0; }
    body { font-family: Arial, sans-serif; }
    .header { background: #1e40af; color: white; padding: 30px; }
    .section { page-break-inside: avoid; margin: 20px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .kpi-card { border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; }
    .chart { width: 100%; height: 300px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${report.title}</h1>
    <p>${report.campaign.name} • ${report.period_start} to ${report.period_end}</p>
  </div>
  
  ${report.sections.map(section => `
    <div class="section">
      <h2>${section.title}</h2>
      <div>${section.content}</div>
    </div>
  `).join('')}
  
  <div class="section">
    <h2>KPI Summary</h2>
    <div class="kpi-grid">
      <div class="kpi-card">
        <h3>Total Reach</h3>
        <p class="text-4xl">${formatNumber(report.kpis.total_reach)}</p>
      </div>
      <!-- More KPI cards -->
    </div>
  </div>
</body>
</html>
```

---

## 📅 Timeline & Estimates

### Week 1 (Current)
- [ ] Complete Content Workflow (6-8 hours)
- [ ] Start KPI Manual Entry (2-3 hours)
- **Total**: 8-11 hours

### Week 2
- [ ] Complete KPI Manual Entry (4-5 hours)
- [ ] Instagram API Integration (16-20 hours)
- **Total**: 20-25 hours

### Week 3
- [ ] Reporting & PDF Export (12-16 hours)
- [ ] Finance & Invoicing (start, 6-8 hours)
- **Total**: 18-24 hours

### Week 4
- [ ] Complete Finance & Invoicing (4-6 hours)
- [ ] Notifications (6-8 hours)
- [ ] Final testing & polish (4-6 hours)
- **Total**: 14-20 hours

**Total Remaining**: ~60-80 hours (~4 weeks at 15-20 hours/week)

---

## 🎯 Success Criteria

### Content Workflow Complete
- [ ] Files can be uploaded to Supabase Storage
- [ ] Version history is displayed
- [ ] Internal approvals work end-to-end
- [ ] Client approvals work end-to-end
- [ ] Feedback system is functional
- [ ] Dashboard shows pending approvals
- [ ] Overdue items are highlighted

### KPI System Complete
- [ ] Manual KPI entry works
- [ ] Instagram OAuth connects successfully
- [ ] Profile data is fetched correctly
- [ ] Media posts are retrieved
- [ ] KPI snapshots are scheduled
- [ ] Jobs process on schedule
- [ ] Campaign rollups calculate correctly
- [ ] Fallback to manual works when API fails

### Reporting Complete
- [ ] Reports can be created
- [ ] AI narrative generates successfully
- [ ] Sections can be edited
- [ ] PDF exports work
- [ ] PDFs are professional quality
- [ ] All KPIs are included
- [ ] Templates are customizable

---

## 🚨 Blockers & Dependencies

### Immediate
- None - Ready to proceed

### For Instagram API
- Facebook Developer Account (can be created anytime)
- Instagram Business Account (test account needed)
- Vercel Cron Jobs or equivalent (for job scheduling)

### For Reporting
- OpenAI API Key (obtain from OpenAI)
- Puppeteer setup (may need Docker on serverless)
- Template design (can use basic initially)

---

## 📖 Documentation

Each task will include:
- [ ] Database schema updates in DB_SCHEMA.sql
- [ ] API endpoints in API_SPEC.md
- [ ] Architecture updates in ARCHITECTURE.md
- [ ] User guide for features
- [ ] Testing checklist
- [ ] Deployment notes

---

## ✅ Definition of Done

A task is complete when:
1. ✅ Code is written and tested
2. ✅ TypeScript compiles with no errors
3. ✅ All automated tests pass
4. ✅ Manual testing completed successfully
5. ✅ Documentation is updated
6. ✅ Code is committed and pushed
7. ✅ Progress is reported
8. ✅ Screenshots taken for UI changes

---

**Status**: Ready to proceed with Content Workflow Phase 4 (File Upload & Versioning)

**Next Action**: Begin building ContentUploadForm component and Supabase Storage integration
