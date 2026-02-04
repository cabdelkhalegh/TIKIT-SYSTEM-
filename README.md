# TIKIT-SYSTEM

This is the repository for the TIKIT APP - A full-featured ticket management system built with Next.js.

## Features

### Core Functionality
- ✅ **Ticket Management**: Create, read, update, and delete support tickets
- ✅ **User Management**: Support for multiple users with different roles (user, agent, admin)
- ✅ **Status Tracking**: Track ticket status (open, in progress, resolved, closed)
- ✅ **Priority Levels**: Assign priority to tickets (low, medium, high, critical)
- ✅ **Dashboard**: View all tickets in a clean, organized table
- ✅ **Ticket Details**: View detailed information about each ticket
- ✅ **Real-time Updates**: Update ticket status on the fly
- ✅ **Comments Support**: Database schema includes support for ticket comments

### Technical Stack
- **Frontend**: React 18 with Next.js 15
- **Styling**: Tailwind CSS 3.4
- **Database**: SQLite with Prisma ORM 5.22
- **API**: Next.js API routes (REST API)

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/cabdelkhalegh/TIKIT-SYSTEM-.git
cd TIKIT-SYSTEM-
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
# Run migrations to create the database
npx prisma migrate dev

# Seed the database with sample data
npm run seed
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed` - Seed database with sample data

## Database Schema

The application uses three main models:

### User
- id, name, email, role, createdAt
- Roles: user, agent, admin

### Ticket
- id, title, description, status, priority, createdAt, updatedAt
- Statuses: open, in_progress, resolved, closed
- Priorities: low, medium, high, critical

### Comment
- id, content, createdAt, ticketId, userId
- Support for ticket discussions

## API Endpoints

### Tickets
- `GET /api/tickets` - List all tickets
- `POST /api/tickets` - Create a new ticket
- `GET /api/tickets/[id]` - Get ticket details
- `PATCH /api/tickets/[id]` - Update a ticket
- `DELETE /api/tickets/[id]` - Delete a ticket

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create a new user

## Project Structure

```
TIKIT-SYSTEM-/
├── app/
│   ├── api/              # API routes
│   │   ├── tickets/      # Ticket endpoints
│   │   └── users/        # User endpoints
│   ├── tickets/          # Ticket pages
│   │   ├── [id]/         # Ticket detail page
│   │   └── new/          # Create ticket page
│   ├── globals.css       # Global styles
│   ├── layout.js         # Root layout
│   └── page.js           # Home page (ticket list)
├── lib/
│   └── prisma.js         # Prisma client instance
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Database migrations
│   └── seed.js           # Seed script
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── jsconfig.json
└── package.json
```

## Screenshots

### Dashboard
![Dashboard](https://github.com/user-attachments/assets/a3cd2ab9-92aa-4858-a436-f9bd4871d9f9)

### Create Ticket
![Create Ticket](https://github.com/user-attachments/assets/bf94e3cd-ca7c-4385-bac6-c0c84345061e)

### Ticket Details
![Ticket Details](https://github.com/user-attachments/assets/77f78809-73e5-4938-a749-86ca461dd15e)

## License

This project is private and proprietary.
