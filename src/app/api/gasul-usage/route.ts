import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gasulUsage, gasulTanks, locations, users } from '@/lib/db/schema';
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
    const tankId = searchParams.get('tankId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const conditions = [eq(gasulUsage.organizationId, orgId)];
    if (tankId) conditions.push(eq(gasulUsage.tankId, tankId));
    if (startDate) conditions.push(eq(gasulUsage.startedAt, new Date(startDate)));
    if (endDate) conditions.push(eq(gasulUsage.startedAt, new Date(endDate)));

    const usage = await db.query.gasulUsage.findMany({
      where: and(...conditions),
      orderBy: (gasulUsage, { desc }) => [desc(gasulUsage.startedAt)],
      limit,
      offset,
      with: {
        tank: true,
        recordedByUser: true,
      },
    });

    return NextResponse.json({ gasulUsage: usage });
  } catch (error) {
    console.error('Error fetching gasul usage:', error);
    return NextResponse.json({ error: 'Failed to fetch gasul usage' }, { status: 500 });
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

    const usage = await db.insert(gasulUsage).values({
      organizationId: orgId,
      locationId: location.id,
      tankId: body.tankId,
      equipment: body.equipment || 'dryer',
      startWeightKg: body.startWeightKg || body.weightBeforeKg,
      endWeightKg: body.endWeightKg || body.weightAfterKg,
      consumedKg: body.consumedKg || body.weightUsedKg,
      startedAt: body.startedAt ? new Date(body.startedAt) : new Date(),
      recordedBy: session.user.id,
      notes: body.notes,
    }).returning();

    // Update tank status based on usage
    const consumedKg = body.consumedKg || body.weightUsedKg || 0;
    const tareWeight = tank.tareWeightKg ?? 0;
    const capacityKg = tank.capacityKg ?? 0;
    const remainingWeight = tareWeight + (capacityKg - consumedKg);
    let newStatus = tank.status;
    if (remainingWeight <= tareWeight + 1) {
      newStatus = 'empty';
    } else if (remainingWeight < tareWeight + capacityKg * 0.2) {
      newStatus = 'in_use'; // Using 'in_use' as 'low' is not a valid enum value
    }

    await db
      .update(gasulTanks)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(gasulTanks.id, body.tankId));

    // Audit log
    await createAuditLog({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      action: auditActions.create,
      entityType: auditEntityTypes.gasulUsage,
      entityId: usage[0].id,
      newData: usage[0],
    });

    return NextResponse.json({ gasulUsage: usage[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating gasul usage:', error);
    return NextResponse.json({ error: 'Failed to create gasul usage' }, { status: 500 });
  }
}