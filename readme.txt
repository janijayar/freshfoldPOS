# FreshFold - Laundry POS System

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon, Supabase, or local)
- pnpm (recommended) or npm

### Installation
```bash
# Clone the repository
git clone https://github.com/janijayar/freshfoldPOS.git
cd freshfoldPOS

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and NEXTAUTH_SECRET

# Push database schema
npm run db:push

# Seed initial data
npm run db:seed

# Start development server
npm run dev
```

### Access the Application
- Local: http://localhost:3000
- Login with seeded credentials (check seed.ts)

## Project Structure
```
src/
├── app/
│   ├── (dashboard)/     # Dashboard pages (customers, inventory, reports, etc.)
│   ├── (pos)/           # POS pages
│   └── api/             # API routes
├── components/          # React components
├── lib/
│   ├── db/              # Database schema, queries, seeding
│   └── permissions.ts   # Permission system
└── middleware.ts        # Auth middleware
```

## Key Features
- **POS System**: Register-based point of sale
- **Customer Management**: Create, edit, search, loyalty tracking
- **Inventory**: Products, categories, consumables (gasul, detergent, etc.)
- **Reports**: Sales, shifts, staff, multi-location
- **Multi-location**: Organizations with multiple locations
- **Authentication**: NextAuth with role-based permissions

## Important Notes

### Customer Creation
- Country field: Use ISO 2-letter codes only (US, PH, CA, GB, AU)
- Removed fields: dateOfBirth, loyaltyTier, state

### Navigation Flow
POS → Add Customer → Create New Customer → Back to POS
- Uses `returnTo` query parameter for proper redirect
- Requires clean restart after code changes: `rm -rf .next && npm run dev`

### Search Behavior
- Search filters apply only on **Enter** key
- Not on every keystroke

## Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema to database
npm run db:seed      # Seed database
npm run db:studio    # Open Drizzle Studio
npm run test         # Run Playwright tests
```

## Troubleshooting

### 500 Error on Customer Creation
- Check country field is ISO 2-letter code
- Verify DATABASE_URL is correct
- Check server logs for details

### Navigation Not Working
- Clear .next cache: `rm -rf .next`
- Restart dev server
- Check browser console for errors

### Static Assets 404
- Clear .next cache
- Rebuild: `npm run build`

## GitHub Repository
https://github.com/janijayar/freshfoldPOS.git

## Migration Guide
See `migration.md` for detailed migration instructions and schema changes.
