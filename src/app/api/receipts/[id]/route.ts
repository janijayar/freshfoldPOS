import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { receipts, orders, orderItems, payments, users, registers, locations, customers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';


export const dynamic = 'force-dynamic';
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch receipt with order, location, register, cashier, and customer
    const receiptResults = await db
      .select({
        receipt: receipts,
        order: orders,
        location: locations,
        register: registers,
        cashier: users,
        customer: customers,
      })
      .from(receipts)
      .innerJoin(orders, eq(receipts.orderId, orders.id))
      .innerJoin(locations, eq(orders.locationId, locations.id))
      .innerJoin(registers, eq(orders.registerId, registers.id))
      .innerJoin(users, eq(orders.cashierId, users.id))
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(and(eq(receipts.id, id), eq(locations.organizationId, session.user.organizationId)))
      .limit(1);

    if (receiptResults.length === 0) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    const { receipt, order, location, register, cashier, customer } = receiptResults[0];

    // Fetch order items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    // Fetch payments
    const paymentResults = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, order.id));

    return NextResponse.json({
      receipt: {
        ...receipt,
        orderId: order.id,
        locationId: location.id,
        locationName: location.name,
        registerId: register.id,
        registerName: register.name,
        userId: cashier.id,
        userName: `${cashier.firstName} ${cashier.lastName}`,
        customerId: customer?.id || null,
        customerName: customer ? `${customer.firstName} ${customer.lastName}` : null,
        subtotalCents: order.subtotal,
        discountCents: order.discountAmount,
        taxCents: order.taxAmount,
        totalCents: order.total,
        currency: 'USD',
        currencySymbol: '$',
        status: order.status,
        items: items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.name,
          productSku: item.sku,
          quantity: item.quantity,
          unitPriceCents: item.unitPrice,
          discountCents: item.discountAmount,
          taxCents: item.taxAmount,
          totalCents: item.total,
        })),
        payments: paymentResults.map(payment => ({
          id: payment.id,
          method: payment.method,
          amountCents: payment.amount,
          cardDetails: payment.cardBrand && payment.cardLast4
            ? { last4: payment.cardLast4, brand: payment.cardBrand }
            : null,
          cashReceivedCents: payment.cashReceived,
          changeCents: payment.changeGiven,
          status: payment.status,
        })),
        createdAt: receipt.createdAt,
        printedAt: receipt.printedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json({ error: 'Failed to fetch receipt' }, { status: 500 });
  }
}