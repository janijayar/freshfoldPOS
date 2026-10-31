import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { washCycles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const orgId = session.user.organizationId;

    const cycle = await db.query.washCycles.findFirst({
      where: and(eq(washCycles.id, id), eq(washCycles.organizationId, orgId)),
    });

    if (!cycle) {
      return NextResponse.json({ error: 'Wash cycle not found' }, { status: 404 });
    }

    return NextResponse.json({ washCycle: cycle });
  } catch (error) {
    console.error('Error fetching wash cycle:', error);
    return NextResponse.json({ error: 'Failed to fetch wash cycle' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only owners, admins, and managers can update wash cycles
    if (!['owner', 'admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const orgId = session.user.organizationId;
    const body = await request.json();

    const cycle = await db
      .update(washCycles)
      .set({
        name: body.name,
        cycleType: body.cycleType,
        description: body.description,
        durationMinutes: body.durationMinutes,
        temperatureCelsius: body.temperatureCelsius,
        spinSpeedRpm: body.spinSpeedRpm,
        priceModifier: body.priceModifier,
        isActive: body.isActive,
        sortOrder: body.sortOrder,
        updatedAt: new Date(),
      })
      .where(and(eq(washCycles.id, id), eq(washCycles.organizationId, orgId)))
      .returning();

    if (!cycle.length) {
      return NextResponse.json({ error: 'Wash cycle not found' }, { status: 404 });
    }

    return NextResponse.json({ washCycle: cycle[0] });
  } catch (error) {
    console.error('Error updating wash cycle:', error);
    return NextResponse.json({ error: 'Failed to update wash cycle' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only owners and admins can delete wash cycles
    if (!['owner', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const orgId = session.user.organizationId;

    await db
      .delete(washCycles)
      .where(and(eq(washCycles.id, id), eq(washCycles.organizationId, orgId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting wash cycle:', error);
    return NextResponse.json({ error: 'Failed to delete wash cycle' }, { status: 500 });
  }
}