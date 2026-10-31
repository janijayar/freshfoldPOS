import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gasulRefills, gasulTanks, users, locations } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';
import { createAuditLog, auditActions, auditEntityTypes } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tankId = searchParams.get('tankId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const conditions = [eq(gasulRefills.organizationId, orgId)];
    if (status) conditions.push(eq(gasulRefills.status, status as any));
    if (tankId) conditions.push(eq(gasulRefills.tankId, tankId));

    const refills = await db.query.gasulRefills.findMany({
      where: and(...conditions),
      orderBy: (gasulRefills, { desc }) => [desc(gasulRefills.orderedAt)],
      limit,
      offset,
      with: {
        tank: true,
        supplier: true,
        orderedByUser: true,
        receivedByUser: true,
      },
    });

    return NextResponse.json({ gasulRefills: refills });
  } catch (error) {
    console.error('Error fetching gasul refills:', error);
    return NextResponse.json({ error: 'Failed to fetch gasul refills' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const body = await request.json();

    // Get first location for the organization
    const location = await db.query.locations.findFirst({
      where: eq(locations.organizationId, orgId),
    });

    if (!location) {
      return NextResponse.json({ error: 'No location found for organization' }, { status: 400 });
    }

    // Verify tank belongs to organization
    const tank = await db.query.gasulTanks.findFirst({
      where: and(eq(gasulTanks.id, body.tankId), eq(gasulTanks.organizationId, orgId)),
    });

    if (!tank) {
      return NextResponse.json({ error: 'Gasul tank not found' }, { status: 404 });
    }

    const refill = await db.insert(gasulRefills).values({
      organizationId: orgId,
      locationId: location.id,
      tankId: body.tankId,
      quantity: body.quantity,
      pricePerTank: body.pricePerTank,
      deliveryFee: body.deliveryFee || 0,
      totalAmount: body.totalAmount,
      status: body.status || 'ordered',
      orderedAt: body.orderedAt ? new Date(body.orderedAt) : new Date(),
      deliveredAt: body.deliveredAt ? new Date(body.deliveredAt) : null,
      invoiceNumber: body.invoiceNumber,
      supplierId: body.supplierId || session.user.id,
      orderedBy: session.user.id,
      receivedBy: body.receivedBy || null,
      notes: body.notes,
    }).returning();

    // Audit log
    await createAuditLog({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      action: auditActions.create,
      entityType: auditEntityTypes.gasulRefill,
      entityId: refill[0].id,
      newData: refill[0],
    });

    return NextResponse.json({ gasulRefill: refill[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating gasul refill:', error);
    return NextResponse.json({ error: 'Failed to create gasul refill' }, { status: 500 });
  }
}