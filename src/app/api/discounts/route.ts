import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { discounts } from '@/lib/db/schema';
import { eq, and, ilike, gte, lte } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';


export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    const conditions = [eq(discounts.organizationId, session.user.organizationId)];

    if (active !== null) {
      conditions.push(eq(discounts.isActive, active === 'true'));
    }
    if (type) {
      conditions.push(eq(discounts.type, type));
    }
    if (search) {
      conditions.push(ilike(discounts.name, `%${search}%`));
    }

    const results = await db
      .select()
      .from(discounts)
      .where(and(...conditions))
      .orderBy(discounts.createdAt);

    return NextResponse.json({ discounts: results });
  } catch (error) {
    console.error('Error fetching discounts:', error);
    return NextResponse.json({ error: 'Failed to fetch discounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const [discount] = await db
      .insert(discounts)
      .values({
        ...body,
        organizationId: session.user.organizationId,
        value: body.value?.toString() || '0',
        maxAmount: body.maxAmount || null,
      })
      .returning();

    return NextResponse.json({ discount }, { status: 201 });
  } catch (error) {
    console.error('Error creating discount:', error);
    return NextResponse.json({ error: 'Failed to create discount' }, { status: 500 });
  }
}