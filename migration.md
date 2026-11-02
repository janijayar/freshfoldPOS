# FreshFold Migration Guide

## Overview
This document outlines the migration steps and important changes for the FreshFold Laundry POS System.

## Database Migrations

### Latest Schema Changes (v0.30.10)
- **Customer table**: Added `country` field with default 'US' (ISO 2-letter code, varchar(2))
- **Customer table**: Added `loyalty_tier` field with default 'bronze'
- **Organizations table**: Default values for country (PH), timezone (Asia/Manila), currency (PHP), tax_rate (0.12), data_mode (demo)
- **Customer Laundry Preferences**: Foreign key constraint to wash_cycles table
- **New indexes**: Unique indexes for discounts, categories, consumable_threshold, consumption_rule
- **New tables**: consumables, consumable_thresholds, consumption_rules, gasul_tanks

### Running Migrations
```bash
# Push schema changes to database
npm run db:push

# Or generate and run migrations
npm run db:generate
npm run db:migrate
```

### Seeding Data
```bash
# Seed initial data (categories, wash cycles, consumables)
npm run db:seed
```

## Environment Variables Required
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
# Optional: Stripe, etc.
```

## Key Fixes in This Version

### Customer Management
1. **Country field validation**: Now accepts only ISO 2-letter codes (US, PH, CA, GB, AU, etc.)
2. **Removed fields**: dateOfBirth, loyaltyTier, state from customer forms
3. **New edit page**: `/customers/[id]/edit` for updating customer details
4. **Real API data**: Customer detail page now uses real API instead of mock data

### POS Navigation
1. **Fixed Radix UI Dialog**: Proper pattern with `open` and `onOpenChange` props
2. **Navigation flow**: POS → Add Customer → Create New Customer → Back to POS
3. **returnTo parameter**: Passes register URL for proper redirect after creation

### Search Behavior
- Search filters now only apply on **Enter** key press (not on every keystroke)
- Applied to: POS customer search dialog, customer list page

### API Improvements
- GET `/api/customers?id=<id>` - fetch single customer
- Computed `isActive` field (based on lastVisitAt within 90 days)
- Proper error handling and validation

## Clean Restart Required
After pulling changes, always run:
```bash
rm -rf .next
npm run dev
```

## Breaking Changes
- Customer `country` field must be ISO 2-letter code (was accepting full country names)
- Dialog components require proper Radix UI pattern
- Search components require form submission on Enter

## Rollback Plan
If issues arise:
1. Check git history: `git log --oneline -10`
2. Revert specific commit: `git revert <commit-hash>`
3. Reset database: `npm run db:push` (if schema reverted)
