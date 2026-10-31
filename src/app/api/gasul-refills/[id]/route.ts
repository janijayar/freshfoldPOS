import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gasulRefills, gasulTanks, users } from '@/lib/db/schema';
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

    const refill = await db.query.gasulRefills.findFirst({
      where: and(eq(gasulRefills.id, id), eq(gasulRefills.organizationId, orgId)),
      with: {
        tank: true,
        supplier: true,
        orderedByUser: true,
        receivedByUser: true,
      },
    });

    if (!refill) {
      return NextResponse.json({ error: 'Gasul refill not found' }, { status: 404 });
    }

    return NextResponse.json({ gasulRefill: refill });
  } catch (error) {
    console.error('Error fetching gasul refill:', error);
    return NextResponse.json({ error: 'Failed to fetch gasul refill' }, { status: 500 });
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
      quantity: body.quantity,
      pricePerTank: body.pricePerTank,
      deliveryFee: body.deliveryFee,
      totalAmount: body.totalAmount,
      status: body.status,
      orderedAt: body.orderedAt ? new Date(body.orderedAt) : undefined,
      deliveredAt: body.deliveredAt ? new Date(body.deliveredAt) : undefined,
      invoiceNumber: body.invoiceNumber,
      supplierId: body.supplierId,
      receivedBy: body.receivedBy,
      notes: body.notes,
      updatedAt: new Date(),
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const refill = await db
      .update(gasulRefills)
      .set(updateData)
      .where(and(eq(gasulRefills.id, id), eq(gasulRefills.organizationId, orgId)))
      .returning();

    if (!refill.length) {
      return NextResponse.json({ error: 'Gasul refill not found' }, { status: 404 });
    }

    // If status changed to delivered, update tank status to full
    if (body.status === 'delivered') {
      await db
        .update(gasulTanks)
        .set({ status: 'full', updatedAt: new Date() })
        .where(eq(gasulTanks.id, refill[0].tankId));
    }

    return NextResponse.json({ gasulRefill: refill[0] });
  } catch (error) {
    console.error('Error updating gasul refill:', error);
    return NextResponse.json({ error: 'Failed to update gasul refill' }, { status: 500 });
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

    await db.delete(gasulRefills).where(and(eq(gasulRefills.id, id), eq(gasulRefills.organizationId, orgId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting gasul refill:', error);
    return NextResponse.json({ error: 'Failed to delete gasul refill' }, { status: 500 });
  }
}