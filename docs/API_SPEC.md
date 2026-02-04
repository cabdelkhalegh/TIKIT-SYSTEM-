# TiKiT API Specification

## Authentication

All API calls use Supabase Auth with JWT tokens.

### Headers
```
Authorization: Bearer <jwt_token>
apikey: <supabase_anon_key>
```

## Endpoints

### Authentication Endpoints

#### Sign Up
```http
POST /auth/v1/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "data": {
    "full_name": "John Doe"
  }
}

Response: 200 OK
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    ...
  },
  "session": {
    "access_token": "jwt_token",
    ...
  }
}
```

#### Sign In
```http
POST /auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "user": { ... }
}
```

#### Sign Out
```http
POST /auth/v1/logout
Authorization: Bearer <jwt_token>

Response: 204 No Content
```

### Database Endpoints (via Supabase REST API)

#### Get User Profile
```http
GET /rest/v1/profiles?id=eq.<user_id>
Authorization: Bearer <jwt_token>
apikey: <supabase_anon_key>

Response: 200 OK
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "campaign_manager",
    "role_approved": true,
    ...
  }
]

Note: Valid roles per PRD v1.2:
- director
- campaign_manager
- reviewer
- finance
- client
- influencer
```

#### Update Profile
```http
PATCH /rest/v1/profiles?id=eq.<user_id>
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "full_name": "Jane Doe",
  "phone": "+1234567890"
}

Response: 200 OK
```

#### Create Invitation (Director Only)
```http
POST /rest/v1/invitations
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "role": "account_manager",
  "invite_code": "ABC12345",
  "invited_by": "director_uuid",
  "expires_at": "2024-01-15T00:00:00Z"
}

Response: 201 Created
```

#### Get Invitations (Director Only)
```http
GET /rest/v1/invitations?order=created_at.desc
Authorization: Bearer <jwt_token>

Response: 200 OK
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "role": "account_manager",
    "invite_code": "ABC12345",
    "status": "pending",
    ...
  }
]
```

#### Validate Invitation Code
```http
GET /rest/v1/invitations?invite_code=eq.ABC12345&email=eq.user@example.com&status=eq.pending
apikey: <supabase_anon_key>

Response: 200 OK
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "role": "account_manager",
    "expires_at": "2024-01-15T00:00:00Z",
    ...
  }
]
```

#### Update Invitation Status
```http
PATCH /rest/v1/invitations?id=eq.<invitation_id>
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "status": "accepted",
  "accepted_at": "2024-01-08T12:00:00Z"
}

Response: 200 OK
```

#### Approve User Role (Director Only)
```http
PATCH /rest/v1/profiles?id=eq.<user_id>
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "role_approved": true,
  "approved_by": "director_uuid",
  "approved_at": "2024-01-08T12:00:00Z"
}

Response: 200 OK
```

## Error Responses

### 400 Bad Request
```json
{
  "message": "Invalid request parameters",
  "details": "..."
}
```

### 401 Unauthorized
```json
{
  "message": "Invalid or expired JWT token"
}
```

### 403 Forbidden
```json
{
  "message": "Insufficient permissions",
  "hint": "Row-level security policy violation"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 422 Unprocessable Entity
```json
{
  "message": "Validation failed",
  "details": "..."
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error",
  "details": "..."
}
```

## Rate Limiting

- Standard Supabase rate limits apply
- Auth: 60 requests per minute per IP
- Database: 100 requests per second per project

## Security

### Row Level Security (RLS)

All database tables have RLS policies that automatically filter data based on:
- User authentication status
- User role
- Data ownership

### RBAC Rules

| Role             | Profiles | Invitations | Own Profile |
|------------------|----------|-------------|-------------|
| Director         | Full     | Full        | Full        |
| Account Manager  | Read Own | None        | Update      |
| Influencer       | Read Own | None        | Update      |
| Client           | Read Own | None        | Update      |

- **Full**: Create, Read, Update, Delete
- **Read Own**: Read only own data
- **Update**: Update own data (excluding role fields)
- **None**: No access
