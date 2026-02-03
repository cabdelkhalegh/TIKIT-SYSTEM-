# TiKiT PRD v1.2 — Flagship Internal‑First Influencer Agency OS

**Version:** 1.2
**Status:** Canonical PRD (Platform‑agnostic)
**Audience:** Product, Engineering, AI, Ops
**Scope:** MVP+ (Flagship baseline)

---

## 1. Vision & Goals

TiKiT is an **internal‑first operating system** for influencer agencies, designed to eliminate manual coordination, enforce governance, and create an auditable, scalable campaign lifecycle.

**Primary Goals**
- Eliminate WhatsApp/Email chaos (track, remind, log — not replace initially)
- Human‑in‑the‑loop AI for speed without loss of control
- Full campaign financial traceability
- Director‑level governance & approvals
- Single source of truth from brief → report → finance

**Non‑Goals (v1.2)**
- No automated payments
- No public marketplace
- No influencer self‑discovery (managed database only)

---

## 2. Personas & Roles

### Roles (Authoritative)
| Role | Description | Special Rights |
|-----|-------------|----------------|
| **Founder / Director** | Super‑user | Global visibility, budget overrides, exception approvals |
| Campaign Manager | Runs campaigns | Create/edit campaigns, manage workflows |
| Reviewer | Quality & approvals | Approve briefs, content, reports |
| Finance | Financial control | Create & approve invoices, mark paid |
| Client | External approver | View & approve shortlist, content, reports |
| Influencer | External contributor | Upload content, connect Instagram, view status |

**Rules**
- Invitation‑only signup
- Roles assigned by Director only
- UI + API must enforce role gating

---

## 3. Core Objects & Identity System

### Human‑Readable IDs (Mandatory)
| Entity | Format | Example |
|------|--------|---------|
| Campaign | `TKT‑YYYY‑XXXX` | TKT‑2026‑0007 |
| Client | `CLI‑XXXX` | CLI‑0142 |
| Influencer | `INF‑XXXX` | INF‑0901 |
| Invoice | `INV‑YYYY‑XXXX` | INV‑2026‑0033 |

IDs are immutable and displayed everywhere.

---

## 4. Campaign Lifecycle (Canonical)

### Status Flow
`draft → in_review → pitching → live → reporting → closed`

### Status Gates
- **draft → in_review**: Brief reviewed
- **in_review → pitching**: Director approves budget
- **pitching → live**: Client approves shortlist
- **live → reporting**: All content posted
- **reporting → closed**: Report + finance approved

---

## 5. Brief Intake & Strategy

### Brief Intake
- Upload PDF or paste text
- AI extracts: objectives, KPIs, audience, deliverables, budget signals
- Human review required
- Version history mandatory

### Strategy Generation
- AI generates:
  - Campaign summary
  - Key messages
  - Content pillars
  - Matching criteria
- Editable by humans
- Exportable as PDF

---

## 6. Influencer Management & Matching

### Influencer Database
- Managed internal directory
- Rate cards, niches, geo, language
- Instagram connection status

### AI Scoring (Assistive Only)
- Weighted scoring with rationale
- Human override allowed
- Scores never auto‑approve

---

## 7. Client Pitch & Approval Loop

- Auto‑generated pitch (shortlist + rationale)
- Client portal (limited view)
- Approve / request changes
- Full audit trail

---

## 8. Content Workflow (Critical)

### Submission
- Influencer uploads content (idea/draft/final)
- Versioned

### Approval
- Internal approval → Client approval
- Feedback loops enforced

### Posting
- Influencer submits live post URL

---

## 9. KPI Capture & Instagram API

### Instagram Integration (MVP)
- OAuth connection per influencer
- Store tokens securely
- Auto‑demographics + post metrics

### KPI Snapshots
- Auto capture Day 1 / 3 / 7
- Manual override always allowed

---

## 10. Reporting & Closeout

- KPI aggregation
- AI narrative summary (editable)
- Lessons learned
- PDF export
- Client approval required

---

## 11. Finance & Governance

### Finance Tracking
- Client invoices
- Influencer invoices
- Status: draft → sent → approved → paid

### Governance Rules
- Finance only can create/mark paid
- Director sees all balances

---

## 12. Notifications & Reminders

- In‑app notification center
- Deadline reminders
- Approval reminders
- WhatsApp remains external (logged only)

---

## 13. Security & Compliance

- RLS enforced everywhere
- Full audit logs
- Role‑based UI rendering

---

## 14. MVP Acceptance Criteria

MVP is complete when:
- Full campaign can run without WhatsApp dependency
- Director approval gates enforced
- Content & KPI workflows functional
- Instagram auto KPIs working
- Financial traceability achieved

---

## 15. Build Order (Mandatory)

**P0**
- Role enforcement + Director role
- Content workflow
- KPI manual + Instagram

**P1**
- Reporting + PDF exports
- Notifications

**P2**
- Client/Influencer portal polish

---

**This PRD is canonical and supersedes all previous versions.**

