import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  organizations,
  products,
  customers,
  orders,
  orderItems,
  payments,
  inventory,
  shifts,
  receipts,
  inventoryAdjustments,
  discounts,
  categories,
  users,
  locations,
  registers,
  consumptionRule,
  consumableThreshold,
  gasulTanks,
  gasulRefills,
  gasulUsage,
  washCycles,
  garmentTypes,
  pickupSchedules,
  deliverySchedules,
  customerLaundryPreferences,
  laundryOrders,
  laundryOrderItems,
} from '@/lib/db/schema';
import { eq, and, ne, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

const testUserEmails = ['admin@freshfold.com', 'manager@freshfold.com', 'cashier1@freshfold.com', 'cashier2@freshfold.com'];

async function seedDemoData(orgId: string, userId: string) {
  // Get the organization's location
  const orgLocations = await db.query.locations.findMany({
    where: eq(locations.organizationId, orgId),
    columns: { id: true, name: true, code: true },
  });

  if (orgLocations.length === 0) {
    return;
  }

  const location = orgLocations[0];

  // Create categories
  const categoriesData = [
    { name: 'Beverages', description: 'Coffee, tea, and cold drinks', sortOrder: 1 },
    { name: 'Food', description: 'Pastries, sandwiches, and snacks', sortOrder: 2 },
    { name: 'Merchandise', description: 'Branded merchandise and accessories', sortOrder: 3 },
    { name: 'Gift Cards', description: 'Digital and physical gift cards', sortOrder: 4 },
    { name: 'Laundry Supplies', description: 'Detergents, fabric softeners, and cleaning supplies', sortOrder: 5 },
  ];

  const createdCategories: typeof categories.$inferSelect[] = [];
  for (const cat of categoriesData) {
    const result = await db.insert(categories).values({
      organizationId: orgId,
      ...cat,
    }).onConflictDoUpdate({
      target: [categories.organizationId, categories.name],
      set: { ...cat, updatedAt: new Date() },
    }).returning();
    if (Array.isArray(result) && result.length > 0) {
      createdCategories.push(result[0] as typeof categories.$inferSelect);
    }
  }

  const beverages = createdCategories.find(c => c.name === 'Beverages')!;
  const food = createdCategories.find(c => c.name === 'Food')!;
  const merchandise = createdCategories.find(c => c.name === 'Merchandise')!;
  const giftCards = createdCategories.find(c => c.name === 'Gift Cards')!;
  const laundrySupplies = createdCategories.find(c => c.name === 'Laundry Supplies')!;

  // Create products
  const productsData = [
    { name: 'Americano', description: 'Classic espresso with hot water', sku: 'BEV-001', barcode: '1234567890123', categoryId: beverages.id, price: 350, cost: 150, taxRate: '0.12', trackInventory: true, lowStockThreshold: 10, type: 'product', isActive: true },
    { name: 'Latte', description: 'Espresso with steamed milk', sku: 'BEV-002', barcode: '1234567890124', categoryId: beverages.id, price: 450, cost: 200, taxRate: '0.12', trackInventory: true, lowStockThreshold: 10, type: 'product', isActive: true },
    { name: 'Cappuccino', description: 'Espresso with foamed milk', sku: 'BEV-003', barcode: '1234567890125', categoryId: beverages.id, price: 450, cost: 200, taxRate: '0.12', trackInventory: true, lowStockThreshold: 10, type: 'product', isActive: true },
    { name: 'Cold Brew', description: 'Steeped cold coffee', sku: 'BEV-004', barcode: '1234567890126', categoryId: beverages.id, price: 500, cost: 220, taxRate: '0.12', trackInventory: true, lowStockThreshold: 10, type: 'product', isActive: true },
    { name: 'Croissant', description: 'Buttery flaky pastry', sku: 'FOOD-001', barcode: '1234567890127', categoryId: food.id, price: 350, cost: 120, taxRate: '0.12', trackInventory: true, lowStockThreshold: 20, type: 'product', isActive: true },
    { name: 'Blueberry Muffin', description: 'Fresh baked muffin', sku: 'FOOD-002', barcode: '1234567890128', categoryId: food.id, price: 400, cost: 150, taxRate: '0.12', trackInventory: true, lowStockThreshold: 15, type: 'product', isActive: true },
    { name: 'Branded T-Shirt', description: 'FreshFold branded t-shirt', sku: 'MERCH-001', barcode: '1234567890129', categoryId: merchandise.id, price: 2500, cost: 1000, taxRate: '0.12', trackInventory: true, lowStockThreshold: 5, type: 'product', isActive: true },
    { name: 'Gift Card $25', description: '$25 gift card', sku: 'GIFT-025', barcode: '1234567890130', categoryId: giftCards.id, price: 2500, cost: 0, taxRate: '0', trackInventory: false, lowStockThreshold: 0, type: 'gift_card', isActive: true },
    { name: 'Gift Card $50', description: '$50 gift card', sku: 'GIFT-050', barcode: '1234567890131', categoryId: giftCards.id, price: 5000, cost: 0, taxRate: '0', trackInventory: false, lowStockThreshold: 0, type: 'gift_card', isActive: true },
    { name: 'Liquid Detergent', description: 'High-efficiency liquid laundry detergent', sku: 'SUP-001', barcode: '1234567890132', categoryId: laundrySupplies.id, price: 800, cost: 350, taxRate: '0.12', trackInventory: true, lowStockThreshold: 10, type: 'product', isActive: true },
    { name: 'Fabric Softener', description: 'Concentrated fabric softener', sku: 'SUP-002', barcode: '1234567890133', categoryId: laundrySupplies.id, price: 600, cost: 250, taxRate: '0.12', trackInventory: true, lowStockThreshold: 10, type: 'product', isActive: true },
    { name: 'Stain Remover', description: 'Heavy-duty stain remover spray', sku: 'SUP-003', barcode: '1234567890134', categoryId: laundrySupplies.id, price: 450, cost: 200, taxRate: '0.12', trackInventory: true, lowStockThreshold: 10, type: 'product', isActive: true },
    { name: 'Bleach', description: 'Chlorine bleach for whites', sku: 'SUP-004', barcode: '1234567890135', categoryId: laundrySupplies.id, price: 350, cost: 150, taxRate: '0.12', trackInventory: true, lowStockThreshold: 5, type: 'product', isActive: true },
    { name: 'Dryer Sheets', description: 'Fabric softener dryer sheets', sku: 'SUP-005', barcode: '1234567890136', categoryId: laundrySupplies.id, price: 400, cost: 180, taxRate: '0.12', trackInventory: true, lowStockThreshold: 15, type: 'product', isActive: true },
  ];

  const createdProducts: typeof products.$inferSelect[] = [];
  for (const product of productsData) {
    const result = await db.insert(products).values({
      organizationId: orgId,
      ...product,
    }).onConflictDoUpdate({
      target: products.sku,
      set: { ...product, updatedAt: new Date() },
    }).returning();
    if (Array.isArray(result) && result.length > 0) {
      createdProducts.push(result[0] as typeof products.$inferSelect);
    }
  }

  // Create inventory for each product
  for (const product of createdProducts) {
    const stock = product.type === 'gift_card' ? 100 : Math.floor(Math.random() * 50) + 20;
    await db.insert(inventory).values({
      locationId: location.id,
      productId: product.id,
      quantity: stock,
      reserved: 0,
      reorderPoint: product.lowStockThreshold ?? 10,
      reorderQuantity: (product.lowStockThreshold ?? 10) * 2,
    }).onConflictDoNothing();
  }

  // Create sample supply purchase orders (inventory adjustments with reason='purchase')
  const laundryProducts = createdProducts.filter(p => p.categoryId === laundrySupplies.id);
  if (laundryProducts.length > 0) {
    const suppliers = ['CleanSupply Co.', 'FreshChem Distributors', 'EcoClean Wholesale', 'ProWash Supplies'];
    const statuses = ['ordered', 'received', 'partial'];

    for (let i = 0; i < 8; i++) {
      const product = laundryProducts[Math.floor(Math.random() * laundryProducts.length)];
      const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const expectedDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const receivedDate = status === 'received' || status === 'partial'
        ? new Date(expectedDate.getTime() + Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000)
        : null;

      await db.insert(inventoryAdjustments).values({
        locationId: location.id,
        productId: product.id,
        quantity: Math.floor(Math.random() * 50) + 10,
        type: 'adjustment',
        reason: 'purchase',
        previousQuantity: 0,
        newQuantity: Math.floor(Math.random() * 50) + 10,
        referenceType: supplier,
        referenceId: status === 'received' ? randomUUID() : null,
        userId: userId,
      });
    }
  }

  // Create customers
  const customersData = [
    { firstName: 'John', lastName: 'Doe', email: 'john.doe@email.com', phone: '+1 (555) 111-2222', address: '123 Main St', city: 'San Francisco', state: 'CA', zip: '94102', country: 'US', loyaltyTier: 'silver', loyaltyPoints: 500, totalSpent: 500000, visitCount: 5 },
    { firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@email.com', phone: '+1 (555) 333-4444', address: '456 Oak Ave', city: 'San Francisco', state: 'CA', zip: '94103', country: 'US', loyaltyTier: 'gold', loyaltyPoints: 1200, totalSpent: 1200000, visitCount: 12 },
    { firstName: 'Bob', lastName: 'Wilson', email: 'bob.wilson@email.com', phone: '+1 (555) 555-6666', address: '789 Pine Rd', city: 'Oakland', state: 'CA', zip: '94607', country: 'US', loyaltyTier: 'bronze', loyaltyPoints: 100, totalSpent: 100000, visitCount: 2 },
  ];

  for (const customer of customersData) {
    await db.insert(customers).values({
      organizationId: orgId,
      ...customer,
      lastVisitAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    }).onConflictDoNothing();
  }

  // Create discounts
  await db.insert(discounts).values([
    {
      organizationId: orgId,
      name: 'Student Discount',
      description: '10% off for students with valid ID',
      type: 'percentage',
      value: '10.00',
      maxAmount: 5000,
      appliesTo: 'all',
      isActive: true,
    },
    {
      organizationId: orgId,
      name: 'Senior Discount',
      description: '15% off for seniors 65+',
      type: 'percentage',
      value: '15.00',
      maxAmount: 10000,
      appliesTo: 'all',
      isActive: true,
    },
  ]).onConflictDoNothing();
}

async function eraseDemoData(orgId: string) {
  // Get all location IDs for this organization
  const orgLocations = await db.query.locations.findMany({
    where: eq(locations.organizationId, orgId),
    columns: { id: true },
  });
  const locationIds = orgLocations.map(l => l.id);

  // Get all register IDs for this organization
  const orgRegisters = await db.query.registers.findMany({
    where: inArray(registers.locationId, locationIds),
    columns: { id: true },
  });
  const registerIds = orgRegisters.map(r => r.id);

  // Get all product IDs for this organization
  const orgProducts = await db.query.products.findMany({
    where: eq(products.organizationId, orgId),
    columns: { id: true },
  });
  const productIds = orgProducts.map(p => p.id);

  // Get all customer IDs for this organization
  const orgCustomers = await db.query.customers.findMany({
    where: eq(customers.organizationId, orgId),
    columns: { id: true },
  });
  const customerIds = orgCustomers.map(c => c.id);

  // Get all order IDs for this organization
  const orgOrders = await db.query.orders.findMany({
    where: eq(orders.organizationId, orgId),
    columns: { id: true },
  });
  const orderIds = orgOrders.map(o => o.id);

  // Get all category IDs for this organization
  const orgCategories = await db.query.categories.findMany({
    where: eq(categories.organizationId, orgId),
    columns: { id: true },
  });
  const categoryIds = orgCategories.map(c => c.id);

  // Get all discount IDs for this organization
  const orgDiscounts = await db.query.discounts.findMany({
    where: eq(discounts.organizationId, orgId),
    columns: { id: true },
  });
  const discountIds = orgDiscounts.map(d => d.id);

  // Get all user IDs for this organization (excluding test users)
  const orgUsers = await db.query.users.findMany({
    where: and(
      eq(users.organizationId, orgId),
      ne(users.email, 'admin@freshfold.com'),
    ),
    columns: { id: true, email: true },
  });

  // Filter out test users
  const userIdsToDelete = orgUsers
    .filter(u => !testUserEmails.includes(u.email))
    .map(u => u.id);

  // Delete in order of dependencies (children first)
  // Laundry order items
  if (orderIds.length > 0) {
    const laundryOrderIds = (await db.query.laundryOrders.findMany({
      where: inArray(laundryOrders.orderId, orderIds),
      columns: { id: true },
    })).map(l => l.id);

    if (laundryOrderIds.length > 0) {
      await db.delete(laundryOrderItems).where(inArray(laundryOrderItems.laundryOrderId, laundryOrderIds));
    }
  }

  // Laundry orders
  if (orderIds.length > 0) {
    await db.delete(laundryOrders).where(inArray(laundryOrders.orderId, orderIds));
  }

  // Pickup/Delivery schedules
  if (customerIds.length > 0) {
    await db.delete(pickupSchedules).where(inArray(pickupSchedules.customerId, customerIds));
    await db.delete(deliverySchedules).where(inArray(deliverySchedules.customerId, customerIds));
  }

  // Customer laundry preferences
  if (customerIds.length > 0) {
    await db.delete(customerLaundryPreferences).where(inArray(customerLaundryPreferences.customerId, customerIds));
  }

  // Gasul usage
  if (registerIds.length > 0) {
    const tankIds = (await db.query.gasulTanks.findMany({
      where: inArray(gasulTanks.locationId, locationIds),
      columns: { id: true },
    })).map(t => t.id);

    if (tankIds.length > 0) {
      await db.delete(gasulUsage).where(inArray(gasulUsage.tankId, tankIds));
    }
  }

  // 1. Order items
  if (orderIds.length > 0) {
    await db.delete(orderItems).where(inArray(orderItems.orderId, orderIds));
  }

  // 2. Payments
  if (orderIds.length > 0) {
    await db.delete(payments).where(inArray(payments.orderId, orderIds));
  }

  // 3. Receipts
  if (orderIds.length > 0) {
    await db.delete(receipts).where(inArray(receipts.orderId, orderIds));
  }

  // 4. Orders
  if (orderIds.length > 0) {
    await db.delete(orders).where(inArray(orders.id, orderIds));
  }

  // 5. Inventory adjustments
  if (productIds.length > 0 && locationIds.length > 0) {
    await db.delete(inventoryAdjustments).where(
      and(
        inArray(inventoryAdjustments.productId, productIds),
        inArray(inventoryAdjustments.locationId, locationIds)
      )
    );
  }

  // 6. Inventory
  if (productIds.length > 0 && locationIds.length > 0) {
    await db.delete(inventory).where(
      and(
        inArray(inventory.productId, productIds),
        inArray(inventory.locationId, locationIds)
      )
    );
  }

  // 7. Shifts
  if (registerIds.length > 0) {
    await db.delete(shifts).where(inArray(shifts.registerId, registerIds));
  }

  // 8. Consumption rules
  if (locationIds.length > 0) {
    await db.delete(consumptionRule).where(inArray(consumptionRule.locationId, locationIds));
  }

  // 9. Consumable thresholds
  if (locationIds.length > 0) {
    await db.delete(consumableThreshold).where(inArray(consumableThreshold.locationId, locationIds));
  }

  // 10. Gasul refills
  if (locationIds.length > 0) {
    const tankIds = (await db.query.gasulTanks.findMany({
      where: inArray(gasulTanks.locationId, locationIds),
      columns: { id: true },
    })).map(t => t.id);

    if (tankIds.length > 0) {
      await db.delete(gasulRefills).where(inArray(gasulRefills.tankId, tankIds));
    }
  }

  // 11. Gasul tanks
  if (locationIds.length > 0) {
    await db.delete(gasulTanks).where(inArray(gasulTanks.locationId, locationIds));
  }

  // 12. Wash cycles
  await db.delete(washCycles).where(eq(washCycles.organizationId, orgId));

  // 13. Garment types
  await db.delete(garmentTypes).where(eq(garmentTypes.organizationId, orgId));

  // 14. Products
  if (productIds.length > 0) {
    await db.delete(products).where(inArray(products.id, productIds));
  }

  // 15. Customers
  if (customerIds.length > 0) {
    await db.delete(customers).where(inArray(customers.id, customerIds));
  }

  // 16. Discounts
  if (discountIds.length > 0) {
    await db.delete(discounts).where(inArray(discounts.id, discountIds));
  }

  // 17. Categories
  if (categoryIds.length > 0) {
    await db.delete(categories).where(inArray(categories.id, categoryIds));
  }

  // 18. Non-test users
  if (userIdsToDelete.length > 0) {
    await db.delete(users).where(inArray(users.id, userIdsToDelete));
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only owners and admins can toggle data mode
    if (session.user.role !== 'owner' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only owners and admins can toggle data mode' }, { status: 403 });
    }

    const body = await request.json();
    const { dataMode } = body;

    if (!dataMode || !['demo', 'live'].includes(dataMode)) {
      return NextResponse.json({ error: 'Invalid dataMode. Must be "demo" or "live"' }, { status: 400 });
    }

    const orgId = session.user.organizationId;

    // If switching to live mode, erase demo data (keep test users)
    if (dataMode === 'live') {
      await eraseDemoData(orgId);
    }

    // If switching to demo mode, seed demo data
    if (dataMode === 'demo') {
      await seedDemoData(orgId, session.user.id);
    }

    const [org] = await db
      .update(organizations)
      .set({
        dataMode,
        demoDataErasedAt: dataMode === 'live' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId))
      .returning();

    return NextResponse.json({ organization: org });
  } catch (error) {
    console.error('Error toggling data mode:', error);
    return NextResponse.json({ error: 'Failed to toggle data mode' }, { status: 500 });
  }
}