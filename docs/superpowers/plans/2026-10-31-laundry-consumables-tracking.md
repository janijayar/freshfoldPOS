# Laundry Consumables Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a per-service consumables auto-deduction system with configurable rules, low-stock alerts, and refill tracking for 5 laundry consumables (detergent, regular fabcon, imported fabcon, plastics, gasul).

**Architecture:** Consumption Rules Engine (Approach A) — explicit `ConsumptionRule` table mapping serviceType × machineType × hasImportedFabcon to per-item amounts. Auto-deduction triggers on POS order completion via `InventoryAdjustment`. Low-stock checks create in-app `Notification` records. Settings UI at `/settings/consumables` for owner/manager configuration.

**Tech Stack:** Next.js 14 App Router, Drizzle ORM, Neon PostgreSQL, Radix UI, TanStack Query, Zustand, Tailwind CSS

**Spec:** This plan implements the design discussed in the brainstorming session (no separate spec file; this plan is the source of truth).

## Global Constraints

- TypeScript strict — no `any`, explicit return types on public APIs
- Components — compound patterns, `forwardRef`, Radix primitives
- API — Zod schemas → inferred types, REST + OpenAPI
- Errors — `Result<T, E>` pattern, no throwing in business logic
- Commits — Conventional Commits (`feat:`, `fix:`, `chore:`)
- Per-location isolation via `orgId` / `locationId` on all multi-tenant tables
- Follow existing patterns in `src/lib/db/schema/`, `src/app/api/`, `src/app/(dashboard)/settings/`

## Review Focus

1. **Substitution logic** — When cart contains imported fabcon item, regular fabcon deduction = 0, imported = 40mL. Test: order with imported fabcon add-on deducts only imported.
2. **Machine-type gas estimate** — LG Giant vs LG Titan different gas/kg per service. Test: same service on different machines deducts different gas.
3. **Service-type consumption** — Extra Dry (10min) uses less gas than Regular (40min). Test: Extra Dry gas ≈ 25% of Regular.
4. **Per-location thresholds** — Thresholds scoped to locationId; low-stock notification only fires for that location. Test: location A below threshold → alert for A only.
5. **Concurrent deductions** — Two orders completing simultaneously don't cause negative inventory. Test: simulate parallel order completion.

---

### Task 1: Database Schema & Migrations

**Files:**
- Create: `src/lib/db/schema/consumables.ts`
- Modify: `src/lib/db/schema/index.ts` (export new tables)
- Create: `drizzle/migrations/000X_consumables.sql` (auto-generated)

**Interfaces:**
- Produces: `consumptionRule`, `consumableThreshold` table definitions with Drizzle types

- [ ] **Step 1: Write failing test for schema**

```typescript
// tests/db/consumables.test.ts
import { consumptionRule, consumableThreshold } from '@/lib/db/schema/consumables'
import { db } from '@/lib/db'

test('consumptionRule table has correct columns', () => {
  const cols = Object.keys(consumptionRule)
  expect(cols).toEqual(expect.arrayContaining([
    'id', 'locationId', 'serviceType', 'machineType', 'hasImportedFabcon',
    'detergentMl', 'regularFabconMl', 'importedFabconMl', 'plasticsCount', 'gasKg',
    'createdAt', 'updatedAt'
  ]))
})

test('consumableThreshold table has correct columns', () => {
  const cols = Object.keys(consumableThreshold)
  expect(cols).toEqual(expect.arrayContaining([
    'id', 'locationId', 'consumableType', 'minimumQty', 'unit',
    'createdAt', 'updatedAt'
  ]))
})
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm test tests/db/consumables.test.ts` — Expected: FAIL (tables not exist)

- [ ] **Step 3: Implement schema in `src/lib/db/schema/consumables.ts`**

```typescript
import { pgTable, uuid, varchar, integer, boolean, numeric, timestamp, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core'
import { locations } from './locations'
import { createId } from '@paralleldrive/cuid2'

export const serviceTypeEnum = pgEnum('service_type', [
  'REGULAR', 'DELUXE', 'EXTRA_DRY', 'EXTRA_WASH', 'HAND_WASH'
])
export const machineTypeEnum = pgEnum('machine_type', ['LG_GIANT', 'LG_TITAN'])
export const consumableTypeEnum = pgEnum('consumable_type', [
  'DETERGENT', 'REGULAR_FABCON', 'IMPORTED_FABCON', 'PLASTICS', 'GASUL'
])

export const consumptionRule = pgTable('consumption_rule', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
  serviceType: serviceTypeEnum('service_type').notNull(),
  machineType: machineTypeEnum('machine_type').notNull(),
  hasImportedFabcon: boolean('has_imported_fabcon').notNull().default(false),
  detergentMl: integer('detergent_ml').notNull().default(80),
  regularFabconMl: integer('regular_fabcon_ml').notNull().default(80),
  importedFabconMl: integer('imported_fabcon_ml').notNull().default(40),
  plasticsCount: integer('plastics_count').notNull().default(1),
  gasKg: numeric('gas_kg', { precision: 6, scale: 3 }).notNull().default('0.15'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('consumption_rule_unique').on(t.locationId, t.serviceType, t.machineType, t.hasImportedFabcon),
}))

export const consumableThreshold = pgTable('consumable_threshold', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
  consumableType: consumableTypeEnum('consumable_type').notNull(),
  minimumQty: integer('minimum_qty').notNull(),
  unit: varchar('unit', { length: 10 }).notNull(), // 'ml', 'kg', 'pcs'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('consumable_threshold_unique').on(t.locationId, t.consumableType),
}))
```

- [ ] **Step 4: Run migration & test**
Run: `pnpm db:generate && pnpm db:push && pnpm test tests/db/consumables.test.ts` — Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/lib/db/schema/consumables.ts src/lib/db/schema/index.ts drizzle/migrations/
git commit -m "feat: add consumptionRule and consumableThreshold tables"
```

---

### Task 2: Seed Default Rules & Thresholds

**Files:**
- Modify: `src/lib/db/seed.ts`

**Interfaces:**
- Consumes: `consumptionRule`, `consumableThreshold` from Task 1
- Produces: Seeded default data for all locations

- [ ] **Step 1: Write failing test**

```typescript
// tests/db/seed-consumables.test.ts
import { seedConsumablesDefaults } from '@/lib/db/seed'
import { db } from '@/lib/db'
import { consumptionRule, consumableThreshold } from '@/lib/db/schema/consumables'

test('seeds 20 consumption rules per location (5 services × 2 machines × 2 fabcon states)', async () => {
  await seedConsumablesDefaults()
  const rules = await db.select().from(consumptionRule)
  expect(rules.length).toBeGreaterThanOrEqual(20)
})

test('seeds 5 thresholds per location', async () => {
  const thresholds = await db.select().from(consumableThreshold)
  expect(thresholds.length).toBeGreaterThanOrEqual(5)
})
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement `seedConsumablesDefaults()` in `src/lib/db/seed.ts`**

Defaults per the design doc table (gas: Giant 0.15/0.04, Titan 0.20/0.05 for Extra Dry). Thresholds: detergent 5000ml, regularFabcon 5000ml, importedFabcon 2000ml, plastics 100pcs, gasul 5kg. Upsert on unique indexes.

- [ ] **Step 4: Run test & seed**
Run: `pnpm db:seed && pnpm test tests/db/seed-consumables.test.ts` — Expected: PASS

- [ ] **Step 5: Commit**

---

### Task 3: Consumption Service (Core Logic)

**Files:**
- Create: `src/lib/services/consumption.ts`
- Create: `tests/lib/services/consumption.test.ts`

**Interfaces:**
- Consumes: `consumptionRule`, `consumableThreshold`, `inventory`, `inventoryAdjustment` schemas
- Produces: `deductConsumablesForOrder(orderId: string): Promise<Result<void, Error>>`

- [ ] **Step 1: Write failing tests**

```typescript
// Key test cases:
// 1. Regular wash + Giant + no imported fabcon → deducts 80/80/0/1/0.15
// 2. Regular wash + Titan + imported fabcon → deducts 80/0/40/1/0.20
// 3. Extra Dry + Giant → gas 0.04 (not 0.15)
// 4. Hand wash → gas 0
// 5. Missing rule → returns Error (not throw)
// 6. Inventory goes below threshold → creates Notification
// 7. Concurrent deduction — uses DB transaction with row locks
```

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement `deductConsumablesForOrder` in `src/lib/services/consumption.ts`**

Algorithm:
1. Load order with line items, locationId, machineType, serviceType
2. Detect `hasImportedFabcon`: any line item with product.category === 'imported_fabcon'
3. Lookup rule: `locationId + serviceType + machineType + hasImportedFabcon`
4. For each consumable (5 types), compute deduction qty
5. In transaction: for each consumable product, decrement `inventory.qty`, create `InventoryAdjustment` (reason: `SERVICE_CONSUMPTION`, refOrderId)
6. After deduction, check `consumableThreshold` → if `inventory.qty < minimumQty`, create `Notification` (type: `LOW_STOCK`, payload: { consumableType, currentQty, threshold })
7. Return Result

- [ ] **Step 4: Run tests to verify pass**

- [ ] **Step 5: Commit**

---

### Task 4: POS Integration — Machine Selector & Service Type

**Files:**
- Modify: `src/app/(pos)/pos/components/Cart.tsx` (add machine radio group)
- Modify: `src/app/(pos)/pos/components/Cart.tsx` (derive serviceType from line items or add selector)
- Modify: `src/app/api/pos/orders/route.ts` (persist machineType, serviceType on order)
- Modify: `src/lib/db/schema/orders.ts` (add machineType, serviceType columns)

**Interfaces:**
- Consumes: Order schema, Cart context
- Produces: Order with `machineType`, `serviceType` persisted

- [ ] **Step 1: Write failing test** — Order creation requires machineType

- [ ] **Step 2: Add `machineType` and `serviceType` to Order schema & API**

- [ ] **Step 3: Add Machine Selector (LG Giant / LG Titan) to Cart UI** — required before checkout

- [ ] **Step 4: Derive `serviceType` from line items** (map product → serviceType) or add explicit selector

- [ ] **Step 5: Run POS flow test** — create order, verify machineType/serviceType saved

- [ ] **Step 6: Commit**

---

### Task 5: Auto-Deduction on Order Completion

**Files:**
- Modify: `src/app/api/pos/orders/[id]/complete/route.ts` (call consumption service)
- Modify: `src/app/api/pos/orders/[id]/complete/route.ts` (transaction boundary)

**Interfaces:**
- Consumes: `deductConsumablesForOrder` from Task 3
- Produces: Completed order with consumables deducted

- [ ] **Step 1: Write failing test** — POST /complete triggers deduction, creates adjustments

- [ ] **Step 2: Integrate `deductConsumablesForOrder` into complete endpoint**

- [ ] **Step 3: Run integration test** — full POS order → complete → verify inventory decremented

- [ ] **Step 4: Commit**

---

### Task 6: Settings UI — Consumption Rules

**Files:**
- Create: `src/app/(dashboard)/settings/consumables/page.tsx`
- Create: `src/app/(dashboard)/settings/consumables/components/RulesTable.tsx`
- Create: `src/app/api/consumables/rules/route.ts` (GET, POST)
- Modify: `src/lib/permissions.ts` (add consumables settings permission if needed)

**Interfaces:**
- Consumes: `consumptionRule` schema, API routes
- Produces: CRUD UI for rules (table with inline edit, add row, delete)

- [ ] **Step 1: Write failing test** — API returns rules for location

- [ ] **Step 2: Implement API routes** (GET list, POST upsert with validation)

- [ ] **Step 3: Build RulesTable component** — columns: serviceType, machineType, hasImportedFabcon, detergentMl, regularFabconMl, importedFabconMl, plasticsCount, gasKg; editable cells; add/delete buttons

- [ ] **Step 4: Build page layout** — tabs: "Consumption Rules" | "Low-Stock Thresholds"

- [ ] **Step 5: Test UI** — create/edit/delete rules, verify DB updates

- [ ] **Step 6: Commit**

---

### Task 7: Settings UI — Low-Stock Thresholds

**Files:**
- Create: `src/app/(dashboard)/settings/consumables/components/ThresholdsTable.tsx`
- Create: `src/app/api/consumables/thresholds/route.ts` (GET, POST)

**Interfaces:**
- Consumes: `consumableThreshold` schema
- Produces: CRUD UI for thresholds (consumableType, minimumQty, unit)

- [ ] **Step 1: Write failing test** — API returns thresholds for location

- [ ] **Step 2: Implement API routes**

- [ ] **Step 3: Build ThresholdsTable component** — editable rows per consumable

- [ ] **Step 4: Integrate into Consumables page tabs**

- [ ] **Step 5: Test** — set threshold, trigger low stock, verify notification

- [ ] **Step 6: Commit**

---

### Task 8: In-App Low-Stock Notifications

**Files:**
- Modify: `src/lib/db/schema/notifications.ts` (add LOW_STOCK type if not exists)
- Modify: `src/components/layout/Header.tsx` (notification bell + dropdown)
- Create: `src/app/api/notifications/route.ts` (GET with filters)
- Create: `src/app/(dashboard)/notifications/page.tsx` (if not exists)

**Interfaces:**
- Consumes: `Notification` schema, consumption service creates notifications
- Produces: Bell icon with count, dropdown list, notifications page

- [ ] **Step 1: Write failing test** — Notification created when inventory < threshold

- [ ] **Step 2: Ensure LOW_STOCK notification type exists**

- [ ] **Step 3: Add bell icon + dropdown to Header** (shows unread count, click → list)

- [ ] **Step 4: Build notifications list page** (mark read, filter by type)

- [ ] **Step 5: Test** — deplete inventory via order → notification appears

- [ ] **Step 6: Commit**

---

### Task 9: Supplies Calendar — Consumable Type Filter (Optional)

**Files:**
- Modify: `src/app/(dashboard)/inventory/supplies/calendar/page.tsx`
- Modify: `src/app/api/inventory/supplies/route.ts` (add filter)

**Interfaces:**
- Consumes: Supplies calendar API
- Produces: Filter by consumableType on calendar (refills vs consumption)

- [ ] **Step 1: Add `type` filter to calendar API** (REFILL | CONSUMPTION)

- [ ] **Step 2: Add filter dropdown to calendar UI**

- [ ] **Step 3: Test** — view refills and consumption events separately

- [ ] **Step 4: Commit**

---

### Task 10: End-to-End Integration Test

**Files:**
- Create: `tests/e2e/consumables-flow.test.ts` (Playwright)

**Interfaces:**
- Consumes: All previous tasks
- Produces: Verified full flow

- [ ] **Step 1: Write Playwright test**
  - Login as manager
  - Go to Settings → Consumables, verify defaults loaded
  - Go to POS, create order: Regular wash + Giant, no imported fabcon
  - Complete order
  - Verify inventory deducted: detergent -80, fabcon -80, plastics -1, gas -0.15
  - Create order: Deluxe + Titan + imported fabcon add-on
  - Complete order
  - Verify: detergent -80, regularFabcon 0, importedFabcon -40, plastics -1, gas -0.20
  - Set detergent threshold to 10000, create orders until below
  - Verify low-stock notification appears in Header bell

- [ ] **Step 2: Run test** — Expected: PASS

- [ ] **Step 3: Commit**

---

## Execution Approach

This plan has **10 tightly coupled tasks** sharing database schemas and service interfaces. A mistake in Task 1-3 cascades to all later tasks.

**Recommended: Subagent-driven** — Fresh subagent per task with reviewer gate ensures schema/service contracts are solid before UI builds on them. Costs more tokens but prevents whole-feature rewrites.

If you prefer **Native**, I'll execute sequentially with frequent verification (run tests after each task, `pnpm build` after Task 3, 5, 8).

**Which approach?**