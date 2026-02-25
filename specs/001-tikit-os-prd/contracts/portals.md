# API Contract: Portals

**Base Path**: `/api/v1`
**Standards**: All responses follow `{ success: boolean, data?: any, error?: string }` envelope. JWT Bearer token required.

---

# Client Portal

All client portal endpoints are scoped to campaigns assigned to the authenticated client user in `pitching` or `live` status.

---

## Client Dashboard

**Method**: GET **Path**: `/client-portal/dashboard`
**Auth**: Required **Roles**: client

Returns the client's dashboard with aggregated stats and consolidated KPIs across their assigned campaigns.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "activeCampaigns": 3,
      "pendingApprovals": 2,
      "contractedCreators": 12,
      "reportsReady": 1,
      "totalReach": 1250000
    },
    "consolidatedKpis": {
      "totalReach": 1250000,
      "totalImpressions": 1800000,
      "totalEngagement": 85000,
      "totalClicks": 4200
    },
    "recentActivity": [
      {
        "type": "content_submitted",
        "campaignName": "Summer Beauty Campaign",
        "message": "New content submitted by @beautybylayla",
        "createdAt": "2026-02-25T10:00:00Z"
      }
    ]
  }
}
```

---

## Client Campaigns

**Method**: GET **Path**: `/client-portal/campaigns`
**Auth**: Required **Roles**: client

Returns the client's assigned campaigns that are in `pitching` or `live` status.

**Query Parameters**:

| Param | Type | Default | Description |
|---|---|---|---|
| status | string | — | Filter: pitching, live |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "cuid",
        "displayId": "TKT-2026-0042",
        "name": "Summer Beauty Campaign",
        "status": "pitching",
        "startDate": "2026-03-01T00:00:00Z",
        "endDate": "2026-04-30T00:00:00Z",
        "influencerCount": 8,
        "pendingApprovals": 1,
        "kpiSummary": {
          "totalReach": 0,
          "totalImpressions": 0,
          "totalEngagement": 0
        }
      }
    ],
    "count": 3
  }
}
```

---

## Approve Shortlist

**Method**: POST **Path**: `/client-portal/shortlists/:id/approve`
**Auth**: Required **Roles**: client

Approves an influencer shortlist for a campaign. The shortlist ID corresponds to an Approval record of type `shortlist`.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| id | string | Approval CUID (type: shortlist) |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| feedback | string | No | Optional approval feedback |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "status": "approved",
    "approvedBy": "cuid",
    "message": "Shortlist approved. Campaign can now advance to live.",
    "updatedAt": "2026-02-25T14:00:00Z"
  }
}
```

**Response 404**: `{ "success": false, "error": "Shortlist approval not found" }`
**Response 403**: `{ "success": false, "error": "You are not authorized to approve this shortlist" }`

---

## Reject Shortlist

**Method**: POST **Path**: `/client-portal/shortlists/:id/reject`
**Auth**: Required **Roles**: client

Rejects an influencer shortlist. The campaign remains in `pitching` status and the Campaign Manager is notified.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| id | string | Approval CUID (type: shortlist) |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| reason | string | Yes | Reason for rejection |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "status": "rejected",
    "rejectedBy": "cuid",
    "reason": "Budget too high for proposed influencers",
    "message": "Shortlist rejected. Campaign Manager has been notified.",
    "updatedAt": "2026-02-25T14:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "reason is required when rejecting a shortlist" }`

---

## Approve Content (Client Portal)

**Method**: POST **Path**: `/client-portal/content/:id/approve`
**Auth**: Required **Roles**: client

Approves content that has passed internal review (status: `internal_approved`). Sets status to `client_approved`. For `final` type content, clears the posting gate.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| id | string | Content CUID |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| feedback | string | No | Optional approval feedback |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "approvalStatus": "client_approved",
    "postingBlocked": false,
    "clientFeedback": "Looks great!",
    "updatedAt": "2026-02-25T16:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "Content must be internally approved before client approval" }`
**Response 403**: `{ "success": false, "error": "You are not authorized to approve this content" }`

---

## Request Content Changes (Client Portal)

**Method**: POST **Path**: `/client-portal/content/:id/request-changes`
**Auth**: Required **Roles**: client

Requests changes to content with feedback. Sets status to `changes_requested`. The influencer and Campaign Manager are notified.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| id | string | Content CUID |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| feedback | string | Yes | Detailed feedback for requested changes |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "approvalStatus": "changes_requested",
    "clientFeedback": "Please make the product placement more prominent in the opening frame.",
    "updatedAt": "2026-02-25T16:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "feedback is required when requesting changes" }`

---

## Approve Report (Client Portal)

**Method**: POST **Path**: `/client-portal/reports/:id/approve`
**Auth**: Required **Roles**: client

Approves a campaign report. The report must be in `pending_approval` status. This is a prerequisite for campaign closure.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| id | string | Report CUID |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| feedback | string | No | Optional approval feedback |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "status": "approved",
    "approvedBy": "cuid",
    "approvedAt": "2026-02-25T16:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "Report must be in pending_approval status" }`
**Response 403**: `{ "success": false, "error": "You are not authorized to approve this report" }`

---

# Influencer Portal

All influencer portal endpoints are scoped to campaigns the authenticated influencer is assigned to.

---

## Influencer Dashboard

**Method**: GET **Path**: `/influencer-portal/dashboard`
**Auth**: Required **Roles**: influencer

Returns the influencer's dashboard with stats and workflow summary.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "activeCampaigns": 2,
      "briefsToAccept": 1,
      "pendingReview": 3,
      "approvedContent": 5,
      "urgentDeadlines": 0
    },
    "upcomingDeadlines": [
      {
        "campaignName": "Summer Beauty Campaign",
        "type": "content_submission",
        "dueDate": "2026-03-05T00:00:00Z"
      }
    ]
  }
}
```

---

## Influencer Campaigns

**Method**: GET **Path**: `/influencer-portal/campaigns`
**Auth**: Required **Roles**: influencer

Returns campaigns the influencer is assigned to, with their assignment details and workflow cards.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "cuid",
        "displayId": "TKT-2026-0042",
        "name": "Summer Beauty Campaign",
        "status": "live",
        "assignment": {
          "id": "cuid",
          "status": "brief_accepted",
          "briefAccepted": true,
          "briefAcceptedAt": "2026-02-22T10:00:00Z",
          "agreedCost": 5000,
          "contentSubmitted": 2,
          "contentApproved": 1,
          "contentPending": 1
        },
        "startDate": "2026-03-01T00:00:00Z",
        "endDate": "2026-04-30T00:00:00Z"
      }
    ],
    "count": 2
  }
}
```

---

## Accept Brief

**Method**: POST **Path**: `/influencer-portal/briefs/:id/accept`
**Auth**: Required **Roles**: influencer

Accepts a campaign brief. The ID is the CampaignInfluencer CUID. Sets the brief acceptance flag and unlocks content submission. The influencer must be in `contracted` status.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| id | string | CampaignInfluencer CUID |

**Request Body**: None (or empty `{}`)

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "briefAccepted": true,
    "briefAcceptedAt": "2026-02-25T10:00:00Z",
    "status": "brief_accepted",
    "message": "Brief accepted. You can now submit content."
  }
}
```

**Response 400**: `{ "success": false, "error": "You must be in contracted status to accept a brief" }`
**Response 400**: `{ "success": false, "error": "Brief has already been accepted" }`
**Response 403**: `{ "success": false, "error": "You are not assigned to this campaign" }`

---

## Submit Content (Influencer Portal)

**Method**: POST **Path**: `/influencer-portal/content`
**Auth**: Required **Roles**: influencer

Submits a content artifact for one of the influencer's assigned campaigns. The influencer must have accepted the brief first.

**Request**: `Content-Type: multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| file | file | Yes | Content file (max 1 GB) |
| campaignInfluencerId | string | Yes | CampaignInfluencer CUID |
| type | string | Yes | ContentType: script, video_draft, final |

**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "campaignId": "cuid",
    "campaignInfluencerId": "cuid",
    "type": "script",
    "versionNumber": 1,
    "approvalStatus": "pending",
    "fileName": "script-draft.pdf",
    "fileUrl": "https://...",
    "fileSizeBytes": 524288,
    "createdAt": "2026-02-25T10:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "You must accept the brief before submitting content" }`
**Response 413**: `{ "success": false, "error": "File size exceeds 1 GB maximum" }`

---

## Get Content Status

**Method**: GET **Path**: `/influencer-portal/content/status`
**Auth**: Required **Roles**: influencer

Returns the approval status of all content submitted by the influencer across their campaigns, with any feedback provided.

**Query Parameters**:

| Param | Type | Default | Description |
|---|---|---|---|
| campaignInfluencerId | string | — | Filter by specific campaign assignment |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "cuid",
        "campaign": {
          "displayId": "TKT-2026-0042",
          "name": "Summer Beauty Campaign"
        },
        "type": "script",
        "versionNumber": 1,
        "approvalStatus": "internal_approved",
        "internalFeedback": null,
        "clientFeedback": null,
        "createdAt": "2026-02-25T10:00:00Z",
        "updatedAt": "2026-02-25T12:00:00Z"
      },
      {
        "id": "cuid",
        "campaign": {
          "displayId": "TKT-2026-0042",
          "name": "Summer Beauty Campaign"
        },
        "type": "video_draft",
        "versionNumber": 1,
        "approvalStatus": "changes_requested",
        "internalFeedback": "Please adjust the opening hook to mention the brand earlier.",
        "clientFeedback": null,
        "createdAt": "2026-02-25T14:00:00Z",
        "updatedAt": "2026-02-25T16:00:00Z"
      }
    ],
    "count": 2
  }
}
```

---

## Request Deliverable Adjustment

**Method**: POST **Path**: `/influencer-portal/adjustments`
**Auth**: Required **Roles**: influencer

Requests a modification to deliverable terms (timeline or rate) for a campaign assignment. Triggers a notification to the Campaign Manager.

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| campaignInfluencerId | string | Yes | CampaignInfluencer CUID |
| adjustmentType | string | Yes | Type: `timeline` or `rate` |
| currentValue | string | No | Current value for context |
| requestedValue | string | Yes | Requested new value |
| reason | string | Yes | Justification for the adjustment |

**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "campaignInfluencerId": "cuid",
    "adjustmentType": "timeline",
    "requestedValue": "2026-03-15",
    "reason": "Need additional time for filming due to scheduling conflict",
    "message": "Adjustment request submitted. Campaign Manager has been notified.",
    "createdAt": "2026-02-25T10:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "adjustmentType must be one of: timeline, rate" }`
**Response 400**: `{ "success": false, "error": "reason is required for adjustment requests" }`
**Response 403**: `{ "success": false, "error": "You are not assigned to this campaign" }`
