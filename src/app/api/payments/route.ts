import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments, orders } from '@/lib/db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';


export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const method = searchParams.get('method');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const conditions = [
      eq(orders.organizationId, session.user.organizationId),
    ];

    if (orderId) {
      conditions.push(eq(payments.orderId, orderId));
    }
    if (method) {
      conditions.push(eq(payments.method, method as 'cash' | 'card' | 'gift_card' | 'split'));
    }
    if (fromDate) {
      conditions.push(gte(payments.processedAt, new Date(fromDate)));
    }
    if (toDate) {
      conditions.push(lte(payments.processedAt, new Date(toDate)));
    }

    const results = await db
      .select({
        payment: payments,
        order: orders,
      })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .where(and(...conditions))
      .orderBy(desc(payments.processedAt));

    return NextResponse.json({ payments: results });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const [payment] = await db
      .insert(payments)
      .values({
        ...body,
        processedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}