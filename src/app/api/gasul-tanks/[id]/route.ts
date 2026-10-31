import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gasulTanks, gasulRefills, gasulUsage } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';
import { createAuditLog, auditActions, auditEntityTypes } from '@/lib/audit';

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

    const tank = await db.query.gasulTanks.findFirst({
      where: and(eq(gasulTanks.id, id), eq(gasulTanks.organizationId, orgId)),
      with: {
        location: true,
        refills: {
          orderBy: (gasulRefills, { desc }) => [desc(gasulRefills.orderedAt)],
          with: {
            supplier: true,
            orderedBy: true,
            receivedBy: true,
          },
        },
        usage: {
          orderBy: (gasulUsage, { desc }) => [desc(gasulUsage.recordedAt)],
          limit: 20,
          with: {
            recordedBy: true,
          },
        },
      },
    });

    if (!tank) {
      return NextResponse.json({ error: 'Gasul tank not found' }, { status: 404 });
    }

    return NextResponse.json({ gasulTank: tank });
  } catch (error) {
    console.error('Error fetching gasul tank:', error);
    return NextResponse.json({ error: 'Failed to fetch gasul tank' }, { status: 500 });
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

    // Get old data for audit log
    const oldTank = await db.query.gasulTanks.findFirst({
      where: and(eq(gasulTanks.id, id), eq(gasulTanks.organizationId, orgId)),
    });

    const updateData: any = {
      serialNumber: body.serialNumber,
      brand: body.brand,
      capacityKg: body.capacityKg,
      tareWeightKg: body.tareWeightKg,
      status: body.status,
      notes: body.notes,
      updatedAt: new Date(),
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const tank = await db
      .update(gasulTanks)
      .set(updateData)
      .where(and(eq(gasulTanks.id, id), eq(gasulTanks.organizationId, orgId)))
      .returning();

    if (!tank.length) {
      return NextResponse.json({ error: 'Gasul tank not found' }, { status: 404 });
    }

    // Audit log
    await createAuditLog({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      action: auditActions.update,
      entityType: auditEntityTypes.gasulTank,
      entityId: id,
      oldData: oldTank || null,
      newData: tank[0],
    });

    return NextResponse.json({ gasulTank: tank[0] });
  } catch (error) {
    console.error('Error updating gasul tank:', error);
    return NextResponse.json({ error: 'Failed to update gasul tank' }, { status: 500 });
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

    // Get old data for audit log
    const oldTank = await db.query.gasulTanks.findFirst({
      where: and(eq(gasulTanks.id, id), eq(gasulTanks.organizationId, orgId)),
    });

    // Delete related refills and usage first
    await db.delete(gasulRefills).where(eq(gasulRefills.tankId, id));
    await db.delete(gasulUsage).where(eq(gasulUsage.tankId, id));
    await db.delete(gasulTanks).where(and(eq(gasulTanks.id, id), eq(gasulTanks.organizationId, orgId)));

    // Audit log
    await createAuditLog({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      action: auditActions.delete,
      entityType: auditEntityTypes.gasulTank,
      entityId: id,
      oldData: oldTank || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting gasul tank:', error);
    return NextResponse.json({ error: 'Failed to delete gasul tank' }, { status: 500 });
  }
}