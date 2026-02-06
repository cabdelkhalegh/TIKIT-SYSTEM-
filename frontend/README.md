# TIKIT Frontend

Modern Next.js 14 frontend for the TIKIT Influencer Marketing Platform.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query + Zustand
- **Forms**: React Hook Form + Zod
- **UI Components**: Custom components with Radix UI primitives
- **Icons**: Lucide React
- **Charts**: Recharts
- **Notifications**: Sonner

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Start development server
npm run dev
```

The frontend will run on [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=TIKIT
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Home page
│   │   └── globals.css   # Global styles
│   ├── components/       # React components
│   │   └── ui/          # UI components
│   ├── lib/             # Utility functions
│   │   ├── utils.ts     # General utilities
│   │   └── api-client.ts # API client setup
│   ├── hooks/           # Custom React hooks
│   ├── stores/          # Zustand stores
│   ├── services/        # API service functions
│   └── types/           # TypeScript types
├── public/              # Static files
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## Available Scripts

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Features

- ✅ Server-side rendering with Next.js 14
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling
- ✅ React Query for server state management
- ✅ API client with automatic auth token handling
- ✅ Responsive design
- ✅ Modern UI components

## Development

The frontend is designed to work with the TIKIT backend API running on `http://localhost:3001`.

Make sure the backend is running before starting the frontend development server.

## Version

Current version: 0.8.0

## Documentation

For complete project documentation, see the root README.md and PHASE_5_FRONTEND_PLAN.md
