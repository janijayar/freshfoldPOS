# freshfold — POS & Management System

Point of Sale and management platform for freshfold.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS + Radix UI primitives
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **Auth**: NextAuth.js (Credentials provider)
- **Payments**: Stripe Terminal + Stripe Connect
- **Testing**: Vitest + Playwright
- **Deploy**: Vercel / Fly.io

## Project Structure

```
freshfold/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Auth route group
│   │   ├── (dashboard)/        # Dashboard route group
│   │   ├── (pos)/              # POS route group
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── ui/                 # Design system primitives
│   │   └── layout/             # Layout components (Sidebar, Header)
│   ├── lib/
│   │   ├── auth/               # NextAuth configuration
│   │   ├── db/                 # Drizzle schema, client, seed
│   │   └── utils.ts            # Utility functions
│   ├── styles/
│   │   └── globals.css         # Global styles + design tokens
│   ├── hooks/                  # Custom React hooks
│   └── types/                  # TypeScript types
├── drizzle/                    # Generated migrations
├── public/                     # Static assets
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (local or Neon)
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Edit .env with your database URL and secrets
# DATABASE_URL="postgresql://user:password@localhost:5432/freshfold"

# Push database schema
pnpm db:push

# Seed database with demo data
pnpm db:seed

# Start development server
pnpm dev
```

### Demo Credentials

After seeding, you can log in with:

| Role | Email | Password |
|------|-------|----------|
| Owner | admin@freshfold.com | password123 |
| Manager | manager@freshfold.com | password123 |
| Cashier | cashier1@freshfold.com | password123 |

## Available Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm db:generate      # Generate migrations
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Drizzle Studio
pnpm db:seed          # Seed database with demo data

# Testing
pnpm test             # Run tests
pnpm test:ui          # Run tests with UI

# Linting
pnpm lint             # Run ESLint
```

## Vertical Slice (Milestone 0)

The following screens are implemented as a working vertical slice:

- **S01** - Login (`/login`)
- **S02** - Dashboard (`/dashboard`)
- **S08** - POS Terminal (`/pos/[registerId]`)
- **S17** - Shifts (`/shifts`)
- **S07** - Receipt Detail (`/receipts/[id]`)

## Design System

Design tokens are defined in `src/styles/globals.css` as CSS custom properties and mapped to Tailwind in `tailwind.config.js`.

Components are built on Radix UI primitives in `src/components/ui/`.

### Tokens Include

- Colors (light/dark mode)
- Typography scale
- Spacing scale
- Border radius
- Shadows
- Motion/transitions
- Layout dimensions
- Z-index scale

## Database Schema

26 tables covering:
- Organizations, Locations, Registers
- Users (Staff with RBAC)
- Categories, Products, Variants
- Inventory (per location)
- Customers & Loyalty
- Orders, Order Items, Payments
- Shifts & Cash Reconciliation
- Receipts
- Discounts
- Inventory Adjustments

## Deployment

### Vercel (Frontend)

```bash
# Connect your repo to Vercel
# Add environment variables
# Deploy
```

### Fly.io / Railway (Full Stack)

```bash
# Build Docker image
# Deploy with flyctl or railway CLI
# Run migrations on deploy
```

## License

Private - All rights reserved