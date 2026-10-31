import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pickupSchedules, customers, users, locations } from '@/lib/db/schema';
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

    const conditions = [eq(pickupSchedules.organizationId, orgId)];
    if (status) conditions.push(eq(pickupSchedules.status, status as any));
    if (customerId) conditions.push(eq(pickupSchedules.customerId, customerId));

    const schedules = await db.query.pickupSchedules.findMany({
      where: and(...conditions),
      orderBy: (pickupSchedules, { desc }) => [desc(pickupSchedules.scheduledAt)],
      limit,
      offset,
      with: {
        customer: true,
        driver: true,
      },
    });

    return NextResponse.json({ pickupSchedules: schedules });
  } catch (error) {
    console.error('Error fetching pickup schedules:', error);
    return NextResponse.json({ error: 'Failed to fetch pickup schedules' }, { status: 500 });
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

    const schedule = await db.insert(pickupSchedules).values({
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
    }).returning();

    return NextResponse.json({ pickupSchedule: schedule[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating pickup schedule:', error);
    return NextResponse.json({ error: 'Failed to create pickup schedule' }, { status: 500 });
  }
}