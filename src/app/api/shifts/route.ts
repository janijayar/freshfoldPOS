import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shifts, users, registers, locations } from '@/lib/db/schema';
import { eq, and, desc, asc, gte, lte, count } from 'drizzle-orm';
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
    const locationId = searchParams.get('locationId');
    const registerId = searchParams.get('registerId');
    const cashierId = searchParams.get('cashierId');
    const status = searchParams.get('status');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const conditions = [
      eq(locations.organizationId, session.user.organizationId),
    ];

    if (locationId) {
      conditions.push(eq(shifts.locationId, locationId));
    }
    if (registerId) {
      conditions.push(eq(shifts.registerId, registerId));
    }
    if (cashierId) {
      conditions.push(eq(shifts.cashierId, cashierId));
    }
    if (status) {
      conditions.push(eq(shifts.status, status as 'open' | 'closed' | 'discrepancy'));
    }
    if (fromDate) {
      conditions.push(gte(shifts.openedAt, new Date(fromDate)));
    }
    if (toDate) {
      conditions.push(lte(shifts.openedAt, new Date(toDate)));
    }

    const results = await db
      .select({
        shift: shifts,
        cashier: users,
        register: registers,
        location: locations,
      })
      .from(shifts)
      .innerJoin(users, eq(shifts.cashierId, users.id))
      .innerJoin(registers, eq(shifts.registerId, registers.id))
      .innerJoin(locations, eq(shifts.locationId, locations.id))
      .where(and(...conditions))
      .orderBy(desc(shifts.openedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ shifts: results });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { locationId, registerId } = body;

    // Generate shift number
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const countResult = await db
      .select({ count: count() })
      .from(shifts)
      .where(and(
        eq(shifts.locationId, locationId),
        gte(shifts.openedAt, new Date(today.setHours(0, 0, 0, 0)))
      ));
    const shiftNumber = `SHF-${dateStr}-${String((countResult[0]?.count || 0) + 1).padStart(3, '0')}`;

    const [shift] = await db
      .insert(shifts)
      .values({
        ...body,
        shiftNumber,
        cashierId: session.user.id,
        status: 'open',
        openedAt: new Date(),
      })
      .returning();

    // Audit log
    await createAuditLog({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      action: auditActions.create,
      entityType: auditEntityTypes.shift,
      entityId: shift.id,
      newData: shift,
    });

    return NextResponse.json({ shift }, { status: 201 });
  } catch (error) {
    console.error('Error creating shift:', error);
    return NextResponse.json({ error: 'Failed to create shift' }, { status: 500 });
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
      return NextResponse.json({ error: 'Shift ID required' }, { status: 400 });
    }

    // Get old data for audit log
    const [oldShift] = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, id))
      .limit(1);

    if (updates.status === 'closed') {
      updates.closedAt = new Date();
    }

    const [shift] = await db
      .update(shifts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(shifts.id, id))
      .returning();

    // Audit log
    await createAuditLog({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      action: auditActions.update,
      entityType: auditEntityTypes.shift,
      entityId: id,
      oldData: oldShift || null,
      newData: shift,
    });

    return NextResponse.json({ shift });
  } catch (error) {
    console.error('Error updating shift:', error);
    return NextResponse.json({ error: 'Failed to update shift' }, { status: 500 });
  }
}