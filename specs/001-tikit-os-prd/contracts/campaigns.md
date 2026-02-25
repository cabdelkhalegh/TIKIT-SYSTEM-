# API Contract: Campaigns

**Base Path**: `/api/v1/campaigns`
**Standards**: All responses follow `{ success: boolean, data?: any, error?: string }` envelope. JWT Bearer token required.

---

## List Campaigns

**Method**: GET **Path**: `/campaigns`
**Auth**: Required **Roles**: director, campaign_manager, reviewer, finance

Returns paginated campaigns filtered by the user's data access scope. Directors see all; Campaign Managers see owned campaigns; Reviewers see campaigns in relevant stages; Finance sees campaigns with financial data.

**Query Parameters**:

| Param | Type | Default | Description |
|---|---|---|---|
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page (max 100) |
| search | string | — | Search by name or displayId |
| status | string | — | Filter by CampaignStatus enum (comma-separated for multiple) |
| clientId | string | — | Filter by client ID |
| ownerId | string | — | Filter by campaign owner |
| riskLevel | string | — | Filter by risk level: low, medium, high |
| sortBy | string | createdAt | Sort field: createdAt, updatedAt, name, status, riskLevel |
| sortOrder | string | desc | Sort direction: asc, desc |

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
        "phase": "client_pitching",
        "riskLevel": "low",
        "riskScore": 1,
        "budget": 50000,
        "managementFee": 30,
        "startDate": "2026-03-01T00:00:00Z",
        "endDate": "2026-04-30T00:00:00Z",
        "version": 3,
        "owner": { "id": "cuid", "displayName": "Sara A." },
        "client": { "id": "cuid", "displayId": "CLI-0012", "companyName": "Luxe Beauty" },
        "createdAt": "2026-02-20T10:00:00Z",
        "updatedAt": "2026-02-24T15:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42,
      "totalPages": 3
    }
  }
}
```

**Response 403**: `{ "success": false, "error": "Insufficient permissions" }`

---

## Create Campaign

**Method**: POST **Path**: `/campaigns`
**Auth**: Required **Roles**: director, campaign_manager

Creates a new campaign in `draft` status. Supports three creation modes.

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| mode | string | Yes | Creation mode: `brief`, `wizard`, or `quick` |
| name | string | Yes (wizard, quick) | Campaign name |
| clientId | string | No | Existing client ID |
| budget | number | No | Campaign budget in AED |
| managementFee | number | No | Management fee percentage (default 30) |
| startDate | string (ISO 8601) | No | Campaign start date |
| endDate | string (ISO 8601) | No | Campaign end date |
| description | string | No | Campaign description |
| briefText | string | Conditional | Raw brief text (required for `brief` mode) |
| briefFileUrl | string | Conditional | Uploaded brief PDF URL (alternative for `brief` mode) |

**Mode Details**:
- `brief` — Creates campaign from brief text or PDF. Name auto-derived from brief extraction. Requires `briefText` or `briefFileUrl`.
- `wizard` — Full wizard with all fields. Requires `name`.
- `quick` — Minimal creation with just a name. Requires `name`.

**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "displayId": "TKT-2026-0043",
    "name": "New Campaign",
    "status": "draft",
    "phase": "brief_intake",
    "riskLevel": "medium",
    "riskScore": 4,
    "budget": null,
    "managementFee": 30,
    "version": 1,
    "ownerId": "cuid",
    "createdAt": "2026-02-25T10:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "Validation failed: name is required for wizard mode" }`
**Response 403**: `{ "success": false, "error": "Insufficient permissions" }`

---

## Get Campaign

**Method**: GET **Path**: `/campaigns/:id`
**Auth**: Required **Roles**: director, campaign_manager, reviewer, finance

Returns full campaign details including related entity counts.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| id | string | Campaign CUID or displayId |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "displayId": "TKT-2026-0042",
    "name": "Summer Beauty Campaign",
    "description": "...",
    "status": "pitching",
    "phase": "client_pitching",
    "riskLevel": "low",
    "riskScore": 1,
    "budget": 50000,
    "managementFee": 30,
    "startDate": "2026-03-01T00:00:00Z",
    "endDate": "2026-04-30T00:00:00Z",
    "isDeleted": false,
    "version": 3,
    "closedAt": null,
    "owner": { "id": "cuid", "displayName": "Sara A." },
    "client": { "id": "cuid", "displayId": "CLI-0012", "companyName": "Luxe Beauty" },
    "counts": {
      "briefs": 1,
      "influencers": 8,
      "content": 12,
      "invoices": 3,
      "kpis": 0,
      "reports": 0
    },
    "createdAt": "2026-02-20T10:00:00Z",
    "updatedAt": "2026-02-24T15:30:00Z"
  }
}
```

**Response 404**: `{ "success": false, "error": "Campaign not found" }`
**Response 403**: `{ "success": false, "error": "You do not have access to this campaign" }`

---

## Update Campaign (Field-Level)

**Method**: PATCH **Path**: `/campaigns/:id`
**Auth**: Required **Roles**: director, campaign_manager

Updates individual fields on a campaign. Requires `version` for optimistic concurrency control. Only campaigns not in `closed` status can be updated.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| id | string | Campaign CUID or displayId |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| version | integer | Yes | Current version for conflict detection |
| name | string | No | Updated name |
| description | string | No | Updated description |
| clientId | string | No | Updated client link |
| budget | number | No | Updated budget (triggers BudgetRevision) |
| managementFee | number | No | Updated management fee percentage |
| startDate | string (ISO 8601) | No | Updated start date |
| endDate | string (ISO 8601) | No | Updated end date |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "displayId": "TKT-2026-0042",
    "version": 4,
    "updatedAt": "2026-02-25T12:00:00Z"
  }
}
```

**Response 409**: `{ "success": false, "error": "Conflict: campaign has been modified. Your version: 3, current version: 4. Please refresh and retry." }`
**Response 400**: `{ "success": false, "error": "Cannot modify a closed campaign" }`
**Response 404**: `{ "success": false, "error": "Campaign not found" }`

---

## Delete Campaign (Soft-Delete)

**Method**: DELETE **Path**: `/campaigns/:id`
**Auth**: Required **Roles**: director, campaign_manager

Soft-deletes a campaign. Only allowed when the campaign is in `draft` status.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| id | string | Campaign CUID or displayId |

**Response 200**:
```json
{
  "success": true,
  "data": { "message": "Campaign soft-deleted", "id": "cuid" }
}
```

**Response 400**: `{ "success": false, "error": "Only draft campaigns can be deleted" }`
**Response 404**: `{ "success": false, "error": "Campaign not found" }`
**Response 403**: `{ "success": false, "error": "Insufficient permissions" }`

---

## Transition Campaign Status

**Method**: POST **Path**: `/campaigns/:id/status`
**Auth**: Required **Roles**: director, campaign_manager

Transitions campaign status with gate validation. Each transition has mandatory requirements that must be met before the status change is allowed.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| id | string | Campaign CUID or displayId |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| targetStatus | string | Yes | Target CampaignStatus enum value |
| overrideReason | string | Conditional | Required for high-risk override (risk score 5+, Director only) |

**Gate Validation Rules**:

| Transition | Gate |
|---|---|
| draft → in_review | Brief exists and is marked reviewed |
| in_review → pitching | Director budget approval exists |
| pitching → live | Client shortlist approval exists |
| live → reporting | All influencers have live post URLs |
| reporting → closed | Report client-approved, all invoices settled, CX survey and post-mortem complete |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "previousStatus": "draft",
    "newStatus": "in_review",
    "phase": "ai_structuring",
    "version": 5,
    "updatedAt": "2026-02-25T14:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "Gate validation failed", "data": { "unmet": ["Brief must be reviewed before advancing to in_review"] } }`
**Response 400**: `{ "success": false, "error": "Invalid status transition from pitching to closed" }`
**Response 403**: `{ "success": false, "error": "High-risk campaign requires Director override with reason" }`

---

## Get Campaign Risk Score

**Method**: GET **Path**: `/campaigns/:id/risk`
**Auth**: Required **Roles**: director, campaign_manager, reviewer

Returns the auto-calculated risk assessment for a campaign.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| id | string | Campaign CUID or displayId |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "campaignId": "cuid",
    "riskScore": 5,
    "riskLevel": "high",
    "factors": [
      { "field": "budget", "missing": true, "points": 3 },
      { "field": "startDate", "missing": true, "points": 2 }
    ],
    "requiresDirectorOverride": true
  }
}
```

**Response 404**: `{ "success": false, "error": "Campaign not found" }`
