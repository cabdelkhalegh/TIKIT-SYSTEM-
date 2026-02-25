# Closure API Contract

**Source**: Adi audit document (Feb 25, 2026) — Part 3
**Added**: Feb 25, 2026

---

## Base Path: `/api/v1/campaigns/:campaignId/closure`

All responses follow the standard `{ success, data, error }` envelope.
JWT authentication required on all endpoints.
Campaign must be in `reporting` status unless noted otherwise.

---

## GET `/closure` — Get Closure Status

**Roles**: `director`, `campaign_manager`

Returns the full closure checklist — shows what is done and what is still blocking campaign closure.

**Success 200**:
```json
{
  "success": true,
  "data": {
    "campaignId": "string",
    "status": "reporting",
    "checklist": {
      "reportApproved": true,
      "allInvoicesSettled": false,
      "cxSurveyCompleted": false,
      "postMortemCompleted": false,
      "aiLearningsGenerated": false
    },
    "canClose": false,
    "unmetRequirements": [
      "All invoices must be paid",
      "CX survey must be completed",
      "Post-mortem must be completed"
    ]
  }
}
```

**Error 400**: Campaign not in reporting status
```json
{ "success": false, "error": "Campaign must be in reporting status to access closure" }
```

---

## POST `/closure/cx-survey` — Save CX Survey

**Roles**: `director`, `campaign_manager`

Save client experience ratings. One CX survey per campaign — upsert behavior (create or update).

**Request body**:
```json
{
  "overallScore": 5,
  "communicationScore": 4,
  "qualityScore": 5,
  "timelinessScore": 3,
  "valueScore": 4,
  "testimonial": "string (optional)"
}
```

All score fields are integers 1–5 (required). `testimonial` is optional.

**Success 201**: Returns the created/updated CX survey record
**Error 400**: Score fields must be integers 1–5

---

## POST `/closure/post-mortem` — Save Post-Mortem

**Roles**: `director`, `campaign_manager`

Save closure analysis. One post-mortem per campaign — upsert behavior.

**Request body**:
```json
{
  "wentWell": ["string"],
  "improvements": ["string"],
  "lessons": ["string"],
  "actionItems": ["string"],
  "riskNotes": "string (optional)",
  "budgetAnalysis": "string (optional)",
  "timelineAnalysis": "string (optional)"
}
```

All array fields required (can be empty arrays). Text fields optional.

**Success 201**: Returns the created/updated post-mortem record
**Error 400**: Validation error

---

## POST `/closure/ai-learnings` — Generate AI Learnings

**Roles**: `director`, `campaign_manager`

Generates `learnings`, `bestPractices`, and an `intelligenceDocument` via Gemini 2.0 Flash,
using the CX survey, post-mortem, KPI summary, and campaign data as inputs.

Consumes 1 Gemini API request. Output is advisory (constitution §VI).

**Request body**: Empty `{}` — all data fetched server-side

**Success 200**:
```json
{
  "success": true,
  "data": {
    "learnings": ["string"],
    "bestPractices": ["string"],
    "intelligenceDocument": "string (full narrative)"
  }
}
```

**Error 400**: Prerequisites not met
```json
{
  "success": false,
  "error": "CX survey and post-mortem must be completed before generating AI learnings"
}
```

**Error 503**: Gemini unavailable — `fallbackRequired: true`

---

## POST `/closure/close` — Close Campaign

**Roles**: `director`, `campaign_manager`

Validates all closure requirements, then permanently closes the campaign.
Sets `status` to `closed`, records `closedAt`, calculates `retentionExpiresAt` (closedAt + 3 years),
and activates immutability (closed campaigns cannot be modified — constitution §IV).

**This action is irreversible.**

**Request body**: Empty `{}` — all validation done server-side

**Validation sequence** (all must pass):
1. Report is client-approved (`report.status === 'approved'`)
2. All invoices are paid (`invoice.status === 'paid'` for all)
3. CX survey completed
4. Post-mortem completed

**Success 200**:
```json
{
  "success": true,
  "data": {
    "campaignId": "string",
    "status": "closed",
    "closedAt": "ISO datetime",
    "retentionExpiresAt": "ISO datetime (+3 years)"
  }
}
```

**Error 400**: Returns unmet requirements if any condition fails
```json
{
  "success": false,
  "error": "Cannot close campaign — requirements not met",
  "data": {
    "unmetRequirements": ["All invoices must be paid", "CX survey must be completed"]
  }
}
```

---

## Notes

- Closure is the final stage — once closed, all campaign data is immutable (enforced at DB + API level)
- Data retention: 3 years from `closedAt`, then Director is notified for manual purge approval
- Models used: `CXSurvey`, `PostMortem`, `AuditLog`, `Campaign` (status update)
- Closure triggers an `AuditLog` entry of type `campaign_closed`
