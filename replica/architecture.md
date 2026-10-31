# Architecture: freshfold POS (a rebuild of Loyverse's core features)

## Stack

| layer | choice | why |
| --- | --- | --- |
| web | Next.js 14 (App Router) + TypeScript | Already in codebase, good DX, React Server Components |
| styling | Tailwind CSS + design tokens | Already in codebase, consistent with existing UI |
| state | TanStack Query + Zustand | Already planned, good for server/client state |
| database | PostgreSQL on Neon | Serverless, branches, cheap at low scale |
| ORM | Drizzle | Type-safe, fast, works with Neon |
| auth | NextAuth v5 (Auth.js) | Already in codebase, credentials + future OAuth |
| payments | Stripe Terminal + Stripe Connect | Multi-location, hardware support |
| email | Resend | Simple, good DX, React Email templates |
| jobs | Vercel Cron + Inngest | Scheduled (cron) + event-driven (Inngest) |
| files | Supabase Storage | S3-compatible, CDN, signed URLs |
| hosting | Vercel | Native Next.js support, edge, preview deploys |

## Schema

Tables: 15. Access rules: Postgres RLS on Supabase/Neon + data-layer checks.

```sql
-- See replica/schema.sql for full schema with indexes and RLS policies

-- Core tables:
-- organizations, locations, registers, users
-- products, product_variants, inventory_adjustments
-- customers, orders, order_line_items, payments
-- shifts, held_orders, receipts
-- audit_logs
```

## API

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| POST /api/auth/signin | Credentials sign in | public | email, password | session cookie | F01 |
| GET /api/auth/session | Get current session | authed | - | user + org + location | All |
| GET /api/locations | List user's locations | authed | - | Location[] | F16 |
| POST /api/locations | Create location | owner | name, address, currency | Location | F16 |
| GET /api/products | List products (search, filter, paginate) | authed | q, category, page, sort | Product[] | F12, F02-F05 |
| POST /api/products | Create product | manager | ProductInput | Product | F12 |
| PATCH /api/products/:id | Update product | manager | Partial<ProductInput> | Product | F12 |
| GET /api/inventory/adjustments | List adjustments | authed | type, location, page | Adjustment[] | F12 |
| POST /api/inventory/adjustments | Create adjustment | manager | AdjustmentInput | Adjustment | F12 |
| GET /api/orders | List orders (filter, paginate) | authed | date, location, status | Order[] | F08, F10 |
| POST /api/orders | Create order (from POS) | authed | OrderCreateInput | Order + Payments | F02-F05 |
| POST /api/orders/:id/refund | Refund order | manager | amount, reason | Refund | F08 |
| GET /api/customers | List customers | authed | q, tier, page | Customer[] | F13 |
| POST /api/customers | Create customer | authed | CustomerInput | Customer | F13 |
| GET /api/shifts | List shifts | authed | date, location | Shift[] | F11 |
| POST /api/shifts/open | Open shift | authed | location, register, cash | Shift | F11 |
| POST /api/shifts/:id/close | Close shift | authed | closing_cash | Shift | F11 |
| GET /api/held-orders | List held orders | authed | - | HeldOrder[] | F06, F07 |
| POST /api/held-orders | Hold order | authed | HeldOrderInput | HeldOrder | F06 |
| DELETE /api/held-orders/:id | Void held order | manager | - | void | F07 |
| GET /api/reports/sales | Sales report data | authed | date, location, groupBy | ReportData | F10 |
| GET /api/reports/shifts | Shift report data | authed | date, location | ReportData | F11 |
| GET /api/reports/products | Product report data | authed | date, location | ReportData | F10 |
| GET /api/reports/staff | Staff report data | authed | date, location | ReportData | F10 |
| GET /api/receipts/:id | Get receipt | authed | - | Receipt | F08 |
| POST /api/webhooks/stripe | Stripe webhook handler | Stripe | event | 200 | F02-F05 |
| POST /api/webhooks/stripe-terminal | Terminal webhook | Stripe | event | 200 | F02-F05 |

Webhooks in: Stripe (payment_intent, terminal.reader), Supabase (realtime)
Webhooks out: None (use polling or SSE for now)
Jobs:
- daily-sales-snapshot: 0 1 * * *, aggregate daily sales per location
- low-stock-check: 0 */6 * * *, check stock vs threshold, notify
- shift-reminder: 0 22 * * *, remind open shifts to close
- sync-offline-queue: */5 * * * *, process offline queue (if implemented)

## The parts that bite

- **time zones**: All timestamps stored as UTC (timestamptz). Display in location's timezone. Use `date-fns-tz` for conversions. Shift open/close must use location timezone.
- **idempotency**: Stripe webhooks can arrive twice. Use `idempotency_key` on order creation. Store `stripe_payment_intent_id` on Payment to dedupe.
- **races**: Concurrent inventory adjustments on same product → use `SELECT FOR UPDATE` or optimistic locking with `version` column. Concurrent shift close → RLS + unique constraint on (register, status='open').
- **offline POS**: IndexedDB queue for orders. Background sync when online. Conflict resolution: last-write-wins for cart, server-wins for inventory.
- **multi-location**: Every query scoped to `location_id` from session. RLS enforces. Users can switch location → update session cookie.
- **currency**: Store all money as integer cents + currency column. Display with `Intl.NumberFormat`. Exchange rates not needed (single currency per org/location).
- **hardware**: Web Serial/HID for printer, scanner, cash drawer. Fallback to print-to-PDF for receipts. Hardware config stored per Register.

## Build order

1. **Vertical slice** (S01, S08, S17): Login → POS → Open/Close shift. Tables: users, locations, registers, products, orders, payments, shifts. Routes: auth, orders, shifts.
2. **Must-haves** (S02, S03, S04, S05, S06, S07, S09, S10, S11, S12, S15, S16, S17, S18, S19, S20, S21, S22, S23, S24, S35): Dashboard, Reports, Inventory, Customers, Employees, Shifts, Receipts, Settings, Tickets.
3. **Should-haves** (S26, S27, S28, S29, S30, S31, S32): Hardware setup, Org settings, User management, Multi-location.
4. **Fixes from replica-entrepreneur**: (after replica-diff and reviews)

Currency selection: Added to Store Settings (S21) → General tab → Currency dropdown. Persisted per Location. Default from Organization.