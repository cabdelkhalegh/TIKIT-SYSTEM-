# API Contract: Influencers

**Base Path**: `/api/v1`
**Standards**: All responses follow `{ success: boolean, data?: any, error?: string }` envelope. JWT Bearer token required.

---

## List Influencers

**Method**: GET **Path**: `/influencers`
**Auth**: Required **Roles**: director, campaign_manager, reviewer

Returns a paginated, filterable list of all influencers in the system.

**Query Parameters**:

| Param | Type | Default | Description |
|---|---|---|---|
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page (max 100) |
| search | string | — | Search by handle, displayName, or displayId |
| platform | string | — | Filter by platform (e.g., `instagram`) |
| niche | string | — | Filter by niche (comma-separated for multiple) |
| status | string | — | Filter by profileStatus: `complete` or `stub` |
| location | string | — | Filter by geo, city, or country |
| minFollowers | integer | — | Minimum follower count |
| maxFollowers | integer | — | Maximum follower count |
| minEngagement | number | — | Minimum engagement rate |
| tier | string | — | Filter by tier |
| sortBy | string | createdAt | Sort field: createdAt, followerCount, engagementRate, handle |
| sortOrder | string | desc | Sort direction: asc, desc |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "influencers": [
      {
        "id": "cuid",
        "displayId": "INF-0128",
        "handle": "@beautybylayla",
        "displayName": "Layla M.",
        "platform": "instagram",
        "niches": ["beauty", "skincare"],
        "geo": "UAE",
        "city": "Dubai",
        "country": "UAE",
        "followerCount": 85000,
        "engagementRate": 3.2,
        "tier": "mid",
        "profileStatus": "complete",
        "profileImage": "https://...",
        "isActive": true,
        "createdAt": "2026-01-15T08:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 245,
      "totalPages": 13
    }
  }
}
```

---

## Create Influencer

**Method**: POST **Path**: `/influencers`
**Auth**: Required **Roles**: director, campaign_manager

Creates a new influencer profile. Can be a complete profile or a stub for quick shortlisting.

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| handle | string | Yes | Social media handle |
| displayName | string | No | Display name |
| email | string | No | Contact email |
| phone | string | No | Contact phone |
| platform | string | No | Platform (default: `instagram`) |
| niches | string[] | No | Niche categories |
| geo | string | No | Geographic region |
| city | string | No | City |
| country | string | No | Country |
| language | string | No | Primary language |
| followerCount | integer | No | Follower count |
| engagementRate | number | No | Engagement rate percentage |
| rateCard | object | No | Pricing: `{ post: number, video: number, story: number }` |
| tier | string | No | Influencer tier |
| gender | string | No | Gender |
| bio | string | No | Bio text |
| profileImage | string | No | Profile image URL |
| representation | string | No | `direct` or `agency` (default: `direct`) |
| agentContact | string | No | Agent contact (if agency represented) |
| tiktokHandle | string | No | TikTok handle |
| tiktokLink | string | No | TikTok profile link |
| sociataProfileUrl | string | No | Sociata profile URL |
| profileStatus | string | No | `complete` or `stub` (auto-determined if omitted) |

**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "displayId": "INF-0129",
    "handle": "@newinfluencer",
    "profileStatus": "stub",
    "createdAt": "2026-02-25T10:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "handle is required" }`
**Response 409**: `{ "success": false, "error": "Influencer with this handle already exists" }`

---

## Get Influencer

**Method**: GET **Path**: `/influencers/:id`
**Auth**: Required **Roles**: director, campaign_manager, reviewer

Returns full influencer profile with campaign participation history.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| id | string | Influencer CUID or displayId |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "displayId": "INF-0128",
    "handle": "@beautybylayla",
    "displayName": "Layla M.",
    "email": "layla@example.com",
    "phone": "+971-50-1234567",
    "platform": "instagram",
    "niches": ["beauty", "skincare"],
    "geo": "UAE",
    "language": "en",
    "followerCount": 85000,
    "engagementRate": 3.2,
    "rateCard": { "post": 2000, "video": 5000, "story": 500 },
    "tier": "mid",
    "gender": "female",
    "city": "Dubai",
    "country": "UAE",
    "bio": "Beauty & skincare enthusiast...",
    "profileImage": "https://...",
    "representation": "direct",
    "agentContact": null,
    "tiktokHandle": "@beautybylayla",
    "tiktokLink": "https://tiktok.com/@beautybylayla",
    "sociataProfileUrl": null,
    "profileStatus": "complete",
    "isActive": true,
    "campaignCount": 5,
    "createdAt": "2026-01-15T08:00:00Z",
    "updatedAt": "2026-02-20T14:00:00Z"
  }
}
```

**Response 404**: `{ "success": false, "error": "Influencer not found" }`

---

## Update Influencer

**Method**: PUT **Path**: `/influencers/:id`
**Auth**: Required **Roles**: director, campaign_manager

Updates influencer profile. All fields in the request body overwrite existing values. Automatically re-evaluates profileStatus (complete vs. stub) based on field completeness.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| id | string | Influencer CUID or displayId |

**Request Body**: Same fields as Create (all optional).

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "displayId": "INF-0128",
    "profileStatus": "complete",
    "updatedAt": "2026-02-25T11:00:00Z"
  }
}
```

**Response 404**: `{ "success": false, "error": "Influencer not found" }`

---

## Instagram Discovery

**Method**: POST **Path**: `/influencers/discover`
**Auth**: Required **Roles**: director, campaign_manager

Searches Instagram via the business_discovery API. Requires an active agency-level Instagram connection. Supports three search modes.

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| mode | string | Yes | Search mode: `name`, `username`, or `hashtag` |
| query | string | Yes | Search query string |
| limit | integer | No | Max results to return (default: 20, max: 50) |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "igUserId": "12345678",
        "username": "beautybylayla",
        "fullName": "Layla M.",
        "bio": "Beauty & skincare enthusiast...",
        "profilePicture": "https://...",
        "followerCount": 85000,
        "followingCount": 1200,
        "mediaCount": 340,
        "engagementRate": 3.2,
        "isExisting": true,
        "existingInfluencerId": "cuid"
      }
    ],
    "mode": "username",
    "query": "beautybylayla",
    "resultCount": 1
  }
}
```

**Response 400**: `{ "success": false, "error": "mode must be one of: name, username, hashtag" }`
**Response 503**: `{ "success": false, "error": "Instagram API is unavailable. Please try again later." }`
**Response 424**: `{ "success": false, "error": "No active Instagram connection. Connect via Settings > Integrations." }`

---

## Add Influencer to Campaign

**Method**: POST **Path**: `/campaigns/:campaignId/influencers`
**Auth**: Required **Roles**: director, campaign_manager

Adds an influencer to a campaign with `proposed` status. If the influencer does not exist in the system, creates a stub profile first.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| influencerId | string | Conditional | Existing influencer CUID (one of influencerId or newInfluencer required) |
| newInfluencer | object | Conditional | New influencer data (same shape as Create Influencer) |
| estimatedCost | number | No | Estimated cost for this campaign |

**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "campaignId": "cuid",
    "influencerId": "cuid",
    "status": "proposed",
    "estimatedCost": 5000,
    "aiMatchScore": null,
    "createdAt": "2026-02-25T10:00:00Z"
  }
}
```

**Response 409**: `{ "success": false, "error": "Influencer is already assigned to this campaign" }`
**Response 400**: `{ "success": false, "error": "Provide either influencerId or newInfluencer" }`
**Response 404**: `{ "success": false, "error": "Campaign not found" }`

---

## List Campaign Influencers

**Method**: GET **Path**: `/campaigns/:campaignId/influencers`
**Auth**: Required **Roles**: director, campaign_manager, reviewer

Returns all influencers assigned to a campaign with their lifecycle status and AI scoring.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |

**Query Parameters**:

| Param | Type | Default | Description |
|---|---|---|---|
| status | string | — | Filter by InfluencerLifecycleStatus |
| sortBy | string | createdAt | Sort: createdAt, aiMatchScore, status, estimatedCost |
| sortOrder | string | desc | Sort direction: asc, desc |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "campaignId": "cuid",
    "influencers": [
      {
        "id": "cuid",
        "influencer": {
          "id": "cuid",
          "displayId": "INF-0128",
          "handle": "@beautybylayla",
          "displayName": "Layla M.",
          "followerCount": 85000,
          "engagementRate": 3.2,
          "profileImage": "https://...",
          "niches": ["beauty", "skincare"],
          "tier": "mid"
        },
        "status": "proposed",
        "aiMatchScore": 87.5,
        "aiMatchRationale": "Strong niche alignment (beauty), high engagement (3.2%), UAE-based...",
        "estimatedCost": 5000,
        "agreedCost": null,
        "briefAccepted": false,
        "contractStatus": null,
        "createdAt": "2026-02-25T10:00:00Z"
      }
    ],
    "count": 8
  }
}
```

**Response 404**: `{ "success": false, "error": "Campaign not found" }`

---

## AI Scoring

**Method**: POST **Path**: `/campaigns/:campaignId/influencers/score`
**Auth**: Required **Roles**: director, campaign_manager

Triggers AI scoring for all proposed influencers on a campaign against the strategy matching criteria. Scoring weights: Platform 25%, Followers 20%, Engagement 20%, Niche, Geo, Language.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| influencerIds | string[] | No | Specific influencer IDs to score (defaults to all proposed) |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "campaignId": "cuid",
    "scored": [
      {
        "campaignInfluencerId": "cuid",
        "influencerId": "cuid",
        "handle": "@beautybylayla",
        "aiMatchScore": 87.5,
        "aiMatchRationale": "Strong niche alignment (beauty), high engagement (3.2%), UAE-based, Instagram primary platform.",
        "breakdown": {
          "platform": 25,
          "followers": 18,
          "engagement": 20,
          "niche": 12.5,
          "geo": 8,
          "language": 4
        }
      }
    ],
    "scoredCount": 8
  }
}
```

**Response 400**: `{ "success": false, "error": "Campaign must have a strategy with matching criteria before scoring" }`
**Response 404**: `{ "success": false, "error": "Campaign not found" }`

---

## Update Campaign Influencer Status

**Method**: PATCH **Path**: `/campaigns/:campaignId/influencers/:id/status`
**Auth**: Required **Roles**: director, campaign_manager

Transitions an influencer's lifecycle status within a campaign.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |
| id | string | CampaignInfluencer CUID |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| status | string | Yes | Target InfluencerLifecycleStatus: proposed, approved, contracted, brief_accepted, live, completed |
| agreedCost | number | Conditional | Required when transitioning to `contracted` |
| contractStatus | string | No | Contract status: pending, signed, na |

**Lifecycle Transitions**:

| From | To | Notes |
|---|---|---|
| proposed | approved | After client shortlist approval |
| approved | contracted | Requires agreedCost |
| contracted | brief_accepted | After influencer accepts brief |
| brief_accepted | live | After live post URL is submitted |
| live | completed | After KPIs captured |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "previousStatus": "proposed",
    "newStatus": "approved",
    "approvedAt": "2026-02-25T14:00:00Z",
    "updatedAt": "2026-02-25T14:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "Invalid transition from proposed to live" }`
**Response 404**: `{ "success": false, "error": "Campaign influencer not found" }`

---

## Send Brief to Influencer

**Method**: POST **Path**: `/campaigns/:campaignId/influencers/:id/send-brief`
**Auth**: Required **Roles**: director, campaign_manager

Sends the campaign brief to the influencer. The influencer must be in `contracted` status. Triggers a notification in the Influencer Portal.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |
| id | string | CampaignInfluencer CUID |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| message | string | No | Optional personalized message to include with the brief |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "invitedAt": "2026-02-25T14:00:00Z",
    "message": "Brief sent to influencer"
  }
}
```

**Response 400**: `{ "success": false, "error": "Influencer must be in contracted status to receive a brief" }`
**Response 400**: `{ "success": false, "error": "Campaign does not have a reviewed brief" }`

---

## Set Influencer Pricing

**Method**: POST **Path**: `/campaigns/:campaignId/influencers/:id/pricing`
**Auth**: Required **Roles**: director, campaign_manager

Sets or updates the pricing details for an influencer on a campaign.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |
| id | string | CampaignInfluencer CUID |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| estimatedCost | number | No | Updated estimated cost |
| agreedCost | number | No | Final agreed cost |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "estimatedCost": 5000,
    "agreedCost": 4500,
    "updatedAt": "2026-02-25T15:00:00Z"
  }
}
```

**Response 404**: `{ "success": false, "error": "Campaign influencer not found" }`
