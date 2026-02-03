# TiKiT Development Backlog

## Priority Levels
- **P0**: Critical - Must have for MVP
- **P1**: High - Important for MVP
- **P2**: Medium - Nice to have
- **P3**: Low - Future enhancement

---

## ✅ COMPLETED

### TASK 2: RBAC + Invite-Only System [P0] ✅
- [x] Database schema with user roles
- [x] Row Level Security policies
- [x] Director role implementation
- [x] Invitation system (create, send, expire, revoke)
- [x] Invite-only signup flow
- [x] Pending approval workflow
- [x] Frontend route protection
- [x] Frontend UI role gating
- [x] RoleGate component for conditional rendering
- [x] Director dashboard for invitation management
- [x] Documentation

---

## 🔄 IN PROGRESS

### TASK 1: Documentation [P0]
- [x] DB_SCHEMA.sql
- [x] MVP_SPEC.md
- [x] ARCHITECTURE.md
- [x] API_SPEC.md
- [ ] DECISIONS.md
- [ ] BACKLOG.md (this file)
- [ ] README.md update

---

## 📋 TODO

### TASK 3: Human-Readable IDs [P0]
**Estimate**: 4-6 hours

- [ ] Campaign ID generator: `TKT-YYYY-####`
- [ ] Client ID generator: `CLI-####`
- [ ] Influencer ID generator: `INF-####`
- [ ] Invoice ID generator: `INV-YYYY-####`
- [ ] Database sequences for auto-increment
- [ ] Display IDs in all UI views
- [ ] Include IDs in exports/reports

**Files to Create/Modify:**
- `docs/DB_SCHEMA.sql` - Add ID generation functions
- `lib/id-generators.ts` - ID generation utilities
- UI components - Display generated IDs

---

### TASK 4: Content Workflow [P0]
**Estimate**: 12-16 hours

- [ ] Content upload to Supabase Storage
- [ ] Version control for content
- [ ] Internal approval stage
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

### TASK 5: KPI Manual Entry [P1]
**Estimate**: 6-8 hours

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

### TASK 6: Instagram API Integration [P1]
**Estimate**: 16-20 hours

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

### TASK 7: Reporting & PDF Export [P1]
**Estimate**: 10-12 hours

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

### Completed Tasks: 1/7
### Progress: ~14%
### Estimated Total Time: 60-80 hours
### Time Spent: ~8 hours
