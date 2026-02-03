# TiKiT Development Backlog

## Priority Levels
- **P0**: Critical - Must have for MVP
- **P1**: High - Important for MVP
- **P2**: Medium - Nice to have
- **P3**: Low - Future enhancement

---

## ✅ COMPLETED

### TASK 1: Documentation [P0] ✅
- [x] DB_SCHEMA.sql - Updated with 6-role model and ID generation
- [x] MVP_SPEC.md - Updated with PRD v1.2 alignment
- [x] ARCHITECTURE.md - Updated with 6-role model
- [x] API_SPEC.md - Updated role examples
- [x] DECISIONS.md - Added DEC-008 and DEC-009
- [x] BACKLOG.md - This file
- [x] README.md - Updated with security notice
- [x] PRD_COMPLIANCE_ANALYSIS.md - Comprehensive PRD analysis
- [x] PRD_ALIGNMENT_PLAN.md - Implementation roadmap
- [x] PRD_CHECK_SUMMARY.md - Executive summary

### TASK 2: RBAC + Invite-Only System [P0] ✅
- [x] **Six-role model per PRD v1.2 Section 2**
  - director, campaign_manager, reviewer, finance, client, influencer
- [x] Database schema with user roles
- [x] Row Level Security policies
- [x] Director role implementation
- [x] Invitation system (create, send, expire, revoke)
- [x] Invite-only signup flow
- [x] Pending approval workflow
- [x] Frontend route protection
- [x] Frontend UI role gating
- [x] RoleGate component with helpers (DirectorOnly, FinanceOnly, CampaignManagerOnly, ReviewerOnly)
- [x] Director dashboard for invitation management
- [x] Updated RBAC utilities with new role hierarchy
- [x] Documentation updates

### TASK 3: Human-Readable IDs [P0] ✅
- [x] Database sequences (campaign_id_seq, client_id_seq, influencer_id_seq, invoice_id_seq)
- [x] ID generation functions:
  - `generate_campaign_id()` → TKT-YYYY-####
  - `generate_client_id()` → CLI-####
  - `generate_influencer_id()` → INF-####
  - `generate_invoice_id()` → INV-YYYY-####
- [x] Documentation in DB_SCHEMA.sql
- [ ] Integration when entity tables are created (future task)

---

## 📋 TODO

### TASK 4: Content Workflow [P0] - Per PRD Section 8
**Estimate**: 12-16 hours  
**Priority**: Critical (P0 per PRD Section 15)

- [ ] Content upload to Supabase Storage
- [ ] Version control for content
- [ ] Internal approval stage (reviewer role)
- [ ] Client approval stage
- [ ] Feedback/comment system
- [ ] Approval status tracking
- [ ] Overdue reminder system
- [ ] Email notifications

**Database Tables:**
- `content_items`
- `content_versions`
- `content_approvals`
- `content_comments`

**Pages:**
- `/content` - Content library
- `/content/upload` - Upload interface
- `/content/[id]` - Content detail + approval
- `/content/[id]/feedback` - Feedback interface

---

### TASK 5: KPI Manual Entry [P0] - Per PRD Section 9
**Estimate**: 6-8 hours  
**Priority**: Critical (P0 per PRD Section 15)

- [ ] KPI entry form (per post)
- [ ] KPI entry form (per influencer)
- [ ] Campaign KPI rollup calculations
- [ ] KPI data validation
- [ ] Historical KPI tracking

**Database Tables:**
- `kpis`
- `campaign_kpis` (aggregated)

**Pages:**
- `/campaigns/[id]/kpis` - KPI dashboard
- `/campaigns/[id]/kpis/add` - Manual entry form

---

### TASK 6: Instagram API Integration [P0] - Per PRD Section 9
**Estimate**: 16-20 hours  
**Priority**: Critical (P0 per PRD Section 15)

- [ ] Instagram OAuth flow
- [ ] Token storage (server-side, encrypted)
- [ ] Profile data fetch
- [ ] Media fetch
- [ ] KPI snapshot job (Day 1, 3, 7)
- [ ] Scheduled job system (cron or triggers)
- [ ] Raw payload storage
- [ ] KPI normalization
- [ ] Fallback to manual entry
- [ ] Eligibility check for API access

**Database Tables:**
- `instagram_connections`
- `instagram_tokens` (encrypted)
- `instagram_raw_data`
- `scheduled_jobs`

**API Endpoints:**
- `/api/instagram/connect` - OAuth initiation
- `/api/instagram/callback` - OAuth callback
- `/api/instagram/fetch-profile`
- `/api/instagram/fetch-media`
- `/api/instagram/snapshot-kpis`

---

### TASK 7: Reporting & PDF Export [P1] - Per PRD Section 10
**Estimate**: 10-12 hours  
**Priority**: High (P1 per PRD Section 15)

- [ ] Campaign report generator
- [ ] KPI aggregation for reports
- [ ] Deliverables completion tracking
- [ ] AI narrative generation (OpenAI/Claude)
- [ ] Editable report content
- [ ] PDF export for briefs
- [ ] PDF export for strategies
- [ ] PDF export for reports
- [ ] Report templates

**Database Tables:**
- `reports`
- `report_sections`

**Pages:**
- `/reports` - Reports list
- `/reports/[id]` - Report editor
- `/reports/[id]/export` - PDF export

**Libraries:**
- PDF generation (puppeteer, react-pdf, or jsPDF)
- AI integration (OpenAI API)

---

### TASK 8: Campaign Management [P0] - Per PRD Sections 4, 5, 6, 7
**Estimate**: 20-24 hours  
**Priority**: Critical (required for MVP)

**Campaign Lifecycle (PRD Section 4)**:
- [ ] Status flow: draft → in_review → pitching → live → reporting → closed
- [ ] Status gates with approvals
- [ ] Campaign CRUD operations
- [ ] Use human-readable IDs (TKT-YYYY-####)

**Brief Intake (PRD Section 5)**:
- [ ] Upload PDF or paste text
- [ ] AI extraction (objectives, KPIs, audience, deliverables, budget)
- [ ] Human review interface
- [ ] Version history

**Strategy Generation (PRD Section 5)**:
- [ ] AI-generated campaign summary
- [ ] Key messages
- [ ] Content pillars
- [ ] Matching criteria
- [ ] Editable by humans
- [ ] PDF export

**Influencer Matching (PRD Section 6)**:
- [ ] Managed influencer directory
- [ ] Rate cards, niches, geo, language
- [ ] AI scoring (assistive only)
- [ ] Human override

**Client Pitch (PRD Section 7)**:
- [ ] Auto-generated pitch deck
- [ ] Client portal view
- [ ] Approve/request changes
- [ ] Audit trail

**Database Tables:**
- `campaigns` (with campaign_code)
- `briefs`
- `brief_versions`
- `strategies`
- `influencer_matches`
- `pitches`
- `pitch_approvals`

---

### TASK 9: Client & Influencer Management [P1]
**Estimate**: 12-16 hours

**Clients**:
- [ ] Client CRUD with CLI-#### IDs
- [ ] Client portal access
- [ ] Client-specific reports

**Influencers**:
- [ ] Influencer CRUD with INF-#### IDs
- [ ] Rate cards
- [ ] Niche/geo/language tags
- [ ] Contract management
- [ ] Instagram connection status

**Database Tables:**
- `clients` (with client_code)
- `influencers` (with influencer_code)
- `contracts`

---

### TASK 10: Finance & Invoicing [P1] - Per PRD Section 11
**Estimate**: 10-12 hours  
**Priority**: High (finance role requires this)

- [ ] Invoice CRUD with INV-YYYY-#### IDs
- [ ] Client invoices
- [ ] Influencer invoices
- [ ] Status: draft → sent → approved → paid
- [ ] Finance-only permissions (finance role)
- [ ] Director balance view
- [ ] Payment tracking

**Database Tables:**
- `invoices` (with invoice_code)
- `invoice_line_items`
- `payments`

**Pages:**
- `/finance` - Finance dashboard (Finance + Director only)
- `/invoices` - Invoice management
- `/invoices/[id]` - Invoice detail

---

### TASK 11: Notifications [P1] - Per PRD Section 12
**Estimate**: 6-8 hours

- [ ] In-app notification center
- [ ] Deadline reminders
- [ ] Approval reminders
- [ ] Email notifications (optional)
- [ ] Notification preferences

**Database Tables:**
- `notifications`
- `notification_preferences`

---

## 🔮 FUTURE ENHANCEMENTS [P2-P3]

### User Management [P2]
- [ ] User list page (Director)
- [ ] User detail/edit (Director)
- [ ] Role change workflow
- [ ] User deactivation

### Campaign Management [P2]
- [ ] Campaign CRUD
- [ ] Campaign dashboard
- [ ] Campaign timeline
- [ ] Budget tracking

### Client Management [P2]
- [ ] Client CRUD
- [ ] Client portal
- [ ] Client-specific reports

### Influencer Management [P2]
- [ ] Influencer CRUD
- [ ] Influencer discovery
- [ ] Influencer ratings
- [ ] Contract management

### Analytics & Insights [P2]
- [ ] Dashboard analytics
- [ ] Performance trends
- [ ] Comparative analysis
- [ ] ROI calculations

### Notifications [P3]
- [ ] Email notifications
- [ ] In-app notifications
- [ ] Notification preferences

### Advanced Features [P3]
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Mobile app
- [ ] API for third-party integrations
- [ ] Webhooks
- [ ] Advanced search
- [ ] Data export (CSV, Excel)

---

## 🐛 KNOWN ISSUES

None currently.

---

## 📊 METRICS

### Completed Tasks: 3/11 (Tasks 1, 2, 3)
### Progress: ~30% (Foundation complete, P0 features remain)
### Estimated Total Time: 100-130 hours
### Time Spent: ~20 hours

### PRD Compliance: ~30%
- ✅ Authentication & Authorization (6-role model)
- ✅ Human-readable IDs (implementation ready)
- ❌ Campaign lifecycle & management
- ❌ Content workflow
- ❌ KPI system
- ❌ Reporting
- ❌ Finance tracking

### Next Priority (Per PRD Section 15):
1. Campaign Management (TASK 8) - Required for MVP
2. Content Workflow (TASK 4) - P0
3. KPI Manual + Instagram (TASKS 5 & 6) - P0
