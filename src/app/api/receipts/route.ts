import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { receipts, orders } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const conditions = [
      eq(orders.organizationId, session.user.organizationId),
    ];

    if (orderId) {
      conditions.push(eq(receipts.orderId, orderId));
    }

    const results = await db
      .select({
        receipt: receipts,
        order: orders,
      })
      .from(receipts)
      .innerJoin(orders, eq(receipts.orderId, orders.id))
      .where(and(...conditions))
      .orderBy(desc(receipts.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ receipts: results });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const [receipt] = await db
      .insert(receipts)
      .values({
        ...body,
        printedAt: body.printed ? new Date() : null,
      })
      .returning();

    return NextResponse.json({ receipt }, { status: 201 });
  } catch (error) {
    console.error('Error creating receipt:', error);
    return NextResponse.json({ error: 'Failed to create receipt' }, { status: 500 });
  }
}