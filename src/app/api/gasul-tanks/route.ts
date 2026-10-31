import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gasulTanks, locations } from '@/lib/db/schema';
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
    const locationId = searchParams.get('locationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const conditions = [eq(gasulTanks.organizationId, orgId)];
    if (status) conditions.push(eq(gasulTanks.status, status as any));
    if (locationId) conditions.push(eq(gasulTanks.locationId, locationId));

    const tanks = await db.query.gasulTanks.findMany({
      where: and(...conditions),
      orderBy: (gasulTanks, { desc }) => [desc(gasulTanks.createdAt)],
      limit,
      offset,
      with: {
        location: true,
        refills: {
          orderBy: (gasulRefills, { desc }) => [desc(gasulRefills.orderedAt)],
          limit: 5,
        },
      },
    });

    return NextResponse.json({ gasulTanks: tanks });
  } catch (error) {
    console.error('Error fetching gasul tanks:', error);
    return NextResponse.json({ error: 'Failed to fetch gasul tanks' }, { status: 500 });
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

    // Get first location for the organization if not provided
    let locationId = body.locationId;
    if (!locationId) {
      const location = await db.query.locations.findFirst({
        where: eq(locations.organizationId, orgId),
      });
      if (!location) {
        return NextResponse.json({ error: 'No location found for organization' }, { status: 400 });
      }
      locationId = location.id;
    }

    const tank = await db.insert(gasulTanks).values({
      organizationId: orgId,
      locationId,
      serialNumber: body.serialNumber,
      brand: body.brand,
      capacityKg: body.capacityKg,
      tareWeightKg: body.tareWeightKg,
      status: body.status || 'full',
      notes: body.notes,
    }).returning();

    // Audit log
    await createAuditLog({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      action: auditActions.create,
      entityType: auditEntityTypes.gasulTank,
      entityId: tank[0].id,
      newData: tank[0],
    });

    return NextResponse.json({ gasulTank: tank[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating gasul tank:', error);
    return NextResponse.json({ error: 'Failed to create gasul tank' }, { status: 500 });
  }
}