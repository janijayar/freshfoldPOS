import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deliverySchedules, locations } from '@/lib/db/schema';
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

    const schedule = await db.query.deliverySchedules.findFirst({
      where: and(eq(deliverySchedules.id, id), eq(deliverySchedules.organizationId, orgId)),
      with: {
        customer: true,
        driver: true,
        location: true,
      },
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Delivery schedule not found' }, { status: 404 });
    }

    return NextResponse.json({ deliverySchedule: schedule });
  } catch (error) {
    console.error('Error fetching delivery schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch delivery schedule' }, { status: 500 });
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

    const { id } = await params;
    const orgId = session.user.organizationId;
    const body = await request.json();

    const schedule = await db
      .update(deliverySchedules)
      .set({
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        address: body.address,
        city: body.city,
        state: body.state,
        zip: body.zip,
        contactPhone: body.contactPhone,
        contactName: body.contactName,
        notes: body.notes,
        status: body.status,
        driverId: body.driverId,
        completedAt: body.status === 'completed' ? new Date() : undefined,
        proofOfDelivery: body.proofOfDelivery,
        updatedAt: new Date(),
      })
      .where(and(eq(deliverySchedules.id, id), eq(deliverySchedules.organizationId, orgId)))
      .returning();

    if (!schedule.length) {
      return NextResponse.json({ error: 'Delivery schedule not found' }, { status: 404 });
    }

    return NextResponse.json({ deliverySchedule: schedule[0] });
  } catch (error) {
    console.error('Error updating delivery schedule:', error);
    return NextResponse.json({ error: 'Failed to update delivery schedule' }, { status: 500 });
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

    // Only owners and admins can delete
    if (!['owner', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const orgId = session.user.organizationId;

    await db
      .delete(deliverySchedules)
      .where(and(eq(deliverySchedules.id, id), eq(deliverySchedules.organizationId, orgId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting delivery schedule:', error);
    return NextResponse.json({ error: 'Failed to delete delivery schedule' }, { status: 500 });
  }
}