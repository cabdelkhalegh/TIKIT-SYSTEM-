# API Contract: Notifications, Audit Logs & Reminders

**Base Path**: `/api/v1`
**Standards**: All responses follow `{ success: boolean, data?: any, error?: string }` envelope. JWT Bearer token required.

---

## List Notifications

**Method**: GET **Path**: `/notifications`
**Auth**: Required **Roles**: All authenticated users

Returns the authenticated user's notifications with an unread count. Ordered by creation date descending.

**Query Parameters**:

| Param | Type | Default | Description |
|---|---|---|---|
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page (max 100) |
| isRead | boolean | — | Filter by read status |
| type | string | — | Filter by notification type (comma-separated): content, script, shortlist, campaign_update, deadline, escalation |
| priority | string | — | Filter by priority: normal, high, urgent |
| campaignId | string | — | Filter by campaign |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "cuid",
        "type": "content",
        "title": "New Content Submitted",
        "message": "@beautybylayla submitted a script for Summer Beauty Campaign",
        "isRead": false,
        "priority": "normal",
        "campaignId": "cuid",
        "entityType": "content",
        "entityId": "cuid",
        "actionUrl": "/campaigns/cuid/content/cuid",
        "isEscalation": false,
        "escalationLevel": null,
        "createdAt": "2026-02-25T10:00:00Z"
      },
      {
        "id": "cuid",
        "type": "escalation",
        "title": "Approval Escalation - 48h",
        "message": "Shortlist approval for TKT-2026-0042 has been pending for 48 hours",
        "isRead": false,
        "priority": "high",
        "campaignId": "cuid",
        "entityType": "approval",
        "entityId": "cuid",
        "actionUrl": "/campaigns/cuid",
        "isEscalation": true,
        "escalationLevel": 2,
        "createdAt": "2026-02-25T09:00:00Z"
      }
    ],
    "unreadCount": 7,
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42,
      "totalPages": 3
    }
  }
}
```

---

## Mark Notification as Read

**Method**: PATCH **Path**: `/notifications/:id/read`
**Auth**: Required **Roles**: All authenticated users

Marks a single notification as read. Users can only mark their own notifications.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| id | string | Notification CUID |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "isRead": true,
    "updatedAt": "2026-02-25T10:30:00Z"
  }
}
```

**Response 404**: `{ "success": false, "error": "Notification not found" }`
**Response 403**: `{ "success": false, "error": "You can only mark your own notifications as read" }`

---

## Mark All Notifications as Read

**Method**: PATCH **Path**: `/notifications/read-all`
**Auth**: Required **Roles**: All authenticated users

Marks all of the authenticated user's unread notifications as read.

**Request Body**: None (or empty `{}`)

**Response 200**:
```json
{
  "success": true,
  "data": {
    "markedCount": 7,
    "message": "All notifications marked as read"
  }
}
```

---

## Get Notification Preferences

**Method**: GET **Path**: `/notifications/preferences`
**Auth**: Required **Roles**: All authenticated users

Returns the authenticated user's notification preferences.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "userId": "cuid",
    "emailNotifications": true,
    "contentUpdates": true,
    "shortlistApprovals": true,
    "campaignUpdates": true,
    "deadlineReminders": true,
    "escalations": true,
    "financialAlerts": true,
    "systemAnnouncements": true
  }
}
```

---

## Update Notification Preferences

**Method**: PUT **Path**: `/notifications/preferences`
**Auth**: Required **Roles**: All authenticated users

Updates the authenticated user's notification preferences.

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| emailNotifications | boolean | No | Enable/disable email notifications |
| contentUpdates | boolean | No | Notify on content uploads and approvals |
| shortlistApprovals | boolean | No | Notify on shortlist approval events |
| campaignUpdates | boolean | No | Notify on campaign status changes |
| deadlineReminders | boolean | No | Notify on upcoming deadlines |
| escalations | boolean | No | Notify on approval escalations (cannot be disabled for Directors) |
| financialAlerts | boolean | No | Notify on invoice and budget changes |
| systemAnnouncements | boolean | No | Notify on system-wide announcements |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "userId": "cuid",
    "emailNotifications": true,
    "contentUpdates": false,
    "shortlistApprovals": true,
    "campaignUpdates": true,
    "deadlineReminders": true,
    "escalations": true,
    "financialAlerts": true,
    "systemAnnouncements": true,
    "updatedAt": "2026-02-25T10:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "Escalation notifications cannot be disabled for Director role" }`

---

## Get Audit Logs

**Method**: GET **Path**: `/audit-logs`
**Auth**: Required **Roles**: director, campaign_manager, reviewer, finance

Returns audit log entries filtered by entities the authenticated user has access to. Directors see all entries; other roles see entries for their accessible campaigns and entities.

**Query Parameters**:

| Param | Type | Default | Description |
|---|---|---|---|
| page | integer | 1 | Page number |
| limit | integer | 50 | Items per page (max 200) |
| userId | string | — | Filter by acting user ID |
| action | string | — | Filter by action type (comma-separated): create, update, delete, login, logout, approve, reject, status_change |
| entityType | string | — | Filter by entity type: campaign, content, invoice, user, brief, influencer, report, approval |
| entityId | string | — | Filter by specific entity ID |
| campaignId | string | — | Filter by campaign context |
| dateFrom | string (ISO 8601) | — | Start of date range |
| dateTo | string (ISO 8601) | — | End of date range |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "cuid",
        "user": {
          "id": "cuid",
          "displayName": "Sara A.",
          "email": "sara@tikit.ae"
        },
        "action": "status_change",
        "entityType": "campaign",
        "entityId": "cuid",
        "changes": {
          "before": { "status": "draft" },
          "after": { "status": "in_review" }
        },
        "ipAddress": "192.168.1.100",
        "createdAt": "2026-02-25T10:00:00Z"
      },
      {
        "id": "cuid",
        "user": {
          "id": "cuid",
          "displayName": "Sara A.",
          "email": "sara@tikit.ae"
        },
        "action": "approve",
        "entityType": "content",
        "entityId": "cuid",
        "changes": {
          "before": { "approvalStatus": "pending" },
          "after": { "approvalStatus": "internal_approved" }
        },
        "ipAddress": "192.168.1.100",
        "createdAt": "2026-02-25T09:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1250,
      "totalPages": 25
    }
  }
}
```

---

## Create Reminder

**Method**: POST **Path**: `/reminders`
**Auth**: Required **Roles**: director, campaign_manager, reviewer, finance

Creates a campaign-linked reminder for the authenticated user. The system sends a notification when the due date is reached.

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| title | string | Yes | Reminder title |
| description | string | No | Detailed description |
| dueDate | string (ISO 8601) | Yes | When to trigger the reminder |
| campaignId | string | No | Link to a campaign |
| entityType | string | No | Related entity type: campaign, content, invoice, influencer |
| entityId | string | No | Related entity ID |

**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "userId": "cuid",
    "title": "Follow up on shortlist approval",
    "description": "Client has not responded to shortlist for TKT-2026-0042",
    "dueDate": "2026-02-27T09:00:00Z",
    "campaignId": "cuid",
    "entityType": "approval",
    "entityId": "cuid",
    "isSent": false,
    "createdAt": "2026-02-25T10:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "title and dueDate are required" }`
**Response 400**: `{ "success": false, "error": "dueDate must be in the future" }`

---

## List Reminders

**Method**: GET **Path**: `/reminders`
**Auth**: Required **Roles**: director, campaign_manager, reviewer, finance

Returns all reminders for the authenticated user, sorted by due date ascending.

**Query Parameters**:

| Param | Type | Default | Description |
|---|---|---|---|
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page (max 100) |
| isSent | boolean | — | Filter by sent status |
| campaignId | string | — | Filter by campaign |
| dueDateFrom | string (ISO 8601) | — | Due date range start |
| dueDateTo | string (ISO 8601) | — | Due date range end |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "reminders": [
      {
        "id": "cuid",
        "title": "Follow up on shortlist approval",
        "description": "Client has not responded to shortlist for TKT-2026-0042",
        "dueDate": "2026-02-27T09:00:00Z",
        "campaignId": "cuid",
        "campaign": {
          "displayId": "TKT-2026-0042",
          "name": "Summer Beauty Campaign"
        },
        "entityType": "approval",
        "entityId": "cuid",
        "isSent": false,
        "createdAt": "2026-02-25T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```
