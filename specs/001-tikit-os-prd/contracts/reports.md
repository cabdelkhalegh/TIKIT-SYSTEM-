# API Contract: Reports

**Base Path**: `/api/v1/campaigns/:campaignId/reports`
**Standards**: All responses follow `{ success: boolean, data?: any, error?: string }` envelope. JWT Bearer token required.

---

## Create Report

**Method**: POST **Path**: `/campaigns/:campaignId/reports`
**Auth**: Required **Roles**: director, campaign_manager

Creates a campaign report in `draft` status. Aggregates KPI data and generates an AI narrative summary. The campaign should have KPI data available for meaningful report generation.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| highlights | string | No | Custom highlights to include in the report |
| generateNarrative | boolean | No | Whether to generate AI narrative (default: true) |

**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "campaignId": "cuid",
    "status": "draft",
    "kpiSummary": {
      "totalReach": 850000,
      "totalImpressions": 1240000,
      "totalEngagement": 56000,
      "totalClicks": 3200,
      "averageEngagementRate": 4.5,
      "influencerCount": 8
    },
    "highlights": "Strong performance across all influencers...",
    "aiNarrative": "The Summer Beauty Campaign achieved exceptional reach of 850K across 8 influencers. Engagement rates averaged 4.5%, exceeding the industry benchmark of 2.8%. Key performer @beautybylayla delivered 95K reach with a 5.1% engagement rate...",
    "approvedBy": null,
    "approvedAt": null,
    "shareableUrl": null,
    "createdAt": "2026-02-25T10:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "Campaign has no KPI data to generate a report from" }`
**Response 400**: `{ "success": false, "error": "Cannot create reports for a closed campaign" }`
**Response 404**: `{ "success": false, "error": "Campaign not found" }`

---

## Get Report

**Method**: GET **Path**: `/campaigns/:campaignId/reports/:id`
**Auth**: Required **Roles**: director, campaign_manager, reviewer, client

Returns full report details. Clients can only access reports for campaigns they are assigned to.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |
| id | string | Report CUID |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "campaignId": "cuid",
    "campaign": {
      "displayId": "TKT-2026-0042",
      "name": "Summer Beauty Campaign",
      "client": { "companyName": "Luxe Beauty" },
      "startDate": "2026-03-01T00:00:00Z",
      "endDate": "2026-04-30T00:00:00Z"
    },
    "status": "pending_approval",
    "kpiSummary": {
      "totalReach": 850000,
      "totalImpressions": 1240000,
      "totalEngagement": 56000,
      "totalClicks": 3200,
      "averageEngagementRate": 4.5,
      "influencerCount": 8,
      "byInfluencer": [
        {
          "handle": "@beautybylayla",
          "reach": 95000,
          "impressions": 142000,
          "engagement": 7200,
          "clicks": 420
        }
      ]
    },
    "highlights": "Strong performance across all influencers...",
    "aiNarrative": "The Summer Beauty Campaign achieved exceptional reach...",
    "approvedBy": null,
    "approvedAt": null,
    "exportedAt": null,
    "shareableUrl": null,
    "createdAt": "2026-02-25T10:00:00Z",
    "updatedAt": "2026-02-25T12:00:00Z"
  }
}
```

**Response 404**: `{ "success": false, "error": "Report not found" }`
**Response 403**: `{ "success": false, "error": "You do not have access to this report" }`

---

## Update Report Status

**Method**: PATCH **Path**: `/campaigns/:campaignId/reports/:id/status`
**Auth**: Required **Roles**: director, campaign_manager, client

Transitions the report through its approval lifecycle.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |
| id | string | Report CUID |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| status | string | Yes | Target ReportStatus: pending_approval, approved, exported |
| highlights | string | No | Updated highlights (only when status is draft) |

**Valid Transitions**:

| From | To | Who |
|---|---|---|
| draft | pending_approval | Campaign Manager |
| pending_approval | approved | Client, Director |
| approved | exported | Campaign Manager, Director |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "previousStatus": "draft",
    "newStatus": "pending_approval",
    "updatedAt": "2026-02-25T12:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "Invalid status transition from draft to approved" }`
**Response 404**: `{ "success": false, "error": "Report not found" }`

---

## Export Report as PDF

**Method**: GET **Path**: `/campaigns/:campaignId/reports/:id/export/pdf`
**Auth**: Required **Roles**: director, campaign_manager, client

Generates and returns a branded PDF narrative report. Updates the report's `exportedAt` timestamp.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |
| id | string | Report CUID |

**Response 200**:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="TKT-2026-0042-report.pdf"`
- Binary PDF data

**Response 400**: `{ "success": false, "error": "Report must be in approved or exported status for PDF export" }`
**Response 404**: `{ "success": false, "error": "Report not found" }`

---

## Export Report as CSV

**Method**: GET **Path**: `/campaigns/:campaignId/reports/:id/export/csv`
**Auth**: Required **Roles**: director, campaign_manager, finance

Generates and returns a CSV file containing raw KPI data tables for the campaign.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |
| id | string | Report CUID |

**Response 200**:
- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename="TKT-2026-0042-kpis.csv"`
- CSV data with headers: `influencer_handle, influencer_id, capture_day, reach, impressions, engagement, clicks, source, captured_at`

**Response 400**: `{ "success": false, "error": "Report must be in approved or exported status for CSV export" }`
**Response 404**: `{ "success": false, "error": "Report not found" }`

---

## Generate Shareable Link

**Method**: GET **Path**: `/campaigns/:campaignId/reports/:id/share`
**Auth**: Required **Roles**: director, campaign_manager

Generates or retrieves a shareable read-only web link for the report. The link is accessible without authentication and displays the report in a branded read-only view.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |
| id | string | Report CUID |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "shareableUrl": "https://app.tikit.ae/reports/share/abc123def456",
    "expiresAt": null,
    "createdAt": "2026-02-25T14:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "Report must be in approved or exported status to generate a shareable link" }`
**Response 404**: `{ "success": false, "error": "Report not found" }`
