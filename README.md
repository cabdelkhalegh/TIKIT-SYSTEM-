# TIKIT-SYSTEM

This is the repository for the TIKIT Application - a comprehensive platform for managing influencer marketing campaigns.

## Project Structure

```
TIKIT-SYSTEM-/
├── backend/          # NestJS backend API
│   ├── src/
│   │   ├── authentication/    # Auth module with JWT & RBAC
│   │   ├── database/          # Prisma database layer
│   │   └── ...
│   ├── prisma/       # Database schema and migrations
│   └── AUTH_README.md # Detailed authentication documentation
└── README.md         # This file
```

## Quick Start

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Generate Prisma client:
```bash
npx prisma generate
```

5. Start the development server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:3001/api`

## Features Implemented

### ✅ Phase 1: Authentication & Authorization

- JWT-based authentication system
- Role-based access control (RBAC)
- Support for 5 user roles:
  - Admin
  - Campaign Manager
  - Director
  - Client
  - Influencer
- Secure password hashing with bcrypt
- Token refresh mechanism
- Account management (registration, login, profile)

See [backend/AUTH_README.md](backend/AUTH_README.md) for detailed authentication documentation.

## Technology Stack

**Backend:**
- NestJS - Progressive Node.js framework
- Prisma - Next-generation ORM
- PostgreSQL - Relational database
- JWT - Token-based authentication
- TypeScript - Type-safe development

## Available Scripts

### Backend

- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code

## API Documentation

All API endpoints are prefixed with `/api`

### Authentication Endpoints

- `POST /api/auth/register` - Register new account
- `POST /api/auth/login` - Login with credentials
- `GET /api/auth/profile` - Get authenticated user profile

For complete API documentation and usage examples, see [backend/AUTH_README.md](backend/AUTH_README.md)

## Contributing

This project follows a phase-based development approach. See the issues directory for planned features and implementation details.

## License

Proprietary - All rights reserved
