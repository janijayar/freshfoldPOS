import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['owner', 'admin', 'manager', 'cashier']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'completed', 'refunded', 'voided']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'card', 'gift_card', 'split']);
export const shiftStatusEnum = pgEnum('shift_status', ['open', 'closed', 'discrepancy']);
export const inventoryAdjustmentTypeEnum = pgEnum('inventory_adjustment_type', ['sale', 'return', 'adjustment', 'transfer', 'waste', 'count']);

// Organizations (multi-tenant)
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zip: varchar('zip', { length: 20 }),
  country: varchar('country', { length: 2 }).default('PH'),
  timezone: varchar('timezone', { length: 50 }).default('Asia/Manila'),
  currency: varchar('currency', { length: 3 }).default('PHP'),
  taxRate: numeric('tax_rate', { precision: 5, scale: 4 }).default('0.12'),
  settings: jsonb('settings').default({}),
  dataMode: varchar('data_mode', { length: 10 }).default('demo'), // 'demo' | 'live'
  demoDataErasedAt: timestamp('demo_data_erased_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Locations (stores)
export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zip: varchar('zip', { length: 20 }),
  country: varchar('country', { length: 2 }).default('US'),
  timezone: varchar('timezone', { length: 50 }),
  isActive: boolean('is_active').default(true).notNull(),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('locations_org_idx').on(table.organizationId),
  codeUnique: uniqueIndex('locations_code_unique').on(table.code),
}));

// Users (staff)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  role: userRoleEnum('role').default('cashier').notNull(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  phone: varchar('phone', { length: 50 }),
  isActive: boolean('is_active').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('users_org_idx').on(table.organizationId),
  emailUnique: uniqueIndex('users_email_unique').on(table.email),
}));

// Registers (POS devices)
export const registers = pgTable('registers', {
  id: uuid('id').primaryKey().defaultRandom(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  deviceId: varchar('device_id', { length: 255 }).unique(),
  isActive: boolean('is_active').default(true).notNull(),
  settings: jsonb('settings').default({}),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  locationIdx: index('registers_location_idx').on(table.locationId),
  deviceIdUnique: uniqueIndex('registers_device_id_unique').on(table.deviceId),
}));

// Categories
// @ts-ignore - self-referencing table causes TypeScript inference issues
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 500 }),
  // @ts-ignore - self-referencing table causes TypeScript inference issues
  parentId: uuid('parent_id').references(() => categories.id, { onDelete: 'set null' }),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('categories_org_idx').on(table.organizationId),
  parentIdx: index('categories_parent_idx').on(table.parentId),
}));

// Products
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  sku: varchar('sku', { length: 100 }).notNull(),
  barcode: varchar('barcode', { length: 100 }),
  type: varchar('type', { length: 20 }).default('physical').notNull(), // physical, digital, service, gift_card
  price: integer('price').notNull(), // in cents
  cost: integer('cost').default(0), // in cents
  taxRate: numeric('tax_rate', { precision: 5, scale: 4 }),
  trackInventory: boolean('track_inventory').default(true).notNull(),
  allowNegativeStock: boolean('allow_negative_stock').default(false).notNull(),
  lowStockThreshold: integer('low_stock_threshold').default(10),
  images: jsonb('images').default([]),
  attributes: jsonb('attributes').default({}),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('products_org_idx').on(table.organizationId),
  categoryIdx: index('products_category_idx').on(table.categoryId),
  skuUnique: uniqueIndex('products_sku_unique').on(table.sku),
  barcodeIdx: index('products_barcode_idx').on(table.barcode),
}));

// Product Variants
export const productVariants = pgTable('product_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  sku: varchar('sku', { length: 100 }).notNull(),
  barcode: varchar('barcode', { length: 100 }),
  price: integer('price'), // override price in cents
  cost: integer('cost'), // override cost in cents
  attributes: jsonb('attributes').default({}), // e.g., { size: 'M', color: 'red' }
  trackInventory: boolean('track_inventory').default(true).notNull(),
  lowStockThreshold: integer('low_stock_threshold').default(10),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  productIdx: index('variants_product_idx').on(table.productId),
  skuUnique: uniqueIndex('variants_sku_unique').on(table.sku),
}));

// Inventory (per location)
export const inventory = pgTable('inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').default(0).notNull(),
  reserved: integer('reserved').default(0).notNull(),
  reorderPoint: integer('reorder_point'),
  reorderQuantity: integer('reorder_quantity'),
  lastCountedAt: timestamp('last_counted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  locationIdx: index('inventory_location_idx').on(table.locationId),
  productIdx: index('inventory_product_idx').on(table.productId),
  variantIdx: index('inventory_variant_idx').on(table.variantId),
  locationProductUnique: uniqueIndex('inventory_location_product_unique').on(table.locationId, table.productId, table.variantId),
}));

// Inventory Adjustments
export const inventoryAdjustments = pgTable('inventory_adjustments', {
  id: uuid('id').primaryKey().defaultRandom(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
  type: inventoryAdjustmentTypeEnum('type').notNull(),
  quantity: integer('quantity').notNull(), // positive or negative
  previousQuantity: integer('previous_quantity').notNull(),
  newQuantity: integer('new_quantity').notNull(),
  reason: text('reason'),
  referenceId: uuid('reference_id'), // order_id, transfer_id, etc.
  referenceType: varchar('reference_type', { length: 50 }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  locationIdx: index('adjustments_location_idx').on(table.locationId),
  productIdx: index('adjustments_product_idx').on(table.productId),
  createdAtIdx: index('adjustments_created_idx').on(table.createdAt),
}));

// Customers
export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  dateOfBirth: timestamp('date_of_birth', { withTimezone: true }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zip: varchar('zip', { length: 20 }),
  country: varchar('country', { length: 2 }).default('US'),
  loyaltyTier: varchar('loyalty_tier', { length: 20 }).default('bronze'),
  loyaltyPoints: integer('loyalty_points').default(0),
  totalSpent: integer('total_spent').default(0), // in cents
  visitCount: integer('visit_count').default(0),
  lastVisitAt: timestamp('last_visit_at', { withTimezone: true }),
  acceptsMarketing: boolean('accepts_marketing').default(false),
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('customers_org_idx').on(table.organizationId),
  emailIdx: index('customers_email_idx').on(table.email),
  phoneIdx: index('customers_phone_idx').on(table.phone),
}));

// Orders
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }).notNull(),
  registerId: uuid('register_id').references(() => registers.id, { onDelete: 'set null' }),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  cashierId: uuid('cashier_id').references(() => users.id, { onDelete: 'set null' }),
  orderNumber: varchar('order_number', { length: 50 }).notNull(),
  status: orderStatusEnum('status').default('pending').notNull(),
  subtotal: integer('subtotal').notNull(), // in cents
  discountAmount: integer('discount_amount').default(0), // in cents
  taxAmount: integer('tax_amount').notNull(), // in cents
  total: integer('total').notNull(), // in cents
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  voidedAt: timestamp('voided_at', { withTimezone: true }),
  voidedBy: uuid('voided_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('orders_org_idx').on(table.organizationId),
  locationIdx: index('orders_location_idx').on(table.locationId),
  registerIdx: index('orders_register_idx').on(table.registerId),
  customerIdx: index('orders_customer_idx').on(table.customerId),
  statusIdx: index('orders_status_idx').on(table.status),
  orderNumberUnique: uniqueIndex('orders_number_unique').on(table.orderNumber),
  createdAtIdx: index('orders_created_idx').on(table.createdAt),
}));

// Order Items
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  sku: varchar('sku', { length: 100 }),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(), // in cents
  discountAmount: integer('discount_amount').default(0), // in cents
  taxAmount: integer('tax_amount').notNull(), // in cents
  total: integer('total').notNull(), // in cents
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orderIdx: index('order_items_order_idx').on(table.orderId),
  productIdx: index('order_items_product_idx').on(table.productId),
}));

// Payments
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  method: paymentMethodEnum('method').notNull(),
  amount: integer('amount').notNull(), // in cents
  cardBrand: varchar('card_brand', { length: 50 }),
  cardLast4: varchar('card_last4', { length: 4 }),
  authCode: varchar('auth_code', { length: 100 }),
  transactionId: varchar('transaction_id', { length: 255 }),
  cashReceived: integer('cash_received'), // in cents
  changeGiven: integer('change_given').default(0), // in cents
  status: varchar('status', { length: 20 }).default('completed').notNull(),
  metadata: jsonb('metadata').default({}),
  processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orderIdx: index('payments_order_idx').on(table.orderId),
}));

// Shifts
export const shifts = pgTable('shifts', {
  id: uuid('id').primaryKey().defaultRandom(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }).notNull(),
  registerId: uuid('register_id').references(() => registers.id, { onDelete: 'cascade' }).notNull(),
  cashierId: uuid('cashier_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  shiftNumber: varchar('shift_number', { length: 50 }).notNull(),
  status: shiftStatusEnum('status').default('open').notNull(),
  openedAt: timestamp('opened_at', { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  expectedCash: integer('expected_cash').default(0), // in cents
  actualCash: integer('actual_cash').default(0), // in cents
  cashSales: integer('cash_sales').default(0), // in cents
  cardSales: integer('card_sales').default(0), // in cents
  giftCardSales: integer('gift_card_sales').default(0), // in cents
  totalSales: integer('total_sales').default(0), // in cents
  transactionCount: integer('transaction_count').default(0),
  refundCount: integer('refund_count').default(0),
  refundAmount: integer('refund_amount').default(0), // in cents
  openingNotes: text('opening_notes'),
  closingNotes: text('closing_notes'),
  discrepancyAmount: integer('discrepancy_amount').default(0), // in cents
  discrepancyReason: text('discrepancy_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  locationIdx: index('shifts_location_idx').on(table.locationId),
  registerIdx: index('shifts_register_idx').on(table.registerId),
  cashierIdx: index('shifts_cashier_idx').on(table.cashierId),
  statusIdx: index('shifts_status_idx').on(table.status),
  openedAtIdx: index('shifts_opened_idx').on(table.openedAt),
}));

// Receipts
export const receipts = pgTable('receipts', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  receiptNumber: varchar('receipt_number', { length: 50 }).notNull(),
  type: varchar('type', { length: 20 }).default('sale').notNull(), // sale, refund, void
  content: jsonb('content').notNull(), // full receipt data for reprinting
  printedAt: timestamp('printed_at', { withTimezone: true }),
  emailedAt: timestamp('emailed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orderIdx: index('receipts_order_idx').on(table.orderId),
  receiptNumberUnique: uniqueIndex('receipts_number_unique').on(table.receiptNumber),
}));

// Discounts
export const discounts = pgTable('discounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 20 }).notNull(), // percentage, fixed_amount, buy_x_get_y
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  maxAmount: integer('max_amount'), // in cents, for percentage discounts
  appliesTo: varchar('applies_to', { length: 20 }).default('all'), // all, category, product, variant
  targetIds: jsonb('target_ids').default([]), // category/product/variant IDs
  minPurchase: integer('min_purchase'), // in cents
  maxUses: integer('max_uses'),
  usedCount: integer('used_count').default(0),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('discounts_org_idx').on(table.organizationId),
}));

// Gasul (LPG) Tracker
export const gasulTankStatusEnum = pgEnum('gasul_tank_status', ['full', 'in_use', 'empty', 'reserve', 'returned']);
export const gasulRefillStatusEnum = pgEnum('gasul_refill_status', ['ordered', 'delivered', 'cancelled']);

// Laundry Consumables Tracking
export const serviceTypeEnum = pgEnum('service_type', ['REGULAR', 'DELUXE', 'EXTRA_DRY', 'EXTRA_WASH', 'HAND_WASH']);
export const machineTypeEnum = pgEnum('machine_type', ['LG_GIANT', 'LG_TITAN']);
export const consumableTypeEnum = pgEnum('consumable_type', ['DETERGENT', 'REGULAR_FABCON', 'IMPORTED_FABCON', 'PLASTICS', 'GASUL']);

export const gasulTanks = pgTable('gasul_tanks', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }).notNull(),
  serialNumber: varchar('serial_number', { length: 100 }).notNull(),
  brand: varchar('brand', { length: 100 }), // Solane, Petron, Pryce, etc.
  capacityKg: integer('capacity_kg').notNull(), // 11kg, 50kg, etc.
  tareWeightKg: integer('tare_weight_kg'), // empty tank weight
  status: gasulTankStatusEnum('status').default('full').notNull(),
  currentLocation: varchar('current_location', { length: 50 }).default('onsite'), // onsite, customer, supplier
  assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }), // staff assigned
  lastRefillAt: timestamp('last_refill_at', { withTimezone: true }),
  nextRefillDue: timestamp('next_refill_due', { withTimezone: true }),
  notes: text('notes'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('gasul_tanks_org_idx').on(table.organizationId),
  locationIdx: index('gasul_tanks_location_idx').on(table.locationId),
  serialUnique: uniqueIndex('gasul_tanks_serial_unique').on(table.serialNumber),
  statusIdx: index('gasul_tanks_status_idx').on(table.status),
}));

export const gasulRefills = pgTable('gasul_refills', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }).notNull(),
  tankId: uuid('tank_id').references(() => gasulTanks.id, { onDelete: 'cascade' }).notNull(),
  supplierId: uuid('supplier_id').references(() => users.id, { onDelete: 'set null' }), // could be external supplier
  orderedBy: uuid('ordered_by').references(() => users.id, { onDelete: 'set null' }),
  quantity: integer('quantity').notNull(), // number of tanks
  pricePerTank: integer('price_per_tank').notNull(), // in cents
  deliveryFee: integer('delivery_fee').default(0), // in cents
  totalAmount: integer('total_amount').notNull(), // in cents
  status: gasulRefillStatusEnum('status').default('ordered').notNull(),
  orderedAt: timestamp('ordered_at', { withTimezone: true }).defaultNow().notNull(),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  receivedBy: uuid('received_by').references(() => users.id, { onDelete: 'set null' }),
  invoiceNumber: varchar('invoice_number', { length: 100 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('gasul_refills_org_idx').on(table.organizationId),
  locationIdx: index('gasul_refills_location_idx').on(table.locationId),
  tankIdx: index('gasul_refills_tank_idx').on(table.tankId),
  statusIdx: index('gasul_refills_status_idx').on(table.status),
  orderedAtIdx: index('gasul_refills_ordered_idx').on(table.orderedAt),
}));

export const gasulUsage = pgTable('gasul_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }).notNull(),
  tankId: uuid('tank_id').references(() => gasulTanks.id, { onDelete: 'cascade' }).notNull(),
  shiftId: uuid('shift_id').references(() => shifts.id, { onDelete: 'set null' }),
  equipment: varchar('equipment', { length: 100 }).notNull(), // dryer, iron, boiler, etc.
  startWeightKg: numeric('start_weight_kg', { precision: 6, scale: 2 }).notNull(),
  endWeightKg: numeric('end_weight_kg', { precision: 6, scale: 2 }),
  consumedKg: numeric('consumed_kg', { precision: 6, scale: 2 }),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  recordedBy: uuid('recorded_by').references(() => users.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('gasul_usage_org_idx').on(table.organizationId),
  locationIdx: index('gasul_usage_location_idx').on(table.locationId),
  tankIdx: index('gasul_usage_tank_idx').on(table.tankId),
  shiftIdx: index('gasul_usage_shift_idx').on(table.shiftId),
  startedAtIdx: index('gasul_usage_started_idx').on(table.startedAt),
}));

// Consumption Rules (per location, service type × machine type × hasImportedFabcon)
export const consumptionRule = pgTable('consumption_rule', {
  id: uuid('id').primaryKey().defaultRandom(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }).notNull(),
  serviceType: serviceTypeEnum('service_type').notNull(),
  machineType: machineTypeEnum('machine_type').notNull(),
  hasImportedFabcon: boolean('has_imported_fabcon').notNull().default(false),
  detergentMl: integer('detergent_ml').notNull().default(80),
  regularFabconMl: integer('regular_fabcon_ml').notNull().default(80),
  importedFabconMl: integer('imported_fabcon_ml').notNull().default(40),
  plasticsCount: integer('plastics_count').notNull().default(1),
  gasKg: numeric('gas_kg', { precision: 6, scale: 3 }).notNull().default('0.15'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniq: uniqueIndex('consumption_rule_unique').on(table.locationId, table.serviceType, table.machineType, table.hasImportedFabcon),
  locationIdx: index('consumption_rule_location_idx').on(table.locationId),
}));

// Consumable Thresholds (per location, per consumable type)
export const consumableThreshold = pgTable('consumable_threshold', {
  id: uuid('id').primaryKey().defaultRandom(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }).notNull(),
  consumableType: consumableTypeEnum('consumable_type').notNull(),
  minimumQty: integer('minimum_qty').notNull(),
  unit: varchar('unit', { length: 10 }).notNull(), // 'ml', 'kg', 'pcs'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniq: uniqueIndex('consumable_threshold_unique').on(table.locationId, table.consumableType),
  locationIdx: index('consumable_threshold_location_idx').on(table.locationId),
}));

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: uuid('entity_id'),
  oldData: jsonb('old_data'),
  newData: jsonb('new_data'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('audit_logs_org_idx').on(table.organizationId),
  userIdx: index('audit_logs_user_idx').on(table.userId),
  entityIdx: index('audit_logs_entity_idx').on(table.entityType, table.entityId),
  actionIdx: index('audit_logs_action_idx').on(table.action),
  createdAtIdx: index('audit_logs_created_idx').on(table.createdAt),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organizations, { fields: [auditLogs.organizationId], references: [organizations.id] }),
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  locations: many(locations),
  users: many(users),
  products: many(products),
  categories: many(categories),
  customers: many(customers),
  orders: many(orders),
  discounts: many(discounts),
  washCycles: many(washCycles),
  garmentTypes: many(garmentTypes),
  pickupSchedules: many(pickupSchedules),
  deliverySchedules: many(deliverySchedules),
  laundryOrders: many(laundryOrders),
  gasulTanks: many(gasulTanks),
  gasulRefills: many(gasulRefills),
  gasulUsage: many(gasulUsage),
  auditLogs: many(auditLogs),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  organization: one(organizations, { fields: [locations.organizationId], references: [organizations.id] }),
  registers: many(registers),
  inventory: many(inventory),
  orders: many(orders),
  shifts: many(shifts),
  pickupSchedules: many(pickupSchedules),
  deliverySchedules: many(deliverySchedules),
  laundryOrders: many(laundryOrders),
  gasulTanks: many(gasulTanks),
  gasulRefills: many(gasulRefills),
  gasulUsage: many(gasulUsage),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, { fields: [users.organizationId], references: [organizations.id] }),
  orders: many(orders),
  shifts: many(shifts),
  inventoryAdjustments: many(inventoryAdjustments),
  pickupSchedulesAsDriver: many(pickupSchedules),
  deliverySchedulesAsDriver: many(deliverySchedules),
  gasulTanksAssigned: many(gasulTanks),
  gasulRefillsOrdered: many(gasulRefills),
  gasulRefillsReceived: many(gasulRefills, { relationName: 'receivedRefills' }),
  gasulUsageRecorded: many(gasulUsage),
}));

export const registersRelations = relations(registers, ({ one, many }) => ({
  location: one(locations, { fields: [registers.locationId], references: [locations.id] }),
  orders: many(orders),
  shifts: many(shifts),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  organization: one(organizations, { fields: [categories.organizationId], references: [organizations.id] }),
  parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
  children: many(categories),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  organization: one(organizations, { fields: [products.organizationId], references: [organizations.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  variants: many(productVariants),
  inventory: many(inventory),
  orderItems: many(orderItems),
  inventoryAdjustments: many(inventoryAdjustments),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
  inventory: many(inventory),
  orderItems: many(orderItems),
  inventoryAdjustments: many(inventoryAdjustments),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  location: one(locations, { fields: [inventory.locationId], references: [locations.id] }),
  product: one(products, { fields: [inventory.productId], references: [products.id] }),
  variant: one(productVariants, { fields: [inventory.variantId], references: [productVariants.id] }),
}));

export const inventoryAdjustmentsRelations = relations(inventoryAdjustments, ({ one }) => ({
  location: one(locations, { fields: [inventoryAdjustments.locationId], references: [locations.id] }),
  product: one(products, { fields: [inventoryAdjustments.productId], references: [products.id] }),
  variant: one(productVariants, { fields: [inventoryAdjustments.variantId], references: [productVariants.id] }),
  user: one(users, { fields: [inventoryAdjustments.userId], references: [users.id] }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  organization: one(organizations, { fields: [customers.organizationId], references: [organizations.id] }),
  orders: many(orders),
  laundryPreferences: one(customerLaundryPreferences, { fields: [customers.id], references: [customerLaundryPreferences.customerId] }),
  pickupSchedules: many(pickupSchedules),
  deliverySchedules: many(deliverySchedules),
  laundryOrders: many(laundryOrders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  organization: one(organizations, { fields: [orders.organizationId], references: [organizations.id] }),
  location: one(locations, { fields: [orders.locationId], references: [locations.id] }),
  register: one(registers, { fields: [orders.registerId], references: [registers.id] }),
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  cashier: one(users, { fields: [orders.cashierId], references: [users.id] }),
  items: many(orderItems),
  payments: many(payments),
  receipts: many(receipts),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
  variant: one(productVariants, { fields: [orderItems.variantId], references: [productVariants.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

export const shiftsRelations = relations(shifts, ({ one }) => ({
  location: one(locations, { fields: [shifts.locationId], references: [locations.id] }),
  register: one(registers, { fields: [shifts.registerId], references: [registers.id] }),
  cashier: one(users, { fields: [shifts.cashierId], references: [users.id] }),
}));

export const receiptsRelations = relations(receipts, ({ one }) => ({
  order: one(orders, { fields: [receipts.orderId], references: [orders.id] }),
}));

export const discountsRelations = relations(discounts, ({ one }) => ({
  organization: one(organizations, { fields: [discounts.organizationId], references: [organizations.id] }),
}));

// Laundry-specific enums
export const washCycleEnum = pgEnum('wash_cycle', ['delicate', 'normal', 'heavy_duty', 'quick_wash', 'wool', 'hand_wash']);
export const garmentTypeEnum = pgEnum('garment_type', ['shirt', 'pants', 'dress', 'skirt', 'blouse', 't_shirt', 'jeans', 'shorts', 'sweater', 'jacket', 'coat', 'suit', 'tie', 'scarf', 'socks', 'underwear', 'bedding', 'towel', 'curtain', 'tablecloth', 'other']);
export const pickupDeliveryStatusEnum = pgEnum('pickup_delivery_status', ['scheduled', 'in_progress', 'completed', 'cancelled', 'failed']);
export const serviceStatusEnum = pgEnum('service_status', ['received', 'washing', 'drying', 'folding', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'completed']);

// Wash Cycles (laundry wash programs)
export const washCycles = pgTable('wash_cycles', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  cycleType: washCycleEnum('cycle_type').notNull(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').notNull(),
  temperatureCelsius: integer('temperature_celsius'),
  spinSpeedRpm: integer('spin_speed_rpm'),
  priceModifier: numeric('price_modifier', { precision: 5, scale: 2 }).default('1.00'), // multiplier on base price
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('wash_cycles_org_idx').on(table.organizationId),
  typeIdx: index('wash_cycles_type_idx').on(table.cycleType),
}));

// Garment Types
export const garmentTypes = pgTable('garment_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  type: garmentTypeEnum('type').notNull(),
  description: text('description'),
  basePrice: integer('base_price').notNull(), // in cents
  baseWeightGrams: integer('base_weight_grams'), // estimated weight for pricing
  requiresSpecialCare: boolean('requires_special_care').default(false),
  careInstructions: text('care_instructions'),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('garment_types_org_idx').on(table.organizationId),
  typeIdx: index('garment_types_type_idx').on(table.type),
}));

// Pickup Schedules
export const pickupSchedules = pgTable('pickup_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  address: text('address').notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 50 }),
  zip: varchar('zip', { length: 20 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  contactName: varchar('contact_name', { length: 100 }),
  notes: text('notes'),
  status: pickupDeliveryStatusEnum('status').default('scheduled').notNull(),
  driverId: uuid('driver_id').references(() => users.id, { onDelete: 'set null' }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('pickup_schedules_org_idx').on(table.organizationId),
  locationIdx: index('pickup_schedules_location_idx').on(table.locationId),
  customerIdx: index('pickup_schedules_customer_idx').on(table.customerId),
  statusIdx: index('pickup_schedules_status_idx').on(table.status),
  scheduledAtIdx: index('pickup_schedules_scheduled_idx').on(table.scheduledAt),
}));

// Delivery Schedules
export const deliverySchedules = pgTable('delivery_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  address: text('address').notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 50 }),
  zip: varchar('zip', { length: 20 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  contactName: varchar('contact_name', { length: 100 }),
  notes: text('notes'),
  status: pickupDeliveryStatusEnum('status').default('scheduled').notNull(),
  driverId: uuid('driver_id').references(() => users.id, { onDelete: 'set null' }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  proofOfDelivery: text('proof_of_delivery'), // photo URL, signature, etc.
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('delivery_schedules_org_idx').on(table.organizationId),
  locationIdx: index('delivery_schedules_location_idx').on(table.locationId),
  customerIdx: index('delivery_schedules_customer_idx').on(table.customerId),
  statusIdx: index('delivery_schedules_status_idx').on(table.status),
  scheduledAtIdx: index('delivery_schedules_scheduled_idx').on(table.scheduledAt),
}));

// Customer Laundry Preferences
export const customerLaundryPreferences = pgTable('customer_laundry_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull().unique(),
  preferredWashCycleId: uuid('preferred_wash_cycle_id').references(() => washCycles.id, { onDelete: 'set null' }),
  preferredDetergent: varchar('preferred_detergent', { length: 100 }), // hypoallergenic, regular, eco
  preferredSoftener: varchar('preferred_softener', { length: 100 }), // none, regular, eco
  waterTemperature: varchar('water_temperature', { length: 20 }), // cold, warm, hot
  foldPreference: varchar('fold_preference', { length: 20 }).default('standard'), // standard, military, hang
  hangerPreference: varchar('hanger_preference', { length: 20 }).default('wire'), // wire, plastic, wooden, none
  specialInstructions: text('special_instructions'),
  autoSchedulePickup: boolean('auto_schedule_pickup').default(false),
  pickupFrequency: varchar('pickup_frequency', { length: 20 }), // weekly, biweekly, monthly, on_demand
  preferredPickupDay: integer('preferred_pickup_day'), // 0-6 (Sunday-Saturday)
  preferredPickupTime: varchar('preferred_pickup_time', { length: 20 }), // morning, afternoon, evening
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  customerIdx: index('customer_laundry_prefs_customer_idx').on(table.customerId),
}));

// Laundry Orders (tracks the laundry service workflow)
export const laundryOrders = pgTable('laundry_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }).notNull(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull().unique(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  pickupScheduleId: uuid('pickup_schedule_id').references(() => pickupSchedules.id, { onDelete: 'set null' }),
  deliveryScheduleId: uuid('delivery_schedule_id').references(() => deliverySchedules.id, { onDelete: 'set null' }),
  status: serviceStatusEnum('status').default('received').notNull(),
  totalWeightKg: numeric('total_weight_kg', { precision: 6, scale: 2 }),
  totalItems: integer('total_items').default(0),
  bagCount: integer('bag_count').default(1),
  specialInstructions: text('special_instructions'),
  receivedAt: timestamp('received_at', { withTimezone: true }),
  washStartedAt: timestamp('wash_started_at', { withTimezone: true }),
  dryStartedAt: timestamp('dry_started_at', { withTimezone: true }),
  foldStartedAt: timestamp('fold_started_at', { withTimezone: true }),
  readyAt: timestamp('ready_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('laundry_orders_org_idx').on(table.organizationId),
  locationIdx: index('laundry_orders_location_idx').on(table.locationId),
  orderIdx: index('laundry_orders_order_idx').on(table.orderId),
  customerIdx: index('laundry_orders_customer_idx').on(table.customerId),
  statusIdx: index('laundry_orders_status_idx').on(table.status),
  pickupScheduleIdx: index('laundry_orders_pickup_idx').on(table.pickupScheduleId),
  deliveryScheduleIdx: index('laundry_orders_delivery_idx').on(table.deliveryScheduleId),
}));

// Laundry Order Items (individual garments in a laundry order)
export const laundryOrderItems = pgTable('laundry_order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  laundryOrderId: uuid('laundry_order_id').references(() => laundryOrders.id, { onDelete: 'cascade' }).notNull(),
  garmentTypeId: uuid('garment_type_id').references(() => garmentTypes.id, { onDelete: 'set null' }),
  washCycleId: uuid('wash_cycle_id').references(() => washCycles.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  quantity: integer('quantity').default(1).notNull(),
  weightGrams: integer('weight_grams'),
  price: integer('price').notNull(), // in cents
  status: serviceStatusEnum('status').default('received').notNull(),
  stainTreatment: boolean('stain_treatment').default(false),
  specialCare: boolean('special_care').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  laundryOrderIdx: index('laundry_order_items_order_idx').on(table.laundryOrderId),
  garmentTypeIdx: index('laundry_order_items_garment_idx').on(table.garmentTypeId),
}));

// Relations for laundry tables
export const washCyclesRelations = relations(washCycles, ({ one, many }) => ({
  organization: one(organizations, { fields: [washCycles.organizationId], references: [organizations.id] }),
  laundryOrderItems: many(laundryOrderItems),
  customerPreferences: many(customerLaundryPreferences),
}));

export const garmentTypesRelations = relations(garmentTypes, ({ one, many }) => ({
  organization: one(organizations, { fields: [garmentTypes.organizationId], references: [organizations.id] }),
  laundryOrderItems: many(laundryOrderItems),
}));

export const pickupSchedulesRelations = relations(pickupSchedules, ({ one, many }) => ({
  organization: one(organizations, { fields: [pickupSchedules.organizationId], references: [organizations.id] }),
  location: one(locations, { fields: [pickupSchedules.locationId], references: [locations.id] }),
  customer: one(customers, { fields: [pickupSchedules.customerId], references: [customers.id] }),
  driver: one(users, { fields: [pickupSchedules.driverId], references: [users.id] }),
  laundryOrders: many(laundryOrders),
}));

export const deliverySchedulesRelations = relations(deliverySchedules, ({ one, many }) => ({
  organization: one(organizations, { fields: [deliverySchedules.organizationId], references: [organizations.id] }),
  location: one(locations, { fields: [deliverySchedules.locationId], references: [locations.id] }),
  customer: one(customers, { fields: [deliverySchedules.customerId], references: [customers.id] }),
  driver: one(users, { fields: [deliverySchedules.driverId], references: [users.id] }),
  laundryOrders: many(laundryOrders),
}));

export const customerLaundryPreferencesRelations = relations(customerLaundryPreferences, ({ one }) => ({
  customer: one(customers, { fields: [customerLaundryPreferences.customerId], references: [customers.id] }),
  preferredWashCycle: one(washCycles, { fields: [customerLaundryPreferences.preferredWashCycleId], references: [washCycles.id] }),
}));

export const laundryOrdersRelations = relations(laundryOrders, ({ one, many }) => ({
  organization: one(organizations, { fields: [laundryOrders.organizationId], references: [organizations.id] }),
  location: one(locations, { fields: [laundryOrders.locationId], references: [locations.id] }),
  order: one(orders, { fields: [laundryOrders.orderId], references: [orders.id] }),
  customer: one(customers, { fields: [laundryOrders.customerId], references: [customers.id] }),
  pickupSchedule: one(pickupSchedules, { fields: [laundryOrders.pickupScheduleId], references: [pickupSchedules.id] }),
  deliverySchedule: one(deliverySchedules, { fields: [laundryOrders.deliveryScheduleId], references: [deliverySchedules.id] }),
  items: many(laundryOrderItems),
}));

export const laundryOrderItemsRelations = relations(laundryOrderItems, ({ one }) => ({
  laundryOrder: one(laundryOrders, { fields: [laundryOrderItems.laundryOrderId], references: [laundryOrders.id] }),
  garmentType: one(garmentTypes, { fields: [laundryOrderItems.garmentTypeId], references: [garmentTypes.id] }),
  washCycle: one(washCycles, { fields: [laundryOrderItems.washCycleId], references: [washCycles.id] }),
}));

// Gasul Relations
export const gasulTanksRelations = relations(gasulTanks, ({ one, many }) => ({
  organization: one(organizations, { fields: [gasulTanks.organizationId], references: [organizations.id] }),
  location: one(locations, { fields: [gasulTanks.locationId], references: [locations.id] }),
  assignedUser: one(users, { fields: [gasulTanks.assignedTo], references: [users.id] }),
  refills: many(gasulRefills),
  usage: many(gasulUsage),
}));

export const gasulRefillsRelations = relations(gasulRefills, ({ one, many }) => ({
  organization: one(organizations, { fields: [gasulRefills.organizationId], references: [organizations.id] }),
  location: one(locations, { fields: [gasulRefills.locationId], references: [locations.id] }),
  tank: one(gasulTanks, { fields: [gasulRefills.tankId], references: [gasulTanks.id] }),
  supplier: one(users, { fields: [gasulRefills.supplierId], references: [users.id] }),
  orderedByUser: one(users, { fields: [gasulRefills.orderedBy], references: [users.id] }),
  receivedByUser: one(users, { fields: [gasulRefills.receivedBy], references: [users.id], relationName: 'receivedRefills' }),
}));

export const gasulUsageRelations = relations(gasulUsage, ({ one }) => ({
  organization: one(organizations, { fields: [gasulUsage.organizationId], references: [organizations.id] }),
  location: one(locations, { fields: [gasulUsage.locationId], references: [locations.id] }),
  tank: one(gasulTanks, { fields: [gasulUsage.tankId], references: [gasulTanks.id] }),
  shift: one(shifts, { fields: [gasulUsage.shiftId], references: [shifts.id] }),
  recordedByUser: one(users, { fields: [gasulUsage.recordedBy], references: [users.id] }),
}));

// Type exports
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Register = typeof registers.$inferSelect;
export type NewRegister = typeof registers.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;

export type Inventory = typeof inventory.$inferSelect;
export type NewInventory = typeof inventory.$inferInsert;

export type InventoryAdjustment = typeof inventoryAdjustments.$inferSelect;
export type NewInventoryAdjustment = typeof inventoryAdjustments.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type Shift = typeof shifts.$inferSelect;
export type NewShift = typeof shifts.$inferInsert;

export type Receipt = typeof receipts.$inferSelect;
export type NewReceipt = typeof receipts.$inferInsert;

export type Discount = typeof discounts.$inferSelect;
export type NewDiscount = typeof discounts.$inferInsert;

export type WashCycle = typeof washCycles.$inferSelect;
export type NewWashCycle = typeof washCycles.$inferInsert;

export type GarmentType = typeof garmentTypes.$inferSelect;
export type NewGarmentType = typeof garmentTypes.$inferInsert;

export type PickupSchedule = typeof pickupSchedules.$inferSelect;
export type NewPickupSchedule = typeof pickupSchedules.$inferInsert;

export type DeliverySchedule = typeof deliverySchedules.$inferSelect;
export type NewDeliverySchedule = typeof deliverySchedules.$inferInsert;

export type CustomerLaundryPreferences = typeof customerLaundryPreferences.$inferSelect;
export type NewCustomerLaundryPreferences = typeof customerLaundryPreferences.$inferInsert;

export type LaundryOrder = typeof laundryOrders.$inferSelect;
export type NewLaundryOrder = typeof laundryOrders.$inferInsert;

export type LaundryOrderItem = typeof laundryOrderItems.$inferSelect;
export type NewLaundryOrderItem = typeof laundryOrderItems.$inferInsert;

export type GasulTank = typeof gasulTanks.$inferSelect;
export type NewGasulTank = typeof gasulTanks.$inferInsert;

export type GasulRefill = typeof gasulRefills.$inferSelect;
export type NewGasulRefill = typeof gasulRefills.$inferInsert;

export type GasulUsage = typeof gasulUsage.$inferSelect;
export type NewGasulUsage = typeof gasulUsage.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type ConsumptionRule = typeof consumptionRule.$inferSelect;
export type NewConsumptionRule = typeof consumptionRule.$inferInsert;

export type ConsumableThreshold = typeof consumableThreshold.$inferSelect;
export type NewConsumableThreshold = typeof consumableThreshold.$inferInsert;