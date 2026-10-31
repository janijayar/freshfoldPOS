import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { laundryOrders, laundryOrderItems, orders, customers, locations } from '@/lib/db/schema';
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

    const order = await db.query.laundryOrders.findFirst({
      where: and(eq(laundryOrders.id, id), eq(laundryOrders.organizationId, orgId)),
      with: {
        customer: true,
        order: true,
        pickupSchedule: {
          with: { customer: true, driver: true },
        },
        deliverySchedule: {
          with: { customer: true, driver: true },
        },
        items: {
          with: {
            garmentType: true,
            washCycle: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Laundry order not found' }, { status: 404 });
    }

    return NextResponse.json({ laundryOrder: order });
  } catch (error) {
    console.error('Error fetching laundry order:', error);
    return NextResponse.json({ error: 'Failed to fetch laundry order' }, { status: 500 });
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

    const updateData: any = {
      status: body.status,
      totalWeightKg: body.totalWeightKg,
      totalItems: body.totalItems,
      bagCount: body.bagCount,
      specialInstructions: body.specialInstructions,
      updatedAt: new Date(),
    };

    // Add timestamp fields based on status
    if (body.status === 'washing') updateData.washStartedAt = new Date();
    if (body.status === 'drying') updateData.dryStartedAt = new Date();
    if (body.status === 'folding') updateData.foldStartedAt = new Date();
    if (body.status === 'ready_for_pickup') updateData.readyAt = new Date();
    if (body.status === 'out_for_delivery') updateData.deliveredAt = new Date();
    if (body.status === 'completed' || body.status === 'delivered') updateData.completedAt = new Date();

    const order = await db
      .update(laundryOrders)
      .set(updateData)
      .where(and(eq(laundryOrders.id, id), eq(laundryOrders.organizationId, orgId)))
      .returning();

    if (!order.length) {
      return NextResponse.json({ error: 'Laundry order not found' }, { status: 404 });
    }

    return NextResponse.json({ laundryOrder: order[0] });
  } catch (error) {
    console.error('Error updating laundry order:', error);
    return NextResponse.json({ error: 'Failed to update laundry order' }, { status: 500 });
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

    // Delete items first (cascade should handle this but just in case)
    await db.delete(laundryOrderItems).where(eq(laundryOrderItems.laundryOrderId, id));
    await db.delete(laundryOrders).where(and(eq(laundryOrders.id, id), eq(laundryOrders.organizationId, orgId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting laundry order:', error);
    return NextResponse.json({ error: 'Failed to delete laundry order' }, { status: 500 });
  }
}