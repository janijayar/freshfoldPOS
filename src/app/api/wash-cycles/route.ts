import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { washCycles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const cycles = await db.query.washCycles.findMany({
      where: eq(washCycles.organizationId, orgId),
      orderBy: (washCycles, { asc }) => [asc(washCycles.sortOrder)],
    });

    return NextResponse.json({ washCycles: cycles });
  } catch (error) {
    console.error('Error fetching wash cycles:', error);
    return NextResponse.json({ error: 'Failed to fetch wash cycles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only owners, admins, and managers can create wash cycles
    if (!['owner', 'admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const orgId = session.user.organizationId;
    const body = await request.json();

    const cycle = await db.insert(washCycles).values({
      organizationId: orgId,
      name: body.name,
      cycleType: body.cycleType,
      description: body.description,
      durationMinutes: body.durationMinutes,
      temperatureCelsius: body.temperatureCelsius,
      spinSpeedRpm: body.spinSpeedRpm,
      priceModifier: body.priceModifier || '1.00',
      isActive: body.isActive !== false,
      sortOrder: body.sortOrder || 0,
    }).returning();

    return NextResponse.json({ washCycle: cycle[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating wash cycle:', error);
    return NextResponse.json({ error: 'Failed to create wash cycle' }, { status: 500 });
  }
}