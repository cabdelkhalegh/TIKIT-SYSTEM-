# Phase 3.1: Authentication & Authorization - Implementation Guide

**Date**: 2026-02-06  
**Status**: ✅ Core Complete (Protection of existing routes pending)  
**PRD Reference**: Section 5.1 - User Authentication & Authorization

---

## 📋 Overview

Phase 3.1 implements JWT-based authentication and role-based authorization for the TIKIT platform. This secures the API and enables user management with different permission levels.

---

## ✅ What Was Implemented

### 1. User Entity (17 fields)

**Authentication Fields:**
- `email` (unique) - User email address
- `passwordHash` - Bcrypt-encrypted password

**Profile Fields:**
- `fullName` - User's full name
- `displayName` - Display name (optional)
- `profileImageUrl` - Profile picture URL

**Authorization Fields:**
- `role` - User role (admin, client_manager, influencer_manager)
- `isActive` - Account active status
- `isEmailVerified` - Email verification status

**Relationship Fields:**
- `managedClientId` - Link to managed client (for client managers)
- `managedInfluencerId` - Link to managed influencer (for influencers)

**Security Fields:**
- `lastLoginAt` - Last login timestamp
- `passwordResetToken` - Password reset token
- `passwordResetExpires` - Token expiration
- `emailVerificationToken` - Email verification token

### 2. Security Manager (`utils/security-manager.js`)

**Class-based singleton** for cryptographic operations:

```javascript
const securityManager = require('./utils/security-manager');

// Encrypt password
const hash = await securityManager.encryptUserPassword(plainPassword);

// Validate password
const isValid = await securityManager.validateUserPassword(password, hash);

// Create JWT token
const token = securityManager.createSessionToken(userCredentials);

// Decode JWT token
const result = securityManager.decodeSessionToken(tokenString);
```

**Features:**
- Bcrypt password hashing (10 rounds)
- JWT token generation with configurable expiration
- Token validation and decoding
- Random security token generation

### 3. Access Control Middleware (`middleware/access-control.js`)

**Three middleware functions:**

```javascript
const accessControl = require('./middleware/access-control');

// Require authentication
router.get('/protected',
  accessControl.requireAuthentication.bind(accessControl),
  handler
);

// Require specific role
router.post('/admin-only',
  accessControl.requireAuthentication.bind(accessControl),
  accessControl.requireRole('admin').bind(accessControl),
  handler
);

// Optional authentication
router.get('/public',
  accessControl.allowOptionalAuth.bind(accessControl),
  handler
);
```

**Features:**
- Bearer token extraction from headers
- JWT validation
- User context injection (req.authenticatedUser)
- Role-based authorization
- Clear error messages

### 4. User Account Manager (`controllers/user-account-manager.js`)

**Five controller methods:**

1. **createUserAccount** - Register new user
2. **authenticateUser** - Login and get token
3. **fetchUserProfile** - Get user profile
4. **modifyUserProfile** - Update profile
5. **updateUserPassword** - Change password

**Features:**
- Email uniqueness validation
- Password strength requirements
- Account status checking
- Login tracking
- Secure password updates

### 5. Authentication Routes (`routes/auth-routes.js`)

**Five API endpoints:**

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/v1/auth/register` | POST | No | Register new user |
| `/api/v1/auth/login` | POST | No | Login and get token |
| `/api/v1/auth/profile` | GET | Yes | Get user profile |
| `/api/v1/auth/profile` | PUT | Yes | Update profile |
| `/api/v1/auth/change-password` | POST | Yes | Change password |

**Input Validation:**
- Email format validation
- Password length (min 8 characters)
- Role validation (admin, client_manager, influencer_manager)
- Profile image URL validation

### 6. Input Validator (`middleware/input-validator.js`)

**Validation error handling:**
- Uses express-validator
- Returns structured error messages
- Includes field names and error details

---

## 🔐 Authentication Flow

### Registration Flow

```
1. User submits email, password, fullName
2. System checks email uniqueness
3. Password encrypted with bcrypt
4. User record created in database
5. JWT token generated and returned
6. User can immediately access protected routes
```

### Login Flow

```
1. User submits email and password
2. System looks up user by email
3. Checks account is active
4. Validates password against hash
5. Updates lastLoginAt timestamp
6. Generates JWT token
7. Returns user data + token
```

### Protected Route Access

```
1. Client includes token in Authorization header
2. Middleware extracts Bearer token
3. JWT verified and decoded
4. User info attached to request
5. Handler processes request
6. Response returned
```

---

## 🎯 API Examples

### Register User

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@company.com",
    "password": "SecurePass123",
    "fullName": "Jane Manager",
    "role": "client_manager"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "New user account created successfully",
  "data": {
    "userAccount": {
      "userId": "uuid-here",
      "email": "manager@company.com",
      "fullName": "Jane Manager",
      "role": "client_manager",
      ...
    },
    "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@company.com",
    "password": "SecurePass123"
  }'
```

### Access Protected Route

```bash
TOKEN="your-jwt-token-here"

curl http://localhost:3001/api/v1/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Update Profile

```bash
curl -X PUT http://localhost:3001/api/v1/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Jane M.",
    "profileImageUrl": "https://example.com/avatar.jpg"
  }'
```

### Change Password

```bash
curl -X POST http://localhost:3001/api/v1/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "SecurePass123",
    "newPassword": "NewSecurePass456"
  }'
```

---

## 🔒 Security Features

### Password Security
- **Bcrypt hashing** with 10 salt rounds
- **Minimum 8 characters** required
- **Hash stored**, never plain text
- **One-way encryption** - cannot be reversed

### Token Security
- **JWT tokens** with expiration (7 days default)
- **Signed with secret key** - tampering detected
- **Includes user ID, email, role** in payload
- **Stateless** - no server-side session storage

### API Security
- **Bearer token** authentication
- **Authorization header** required
- **Invalid tokens rejected** with 401
- **Expired tokens detected** automatically

### Account Security
- **Email uniqueness** enforced
- **Account status** checking
- **Role-based access** control
- **Login tracking** for audit

---

## 🎭 User Roles

### admin
- Full system access
- Can manage all users
- Can access all clients and campaigns
- Can modify system settings

### client_manager
- Manage assigned clients
- Create and manage campaigns
- Invite influencers
- View analytics for their clients

### influencer_manager
- Manage influencer profiles
- View collaboration requests
- Track performance
- Update deliverables

---

## 🧪 Testing Results

### Test 1: User Registration ✅
```bash
POST /api/v1/auth/register
Status: 201 Created
Token: Generated successfully
```

### Test 2: User Login ✅
```bash
POST /api/v1/auth/login
Status: 200 OK
Token: Valid JWT returned
lastLoginAt: Updated
```

### Test 3: Profile Access ✅
```bash
GET /api/v1/auth/profile
With valid token: 200 OK
Without token: 401 Unauthorized
Invalid token: 401 Unauthorized
```

### Test 4: Password Validation ✅
```bash
Login with wrong password: 401 Unauthorized
Login with correct password: 200 OK
```

---

## 📊 Database Changes

### Migration: `20260206032908_add_user_authentication`

**Created:**
- `users` table with 17 columns
- Indexes on email, role, managedClientId, managedInfluencerId
- Foreign keys to clients and influencers tables

**Schema additions:**
- User → Client relationship (optional)
- User → Influencer relationship (optional)
- Client → Users relationship (managers)
- Influencer → Users relationship (user accounts)

---

## 🚧 What's Pending

### Next Steps:

1. **Protect Existing Routes**
   - Add authentication to all CRUD endpoints
   - Implement role-based filtering

2. **Admin Endpoints**
   - User management (list, create, update, delete)
   - Role assignment
   - Account activation/deactivation

3. **Password Reset**
   - Request reset email
   - Verify reset token
   - Update password

4. **Email Verification**
   - Send verification email
   - Verify email token
   - Update verification status

5. **Enhanced Security**
   - Rate limiting
   - Account lockout after failed attempts
   - Session management

---

## 🎯 Success Criteria

- [x] Users can register with email/password
- [x] Users can login and receive JWT token
- [x] JWT tokens correctly authenticate requests
- [x] Protected routes reject invalid tokens
- [x] Users can view their profile
- [x] Users can update their profile
- [x] Users can change their password
- [x] Passwords are securely hashed
- [x] Role-based access control working
- [ ] All existing routes protected (pending)
- [ ] Admin user management (pending)
- [ ] Password reset flow (pending)

---

## 💡 Design Decisions

### Why JWT over Sessions?
- **Stateless** - scales better
- **Cross-domain** - works with separate frontend
- **Mobile-friendly** - easier for mobile apps
- **Microservices** - no shared session store needed

### Why Bcrypt?
- **Industry standard** for password hashing
- **Adaptive** - can increase rounds as computers get faster
- **Salted** - protects against rainbow tables
- **Slow by design** - resistant to brute force

### Why Class-Based Singletons?
- **Centralized configuration** - one place for secrets
- **Consistent interface** - same methods everywhere
- **Easy to test** - can mock the singleton
- **Memory efficient** - single instance

---

**Status**: Phase 3.1 Core ✅ Complete  
**Next**: Protect existing routes and add admin endpoints  
**Estimated Completion**: 2-3 days for full Phase 3.1
