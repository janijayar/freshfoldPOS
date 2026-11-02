import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { consumableThreshold, locations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only owners, admins, and managers can update thresholds
    if (!['owner', 'admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify the threshold exists and belongs to user's organization
    const existingThreshold = await db.query.consumableThreshold.findFirst({
      where: eq(consumableThreshold.id, id),
      with: {
        location: { columns: { organizationId: true } },
      },
    });

    const location = Array.isArray(existingThreshold?.location) ? existingThreshold.location[0] : existingThreshold?.location;

    if (!existingThreshold || !location || location.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Threshold not found' }, { status: 404 });
    }

    // Validate and update allowed fields
    const allowedFields = ['minimumQty', 'unit'] as const;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'minimumQty') {
          updateData[field] = Number(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    // Validate unit
    if (updateData.unit && !['ml', 'kg', 'pcs'].includes(updateData.unit as string)) {
      return NextResponse.json({ error: 'Invalid unit. Must be ml, kg, or pcs' }, { status: 400 });
    }

    const [updated] = await db
      .update(consumableThreshold)
      .set(updateData)
      .where(eq(consumableThreshold.id, id))
      .returning();

    return NextResponse.json({ threshold: updated });
  } catch (error) {
    console.error('Error updating threshold:', error);
    return NextResponse.json({ error: 'Failed to update threshold' }, { status: 500 });
  }
}