# API Contract: KPIs

**Base Path**: `/api/v1/campaigns/:campaignId/kpis`
**Standards**: All responses follow `{ success: boolean, data?: any, error?: string }` envelope. JWT Bearer token required.

---

## Create KPI Entry (Manual)

**Method**: POST **Path**: `/campaigns/:campaignId/kpis`
**Auth**: Required **Roles**: director, campaign_manager

Manually enters KPI data for a campaign-influencer. Creates an append-only record (no updates). Used when auto-capture is not available (non-connected influencers).

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| campaignInfluencerId | string | Yes | CampaignInfluencer CUID |
| reach | integer | No | Total reach |
| impressions | integer | No | Total impressions |
| engagement | integer | No | Total engagements (likes + comments + shares + saves) |
| clicks | integer | No | Total clicks |
| captureDay | integer | No | Capture window: 1, 3, or 7 |

**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "campaignId": "cuid",
    "campaignInfluencerId": "cuid",
    "reach": 45000,
    "impressions": 62000,
    "engagement": 3200,
    "clicks": 180,
    "captureDay": 1,
    "source": "manual",
    "createdAt": "2026-02-25T10:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "campaignInfluencerId is required" }`
**Response 400**: `{ "success": false, "error": "At least one metric (reach, impressions, engagement, clicks) is required" }`
**Response 404**: `{ "success": false, "error": "Campaign influencer not found" }`

---

## List Campaign KPIs

**Method**: GET **Path**: `/campaigns/:campaignId/kpis`
**Auth**: Required **Roles**: director, campaign_manager, reviewer

Returns all KPI entries for a campaign, ordered by creation date descending. Includes the influencer context for each entry.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |

**Query Parameters**:

| Param | Type | Default | Description |
|---|---|---|---|
| campaignInfluencerId | string | — | Filter by specific influencer assignment |
| captureDay | integer | — | Filter by capture day: 1, 3, or 7 |
| source | string | — | Filter by source: manual or auto |
| sortBy | string | createdAt | Sort field: createdAt, captureDay |
| sortOrder | string | desc | Sort direction: asc, desc |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "campaignId": "cuid",
    "kpis": [
      {
        "id": "cuid",
        "campaignInfluencerId": "cuid",
        "influencer": {
          "id": "cuid",
          "displayId": "INF-0128",
          "handle": "@beautybylayla"
        },
        "reach": 45000,
        "impressions": 62000,
        "engagement": 3200,
        "clicks": 180,
        "captureDay": 1,
        "source": "manual",
        "createdAt": "2026-02-25T10:00:00Z"
      },
      {
        "id": "cuid",
        "campaignInfluencerId": "cuid",
        "influencer": {
          "id": "cuid",
          "displayId": "INF-0045",
          "handle": "@fitnessguru"
        },
        "reach": 120000,
        "impressions": 185000,
        "engagement": 8400,
        "clicks": 520,
        "captureDay": 3,
        "source": "auto",
        "createdAt": "2026-02-24T08:00:00Z"
      }
    ],
    "count": 16
  }
}
```

---

## Get Aggregated KPI Summary

**Method**: GET **Path**: `/campaigns/:campaignId/kpis/summary`
**Auth**: Required **Roles**: director, campaign_manager, reviewer, client

Returns aggregated KPI metrics for the campaign. Uses the latest capture day entry per influencer for aggregation. Client role access is limited to campaigns they are assigned to.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "campaignId": "cuid",
    "summary": {
      "totalReach": 850000,
      "totalImpressions": 1240000,
      "totalEngagement": 56000,
      "totalClicks": 3200,
      "averageEngagementRate": 4.5,
      "influencerCount": 8,
      "capturedCount": 6,
      "pendingCount": 2
    },
    "byInfluencer": [
      {
        "campaignInfluencerId": "cuid",
        "handle": "@beautybylayla",
        "displayId": "INF-0128",
        "latestCapture": {
          "captureDay": 7,
          "reach": 95000,
          "impressions": 142000,
          "engagement": 7200,
          "clicks": 420,
          "source": "auto"
        }
      }
    ],
    "byCaptureDay": {
      "day1": { "reach": 320000, "impressions": 480000, "engagement": 21000, "clicks": 1200 },
      "day3": { "reach": 650000, "impressions": 950000, "engagement": 42000, "clicks": 2400 },
      "day7": { "reach": 850000, "impressions": 1240000, "engagement": 56000, "clicks": 3200 }
    }
  }
}
```

**Response 404**: `{ "success": false, "error": "Campaign not found" }`

---

## Get Capture Schedules

**Method**: GET **Path**: `/campaigns/:campaignId/kpis/schedules`
**Auth**: Required **Roles**: director, campaign_manager

Returns KPI auto-capture schedule status for all campaign influencers. Schedules are created when an influencer status changes to `live`.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "campaignId": "cuid",
    "schedules": [
      {
        "id": "cuid",
        "campaignInfluencerId": "cuid",
        "influencer": {
          "displayId": "INF-0128",
          "handle": "@beautybylayla"
        },
        "captureDay": 1,
        "scheduledAt": "2026-02-26T10:00:00Z",
        "capturedAt": "2026-02-26T10:05:00Z",
        "isFailed": false
      },
      {
        "id": "cuid",
        "campaignInfluencerId": "cuid",
        "influencer": {
          "displayId": "INF-0128",
          "handle": "@beautybylayla"
        },
        "captureDay": 3,
        "scheduledAt": "2026-02-28T10:00:00Z",
        "capturedAt": null,
        "isFailed": false
      },
      {
        "id": "cuid",
        "campaignInfluencerId": "cuid",
        "influencer": {
          "displayId": "INF-0128",
          "handle": "@beautybylayla"
        },
        "captureDay": 7,
        "scheduledAt": "2026-03-04T10:00:00Z",
        "capturedAt": null,
        "isFailed": false
      }
    ],
    "stats": {
      "total": 24,
      "completed": 8,
      "pending": 14,
      "failed": 2
    }
  }
}
```

---

## Trigger Auto-Capture

**Method**: POST **Path**: `/campaigns/:campaignId/kpis/auto-capture`
**Auth**: Required **Roles**: director, campaign_manager

Manually triggers an auto-capture for a specific influencer on the campaign. The influencer must have a live post URL and an active Instagram connection must exist.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| campaignInfluencerId | string | Yes | CampaignInfluencer CUID to capture KPIs for |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "campaignInfluencerId": "cuid",
    "reach": 45000,
    "impressions": 62000,
    "engagement": 3200,
    "clicks": 180,
    "source": "auto",
    "captureDay": null,
    "message": "KPIs captured successfully from Instagram",
    "createdAt": "2026-02-25T10:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "Influencer does not have a live post URL" }`
**Response 424**: `{ "success": false, "error": "No active Instagram connection. Connect via Settings > Integrations." }`
**Response 503**: `{ "success": false, "error": "Instagram API is unavailable. KPI capture failed — please try again or enter manually." }`
