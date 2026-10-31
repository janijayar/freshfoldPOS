# freshfold POS — Recon Map

Generated from features.csv and codebase analysis.

---

## Screen Inventory

| ID | Screen | Route | Purpose | Key Components | States Seen |
|---|---|---|---|---|---|
| S01 | Login | /login | Email/password auth | Email input, password input, sign in button, demo creds | loading, error (invalid creds), empty, 390px/1440px, keyboard |
| S02 | Dashboard | /dashboard | Overview stats, recent orders, top products, low stock | Stat cards, tables, charts, refresh buttons | loading skeletons, error, empty, 390px/1440px, keyboard |
| S03 | Sales Reports | /reports/sales | Sales by period/category/product/staff | Date picker, filters, tabbed views, sortable tables, export | loading skeletons, error, empty, 390px/1440px, keyboard |
| S04 | Shift Reports | /reports/shifts | Shift summaries, cash reconciliation | Date picker, filters, tabbed views, stat cards, tables | loading skeletons, error, empty, 390px/1440px, keyboard |
| S05 | Product Reports | /reports/products | Product performance, low stock, margins | Date picker, filters, tabbed views, sortable tables, export | loading skeletons, error, empty, 390px/1440px, keyboard |
| S06 | Staff Reports | /reports/staff | Staff sales, hours, performance | Date picker, filters, tabbed views, sortable tables, export | loading skeletons, error, empty, 390px/1440px, keyboard |
| S07 | Receipt Detail | /receipts/[id] | Receipt header, line items, payments, discounts, taxes | Receipt header, line items table, payment breakdown | loading skeleton, error (not found), empty, 390px/1440px, keyboard |
| S08 | POS Terminal | /pos | Product grid, cart, payment, customer, discount, hold | Product grid, cart panel, payment dialog, customer dialog, hold dialog | loading skeleton, error (network/server), offline, empty cart/products, 390px/1440px, keyboard |
| S09 | Product List | /inventory | Product catalog with search, filter, sort | Search, category filter, table, pagination, sort | loading skeleton, error, empty, 390px/1440px, keyboard |
| S10 | Product Detail | /inventory/[id] | Product CRUD, variants, pricing | Tabs (details/inventory/sales), form fields, variant table | loading skeleton, error (not found), 390px/1440px, keyboard |
| S11 | Product Create/Edit | /inventory/new or /inventory/[id]/edit | Product form with images, categories, variants | Tabs (basic/pricing/advanced), type switch, margin calc | loading skeleton, error, form validation, 390px/1440px, keyboard |
| S12 | Inventory Adjustments | /inventory/adjustments | Stock count, transfers, adjustments | Filter by type/location, pagination, sort, create/edit dialog | loading skeleton, error, empty, 390px/1440px, keyboard |
| S15 | Employee List | /employees | Staff directory, roles, permissions | Search, filters, table, pagination, dropdown actions | loading skeleton, error, empty, 390px/1440px, keyboard |
| S16 | Employee Shifts | /employees/shifts | Schedule, time clock, payroll | Date picker, filters, tabbed views (list/calendar), table | loading skeleton, error, empty, 390px/1440px, keyboard |
| S17 | Shifts | /shifts | Shift list, open/close, cash reconciliation | Table, open/close buttons, cash reconciliation form | loading skeleton, error, empty, 390px/1440px, keyboard |
| S18 | Customer List | /customers | Customer directory with loyalty tiers | Search, filters, table, pagination, dropdown actions | loading skeleton, error, empty, 390px/1440px, keyboard |
| S19 | Customer Detail | /customers/[id] | Customer history, loyalty, spending | Tabs (overview/orders/loyalty), contact info, notes | loading skeleton, error (not found), 390px/1440px, keyboard |
| S20 | Customer Loyalty | /customers/loyalty | Points, tiers, rewards | Tier distribution, progress bars, tier filter | loading skeleton, error, empty, 390px/1440px, keyboard |
| S21 | Store Settings | /settings/store | Location, currency, tax, receipt | Tabs (general/localization/receipt/hours), form, currency selector, receipt preview | loading skeleton, error, 390px/1440px, keyboard |
| S22 | Register Settings | /settings/registers | Hardware, receipt printer, cash drawer | Device table, status badges, test print/open, add device form | loading skeleton, error, empty, 390px/1440px, keyboard |
| S23 | Payment Settings | /settings/payments | Stripe Terminal, payment methods | Tabs (providers/methods/security), Stripe keys, method toggles | loading skeleton, error, 390px/1440px, keyboard |
| S24 | Tax Settings | /settings/tax | Tax rates, groups, exemptions | Tabs (rates/groups/settings), rate table, calculation example | loading skeleton, error, empty, 390px/1440px, keyboard |
| S26 | Printer Setup | /settings/hardware/printer | Receipt printer pairing, test print | Pairing flow, test print button | loading, error, empty, 390px/1440px, keyboard |
| S27 | Scanner Setup | /settings/hardware/scanner | Barcode scanner pairing | Pairing flow | loading, error, empty, 390px/1440px, keyboard |
| S28 | Cash Drawer | /settings/hardware/cash-drawer | Cash drawer trigger, test | Trigger button, test open | loading, error, empty, 390px/1440px, keyboard |
| S29 | Organization Settings | /settings/org | Org details, billing, subscription | Tabs (general/billing/security/notifications), form | loading skeleton, error, 390px/1440px, keyboard |
| S30 | User Management | /settings/users | Invite, roles, SSO, audit logs | Tabs (users/roles/audit), invite/edit dialogs, role matrix | loading skeleton, error, 390px/1440px, keyboard |
| S31 | Multi-Location List | /locations | Location directory, switching | Location table, default badge, active toggle, stats, actions | loading skeleton, error, empty, 390px/1440px, keyboard |
| S32 | Multi-Location Reports | /reports/multi-location | Consolidated reports across locations | Date picker, sortable table, change indicators, totals | loading skeleton, error, empty, 390px/1440px, keyboard |
| S35 | Open Tickets | /tickets | Ticket management (on hold orders) | Hold/recall/void actions, ticket list | loading skeleton, error, empty, 390px/1440px, keyboard |

---

## User Flows

| Flow | Goal | Screens | Steps |
|---|---|---|---|
| F01 | Staff login | S01 | Enter email/password → Submit → Redirect to dashboard |
| F02 | POS - Cash sale | S08 | Add products → Pay → Cash → Enter amount → Charge |
| F03 | POS - Card sale | S08 | Add products → Pay → Card → Charge |
| F04 | POS - Split payment | S08 | Add products → Pay → Split → Cash amount → Card → Charge |
| F05 | POS - Discount | S08 | Add product → Discount % → Pay → Cash → Charge |
| F06 | POS - Hold/Recall | S08, S35 | Add products → Hold → Name order → Recall from tickets |
| F07 | POS - Void ticket | S08, S35 | Add product → Hold → Go to tickets → Void → Confirm |
| F08 | View receipt | S07 | Complete sale → Go to receipts → View receipt |
| F09 | Print receipt | S07 | View receipt → Print |
| F10 | Sales report | S03 | Navigate → Select date range → Filter → View/export |
| F11 | Shift management | S17 | Open shift → Process sales → Close shift → Reconcile cash |
| F12 | Inventory management | S09, S10, S11, S12 | List → View detail → Create/edit → Adjust stock |
| F13 | Customer management | S18, S19, S20 | List → View detail → View loyalty |
| F14 | Employee management | S15, S16 | List → Schedule shifts → Time clock |
| F15 | Settings configuration | S21-S24, S26-S28 | Store → Register → Payment → Tax → Hardware |
| F16 | Multi-location | S31, S32 | List locations → Switch → View consolidated reports |
| F17 | Organization admin | S29, S30 | Org settings → User management |

---

## Components

| Component | Variants | States | Screens |
|---|---|---|---|
| Button | primary, secondary, outline, ghost, danger | default, hover, active, focus, disabled, loading | All |
| Input | text, email, password, number, search | default, focus, error, disabled | S01, S08, S09, S11, S21-S24 |
| Select | single | default, open, focus, disabled | S08, S09, S21-S24 |
| Dialog | default, alert, form | open, closed, loading | S08, S11, S21-S24, S35 |
| Table | default, sortable, selectable | loading, empty, error | S02, S03-S06, S09, S15, S17, S18, S31, S32 |
| Card | default, stat, product | default, hover, loading | S02, S08, S09, S10 |
| Badge | default, success, warning, danger, secondary | default | S08, S09, S17, S18, S31 |
| Tabs | default | default, active, disabled | S10, S11, S19, S21, S23, S24, S29, S30 |
| DropdownMenu | default | open, closed | S15, S18, S31 |
| Toast | success, error, warning, info | visible, hidden | All |
| Skeleton | card, table, list, stat | loading | All |
| EmptyState | default, illustration | empty | S02, S08, S09, S17, S18, S31 |
| ErrorState | network, server, not-found | error | All |
| Avatar | default, fallback | default | S08, S18, S19 |
| TabularNums | default | default | S02, S03-S06, S08, S17 |
| CurrencyDisplay | default | default | All |

---

## Inferred Data Model

### Organization
- id (uuid)
- name (string)
- slug (string)
- currency (string, default 'USD')
- timezone (string)
- created_at, updated_at

### Location
- id (uuid)
- organization_id (fk)
- name (string)
- address (jsonb)
- phone (string)
- email (string)
- is_default (boolean)
- currency (string, override)
- timezone (string)
- created_at, updated_at

### Register
- id (uuid)
- location_id (fk)
- name (string)
- device_id (string, unique)
- hardware_config (jsonb)
- is_active (boolean)
- created_at, updated_at

### User / Staff
- id (uuid)
- organization_id (fk)
- email (string, unique)
- password_hash (string)
- first_name, last_name (string)
- role (enum: owner, manager, cashier, admin)
- location_id (fk, nullable)
- is_active (boolean)
- avatar_url (string, nullable)
- created_at, updated_at

### Product
- id (uuid)
- organization_id (fk)
- name (string)
- sku (string)
- category (string)
- price_cents (integer)
- cost_cents (integer)
- type (enum: product, gift_card)
- track_inventory (boolean)
- stock (integer)
- low_stock_threshold (integer)
- barcode (string)
- image_url (string, nullable)
- popular (boolean)
- created_at, updated_at

### ProductVariant
- id (uuid)
- product_id (fk)
- name (string)
- sku (string)
- price_cents (integer)
- stock (integer)
- barcode (string)

### InventoryAdjustment
- id (uuid)
- location_id (fk)
- product_id (fk)
- variant_id (fk, nullable)
- type (enum: count, transfer, adjustment, receive, damage)
- quantity_change (integer)
- reason (string)
- user_id (fk)
- created_at

### Customer
- id (uuid)
- organization_id (fk)
- first_name, last_name (string)
- email (string)
- phone (string)
- loyalty_tier (enum: bronze, silver, gold, platinum)
- loyalty_points (integer)
- marketing_consent (boolean)
- created_at, updated_at

### Order
- id (uuid)
- location_id (fk)
- register_id (fk)
- user_id (fk)
- customer_id (fk, nullable)
- subtotal_cents (integer)
- discount_cents (integer)
- tax_cents (integer)
- total_cents (integer)
- currency (string)
- status (enum: completed, refunded, pending, held, voided)
- created_at, updated_at

### OrderLineItem
- id (uuid)
- order_id (fk)
- product_id (fk)
- variant_id (fk, nullable)
- quantity (integer)
- unit_price_cents (integer)
- discount_cents (integer)
- tax_cents (integer)

### Payment
- id (uuid)
- order_id (fk)
- method (enum: cash, card, gift_card, split)
- amount_cents (integer)
- card_details (jsonb, nullable)
- cash_received_cents (integer, nullable)
- change_cents (integer, nullable)
- stripe_payment_intent_id (string, nullable)
- status (enum: pending, completed, failed, refunded)
- created_at

### Shift
- id (uuid)
- location_id (fk)
- register_id (fk)
- user_id (fk)
- opened_at
- closed_at (nullable)
- opening_cash_cents (integer)
- closing_cash_cents (integer, nullable)
- expected_cash_cents (integer, nullable)
- cash_difference_cents (integer, nullable)
- status (enum: open, closed, reconciled)
- created_at, updated_at

### HeldOrder
- id (uuid)
- location_id (fk)
- register_id (fk)
- name (string)
- customer_id (fk, nullable)
- cart_items (jsonb)
- subtotal_cents (integer)
- discount_cents (integer)
- tax_cents (integer)
- total_cents (integer)
- created_at, updated_at

### Receipt
- id (uuid)
- order_id (fk)
- receipt_number (string)
- content (jsonb)
- printed_at (nullable)
- created_at

---

## Feature Matrix

See features.csv for complete matrix.

Priority: must (7), should (19), could (5), skip (3 - hardware)

---

## What Cannot Be Cloned

| Feature | Reason |
|---|---|
| Hardware printer pairing | Physical device dependency |
| Hardware scanner pairing | Physical device dependency |
| Cash drawer trigger | Physical device dependency |
| Real Stripe Terminal payments | Requires Stripe account & hardware |
| Real-time multi-register sync | Requires WebSocket infrastructure |

---

## Size Estimate

- **Screens**: 31
- **Flows**: 17
- **Entities**: 14
- **Hard parts**: Real-time sync, payments, offline POS, multi-location, hardware integration
- **Estimate**: L (a quarter) for full feature parity