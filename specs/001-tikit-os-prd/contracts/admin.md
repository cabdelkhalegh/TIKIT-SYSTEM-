# API Contract: Admin

**Base Path**: `/api/v1/admin`
**Standards**: All responses follow `{ success: boolean, data?: any, error?: string }` envelope. JWT Bearer token required. All endpoints restricted to Director role.

---

## List Pending Registrations

**Method**: GET **Path**: `/admin/registrations`
**Auth**: Required **Roles**: director

Returns all pending user registrations awaiting Director approval, including AI-extracted trade license data.

**Query Parameters**:

| Param | Type | Default | Description |
|---|---|---|---|
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page (max 100) |
| status | string | pending | Filter by RegistrationStatus: pending, approved, rejected |
| sortBy | string | createdAt | Sort field: createdAt, companyName |
| sortOrder | string | desc | Sort direction: asc, desc |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "registrations": [
      {
        "id": "cuid",
        "user": {
          "id": "cuid",
          "email": "ali@luxe.ae",
          "displayName": "Ali K.",
          "phone": "+971-50-1234567",
          "createdAt": "2026-02-24T09:00:00Z"
        },
        "companyName": "Luxe Beauty LLC",
        "vatTrnNumber": "100123456700003",
        "licenseNumber": "DED-789012",
        "expiryDate": "2027-06-30T00:00:00Z",
        "businessAddress": "Business Bay, Dubai, UAE",
        "activities": ["Marketing", "Advertising", "PR"],
        "ownerNames": ["Ali K.", "Sara M."],
        "licenseFileUrl": "https://storage.example.com/licenses/abc123.pdf",
        "status": "pending",
        "createdAt": "2026-02-24T09:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "totalPages": 1
    }
  }
}
```

---

## Approve Registration

**Method**: POST **Path**: `/admin/registrations/:id/approve`
**Auth**: Required **Roles**: director

Approves a pending registration. Assigns the `client` role to the user and activates their account.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| id | string | CompanyRegistration CUID |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| role | string | No | Role to assign (default: `client`). Must be one of the six RoleName values. |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "registrationId": "cuid",
    "userId": "cuid",
    "status": "approved",
    "assignedRole": "client",
    "userActivated": true,
    "message": "Registration approved. User can now log in."
  }
}
```

**Response 400**: `{ "success": false, "error": "Registration is not in pending status" }`
**Response 404**: `{ "success": false, "error": "Registration not found" }`

---

## Reject Registration

**Method**: POST **Path**: `/admin/registrations/:id/reject`
**Auth**: Required **Roles**: director

Rejects a pending registration with a reason. The user account remains inactive.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| id | string | CompanyRegistration CUID |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| reason | string | Yes | Reason for rejection |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "registrationId": "cuid",
    "status": "rejected",
    "rejectionReason": "Trade license expired. Please submit a valid license.",
    "message": "Registration rejected."
  }
}
```

**Response 400**: `{ "success": false, "error": "reason is required when rejecting a registration" }`
**Response 400**: `{ "success": false, "error": "Registration is not in pending status" }`
**Response 404**: `{ "success": false, "error": "Registration not found" }`

---

## List Users

**Method**: GET **Path**: `/admin/users`
**Auth**: Required **Roles**: director

Returns all users in the system with their assigned roles and account status.

**Query Parameters**:

| Param | Type | Default | Description |
|---|---|---|---|
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page (max 100) |
| search | string | — | Search by email, displayName |
| role | string | — | Filter by RoleName (comma-separated for multiple) |
| isActive | boolean | — | Filter by active status |
| sortBy | string | createdAt | Sort field: createdAt, displayName, email, lastSignIn |
| sortOrder | string | desc | Sort direction: asc, desc |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "cuid",
        "email": "sara@tikit.ae",
        "displayName": "Sara A.",
        "phone": "+971-50-9876543",
        "isActive": true,
        "isEmailVerified": true,
        "roles": ["campaign_manager", "reviewer"],
        "lastSignIn": "2026-02-25T08:30:00Z",
        "createdAt": "2026-01-10T10:00:00Z"
      },
      {
        "id": "cuid",
        "email": "ali@luxe.ae",
        "displayName": "Ali K.",
        "phone": "+971-50-1234567",
        "isActive": true,
        "isEmailVerified": true,
        "roles": ["client"],
        "lastSignIn": "2026-02-24T16:00:00Z",
        "createdAt": "2026-02-24T09:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 28,
      "totalPages": 2
    }
  }
}
```

---

## Assign/Remove User Roles

**Method**: PATCH **Path**: `/admin/users/:id/roles`
**Auth**: Required **Roles**: director

Assigns or removes roles for a user. Enforces the constraint that Client and Influencer roles are exclusive (cannot be combined with any other role).

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| id | string | User CUID |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| add | string[] | No | Roles to add (RoleName values) |
| remove | string[] | No | Roles to remove (RoleName values) |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "userId": "cuid",
    "roles": ["campaign_manager", "reviewer", "finance"],
    "message": "Roles updated successfully"
  }
}
```

**Response 400**: `{ "success": false, "error": "Client role cannot be combined with other roles" }`
**Response 400**: `{ "success": false, "error": "Influencer role cannot be combined with other roles" }`
**Response 400**: `{ "success": false, "error": "At least one of add or remove must be provided" }`
**Response 404**: `{ "success": false, "error": "User not found" }`

---

## Reset User Password

**Method**: POST **Path**: `/admin/users/:id/reset-password`
**Auth**: Required **Roles**: director

Directly resets a user's password to a provided value. Useful for support scenarios.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| id | string | User CUID |

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| newPassword | string | Yes | New password (min 8 chars, uppercase + lowercase + number) |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "userId": "cuid",
    "message": "Password reset successfully"
  }
}
```

**Response 400**: `{ "success": false, "error": "Password does not meet complexity requirements" }`
**Response 404**: `{ "success": false, "error": "User not found" }`

---

## Send Password Reset Email

**Method**: POST **Path**: `/admin/users/:id/send-reset-email`
**Auth**: Required **Roles**: director

Sends a password reset email to the user with a time-limited reset link.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| id | string | User CUID |

**Request Body**: None (or empty `{}`)

**Response 200**:
```json
{
  "success": true,
  "data": {
    "userId": "cuid",
    "email": "sara@tikit.ae",
    "message": "Password reset email sent"
  }
}
```

**Response 404**: `{ "success": false, "error": "User not found" }`

---

## Delete User

**Method**: DELETE **Path**: `/admin/users/:id`
**Auth**: Required **Roles**: director

Permanently deletes a user account. This action is irreversible. Cannot delete the last Director user.

**Path Parameters**:

| Param | Type | Description |
|---|---|---|
| id | string | User CUID |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "userId": "cuid",
    "message": "User deleted successfully"
  }
}
```

**Response 400**: `{ "success": false, "error": "Cannot delete the last Director user" }`
**Response 400**: `{ "success": false, "error": "Cannot delete yourself" }`
**Response 404**: `{ "success": false, "error": "User not found" }`
