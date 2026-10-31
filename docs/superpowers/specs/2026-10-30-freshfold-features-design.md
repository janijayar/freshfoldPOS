# FreshFold POS - Feature Implementation Design

## Intent and Why

Transform FreshFold from a generic POS into a laundry-shop-first platform with:
- **Data management**: Admin toggle between demo/live modes, import from other POS systems
- **Philippines localization**: PHP currency as default, local business workflows
- **Laundry-specific features**: Wash cycles, garment tracking, pickup/delivery scheduling
- **Operational tools**: Gasul (LPG) tracker for laundry shop operations
- **Production readiness**: Receipts, Stripe Terminal, audit logs

## Goals

1. **Organization Settings Enhancement**
   - Add PHP currency as default option
   - Add "Data Management" tab with demo/live toggle, erase demo data, POS import
   - Persist settings to database (not mock data)

2. **Laundry Domain Models** (new tables)
   - Wash cycles (wash, rinse, spin, dry programs)
   - Garment types with care instructions
   - Pickup/delivery schedules and routes
   - Customer preferences (detergent, softener, fold style, etc.)

3. **Gasul Tracker** (new tables)
   - Tank inventory (sizes: 11kg, 22kg, 50kg)
   - Refill history with costs
   - Usage tracking per shift/day
   - Low-level alerts

3. **Receipt Generation**
   - Auto-generate on order completion
   - Thermal printer format (58mm/80mm)
   - Reprint capability

4. **Stripe Terminal Integration**
   - Card reader support on POS
   - Payment intent flow

5. **Audit Log Middleware**
   - Log all mutating API operations
   - User, action, entity, before/after state

## Non-Goals

- Full accounting/ledger system
- Multi-currency support (PHP only for now)
- Advanced route optimization for pickup/delivery
- Hardware-specific drivers (use Web Serial/HID APIs)

## Constraints

- Must maintain multi-tenant isolation via organizationId
- Role-based permissions (cashier cannot access admin features)
- Offline-first POS architecture
- Existing API patterns must be followed

## Approaches Considered

### Data Management Tab

**Option A: Separate API routes for each operation** (chosen)
- `/api/organizations/data-mode` - toggle demo/live
- `/api/organizations/erase-demo` - erase demo data
- `/api/import` - generic import handler
- Clear separation, easy to test and permission

**Option B: Single settings PATCH with action field**
- More RESTful but mixes concerns
- Harder to validate different payloads

### Laundry Features Schema

**Option A: Extend existing products table with JSON attributes** (chosen for v1)
- Use `products.attributes` JSONB for laundry-specific fields
- Faster to implement, flexible
- Can normalize later if needed

**Option B: New normalized tables**
- Cleaner long-term but more migration work
- Better for complex queries

### Gasul Tracker

**Option A: New tables (gasul_tanks, gasul_refills, gasul_usage)**
- Proper relational model
- Good for reporting and alerts

**Option B: Extend inventory with type='gasul'**
- Simpler but mixes concerns

## Design Decisions

1. **Currency**: Add PHP to currency selector, default to PHP in seed, update `formatCurrency` default
2. **Data Management**: New tab in organization settings with three sections
3. **Laundry**: Use product attributes JSONB + new `laundry_orders` table for workflow
4. **Gasul**: New tables for proper tracking
5. **Receipts**: Extend orders API to auto-create receipt on completion
6. **Stripe Terminal**: New `/api/pos/payment-intent` endpoint
7. **Audit Logs**: New `audit_logs` table + middleware wrapper

## Database Schema Changes

### New Tables

```sql
-- Gasul Tracker
gasul_tanks (id, organizationId, locationId, sizeKg, currentLevelKg, status, lastRefillAt, createdAt)
gasul_refills (id, organizationId, locationId, tankId, kgRefilled, cost, supplier, refilledAt, userId)
gasul_usage (id, organizationId, locationId, tankId, kgUsed, shiftId, orderId, recordedAt, userId)

-- Laundry Orders (extends orders for laundry workflow)
laundry_orders (id, orderId, customerId, status, washCycleId, garmentTypeId, pickupScheduleId, deliveryScheduleId, preferences, specialInstructions, estimatedReadyAt, actualReadyAt, createdAt, updatedAt)

-- Laundry Reference Data
wash_cycles (id, organizationId, name, description, durationMinutes, temperatureC, steps, priceModifier, isActive)
garment_types (id, organizationId, name, category, careInstructions, defaultWashCycleId, pricePerKg, isActive)
pickup_schedules (id, organizationId, locationId, customerId, address, latitude, longitude, scheduledAt, windowStart, windowEnd, status, notes, createdAt)
delivery_schedules (id, organizationId, locationId, customerId, address, latitude, longitude, scheduledAt, windowStart, windowEnd, status, notes, createdAt)

-- Customer Preferences (laundry-specific)
customer_laundry_preferences (id, customerId, preferredDetergent, preferredSoftener, foldStyle, hangDry, specialInstructions, updatedAt)

-- Audit Logs
audit_logs (id, organizationId, userId, action, entityType, entityId, oldValues, newValues, ipAddress, userAgent, createdAt)

-- Import Jobs
import_jobs (id, organizationId, type, status, fileName, totalRecords, processedRecords, failedRecords, errors, createdAt, completedAt)
```

### Modified Tables

- `organizations`: Add `dataMode` (demo|live), `demoDataErasedAt`
- `products`: Ensure `attributes` JSONB supports laundry fields

## API Routes to Create/Modify

### New Routes
- `GET/PATCH /api/organizations` - Get/update organization settings
- `POST /api/organizations/data-mode` - Toggle demo/live
- `POST /api/organizations/erase-demo` - Erase demo data
- `POST /api/import` - Handle POS imports (customers, sales, transactions)
- `GET/POST /api/laundry/wash-cycles` - Wash cycle CRUD
- `GET/POST /api/laundry/garment-types` - Garment type CRUD
- `GET/POST /api/laundry/pickup-schedules` - Pickup schedule CRUD
- `GET/POST /api/laundry/delivery-schedules` - Delivery schedule CRUD
- `GET/POST /api/laundry/preferences` - Customer laundry preferences
- `GET/POST /api/gasul/tanks` - Gasul tank CRUD
- `GET/POST /api/gasul/refills` - Gasul refill CRUD
- `GET/POST /api/gasul/usage` - Gasul usage tracking
- `POST /api/pos/payment-intent` - Stripe Terminal payment intent
- `GET /api/receipts/[id]/print` - Receipt printing endpoint

### Modified Routes
- `POST /api/orders` - Auto-create receipt on completion
- All mutating routes - Add audit log middleware

## UI Components to Create/Modify

### Settings Page
- Add "Data Management" tab
- Add PHP to currency selector (make default)
- Connect to real API (replace mockOrg)

### New Pages
- `/settings/data-management` - Data management tab content
- `/laundry/wash-cycles` - Wash cycle management
- `/laundry/garment-types` - Garment type management
- `/laundry/pickup-delivery` - Schedule management
- `/gasul` - Gasul tracker dashboard
- `/receipts/[id]` - Receipt view/print

### POS Enhancements
- Stripe Terminal payment button
- Laundry order flow (select wash cycle, garment type, schedule pickup/delivery)
- Receipt printing button

## Implementation Order (Lean Build Slices)

### Slice 1: Organization Settings & PHP Currency (Stop: Settings persist to DB)
- Create `/api/organizations` GET/PATCH
- Update settings page to use real API
- Add PHP to currency selector, default to PHP
- Update `formatCurrency` default to PHP
- Update seed to use PHP

### Slice 2: Data Management Tab (Stop: Demo/live toggle works, erase demo works)
- Add Data Management tab to settings
- Create `/api/organizations/data-mode` POST
- Create `/api/organizations/erase-demo` POST
- Add import UI and `/api/import` POST

### Slice 3: Laundry Domain Models (Stop: Can create wash cycles, garment types, schedules)
- Add new tables to schema
- Create API routes for wash cycles, garment types, schedules
- Create management pages
- Extend POS with laundry order flow

### Slice 4: Gasul Tracker (Stop: Can track tanks, refills, usage, get alerts)
- Add gasul tables to schema
- Create API routes
- Create dashboard page with alerts

### Slice 5: Receipts & Stripe Terminal (Stop: Receipts auto-generate, card payments work on POS)
- Extend orders API to create receipt
- Create receipt print endpoint
- Add Stripe Terminal integration

### Slice 6: Audit Logs (Stop: All mutating APIs log to audit_logs)
- Add audit_logs table
- Create middleware
- Apply to all mutating routes

## What's Left to Builder

- Exact UI styling (use existing component library)
- Import field mapping UI (CSV column mapping)
- Stripe Terminal hardware testing (requires physical reader)
- Gasul alert notification channels (email/push)
- Laundry workflow edge cases (partial orders, re-wash, etc.)