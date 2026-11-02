import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq, and, ilike, asc } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';
import { hasSpecificPermission } from '@/lib/permissions';


export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check inventory.view permission
    if (!hasSpecificPermission(session.user.role as any, 'inventory', 'view')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
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

    // Check inventory.create permission
    if (!hasSpecificPermission(session.user.role as any, 'inventory', 'create')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
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

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check inventory.edit permission
    if (!hasSpecificPermission(session.user.role as any, 'inventory', 'edit')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const result = await db
      .update(categories)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(and(eq(categories.id, id), eq(categories.organizationId, session.user.organizationId)))
      .returning();

    const resultArray = Array.isArray(result) ? result : (result as any).rows || [];
    if (resultArray.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ category: resultArray[0] });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check inventory.delete permission
    if (!hasSpecificPermission(session.user.role as any, 'inventory', 'delete')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const result = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.organizationId, session.user.organizationId)))
      .returning();

    const resultArray = Array.isArray(result) ? result : (result as any).rows || [];
    if (resultArray.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}