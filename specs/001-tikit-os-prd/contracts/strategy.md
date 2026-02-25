# Strategy API Contract

**Source**: Adi audit document (Feb 25, 2026) — Part 2
**Added**: Feb 25, 2026

---

## Base Path: `/api/v1/campaigns/:campaignId/strategy`

All responses follow the standard `{ success, data, error }` envelope.
JWT authentication required on all endpoints.

---

## POST `/campaigns/:campaignId/strategy` — Generate Strategy

**Roles**: `director`, `campaign_manager`

Generates an AI strategy from the reviewed brief using Gemini 2.0 Flash.
Returns `summary`, `keyMessages`, `contentPillars`, and `matchingCriteria`
(platform, follower range, engagement minimums, niches, locations, languages).

If a strategy already exists for this campaign, it is overwritten.
All AI output is advisory — human must confirm before saving (constitution §VI).

**Request body**: Empty `{}` or no body required

**Success 201**:
```json
{
  "success": true,
  "data": {
    "strategyId": "string",
    "campaignId": "string",
    "summary": "string (2-3 paragraphs)",
    "keyMessages": ["string"],
    "contentPillars": ["string"],
    "matchingCriteria": {
      "platform": "string",
      "followerRange": { "min": 0, "max": 0 },
      "engagementMin": 0,
      "niches": ["string"],
      "locations": ["string"],
      "languages": ["string"]
    },
    "generatedAt": "ISO datetime",
    "createdAt": "ISO datetime",
    "updatedAt": "ISO datetime"
  }
}
```

**Error 400**: Brief must be reviewed first (`brief.isReviewed` must be `true`)
```json
{ "success": false, "error": "Brief must be reviewed before generating strategy" }
```

**Error 503**: Gemini unavailable — prompt manual entry
```json
{ "success": false, "error": "AI service unavailable. Please enter strategy manually.", "fallbackRequired": true }
```

---

## GET `/campaigns/:campaignId/strategy` — Get Strategy

**Roles**: `director`, `campaign_manager`, `reviewer`

Retrieve the current strategy for a campaign.

**Success 200**: Returns the strategy object (same shape as POST 201 above)

**Error 404**: Strategy not found
```json
{ "success": false, "error": "No strategy found for this campaign" }
```

---

## PUT `/campaigns/:campaignId/strategy` — Update Strategy

**Roles**: `director`, `campaign_manager`

Update editable fields after manual review. All fields optional.
Typical use: human refines AI-generated strategy or fills in when AI was unavailable.

**Request body** (all optional):
```json
{
  "summary": "string",
  "keyMessages": ["string"],
  "contentPillars": ["string"],
  "matchingCriteria": {
    "platform": "string",
    "followerRange": { "min": 0, "max": 0 },
    "engagementMin": 0,
    "niches": ["string"],
    "locations": ["string"],
    "languages": ["string"]
  }
}
```

**Success 200**: Returns updated strategy object

**Error 400**: Cannot modify strategy for a closed campaign
```json
{ "success": false, "error": "Cannot modify strategy of a closed campaign" }
```

---

## Notes

- Strategy generation consumes 1 Gemini API request (tracked toward 1,500/day limit)
- If Gemini is unavailable: route returns `fallbackRequired: true`; frontend must show manual entry form
- Strategy is linked 1:1 with campaign — one strategy per campaign
- Model: `Strategy` in Prisma schema
