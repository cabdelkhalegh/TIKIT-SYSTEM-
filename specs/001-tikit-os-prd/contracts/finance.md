# API Contract: Finance

**Base Path**: `/api/v1`
**Standards**: All responses follow `{ success: boolean, data?: any, error?: string }` envelope. JWT Bearer token required. All monetary values are in AED.

---

## Create Invoice

**Method**: POST **Path**: `/campaigns/:campaignId/invoices`
**Auth**: Required **Roles**: director, finance, campaign_manager

Creates a new invoice for a campaign in `draft` status with an auto-generated display ID (INV-YYYY-XXXX).

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| type | string | Yes | InvoiceType: `client` or `influencer` |
| amount | number | Yes | Invoice amount in AED |
| currency | string | No | Currency code (default: `AED`) |
| dueDate | string (ISO 8601) | No | Payment due date |
| notes | string | No | Additional notes |
| fileUrl | string | No | Attached invoice document URL |

**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "displayId": "INV-2026-0087",
    "campaignId": "cuid",
    "type": "client",
    "status": "draft",
    "amount": 65000,
    "currency": "AED",
    "dueDate": "2026-03-31T00:00:00Z",
    "notes": "Q1 campaign fee including management",
    "fileUrl": null,
    "createdAt": "2026-02-25T10:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "type must be one of: client, influencer" }`
**Response 400**: `{ "success": false, "error": "amount is required and must be a positive number" }`
**Response 400**: `{ "success": false, "error": "Cannot create invoices for a closed campaign" }`
**Response 404**: `{ "success": false, "error": "Campaign not found" }`

---

## List Campaign Invoices

**Method**: GET **Path**: `/campaigns/:campaignId/invoices`
**Auth**: Required **Roles**: director, finance, campaign_manager

Returns all invoices for a campaign.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |

**Query Parameters**:

| Param | Type | Default | Description |
|---|---|---|---|
| type | string | — | Filter by InvoiceType: client, influencer |
| status | string | — | Filter by InvoiceStatus: draft, sent, approved, paid |
| sortBy | string | createdAt | Sort field: createdAt, amount, dueDate, status |
| sortOrder | string | desc | Sort direction: asc, desc |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "campaignId": "cuid",
    "invoices": [
      {
        "id": "cuid",
        "displayId": "INV-2026-0087",
        "type": "client",
        "status": "sent",
        "amount": 65000,
        "currency": "AED",
        "dueDate": "2026-03-31T00:00:00Z",
        "notes": "Q1 campaign fee including management",
        "fileUrl": null,
        "createdAt": "2026-02-25T10:00:00Z",
        "updatedAt": "2026-02-25T14:00:00Z"
      },
      {
        "id": "cuid",
        "displayId": "INV-2026-0088",
        "type": "influencer",
        "status": "draft",
        "amount": 5000,
        "currency": "AED",
        "dueDate": "2026-04-15T00:00:00Z",
        "notes": "Payment for @beautybylayla",
        "fileUrl": null,
        "createdAt": "2026-02-25T11:00:00Z",
        "updatedAt": "2026-02-25T11:00:00Z"
      }
    ],
    "count": 5
  }
}
```

---

## Update Invoice Status

**Method**: PATCH **Path**: `/campaigns/:campaignId/invoices/:id/status`
**Auth**: Required **Roles**: director, finance

Transitions an invoice through its status lifecycle: draft -> sent -> approved -> paid.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| campaignId | string | Campaign CUID or displayId |
| id | string | Invoice CUID or displayId |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| status | string | Yes | Target InvoiceStatus: sent, approved, paid |

**Valid Transitions**:

| From | To |
|---|---|
| draft | sent |
| sent | approved |
| approved | paid |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "displayId": "INV-2026-0087",
    "previousStatus": "draft",
    "newStatus": "sent",
    "updatedAt": "2026-02-25T14:00:00Z"
  }
}
```

**Response 400**: `{ "success": false, "error": "Invalid status transition from draft to paid" }`
**Response 404**: `{ "success": false, "error": "Invoice not found" }`

---

## Get Campaign Budget Tracker

**Method**: GET **Path**: `/campaigns/:campaignId/budget`
**Auth**: Required **Roles**: director, finance, campaign_manager

Returns the budget tracker for a campaign showing budget vs. committed vs. spent, including management fee calculation.

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
    "displayId": "TKT-2026-0042",
    "budget": 50000,
    "managementFee": 30,
    "managementFeeAmount": 15000,
    "netBudget": 35000,
    "committed": 28000,
    "spent": 15000,
    "remaining": 7000,
    "utilizationPercent": 80,
    "breakdown": {
      "influencerCosts": {
        "committed": 28000,
        "paid": 15000
      },
      "clientInvoices": {
        "total": 65000,
        "sent": 65000,
        "approved": 0,
        "paid": 0
      },
      "influencerInvoices": {
        "total": 15000,
        "sent": 10000,
        "approved": 5000,
        "paid": 5000
      }
    },
    "lastRevision": {
      "previousBudget": 45000,
      "newBudget": 50000,
      "changedBy": "cuid",
      "reason": "Client approved additional deliverables",
      "createdAt": "2026-02-24T09:00:00Z"
    }
  }
}
```

**Response 404**: `{ "success": false, "error": "Campaign not found" }`

---

## Get Budget Revisions

**Method**: GET **Path**: `/campaigns/:campaignId/budget/revisions`
**Auth**: Required **Roles**: director, finance, campaign_manager

Returns the append-only budget revision history for a campaign, sorted by creation date descending.

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
    "revisions": [
      {
        "id": "cuid",
        "previousBudget": 45000,
        "newBudget": 50000,
        "changedBy": "cuid",
        "changedByName": "Sara A.",
        "reason": "Client approved additional deliverables",
        "createdAt": "2026-02-24T09:00:00Z"
      },
      {
        "id": "cuid",
        "previousBudget": 40000,
        "newBudget": 45000,
        "changedBy": "cuid",
        "changedByName": "Sara A.",
        "reason": "Initial budget increase after brief review",
        "createdAt": "2026-02-20T14:00:00Z"
      }
    ],
    "count": 2
  }
}
```

---

## Get Finance Overview (Global)

**Method**: GET **Path**: `/finance/overview`
**Auth**: Required **Roles**: director, finance

Returns a global financial overview across all campaigns.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "totalRevenue": 1250000,
    "pendingReceivables": 380000,
    "pendingPayables": 145000,
    "activeCampaigns": 12,
    "totalManagementFees": 375000,
    "byStatus": {
      "draft": { "count": 5, "total": 32000 },
      "sent": { "count": 8, "total": 248000 },
      "approved": { "count": 3, "total": 145000 },
      "paid": { "count": 42, "total": 1250000 }
    },
    "monthlyTrend": [
      { "month": "2026-01", "revenue": 420000, "receivables": 180000, "payables": 65000 },
      { "month": "2026-02", "revenue": 830000, "receivables": 200000, "payables": 80000 }
    ]
  }
}
```

**Response 403**: `{ "success": false, "error": "Insufficient permissions — Director or Finance role required" }`

---

## List All Invoices (Global)

**Method**: GET **Path**: `/finance/invoices`
**Auth**: Required **Roles**: director, finance

Returns a paginated, filterable list of all invoices across all campaigns.

**Query Parameters**:

| Param | Type | Default | Description |
|---|---|---|---|
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page (max 100) |
| search | string | — | Search by displayId or campaign name |
| type | string | — | Filter by InvoiceType: client, influencer |
| status | string | — | Filter by InvoiceStatus (comma-separated for multiple) |
| campaignId | string | — | Filter by campaign |
| dueDateFrom | string (ISO 8601) | — | Due date range start |
| dueDateTo | string (ISO 8601) | — | Due date range end |
| sortBy | string | createdAt | Sort field: createdAt, amount, dueDate, status |
| sortOrder | string | desc | Sort direction: asc, desc |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": "cuid",
        "displayId": "INV-2026-0087",
        "campaign": {
          "id": "cuid",
          "displayId": "TKT-2026-0042",
          "name": "Summer Beauty Campaign"
        },
        "type": "client",
        "status": "sent",
        "amount": 65000,
        "currency": "AED",
        "dueDate": "2026-03-31T00:00:00Z",
        "notes": "Q1 campaign fee",
        "createdAt": "2026-02-25T10:00:00Z",
        "updatedAt": "2026-02-25T14:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 58,
      "totalPages": 3
    }
  }
}
```
