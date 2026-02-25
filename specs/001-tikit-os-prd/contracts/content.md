# API Contract: Content

**Base Path**: `/api/v1`
**Standards**: All responses follow `{ success: boolean, data?: any, error?: string }` envelope. JWT Bearer token required.

---

## Upload Content Artifact

**Method**: POST **Path**: `/campaigns/:campaignId/content`
**Auth**: Required **Roles**: director, campaign_manager, influencer

Uploads a content artifact (script, video draft, or final) for a campaign. Maximum file size: 1 GB. Influencers can only upload for their own campaign assignment and must have accepted the brief first.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |

**Request**: `Content-Type: multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| file | file | Yes | Content file (max 1 GB) |
| type | string | Yes | ContentType: `script`, `video_draft`, or `final` |
| campaignInfluencerId | string | Yes | CampaignInfluencer CUID this content belongs to |

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
    "filmingBlocked": true,
    "postingBlocked": true,
    "fileName": "script-v1.pdf",
    "fileUrl": "https://storage.example.com/content/abc123.pdf",
    "fileSizeBytes": 524288,
    "createdAt": "2026-02-25T10:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "Influencer must accept the brief before submitting content" }`
**Response 400**: `{ "success": false, "error": "type must be one of: script, video_draft, final" }`
**Response 413**: `{ "success": false, "error": "File size exceeds 1 GB maximum" }`
**Response 404**: `{ "success": false, "error": "Campaign not found" }`

---

## List Campaign Content

**Method**: GET **Path**: `/campaigns/:campaignId/content`
**Auth**: Required **Roles**: director, campaign_manager, reviewer

Returns all content artifacts for a campaign, optionally filtered.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |

**Query Parameters**:

| Param | Type | Default | Description |
|---|---|---|---|
| type | string | — | Filter by ContentType: script, video_draft, final |
| approvalStatus | string | — | Filter by ContentApprovalStatus |
| campaignInfluencerId | string | — | Filter by specific influencer assignment |
| sortBy | string | createdAt | Sort field: createdAt, type, approvalStatus |
| sortOrder | string | desc | Sort direction: asc, desc |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "campaignId": "cuid",
    "content": [
      {
        "id": "cuid",
        "campaignInfluencerId": "cuid",
        "influencer": {
          "id": "cuid",
          "displayId": "INF-0128",
          "handle": "@beautybylayla"
        },
        "type": "script",
        "versionNumber": 1,
        "approvalStatus": "internal_approved",
        "filmingBlocked": false,
        "postingBlocked": true,
        "fileName": "script-v1.pdf",
        "fileUrl": "https://...",
        "fileSizeBytes": 524288,
        "livePostUrl": null,
        "internalFeedback": null,
        "clientFeedback": null,
        "exceptionType": null,
        "createdAt": "2026-02-25T10:00:00Z",
        "updatedAt": "2026-02-25T12:00:00Z"
      }
    ],
    "count": 12
  }
}
```

---

## Get Content Artifact

**Method**: GET **Path**: `/campaigns/:campaignId/content/:id`
**Auth**: Required **Roles**: director, campaign_manager, reviewer, client, influencer

Returns a single content artifact with full details. Clients see only content that has reached `internal_approved` or beyond. Influencers see only their own content.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |
| id | string | Content CUID |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "campaignId": "cuid",
    "campaignInfluencerId": "cuid",
    "influencer": {
      "id": "cuid",
      "displayId": "INF-0128",
      "handle": "@beautybylayla",
      "displayName": "Layla M."
    },
    "type": "final",
    "versionNumber": 2,
    "approvalStatus": "client_approved",
    "filmingBlocked": false,
    "postingBlocked": false,
    "fileName": "final-reel-v2.mp4",
    "fileUrl": "https://...",
    "fileSizeBytes": 104857600,
    "livePostUrl": "https://instagram.com/p/xyz123",
    "internalFeedback": "Approved — great energy and on-brand messaging.",
    "clientFeedback": "Love it!",
    "exceptionType": null,
    "exceptionApprovedBy": null,
    "exceptionEvidence": null,
    "createdAt": "2026-02-25T10:00:00Z",
    "updatedAt": "2026-02-25T16:00:00Z"
  }
}
```

**Response 404**: `{ "success": false, "error": "Content not found" }`
**Response 403**: `{ "success": false, "error": "You do not have access to this content" }`

---

## Approve Content (Internal)

**Method**: POST **Path**: `/campaigns/:campaignId/content/:id/approve-internal`
**Auth**: Required **Roles**: director, campaign_manager

Approves content internally (stage 1). For `script` type, clears the filming gate.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |
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
    "approvalStatus": "internal_approved",
    "filmingBlocked": false,
    "updatedAt": "2026-02-25T12:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "Content must be in pending status for internal approval" }`
**Response 404**: `{ "success": false, "error": "Content not found" }`

---

## Approve Content (Client)

**Method**: POST **Path**: `/campaigns/:campaignId/content/:id/approve-client`
**Auth**: Required **Roles**: director, campaign_manager, client

Approves content on behalf of or by the client (stage 2). For `final` type, clears the posting gate. Content must be `internal_approved` first.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |
| id | string | Content CUID |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| feedback | string | No | Optional client feedback |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "approvalStatus": "client_approved",
    "postingBlocked": false,
    "updatedAt": "2026-02-25T14:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "Content must be internally approved before client approval" }`
**Response 404**: `{ "success": false, "error": "Content not found" }`

---

## Request Changes

**Method**: POST **Path**: `/campaigns/:campaignId/content/:id/request-changes`
**Auth**: Required **Roles**: director, campaign_manager, client

Requests changes to a content artifact with feedback. Sets status to `changes_requested`. The influencer is notified and can submit a new version.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |
| id | string | Content CUID |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| feedback | string | Yes | Detailed feedback describing required changes |
| source | string | No | Who is requesting: `internal` or `client` (auto-determined from role if omitted) |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "approvalStatus": "changes_requested",
    "internalFeedback": "Please adjust the opening hook...",
    "updatedAt": "2026-02-25T13:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "feedback is required when requesting changes" }`
**Response 404**: `{ "success": false, "error": "Content not found" }`

---

## Request Exception (Director Override)

**Method**: POST **Path**: `/campaigns/:campaignId/content/:id/exception`
**Auth**: Required **Roles**: campaign_manager

Requests a Director override to bypass the posting gate in exceptional circumstances. The Director must then approve the exception.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |
| id | string | Content CUID |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| exceptionType | string | Yes | Exception type: `urgent_posting`, `verbal_approval`, or `client_timeout` |
| evidence | string | Yes | Evidence or justification for the exception |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "exceptionType": "verbal_approval",
    "exceptionEvidence": "Client confirmed via phone call at 2pm...",
    "approvalId": "cuid",
    "message": "Exception request submitted. Awaiting Director approval."
  }
}
```

**Response 400**: `{ "success": false, "error": "exceptionType must be one of: urgent_posting, verbal_approval, client_timeout" }`
**Response 400**: `{ "success": false, "error": "evidence is required for exception requests" }`

---

## Submit Live Post URL

**Method**: POST **Path**: `/campaigns/:campaignId/content/:id/live-url`
**Auth**: Required **Roles**: director, campaign_manager, influencer

Submits the live post URL after content has been posted. Posting gate must be cleared (postingBlocked = false) unless an exception has been approved.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |
| id | string | Content CUID |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| livePostUrl | string | Yes | URL of the live post (must be a valid URL) |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "livePostUrl": "https://instagram.com/p/xyz123",
    "updatedAt": "2026-02-25T18:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "Posting is blocked — content must receive client approval or Director exception first" }`
**Response 400**: `{ "success": false, "error": "livePostUrl must be a valid URL" }`

---

## Get Pending Content (Global)

**Method**: GET **Path**: `/content/pending`
**Auth**: Required **Roles**: director, campaign_manager, reviewer

Returns all content pending approval across all campaigns the user has access to. Useful for a centralized approval queue.

**Query Parameters**:

| Param | Type | Default | Description |
|---|---|---|---|
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page (max 100) |
| type | string | — | Filter by ContentType |
| approvalStatus | string | pending | Filter status: pending, internal_approved, changes_requested |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "cuid",
        "campaign": {
          "id": "cuid",
          "displayId": "TKT-2026-0042",
          "name": "Summer Beauty Campaign"
        },
        "influencer": {
          "id": "cuid",
          "displayId": "INF-0128",
          "handle": "@beautybylayla"
        },
        "type": "script",
        "versionNumber": 1,
        "approvalStatus": "pending",
        "fileName": "script-v1.pdf",
        "createdAt": "2026-02-25T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1
    }
  }
}
```
