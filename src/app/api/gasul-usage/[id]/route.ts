import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gasulUsage, gasulTanks } from '@/lib/db/schema';
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

    const usage = await db.query.gasulUsage.findFirst({
      where: and(eq(gasulUsage.id, id), eq(gasulUsage.organizationId, orgId)),
      with: {
        tank: true,
        recordedByUser: true,
      },
    });

    if (!usage) {
      return NextResponse.json({ error: 'Gasul usage not found' }, { status: 404 });
    }

    return NextResponse.json({ gasulUsage: usage });
  } catch (error) {
    console.error('Error fetching gasul usage:', error);
    return NextResponse.json({ error: 'Failed to fetch gasul usage' }, { status: 500 });
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
      weightBeforeKg: body.weightBeforeKg,
      weightAfterKg: body.weightAfterKg,
      weightUsedKg: body.weightUsedKg,
      purpose: body.purpose,
      recordedAt: body.recordedAt ? new Date(body.recordedAt) : undefined,
      notes: body.notes,
      updatedAt: new Date(),
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const usage = await db
      .update(gasulUsage)
      .set(updateData)
      .where(and(eq(gasulUsage.id, id), eq(gasulUsage.organizationId, orgId)))
      .returning();

    if (!usage.length) {
      return NextResponse.json({ error: 'Gasul usage not found' }, { status: 404 });
    }

    return NextResponse.json({ gasulUsage: usage[0] });
  } catch (error) {
    console.error('Error updating gasul usage:', error);
    return NextResponse.json({ error: 'Failed to update gasul usage' }, { status: 500 });
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

    await db.delete(gasulUsage).where(and(eq(gasulUsage.id, id), eq(gasulUsage.organizationId, orgId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting gasul usage:', error);
    return NextResponse.json({ error: 'Failed to delete gasul usage' }, { status: 500 });
  }
}