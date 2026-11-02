import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { consumableThreshold, locations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');

    if (!locationId) {
      return NextResponse.json({ error: 'locationId is required' }, { status: 400 });
    }

    // Verify location belongs to organization
    const location = await db.query.locations.findFirst({
      where: eq(locations.id, locationId),
      columns: { id: true, organizationId: true },
    });

    if (!location || location.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    const thresholds = await db.query.consumableThreshold.findMany({
      where: eq(consumableThreshold.locationId, locationId),
      orderBy: [consumableThreshold.consumableType],
    });

    return NextResponse.json({ thresholds });
  } catch (error) {
    console.error('Error fetching consumable thresholds:', error);
    return NextResponse.json({ error: 'Failed to fetch consumable thresholds' }, { status: 500 });
  }
}