import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers, organizations } from '@/lib/db/schema';
import { eq, and, ilike, or, desc, asc, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';
import { createAuditLog, auditActions, auditEntityTypes } from '@/lib/audit';
import { hasSpecificPermission } from '@/lib/permissions';


export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check customers.view permission
    if (!hasSpecificPermission(session.user.role as any, 'customers', 'view')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // If ID is provided, fetch single customer
    if (id) {
      const [customer] = await db
        .select({
          id: customers.id,
          organizationId: customers.organizationId,
          firstName: customers.firstName,
          lastName: customers.lastName,
          email: customers.email,
          phone: customers.phone,
          dateOfBirth: customers.dateOfBirth,
          address: customers.address,
          city: customers.city,
          state: customers.state,
          zip: customers.zip,
          country: customers.country,
          loyaltyTier: customers.loyaltyTier,
          loyaltyPoints: customers.loyaltyPoints,
          totalSpent: customers.totalSpent,
          visitCount: customers.visitCount,
          lastVisitAt: customers.lastVisitAt,
          acceptsMarketing: customers.acceptsMarketing,
          notes: customers.notes,
          metadata: customers.metadata,
          createdAt: customers.createdAt,
          updatedAt: customers.updatedAt,
          isActive: sql<boolean>`CASE WHEN ${customers.lastVisitAt} IS NOT NULL AND ${customers.lastVisitAt} > (NOW() - INTERVAL '90 days') THEN true ELSE false END`.as('isActive'),
        })
        .from(customers)
        .where(and(eq(customers.id, id), eq(customers.organizationId, session.user.organizationId)))
        .limit(1);

      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }

      return NextResponse.json({ customer });
    }

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

    // Add computed isActive field based on lastVisitAt (active if visited within 90 days)
    const results = await db
      .select({
        id: customers.id,
        organizationId: customers.organizationId,
        firstName: customers.firstName,
        lastName: customers.lastName,
        email: customers.email,
        phone: customers.phone,
        dateOfBirth: customers.dateOfBirth,
        address: customers.address,
        city: customers.city,
        state: customers.state,
        zip: customers.zip,
        country: customers.country,
        loyaltyTier: customers.loyaltyTier,
        loyaltyPoints: customers.loyaltyPoints,
        totalSpent: customers.totalSpent,
        visitCount: customers.visitCount,
        lastVisitAt: customers.lastVisitAt,
        acceptsMarketing: customers.acceptsMarketing,
        notes: customers.notes,
        metadata: customers.metadata,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
        isActive: sql<boolean>`CASE WHEN ${customers.lastVisitAt} IS NOT NULL AND ${customers.lastVisitAt} > (NOW() - INTERVAL '90 days') THEN true ELSE false END`.as('isActive'),
      })
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

    // Check customers.create permission
    if (!hasSpecificPermission(session.user.role as any, 'customers', 'create')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.firstName || !body.lastName) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 });
    }

    // Verify organization exists (prevents FK violation on insert)
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, session.user.organizationId),
    });
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 409 });
    }

    // Map frontend field names to database schema
    const customerData = {
      organizationId: session.user.organizationId,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email || null,
      phone: body.phone || null,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      zip: body.postalCode || body.zip || null,
      country: body.country || 'US',
      loyaltyTier: body.loyaltyTier || 'bronze',
      loyaltyPoints: 0,
      totalSpent: 0,
      visitCount: 0,
      acceptsMarketing: body.marketingConsent || body.acceptsMarketing || false,
      notes: body.notes || null,
    };

    const [customer] = await db
      .insert(customers)
      .values(customerData)
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

    // Check customers.edit permission
    if (!hasSpecificPermission(session.user.role as any, 'customers', 'edit')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    // Map frontend field names to database schema
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (updates.firstName !== undefined) updateData.firstName = updates.firstName;
    if (updates.lastName !== undefined) updateData.lastName = updates.lastName;
    if (updates.email !== undefined) updateData.email = updates.email || null;
    if (updates.phone !== undefined) updateData.phone = updates.phone || null;
    if (updates.dateOfBirth !== undefined) updateData.dateOfBirth = updates.dateOfBirth ? new Date(updates.dateOfBirth) : null;
    if (updates.address !== undefined) updateData.address = updates.address || null;
    if (updates.city !== undefined) updateData.city = updates.city || null;
    if (updates.state !== undefined) updateData.state = updates.state || null;
    if (updates.postalCode !== undefined) updateData.zip = updates.postalCode;
    if (updates.zip !== undefined) updateData.zip = updates.zip;
    if (updates.country !== undefined) updateData.country = updates.country;
    if (updates.loyaltyTier !== undefined) updateData.loyaltyTier = updates.loyaltyTier;
    if (updates.loyaltyPoints !== undefined) updateData.loyaltyPoints = updates.loyaltyPoints;
    if (updates.totalSpent !== undefined) updateData.totalSpent = updates.totalSpent;
    if (updates.visitCount !== undefined) updateData.visitCount = updates.visitCount;
    if (updates.acceptsMarketing !== undefined) updateData.acceptsMarketing = updates.acceptsMarketing;
    if (updates.marketingConsent !== undefined) updateData.acceptsMarketing = updates.marketingConsent;
    if (updates.notes !== undefined) updateData.notes = updates.notes || null;

    // Get old data for audit log
    const [oldCustomer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.organizationId, session.user.organizationId)))
      .limit(1);

    const [customer] = await db
      .update(customers)
      .set(updateData)
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

    // Check customers.delete permission
    if (!hasSpecificPermission(session.user.role as any, 'customers', 'delete')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
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
