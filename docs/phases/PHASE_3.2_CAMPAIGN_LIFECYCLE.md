# Phase 3.2: Campaign Lifecycle Management

## Overview

Phase 3.2 implements comprehensive campaign lifecycle management with status transitions, validation rules, and business logic. This enables campaigns to flow through their natural lifecycle from creation to completion.

## Features Implemented

### 1. Campaign Status State Machine

Campaigns can transition through the following states with validation:

```
draft ──→ active ──→ paused ──→ active (resume)
  │         │         
  │         └──→ completed
  │         └──→ cancelled
  └──→ cancelled
```

**Status Transitions Matrix:**
- `draft` can transition to: `active`, `cancelled`
- `active` can transition to: `paused`, `completed`, `cancelled`
- `paused` can transition to: `active`, `cancelled`
- `completed` is terminal (no transitions)
- `cancelled` is terminal (no transitions)

### 2. Campaign Lifecycle Endpoints

All endpoints require authentication (JWT token in Authorization header).

#### Activate Campaign
```http
POST /api/v1/campaigns/:id/activate
Authorization: Bearer <token>
```

Transitions a campaign from `draft` to `active` status.

**Response:**
```json
{
  "success": true,
  "data": {
    "campaignId": "...",
    "campaignName": "Spring Coffee Launch 2026",
    "status": "active",
    "launchDate": "2026-02-06T03:40:00.000Z"
  },
  "message": "Campaign activated successfully"
}
```

**Error Response (Invalid Transition):**
```json
{
  "success": false,
  "error": "Cannot activate campaign with status completed",
  "currentStatus": "completed"
}
```

#### Pause Campaign
```http
POST /api/v1/campaigns/:id/pause
Authorization: Bearer <token>
```

Pauses an active campaign.

**Requirements:**
- Campaign must be in `active` status
- Only active campaigns can be paused

#### Resume Campaign
```http
POST /api/v1/campaigns/:id/resume
Authorization: Bearer <token>
```

Resumes a paused campaign back to active status.

**Requirements:**
- Campaign must be in `paused` status
- Sets status back to `active`

#### Complete Campaign
```http
POST /api/v1/campaigns/:id/complete
Authorization: Bearer <token>
```

Marks an active campaign as completed.

**Requirements:**
- Campaign must be in `active` status
- Sets end date if not already set
- Terminal state (cannot be changed after)

#### Cancel Campaign
```http
POST /api/v1/campaigns/:id/cancel
Authorization: Bearer <token>

Content-Type: application/json
{
  "reason": "Budget constraints"
}
```

Cancels a campaign (from draft, active, or paused status).

**Requirements:**
- Campaign cannot already be completed or cancelled
- Optional cancellation reason in request body
- Terminal state (cannot be changed after)

#### Get Campaign Budget
```http
GET /api/v1/campaigns/:id/budget
Authorization: Bearer <token>
```

Retrieves campaign budget information with calculations.

**Response:**
```json
{
  "success": true,
  "data": {
    "campaignId": "...",
    "campaignName": "Spring Coffee Launch 2026",
    "totalBudget": 50000,
    "allocatedBudget": 45000,
    "spentBudget": 32000,
    "status": "active",
    "budgetRemaining": 18000,
    "budgetUtilization": 64.00
  }
}
```

**Calculated Fields:**
- `budgetRemaining = totalBudget - spentBudget`
- `budgetUtilization = (spentBudget / totalBudget) * 100`

### 3. Enhanced Campaign CRUD Operations

#### Update Campaign (with Status Validation)
```http
PUT /api/v1/campaigns/:id
Authorization: Bearer <token>

Content-Type: application/json
{
  "campaignName": "Updated Name",
  "status": "active",
  "totalBudget": 60000
}
```

When updating campaign status through the general update endpoint, the same transition rules apply.

**Validation:**
- If status is being changed, validates the transition
- Returns error with allowed transitions if invalid
- Allows updating other fields without changing status

### 4. Business Rules

#### Status Transition Rules
1. **Draft to Active**: Sets launch date if not set
2. **Active to Paused**: Preserves all campaign data
3. **Paused to Active**: Resume without data loss
4. **Active to Completed**: Sets end date if not set, terminal state
5. **Any to Cancelled**: Terminal state, no further changes allowed

#### Validation
- All status transitions are validated before execution
- Invalid transitions return 400 error with details
- Attempting to modify completed/cancelled campaigns returns error

#### Data Integrity
- Launch date set when campaign is activated
- End date set when campaign is completed
- All timeline fields preserved through status changes

## Implementation Details

### Route File
Location: `/backend/src/routes/campaign-routes.js`

### Status Transition Configuration
```javascript
const CAMPAIGN_STATUS_TRANSITIONS = {
  draft: ['active', 'cancelled'],
  active: ['paused', 'completed', 'cancelled'],
  paused: ['active', 'cancelled'],
  completed: [],
  cancelled: []
};

function canTransitionStatus(currentStatus, newStatus) {
  const allowedTransitions = CAMPAIGN_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}
```

### Protection
- All lifecycle endpoints require authentication
- Uses `requireAuthentication` middleware
- JWT token validated on every request

## Testing

### Manual Testing

1. **Create a draft campaign:**
```bash
curl -X POST http://localhost:3001/api/v1/campaigns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "...",
    "campaignName": "Test Campaign",
    "status": "draft"
  }'
```

2. **Activate the campaign:**
```bash
curl -X POST http://localhost:3001/api/v1/campaigns/{id}/activate \
  -H "Authorization: Bearer $TOKEN"
```

3. **Check budget:**
```bash
curl http://localhost:3001/api/v1/campaigns/{id}/budget \
  -H "Authorization: Bearer $TOKEN"
```

4. **Pause the campaign:**
```bash
curl -X POST http://localhost:3001/api/v1/campaigns/{id}/pause \
  -H "Authorization: Bearer $TOKEN"
```

5. **Resume the campaign:**
```bash
curl -X POST http://localhost:3001/api/v1/campaigns/{id}/resume \
  -H "Authorization: Bearer $TOKEN"
```

6. **Complete the campaign:**
```bash
curl -X POST http://localhost:3001/api/v1/campaigns/{id}/complete \
  -H "Authorization: Bearer $TOKEN"
```

### Automated Tests

Test script location: `/tmp/test_api.sh`

Run tests:
```bash
cd /tmp && ./test_api.sh
```

## Database Schema

No schema changes required for Phase 3.2. Uses existing Campaign fields:
- `status` - Campaign status enum
- `launchDate` - Set when activated
- `endDate` - Set when completed
- `totalBudget`, `allocatedBudget`, `spentBudget` - Budget tracking

## API Version

This feature is part of **API v0.4.0**

## Next Steps

Phase 3.3 will implement:
- Influencer discovery and search
- Campaign-influencer matching algorithms
- Recommendation engine for influencer selection

## Migration Guide

### For Existing Campaigns

If you have campaigns in the database from previous phases:

1. All campaigns default to `draft` status if not specified
2. Use the activate endpoint to transition to active
3. Budget tracking works immediately with existing data

### Breaking Changes

None. This is a new feature that enhances existing endpoints without breaking changes.

## Error Handling

All lifecycle endpoints return consistent error responses:

**404 Not Found:**
```json
{
  "success": false,
  "error": "Campaign not found"
}
```

**400 Bad Request (Invalid Transition):**
```json
{
  "success": false,
  "error": "Cannot transition campaign from completed to active",
  "allowedTransitions": []
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Authentication token missing from request headers"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Failed to activate campaign"
}
```

## Best Practices

1. **Always activate campaigns before running them** - Don't create campaigns in active status directly
2. **Use pause instead of cancel** - Pause is reversible, cancel is not
3. **Check budget regularly** - Use the budget endpoint to monitor spending
4. **Validate status before operations** - Some operations may only work in specific statuses
5. **Store cancellation reasons** - Include reason when cancelling for audit trails

## Security

- All endpoints protected by JWT authentication
- Status transitions logged (future enhancement)
- No special role requirements for lifecycle operations
- All authenticated users can manage campaign lifecycles

## Performance

- Status validation is O(1) lookup operation
- Budget calculations are simple arithmetic
- No database queries for validation logic
- Minimal overhead on lifecycle operations

## Future Enhancements

Potential improvements for future phases:
1. Workflow automation (auto-complete when end date reached)
2. Status change notifications
3. Audit trail for status transitions
4. Scheduled status changes
5. Rollback capabilities for certain transitions
6. Multi-step approval workflows for status changes
7. Integration with payment systems for budget tracking

---

**Phase 3.2 Status**: ✅ Complete
**Documentation Version**: 1.0
**Last Updated**: 2026-02-06
