# API Contract: Authentication

**Base Path**: `/api/v1/auth`
**Standards**: All responses follow `{ success: boolean, data?: any, error?: string }` envelope.

---

## Register (Multi-Step)

**Method**: POST **Path**: `/auth/register`
**Auth**: Public **Roles**: N/A

Completes a multi-step signup: credentials, trade license upload, and review. Account is created in a "no role" pending state. User is auto-confirmed for file upload during registration, then signed out pending Director approval.

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| email | string | Yes | Unique email address |
| password | string | Yes | Min 8 chars, uppercase + lowercase + number |
| displayName | string | Yes | Full display name |
| phone | string | No | Contact phone |
| companyName | string | No | Trade license company name |
| vatTrnNumber | string | No | VAT/TRN number |
| licenseNumber | string | No | Trade license number |
| expiryDate | string (ISO 8601) | No | License expiry date |
| businessAddress | string | No | Business address |
| activities | string[] | No | Business activities |
| ownerNames | string[] | No | License owner names |
| licenseFileUrl | string | No | Uploaded trade license file URL |

**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "isActive": false,
    "registration": {
      "id": "cuid",
      "status": "pending",
      "companyName": "Acme LLC",
      "licenseNumber": "DED-12345"
    }
  }
}
```

**Response 400**: `{ "success": false, "error": "Validation failed: password must contain uppercase, lowercase, and number" }`
**Response 409**: `{ "success": false, "error": "Email already registered" }`

---

## Login

**Method**: POST **Path**: `/auth/login`
**Auth**: Public **Roles**: N/A

Authenticates a user with email/password. Returns a JWT access token and refresh token. Sessions expire after 30 minutes of inactivity.

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| email | string | Yes | User email |
| password | string | Yes | User password |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "expiresIn": 1800,
    "user": {
      "id": "cuid",
      "email": "user@example.com",
      "displayName": "John Doe",
      "roles": ["campaign_manager", "reviewer"],
      "isActive": true
    }
  }
}
```

**Response 401**: `{ "success": false, "error": "Invalid email or password" }`
**Response 423**: `{ "success": false, "error": "Account locked due to 10 failed login attempts. Try again after {lockedUntil}" }`
**Response 403**: `{ "success": false, "error": "Account pending approval" }`

---

## Logout

**Method**: POST **Path**: `/auth/logout`
**Auth**: Required **Roles**: All

Invalidates the current session and refresh token.

**Request Headers**: `Authorization: Bearer <accessToken>`

**Response 200**:
```json
{
  "success": true,
  "data": { "message": "Logged out successfully" }
}
```

**Response 401**: `{ "success": false, "error": "Invalid or expired token" }`

---

## Refresh Token

**Method**: POST **Path**: `/auth/refresh`
**Auth**: Public (requires valid refresh token) **Roles**: N/A

Exchanges a valid refresh token for a new access token and refresh token pair.

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| refreshToken | string | Yes | Current refresh token |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "expiresIn": 1800
  }
}
```

**Response 401**: `{ "success": false, "error": "Invalid or expired refresh token" }`

---

## Forgot Password

**Method**: POST **Path**: `/auth/forgot-password`
**Auth**: Public **Roles**: N/A

Sends a password reset email with a time-limited reset token. Always returns 200 to prevent email enumeration.

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| email | string | Yes | Account email address |

**Response 200**:
```json
{
  "success": true,
  "data": { "message": "If an account with that email exists, a reset link has been sent" }
}
```

---

## Reset Password

**Method**: POST **Path**: `/auth/reset-password`
**Auth**: Public (requires valid reset token) **Roles**: N/A

Resets the user password using a valid reset token from the forgot-password email.

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| token | string | Yes | Reset token from email |
| newPassword | string | Yes | New password (min 8 chars, uppercase + lowercase + number) |

**Response 200**:
```json
{
  "success": true,
  "data": { "message": "Password reset successfully" }
}
```

**Response 400**: `{ "success": false, "error": "Invalid or expired reset token" }`
**Response 400**: `{ "success": false, "error": "Password does not meet complexity requirements" }`

---

## Instagram OAuth Callback

**Method**: GET **Path**: `/auth/instagram/callback`
**Auth**: Required **Roles**: director, campaign_manager

Handles the Instagram OAuth redirect. Exchanges the authorization code for an access token and stores the agency-level Instagram connection.

**Query Parameters**:

| Param | Type | Required | Description |
|---|---|---|---|
| code | string | Yes | OAuth authorization code from Instagram |
| state | string | Yes | CSRF state parameter |

**Response 302**: Redirects to `/settings/integrations?status=connected`

**Response 302 (error)**: Redirects to `/settings/integrations?status=error&message={error}`

**Response 400**: `{ "success": false, "error": "Invalid state parameter" }`
**Response 502**: `{ "success": false, "error": "Failed to exchange code with Instagram" }`
