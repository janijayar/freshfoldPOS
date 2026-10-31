import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { garmentTypes } from '@/lib/db/schema';
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
    const types = await db.query.garmentTypes.findMany({
      where: eq(garmentTypes.organizationId, orgId),
      orderBy: (garmentTypes, { asc }) => [asc(garmentTypes.sortOrder)],
    });

    return NextResponse.json({ garmentTypes: types });
  } catch (error) {
    console.error('Error fetching garment types:', error);
    return NextResponse.json({ error: 'Failed to fetch garment types' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only owners, admins, and managers can create garment types
    if (!['owner', 'admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const orgId = session.user.organizationId;
    const body = await request.json();

    const type = await db.insert(garmentTypes).values({
      organizationId: orgId,
      name: body.name,
      type: body.type,
      description: body.description,
      basePrice: body.basePrice,
      baseWeightGrams: body.baseWeightGrams,
      requiresSpecialCare: body.requiresSpecialCare || false,
      careInstructions: body.careInstructions,
      isActive: body.isActive !== false,
      sortOrder: body.sortOrder || 0,
    }).returning();

    return NextResponse.json({ garmentType: type[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating garment type:', error);
    return NextResponse.json({ error: 'Failed to create garment type' }, { status: 500 });
  }
}