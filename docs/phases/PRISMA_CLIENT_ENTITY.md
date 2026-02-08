# TIKIT System - Client Entity Model

## Overview
This implementation addresses **Phase 2.1: Client Entity Model** as specified in PRD Section 4.2 (Client Company Profile).

## Database Schema

The Client entity is defined in `prisma/schema.prisma` with the following structure:

### Client Model Fields

| Field | Type | Description |
|-------|------|-------------|
| `clientId` | String (UUID) | Primary key, auto-generated unique identifier |
| `legalCompanyName` | String | Official registered company name |
| `brandDisplayName` | String | Public-facing brand name |
| `industryVertical` | String (optional) | Industry classification |
| `primaryContactEmails` | String (JSON) | Primary contact email addresses |
| `billingContactEmails` | String (JSON) | Billing department contacts |
| `preferredCommChannels` | String (JSON) | Communication channel preferences |
| `activeCampaignList` | Campaign[] | Active campaigns relation |
| `completedCampaignList` | Campaign[] | Completed campaigns relation |
| `totalAdSpend` | Float (optional) | Cumulative advertising spend |
| `performanceMetricsJson` | String (JSON, optional) | Performance analytics data |
| `accountCreatedAt` | DateTime | Record creation timestamp |
| `lastModifiedAt` | DateTime | Last update timestamp (auto-managed) |

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database
Copy the example environment file:
```bash
cp .env.example .env
```

### 3. Run Migration
Apply the database schema:
```bash
npm run db:migrate:create
```

### 4. Seed Test Data (Optional)
Populate database with sample clients:
```bash
npm run db:seed
```

### 5. Verify Installation
```bash
node prisma/verify.js
```

## Available Scripts

- `npm run db:migrate:create` - Create and apply new migration
- `npm run db:studio:open` - Open Prisma Studio GUI
- `npm run db:client:sync` - Regenerate Prisma Client
- `npm run db:seed` - Seed database with test data
- `npm run db:reset:dev` - Reset database (caution: deletes all data)

## Database Technology

Currently configured to use SQLite for development convenience. Can be switched to PostgreSQL for production by updating the `datasource` in `schema.prisma`.

## Relations

The Client model includes bidirectional relations with the Campaign entity:
- `activeCampaignList` - Campaigns currently in progress
- `completedCampaignList` - Finished campaigns

## Notes

- Contact fields use JSON string storage for compatibility with SQLite
- UUID identifiers are auto-generated for all clients
- Timestamps are automatically managed by Prisma
- The Campaign model is a placeholder that will be fully implemented in Phase 2.2

## Acceptance Criteria Status

- ✅ Client entity defined in `prisma/schema.prisma` with all required fields
- ✅ Prisma migration created and applied
- ✅ Fields include: id, legal name, brand name, industry, contacts, etc.
- ✅ Seed test data implemented and verified
- ✅ Relations with Campaign entity established

## Dependencies

- Prisma ORM v5.9.1
- @prisma/client v5.9.1
- Node.js >= 18.0.0
