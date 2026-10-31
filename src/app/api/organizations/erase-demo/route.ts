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
  registers
} from '@/lib/db/schema';
import { eq, and, ne, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only owners can erase demo data
    if (session.user.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden: Only owners can erase demo data' }, { status: 403 });
    }

    const orgId = session.user.organizationId;

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
    const testUserEmails = ['admin@freshfold.com', 'manager@freshfold.com', 'cashier1@freshfold.com', 'cashier2@freshfold.com'];
    const orgUsers = await db.query.users.findMany({
      where: and(
        eq(users.organizationId, orgId),
        // Don't delete test users
        ne(users.email, 'admin@freshfold.com'),
      ),
      columns: { id: true, email: true },
    });

    // Filter out test users
    const userIdsToDelete = orgUsers
      .filter(u => !testUserEmails.includes(u.email))
      .map(u => u.id);

    // Delete in order of dependencies (children first)
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

    // 8. Products
    if (productIds.length > 0) {
      await db.delete(products).where(inArray(products.id, productIds));
    }

    // 9. Customers
    if (customerIds.length > 0) {
      await db.delete(customers).where(inArray(customers.id, customerIds));
    }

    // 10. Discounts
    if (discountIds.length > 0) {
      await db.delete(discounts).where(inArray(discounts.id, discountIds));
    }

    // 11. Categories (except keep structure if needed, but for demo we delete)
    if (categoryIds.length > 0) {
      await db.delete(categories).where(inArray(categories.id, categoryIds));
    }

    // 12. Non-test users
    if (userIdsToDelete.length > 0) {
      await db.delete(users).where(inArray(users.id, userIdsToDelete));
    }

    // Update organization to mark demo data as erased
    const [org] = await db
      .update(organizations)
      .set({
        dataMode: 'live',
        demoDataErasedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId))
      .returning();

    return NextResponse.json({
      organization: org,
      message: 'Demo data erased successfully. Test users preserved.'
    });
  } catch (error) {
    console.error('Error erasing demo data:', error);
    return NextResponse.json({ error: 'Failed to erase demo data' }, { status: 500 });
  }
}