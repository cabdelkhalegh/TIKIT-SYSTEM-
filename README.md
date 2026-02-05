# TIKIT-SYSTEM

This is the repository for the TIKIT ticketing application.

## Project Structure

```
TIKIT-SYSTEM/
├── backend/          # Backend Node.js application with Prisma ORM
├── docker-compose.yml # Docker configuration for local development
└── README.md         # This file
```

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- npm or yarn package manager

## Getting Started

### 1. Start the Development Database

The project uses PostgreSQL in a Docker container for local development:

```bash
# Start the database service
docker compose up -d

# Check that the database is running
docker compose ps

# View database logs (optional)
docker compose logs tikit_db_service
```

The PostgreSQL database will be available at `localhost:54320`.

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

The `.env` file is already created with default development settings. For production or custom setups, copy `.env.example` and modify as needed:

```bash
cp .env.example .env
```

Database connection format:
```
DATABASE_URL="postgresql://tikit_db_admin:TikitDev2024Pass@localhost:54320/tikit_tickets_database?schema=public"
```

### 4. Prisma Setup and Database Migration

Generate the Prisma Client:

```bash
npm run prisma:generate
```

Run database migrations:

```bash
npm run prisma:migrate
```

This will apply the database schema defined in `prisma/schema.prisma` to your PostgreSQL database.

### 5. Verify Prisma Setup

Test the Prisma Client connection:

```bash
node test-prisma.js
```

You should see output confirming successful database connection and operations.

## Available NPM Scripts

The backend includes several useful npm scripts:

```bash
# Generate Prisma Client (after schema changes)
npm run prisma:generate

# Create and apply a new migration
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Push schema changes without creating migration
npm run db:push

# Run database seeds
npm run db:seed
```

## Prisma Commands

Prisma provides powerful CLI commands for database management:

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply pending migrations
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio to view/edit data
npx prisma studio

# Pull schema from existing database
npx prisma db pull

# Format Prisma schema file
npx prisma format
```

## Docker Commands

Useful Docker commands for managing the development environment:

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Stop and remove volumes (deletes database data)
docker compose down -v

# View logs
docker compose logs -f

# Restart database service
docker compose restart tikit_db_service
```

## Database Access

- **Host:** localhost
- **Port:** 54320
- **Database:** tikit_tickets_database
- **Username:** tikit_db_admin
- **Password:** TikitDev2024Pass

You can connect using any PostgreSQL client (psql, pgAdmin, DBeaver, etc.):

```bash
psql postgresql://tikit_db_admin:TikitDev2024Pass@localhost:54320/tikit_tickets_database
```

## Development Workflow

1. Make changes to `backend/prisma/schema.prisma`
2. Run `npm run prisma:migrate` to create and apply migration
3. Prisma Client is automatically regenerated
4. Use the updated Prisma Client in your application code

## Troubleshooting

### Database connection issues

If you can't connect to the database:
1. Ensure Docker is running: `docker ps`
2. Check database container status: `docker compose ps`
3. View database logs: `docker compose logs tikit_db_service`
4. Verify port 54320 is not in use by another service

### Prisma Client not updating

After schema changes, regenerate the client:
```bash
npm run prisma:generate
```

### Reset everything

To start fresh:
```bash
# Stop and remove containers and volumes
docker compose down -v

# Start database again
docker compose up -d

# Reset and recreate database
cd backend
npx prisma migrate reset
```

## Phase 1 Completion Checklist

- [x] Install Prisma and configure PostgreSQL
- [x] `npx prisma generate` works correctly
- [x] Dummy migration applies to development database
- [x] Prisma Client is ready for use
- [x] Docker Compose configuration for PostgreSQL
- [x] Documentation in README

## Next Steps

Phase 1 (Prisma initialization) is complete. Future phases will include:
- Entity models for tickets, users, organizations
- API endpoints using the Prisma Client
- Authentication and authorization
- Frontend development

## License

ISC
