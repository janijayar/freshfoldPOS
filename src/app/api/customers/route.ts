import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq, and, ilike, or, desc, asc } from 'drizzle-orm';
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
    const search = searchParams.get('search');
    const loyaltyTier = searchParams.get('loyaltyTier');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const conditions = [eq(customers.organizationId, session.user.organizationId)];

    if (search) {
      conditions.push(
        or(
          ilike(customers.firstName, `%${search}%`),
          ilike(customers.lastName, `%${search}%`),
          ilike(customers.email, `%${search}%`),
          ilike(customers.phone, `%${search}%`)
        )!
      );
    }
    if (loyaltyTier) {
      conditions.push(eq(customers.loyaltyTier, loyaltyTier));
    }

    const orderBy = sortOrder === 'desc'
      ? desc(customers[sortBy as keyof typeof customers] as any)
      : asc(customers[sortBy as keyof typeof customers] as any);

    const results = await db
      .select()
      .from(customers)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ customers: results });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const [customer] = await db
      .insert(customers)
      .values({
        ...body,
        organizationId: session.user.organizationId,
        totalSpent: body.totalSpent || 0,
        visitCount: body.visitCount || 0,
        loyaltyPoints: body.loyaltyPoints || 0,
        loyaltyTier: body.loyaltyTier || 'bronze',
      })
      .returning();

    // Audit log
    await createAuditLog({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      action: auditActions.create,
      entityType: auditEntityTypes.customer,
      entityId: customer.id,
      newData: customer,
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    // Get old data for audit log
    const [oldCustomer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.organizationId, session.user.organizationId)))
      .limit(1);

    const [customer] = await db
      .update(customers)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(customers.id, id), eq(customers.organizationId, session.user.organizationId)))
      .returning();

    // Audit log
    await createAuditLog({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      action: auditActions.update,
      entityType: auditEntityTypes.customer,
      entityId: id,
      oldData: oldCustomer || null,
      newData: customer,
    });

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only owners and admins can delete
    if (!['owner', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    // Get old data for audit log
    const [oldCustomer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.organizationId, session.user.organizationId)))
      .limit(1);

    await db
      .delete(customers)
      .where(and(eq(customers.id, id), eq(customers.organizationId, session.user.organizationId)));

    // Audit log
    await createAuditLog({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      action: auditActions.delete,
      entityType: auditEntityTypes.customer,
      entityId: id,
      oldData: oldCustomer || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}