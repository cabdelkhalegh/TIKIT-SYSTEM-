# API Contract: Briefs

**Base Path**: `/api/v1/campaigns/:campaignId/briefs`
**Standards**: All responses follow `{ success: boolean, data?: any, error?: string }` envelope. JWT Bearer token required.

---

## Create Brief from Text

**Method**: POST **Path**: `/campaigns/:campaignId/briefs`
**Auth**: Required **Roles**: director, campaign_manager

Creates a brief from raw text input and triggers AI extraction.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| rawText | string | Yes | Raw brief text content |

**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "campaignId": "cuid",
    "rawText": "...",
    "extractionStatus": "processing",
    "versionNumber": 1,
    "createdAt": "2026-02-25T10:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "rawText is required" }`
**Response 404**: `{ "success": false, "error": "Campaign not found" }`
**Response 400**: `{ "success": false, "error": "Cannot modify a closed campaign" }`

---

## Upload Brief (PDF)

**Method**: POST **Path**: `/campaigns/:campaignId/briefs/upload`
**Auth**: Required **Roles**: director, campaign_manager

Uploads a PDF brief file. The system extracts raw text via `parse-pdf` and triggers AI extraction of structured fields.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |

**Request**: `Content-Type: multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| file | file (PDF) | Yes | Brief PDF file |

**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "campaignId": "cuid",
    "fileName": "client-brief-q2.pdf",
    "fileUrl": "https://storage.example.com/briefs/abc123.pdf",
    "rawText": "...(extracted text)...",
    "extractionStatus": "processing",
    "versionNumber": 1,
    "createdAt": "2026-02-25T10:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "File is required and must be a PDF" }`
**Response 413**: `{ "success": false, "error": "File size exceeds maximum allowed" }`

---

## Get Brief

**Method**: GET **Path**: `/campaigns/:campaignId/briefs/:briefId`
**Auth**: Required **Roles**: director, campaign_manager, reviewer

Returns the full brief with all extracted structured fields and confidence scores.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |
| briefId | string | Brief CUID |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "campaignId": "cuid",
    "rawText": "...",
    "fileName": "client-brief-q2.pdf",
    "fileUrl": "https://storage.example.com/briefs/abc123.pdf",
    "objectives": ["Increase brand awareness", "Drive 500 website visits"],
    "kpis": ["reach", "impressions", "clicks"],
    "targetAudience": { "ageRange": "18-35", "gender": "female", "location": "UAE", "interests": ["beauty", "fashion"] },
    "deliverables": [{ "type": "instagram_reel", "quantity": 3 }, { "type": "instagram_story", "quantity": 5 }],
    "budgetSignals": { "totalBudget": 50000, "currency": "AED", "perInfluencer": 5000 },
    "clientInfo": { "companyName": "Luxe Beauty", "contactName": "Ali K.", "contactEmail": "ali@luxe.ae" },
    "keyMessages": ["Premium quality", "Natural ingredients"],
    "contentPillars": ["Before/After", "Tutorial", "Lifestyle"],
    "matchingCriteria": { "platform": "instagram", "minFollowers": 10000, "minEngagement": 2.5, "niches": ["beauty"], "locations": ["UAE"] },
    "confidenceScores": {
      "objectives": 0.92,
      "kpis": 0.85,
      "targetAudience": 0.78,
      "deliverables": 0.88,
      "budgetSignals": 0.65,
      "clientInfo": 0.95
    },
    "extractionStatus": "completed",
    "isReviewed": false,
    "reviewedBy": null,
    "versionNumber": 1,
    "createdAt": "2026-02-25T10:00:00Z",
    "updatedAt": "2026-02-25T10:05:00Z"
  }
}
```

**Response 404**: `{ "success": false, "error": "Brief not found" }`

---

## Update Brief

**Method**: PUT **Path**: `/campaigns/:campaignId/briefs/:briefId`
**Auth**: Required **Roles**: director, campaign_manager

Updates brief fields after user review or manual correction. Automatically appends a version to the brief version history.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |
| briefId | string | Brief CUID |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| objectives | any[] | No | Updated objectives |
| kpis | string[] | No | Updated KPI list |
| targetAudience | object | No | Updated audience definition |
| deliverables | object[] | No | Updated deliverables list |
| budgetSignals | object | No | Updated budget signals |
| clientInfo | object | No | Updated client info |
| keyMessages | string[] | No | Updated key messages |
| contentPillars | string[] | No | Updated content pillars |
| matchingCriteria | object | No | Updated matching criteria |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "versionNumber": 2,
    "updatedAt": "2026-02-25T11:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "Cannot modify brief for a closed campaign" }`
**Response 404**: `{ "success": false, "error": "Brief not found" }`

---

## Trigger AI Extraction

**Method**: POST **Path**: `/campaigns/:campaignId/briefs/:briefId/extract`
**Auth**: Required **Roles**: director, campaign_manager

Re-triggers AI extraction on an existing brief. Useful when the user has corrected low-confidence fields and wants the AI to re-process, or when a previous extraction failed.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |
| briefId | string | Brief CUID |

**Request Body**: None (or empty `{}`)

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "extractionStatus": "processing",
    "message": "AI extraction triggered"
  }
}
```

**Response 400**: `{ "success": false, "error": "Brief has no raw text to extract from" }`
**Response 404**: `{ "success": false, "error": "Brief not found" }`

---

## Mark Brief Reviewed

**Method**: POST **Path**: `/campaigns/:campaignId/briefs/:briefId/review`
**Auth**: Required **Roles**: director, campaign_manager

Marks a brief as reviewed. This is a prerequisite gate for transitioning the campaign from `draft` to `in_review`.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |
| briefId | string | Brief CUID |

**Request Body**: None (or empty `{}`)

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "isReviewed": true,
    "reviewedBy": "cuid",
    "updatedAt": "2026-02-25T12:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "Extraction must be completed before review" }`
**Response 404**: `{ "success": false, "error": "Brief not found" }`

---

## Get Brief Versions

**Method**: GET **Path**: `/campaigns/:campaignId/briefs/:briefId/versions`
**Auth**: Required **Roles**: director, campaign_manager, reviewer

Returns the append-only version history for a brief, sorted by version number descending.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |
| briefId | string | Brief CUID |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "briefId": "cuid",
    "versions": [
      {
        "id": "cuid",
        "versionNumber": 2,
        "objectives": ["Increase brand awareness", "Drive 500 website visits"],
        "kpis": ["reach", "impressions", "clicks"],
        "targetAudience": { "ageRange": "18-35", "gender": "female", "location": "UAE" },
        "deliverables": [{ "type": "instagram_reel", "quantity": 3 }],
        "budgetSignals": { "totalBudget": 50000, "currency": "AED" },
        "clientInfo": { "companyName": "Luxe Beauty" },
        "keyMessages": ["Premium quality"],
        "contentPillars": ["Before/After"],
        "matchingCriteria": { "platform": "instagram", "minFollowers": 10000 },
        "changedBy": "cuid",
        "createdAt": "2026-02-25T11:00:00Z"
      },
      {
        "id": "cuid",
        "versionNumber": 1,
        "objectives": ["Increase brand awareness"],
        "changedBy": null,
        "createdAt": "2026-02-25T10:05:00Z"
      }
    ]
  }
}
```

**Response 404**: `{ "success": false, "error": "Brief not found" }`
