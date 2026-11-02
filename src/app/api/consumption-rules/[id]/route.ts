import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { consumptionRule, locations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
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

    // Only owners, admins, and managers can update consumption rules
    if (!['owner', 'admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify the rule exists and belongs to user's organization
    const existingRule = await db.query.consumptionRule.findFirst({
      where: eq(consumptionRule.id, id),
      with: {
        location: { columns: { organizationId: true } },
      },
    });

    const ruleLocation = Array.isArray(existingRule?.location) ? existingRule.location[0] : existingRule?.location;

    if (!existingRule || !ruleLocation || ruleLocation.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Consumption rule not found' }, { status: 404 });
    }

    // Validate and update allowed fields
    const allowedFields = ['detergentMl', 'regularFabconMl', 'importedFabconMl', 'plasticsCount', 'gasKg'] as const;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'gasKg') {
          updateData[field] = String(body[field]);
        } else {
          updateData[field] = Number(body[field]);
        }
      }
    }

    const [updated] = await db
      .update(consumptionRule)
      .set(updateData)
      .where(eq(consumptionRule.id, id))
      .returning();

    return NextResponse.json({ rule: updated });
  } catch (error) {
    console.error('Error updating consumption rule:', error);
    return NextResponse.json({ error: 'Failed to update consumption rule' }, { status: 500 });
  }
}