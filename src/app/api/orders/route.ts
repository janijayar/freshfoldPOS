import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, payments, customers, users, registers, inventory, products, receipts } from '@/lib/db/schema';
import { eq, and, ilike, or, desc, asc, gte, lte, count, sum, sql, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';
import { createAuditLog, auditActions, auditEntityTypes } from '@/lib/audit';


export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const registerId = searchParams.get('registerId');
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const conditions = [eq(orders.organizationId, session.user.organizationId)];

    if (locationId) {
      conditions.push(eq(orders.locationId, locationId));
    }
    if (registerId) {
      conditions.push(eq(orders.registerId, registerId));
    }
    if (customerId) {
      conditions.push(eq(orders.customerId, customerId));
    }
    if (status) {
      conditions.push(eq(orders.status, status as 'pending' | 'completed' | 'refunded' | 'voided'));
    }
    if (fromDate) {
      conditions.push(gte(orders.createdAt, new Date(fromDate)));
    }
    if (toDate) {
      conditions.push(lte(orders.createdAt, new Date(toDate)));
    }
    if (search) {
      conditions.push(
        or(
          ilike(orders.orderNumber, `%${search}%`),
          ilike(customers.firstName, `%${search}%`),
          ilike(customers.lastName, `%${search}%`)
        )!
      );
    }

    const orderBy = sortOrder === 'desc'
      ? desc(orders[sortBy as keyof typeof orders] as any)
      : asc(orders[sortBy as keyof typeof orders] as any);

    const results = await db
      .select({
        order: orders,
        customer: customers,
        cashier: users,
        register: registers,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(users, eq(orders.cashierId, users.id))
      .leftJoin(registers, eq(orders.registerId, registers.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const orderIds = results.map(r => r.order.id);
    let items: any[] = [];
    let paymentsData: any[] = [];

    if (orderIds.length > 0) {
      items = await db
        .select()
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds));

      paymentsData = await db
        .select()
        .from(payments)
        .where(inArray(payments.orderId, orderIds));
    }

    const ordersWithDetails = results.map(({ order, customer, cashier, register }) => ({
      ...order,
      customer,
      cashier,
      register,
      items: items.filter(i => i.orderId === order.id),
      payments: paymentsData.filter(p => p.orderId === order.id),
    }));

    return NextResponse.json({ orders: ordersWithDetails });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items, payments: paymentData, customerId, registerId, locationId, ...orderData } = body;

    // Generate order number
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const countResult = await db
      .select({ count: count() })
      .from(orders)
      .where(and(
        eq(orders.organizationId, session.user.organizationId),
        gte(orders.createdAt, new Date(today.setHours(0, 0, 0, 0)))
      ));
    const orderNumber = `ORD-${dateStr}-${String((countResult[0]?.count || 0) + 1).padStart(4, '0')}`;

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + item.unitPrice * item.quantity, 0);
    const discountAmount = items.reduce((sum: number, item: any) => sum + (item.discount || 0) * item.quantity, 0) + (orderData.discountAmount || 0);
    const taxAmount = items.reduce((sum: number, item: any) => sum + (item.tax || 0) * item.quantity, 0);
    const total = subtotal - discountAmount + taxAmount;

    const [order] = await db
      .insert(orders)
      .values({
        ...orderData,
        organizationId: session.user.organizationId,
        locationId: locationId || session.user.organizationId, // Need proper location
        registerId: registerId || null,
        customerId: customerId || null,
        cashierId: session.user.id,
        orderNumber,
        subtotal,
        discountAmount,
        taxAmount,
        total,
        status: 'completed',
        completedAt: new Date(),
      })
      .returning();

    // Insert order items
    if (items.length > 0) {
      // Fetch product details for items that don't have all required fields
      const productIds = items
        .filter((item: any) => item.productId && (!item.name || item.taxAmount === undefined || item.total === undefined))
        .map((item: any) => item.productId);

      let productMap = new Map();
      if (productIds.length > 0) {
        const productsData = await db
          .select()
          .from(products)
          .where(inArray(products.id, productIds));
        productMap = new Map(productsData.map(p => [p.id, p]));
      }

      await db.insert(orderItems).values(
        items.map((item: any) => {
          const product = productMap.get(item.productId);
          const itemTotal = item.unitPrice * item.quantity;
          const itemTax = item.taxAmount ?? (item.tax || 0) * item.quantity;

          return {
            orderId: order.id,
            productId: item.productId || null,
            variantId: item.variantId || null,
            name: item.name || product?.name || 'Unknown Product',
            sku: item.sku || product?.sku || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountAmount: item.discountAmount ?? (item.discount || 0),
            taxAmount: itemTax,
            total: item.total ?? (itemTotal + itemTax - (item.discountAmount || 0)),
            metadata: item.metadata || {},
          };
        })
      );
    }

    // Insert payments
    if (paymentData && paymentData.length > 0) {
      await db.insert(payments).values(
        paymentData.map((p: any) => ({
          ...p,
          orderId: order.id,
          processedAt: new Date(),
        }))
      );
    }

    // Update inventory
    for (const item of items) {
      if (item.variantId) {
        await db
          .update(inventory)
          .set({ quantity: sql`${inventory.quantity} - ${item.quantity}` })
          .where(and(eq(inventory.locationId, locationId || ''), eq(inventory.variantId, item.variantId)));
      } else if (item.productId) {
        await db
          .update(inventory)
          .set({ quantity: sql`${inventory.quantity} - ${item.quantity}` })
          .where(and(eq(inventory.locationId, locationId || ''), eq(inventory.productId, item.productId)));
      }
    }

    // Update customer stats
    if (customerId) {
      await db
        .update(customers)
        .set({
          totalSpent: sql`${customers.totalSpent} + ${total}`,
          visitCount: sql`${customers.visitCount} + 1`,
          lastVisitAt: new Date(),
        })
        .where(eq(customers.id, customerId));
    }

    // Auto-generate receipt for completed orders
    if (orderData.status === 'completed' || order.status === 'completed') {
      await db.insert(receipts).values({
        orderId: order.id,
        receiptNumber: `RCP-${orderNumber}`,
        type: 'sale',
        content: {},
        printedAt: new Date(),
      });
    }

    // Audit log
    await createAuditLog({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      action: auditActions.create,
      entityType: auditEntityTypes.order,
      entityId: order.id,
      newData: { ...order, items, payments: paymentData },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}