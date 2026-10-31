import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { garmentTypes } from '@/lib/db/schema';
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

    const type = await db.query.garmentTypes.findFirst({
      where: and(eq(garmentTypes.id, id), eq(garmentTypes.organizationId, orgId)),
    });

    if (!type) {
      return NextResponse.json({ error: 'Garment type not found' }, { status: 404 });
    }

    return NextResponse.json({ garmentType: type });
  } catch (error) {
    console.error('Error fetching garment type:', error);
    return NextResponse.json({ error: 'Failed to fetch garment type' }, { status: 500 });
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

    // Only owners, admins, and managers can update garment types
    if (!['owner', 'admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const orgId = session.user.organizationId;
    const body = await request.json();

    const type = await db
      .update(garmentTypes)
      .set({
        name: body.name,
        type: body.type,
        description: body.description,
        basePrice: body.basePrice,
        baseWeightGrams: body.baseWeightGrams,
        requiresSpecialCare: body.requiresSpecialCare,
        careInstructions: body.careInstructions,
        isActive: body.isActive,
        sortOrder: body.sortOrder,
        updatedAt: new Date(),
      })
      .where(and(eq(garmentTypes.id, id), eq(garmentTypes.organizationId, orgId)))
      .returning();

    if (!type.length) {
      return NextResponse.json({ error: 'Garment type not found' }, { status: 404 });
    }

    return NextResponse.json({ garmentType: type[0] });
  } catch (error) {
    console.error('Error updating garment type:', error);
    return NextResponse.json({ error: 'Failed to update garment type' }, { status: 500 });
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

    // Only owners and admins can delete garment types
    if (!['owner', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const orgId = session.user.organizationId;

    await db
      .delete(garmentTypes)
      .where(and(eq(garmentTypes.id, id), eq(garmentTypes.organizationId, orgId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting garment type:', error);
    return NextResponse.json({ error: 'Failed to delete garment type' }, { status: 500 });
  }
}