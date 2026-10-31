import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customerLaundryPreferences, customers } from '@/lib/db/schema';
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
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (customerId) {
      // Get specific customer's preferences
      const prefs = await db.query.customerLaundryPreferences.findFirst({
        where: and(
          eq(customerLaundryPreferences.customerId, customerId),
          eq(customers.organizationId, orgId)
        ),
        with: {
          preferredWashCycle: true,
        },
      });
      return NextResponse.json({ preferences: prefs });
    }

    // Get all preferences for organization
    const allPrefs = await db.query.customerLaundryPreferences.findMany({
      where: eq(customers.organizationId, orgId),
      with: {
        customer: true,
        preferredWashCycle: true,
      },
    });

    return NextResponse.json({ preferences: allPrefs });
  } catch (error) {
    console.error('Error fetching customer laundry preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
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

    // Verify customer belongs to organization
    const customer = await db.query.customers.findFirst({
      where: and(eq(customers.id, body.customerId), eq(customers.organizationId, orgId)),
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const prefs = await db.insert(customerLaundryPreferences).values({
      customerId: body.customerId,
      preferredWashCycleId: body.preferredWashCycleId,
      preferredDetergent: body.preferredDetergent,
      preferredSoftener: body.preferredSoftener,
      waterTemperature: body.waterTemperature,
      foldPreference: body.foldPreference || 'standard',
      hangerPreference: body.hangerPreference || 'wire',
      specialInstructions: body.specialInstructions,
      autoSchedulePickup: body.autoSchedulePickup || false,
      pickupFrequency: body.pickupFrequency,
      preferredPickupDay: body.preferredPickupDay,
      preferredPickupTime: body.preferredPickupTime,
    }).returning();

    return NextResponse.json({ preferences: prefs[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer laundry preferences:', error);
    return NextResponse.json({ error: 'Failed to create preferences' }, { status: 500 });
  }
}