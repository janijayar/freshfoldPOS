import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, products, customers, inventory, shifts, users, registers } from '@/lib/db/schema';
import { eq, and, gte, lte, desc, asc, count, sum, sql, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const fromDateParam = searchParams.get('fromDate');
    const toDateParam = searchParams.get('toDate');
    const fromDate = (fromDateParam && fromDateParam !== 'undefined') ? fromDateParam : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const toDate = (toDateParam && toDateParam !== 'undefined') ? toDateParam : new Date().toISOString();
    const compareFromDate = searchParams.get('compareFromDate');
    const compareToDate = searchParams.get('compareToDate');

    const orgId = session.user.organizationId;
    const locationCondition = locationId ? eq(orders.locationId, locationId) : undefined;

    // Current period stats
    const conditions = [
      eq(orders.organizationId, orgId),
      gte(orders.createdAt, new Date(fromDate)),
      lte(orders.createdAt, new Date(toDate)),
    ];
    if (locationCondition) conditions.push(locationCondition);

    const [currentStats] = await db
      .select({
        totalSales: sum(orders.total),
        orderCount: count(orders.id),
        avgOrderValue: sql<number>`CASE WHEN ${count(orders.id)} > 0 THEN ${sum(orders.total)} / ${count(orders.id)} ELSE 0 END`,
      })
      .from(orders)
      .where(and(...conditions));

    // Previous period for comparison
    let previousStats: any = { totalSales: 0, orderCount: 0, avgOrderValue: 0 };
    if (compareFromDate && compareToDate) {
      const compareConditions = [
        eq(orders.organizationId, orgId),
        gte(orders.createdAt, new Date(compareFromDate)),
        lte(orders.createdAt, new Date(compareToDate)),
      ];
      if (locationCondition) compareConditions.push(locationCondition);

      const [prev] = await db
        .select({
          totalSales: sum(orders.total),
          orderCount: count(orders.id),
          avgOrderValue: sql<number>`CASE WHEN ${count(orders.id)} > 0 THEN ${sum(orders.total)} / ${count(orders.id)} ELSE 0 END`,
        })
        .from(orders)
        .where(and(...compareConditions));
      previousStats = prev;
    }

    // Recent orders
    const recentOrders = await db
      .select({
        order: orders,
        customer: customers,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt))
      .limit(10);

    // Top products
    const topProducts = await db
      .select({
        product: products,
        quantitySold: sum(orderItems.quantity),
        revenue: sum(sql`${orderItems.unitPrice} * ${orderItems.quantity}`),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(and(
        eq(orders.organizationId, orgId),
        gte(orders.createdAt, new Date(fromDate)),
        lte(orders.createdAt, new Date(toDate)),
        locationCondition ? locationCondition : sql`true`
      ))
      .groupBy(products.id)
      .orderBy(desc(sum(orderItems.quantity)))
      .limit(10);

    // Low stock
    const lowStock = await db
      .select({
        inventory: inventory,
        product: products,
      })
      .from(inventory)
      .innerJoin(products, eq(inventory.productId, products.id))
      .where(and(
        eq(products.organizationId, orgId),
        lte(inventory.quantity, inventory.reorderPoint),
        locationId ? eq(inventory.locationId, locationId) : sql`true`
      ))
      .limit(10);

    // Customer count
    const [customerCount] = await db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.organizationId, orgId));

    // Active shifts
    const activeShifts = await db
      .select({
        shift: shifts,
        cashier: users,
        register: registers,
      })
      .from(shifts)
      .innerJoin(users, eq(shifts.cashierId, users.id))
      .innerJoin(registers, eq(shifts.registerId, registers.id))
      .where(and(
        eq(shifts.status, 'open'),
        locationId ? eq(shifts.locationId, locationId) : sql`true`
      ));

    return NextResponse.json({
      stats: {
        current: currentStats,
        previous: previousStats,
        customerCount: customerCount.count,
      },
      recentOrders,
      topProducts,
      lowStock,
      activeShifts,
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 });
  }
}