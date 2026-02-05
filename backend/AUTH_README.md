# TIKIT System - Authentication & Authorization

This backend implements a comprehensive authentication and role-based access control (RBAC) system for the TIKIT platform.

## Architecture Overview

The system uses:
- **NestJS** - Backend framework
- **Prisma** - Database ORM
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing
- **PostgreSQL** - Database

## Roles Supported

The system supports five distinct user roles:
- `ADMIN` - Full system access
- `CAMPAIGN_MANAGER` - Manages marketing campaigns
- `DIRECTOR` - Strategic oversight and reporting
- `CLIENT` - Customer access to campaigns
- `INFLUENCER` - Content creator access

## Setup Instructions

### 1. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Update the following variables:
- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_SECRET_KEY` - Secret key for access tokens (min 32 chars)
- `JWT_REFRESH_SECRET` - Secret key for refresh tokens (min 32 chars)
- `PORT` - Server port (default: 3001)

### 2. Database Setup

Generate Prisma client:
```bash
npm run prisma:generate
```

Run database migrations (when you have a database):
```bash
npx prisma migrate dev
```

### 3. Start the Server

Development mode:
```bash
npm run start:dev
```

Production mode:
```bash
npm run build
npm run start:prod
```

## API Endpoints

All endpoints are prefixed with `/api`

### Authentication Endpoints

#### Register New Account
```http
POST /api/auth/register
Content-Type: application/json

{
  "emailAddress": "user@example.com",
  "password": "securePassword123",
  "fullName": "John Doe"
}
```

Response:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": "1h"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "emailAddress": "user@example.com",
  "password": "securePassword123"
}
```

Response:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": "1h"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer {accessToken}
```

Response:
```json
{
  "id": "uuid-here",
  "emailAddress": "user@example.com",
  "fullName": "John Doe",
  "accountRole": "CLIENT",
  "isActive": true
}
```

## Using RBAC in Your Controllers

### Example 1: Protecting an Endpoint with Authentication

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from './authentication/guards/access-token.guard';
import { CurrentAccount } from './authentication/decorators/current-account.decorator';

@Controller('campaigns')
export class CampaignsController {
  @Get()
  @UseGuards(AccessTokenGuard)
  async listCampaigns(@CurrentAccount('accountId') userId: string) {
    // Only authenticated users can access
    return { userId, campaigns: [] };
  }
}
```

### Example 2: Role-Based Restrictions

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from './authentication/guards/access-token.guard';
import { PermissionCheckGuard } from './authentication/guards/permission-check.guard';
import { RequirePermissions } from './authentication/decorators/permissions.decorator';

@Controller('admin')
@UseGuards(AccessTokenGuard, PermissionCheckGuard)
export class AdminController {
  @Post('create-user')
  @RequirePermissions('ADMIN')
  async createUser() {
    // Only ADMIN role can access
    return { message: 'User created' };
  }
}
```

### Example 3: Multiple Roles

```typescript
@Controller('reports')
@UseGuards(AccessTokenGuard, PermissionCheckGuard)
export class ReportsController {
  @Get('analytics')
  @RequirePermissions('ADMIN', 'DIRECTOR', 'CAMPAIGN_MANAGER')
  async getAnalytics(@CurrentAccount() account) {
    // Accessible by ADMIN, DIRECTOR, or CAMPAIGN_MANAGER
    return { 
      role: account.accountRole,
      data: [] 
    };
  }
}
```

### Example 4: Extracting Specific User Data

```typescript
@Controller('profile')
@UseGuards(AccessTokenGuard)
export class ProfileController {
  @Get('email')
  async getEmail(@CurrentAccount('emailAddress') email: string) {
    return { email };
  }

  @Get('full')
  async getFullProfile(@CurrentAccount() account) {
    return account; // Contains accountId, emailAddress, accountRole
  }
}
```

## Testing

Run all tests:
```bash
npm test
```

Run specific test file:
```bash
npm test -- authentication.controller.spec.ts
```

Run with coverage:
```bash
npm test -- --coverage
```

## Security Features

1. **Password Hashing**: Uses bcrypt with 12 rounds
2. **JWT Tokens**: Separate access and refresh tokens
3. **Token Expiration**: Configurable expiration times
4. **Account Status**: Inactive accounts cannot authenticate
5. **Input Validation**: All inputs validated with class-validator
6. **SQL Injection Protection**: Prisma provides parameterized queries

## Database Schema

### Account Model
- `id` - UUID primary key
- `emailAddress` - Unique email
- `passwordHash` - Bcrypt hashed password
- `fullName` - User's full name
- `accountRole` - Enum (ADMIN, CAMPAIGN_MANAGER, DIRECTOR, CLIENT, INFLUENCER)
- `isActive` - Boolean flag
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

### RefreshToken Model
- `id` - UUID primary key
- `tokenValue` - Unique token string
- `accountId` - Reference to account
- `expiresAt` - Token expiration
- `isRevoked` - Boolean flag
- `createdAt` - Timestamp

## Troubleshooting

### JWT Secret Too Short
Ensure your JWT secrets are at least 32 characters long in the .env file.

### Database Connection Issues
Verify your DATABASE_URL is correct and PostgreSQL is running.

### Validation Errors
The API returns detailed validation errors. Check the response body for specific field errors.

## Next Steps

This authentication framework is ready for:
- Campaign Service integration
- User management endpoints
- Role hierarchy implementation
- OAuth provider integration
- Multi-factor authentication
