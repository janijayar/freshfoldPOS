import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq, and, ilike, asc } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';


export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const active = searchParams.get('active');

    const conditions = [eq(categories.organizationId, session.user.organizationId)];

    if (parentId) {
      conditions.push(eq(categories.parentId, parentId));
    } else if (parentId === 'null') {
      conditions.push(eq(categories.parentId, null as any));
    }
    if (active !== null) {
      conditions.push(eq(categories.isActive, active === 'true'));
    }

    const results = await db
      .select()
      .from(categories)
      .where(and(...conditions))
      .orderBy(asc(categories.sortOrder), asc(categories.name));

    return NextResponse.json({ categories: results });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = await db
      .insert(categories)
      .values({
        ...body,
        organizationId: session.user.organizationId,
      })
      .returning();

    const category = (result as any[])[0];

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}