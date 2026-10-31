import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deliverySchedules, locations } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const conditions = [eq(deliverySchedules.organizationId, orgId)];
    if (status) conditions.push(eq(deliverySchedules.status, status as any));
    if (customerId) conditions.push(eq(deliverySchedules.customerId, customerId));

    const schedules = await db.query.deliverySchedules.findMany({
      where: and(...conditions),
      orderBy: (deliverySchedules, { desc }) => [desc(deliverySchedules.scheduledAt)],
      limit,
      offset,
      with: {
        customer: true,
        driver: true,
      },
    });

    return NextResponse.json({ deliverySchedules: schedules });
  } catch (error) {
    console.error('Error fetching delivery schedules:', error);
    return NextResponse.json({ error: 'Failed to fetch delivery schedules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const body = await request.json();

    // Get first location for the organization
    const location = await db.query.locations.findFirst({
      where: eq(locations.organizationId, orgId),
    });

    if (!location) {
      return NextResponse.json({ error: 'No location found for organization' }, { status: 400 });
    }

    const schedule = await db.insert(deliverySchedules).values({
      organizationId: orgId,
      locationId: location.id,
      customerId: body.customerId,
      scheduledAt: new Date(body.scheduledAt),
      address: body.address,
      city: body.city,
      state: body.state,
      zip: body.zip,
      contactPhone: body.contactPhone,
      contactName: body.contactName,
      notes: body.notes,
      status: body.status || 'scheduled',
      driverId: body.driverId,
      proofOfDelivery: body.proofOfDelivery,
    }).returning();

    return NextResponse.json({ deliverySchedule: schedule[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating delivery schedule:', error);
    return NextResponse.json({ error: 'Failed to create delivery schedule' }, { status: 500 });
  }
}