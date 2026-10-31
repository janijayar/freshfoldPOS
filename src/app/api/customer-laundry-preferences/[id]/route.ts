import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customerLaundryPreferences, customers } from '@/lib/db/schema';
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

    const prefs = await db.query.customerLaundryPreferences.findFirst({
      where: and(
        eq(customerLaundryPreferences.customerId, id),
        eq(customers.organizationId, orgId)
      ),
      with: {
        customer: true,
        preferredWashCycle: true,
      },
    });

    if (!prefs) {
      return NextResponse.json({ error: 'Preferences not found' }, { status: 404 });
    }

    return NextResponse.json({ preferences: prefs });
  } catch (error) {
    console.error('Error fetching customer laundry preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
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

    const prefs = await db
      .update(customerLaundryPreferences)
      .set({
        preferredWashCycleId: body.preferredWashCycleId,
        preferredDetergent: body.preferredDetergent,
        preferredSoftener: body.preferredSoftener,
        waterTemperature: body.waterTemperature,
        foldPreference: body.foldPreference,
        hangerPreference: body.hangerPreference,
        specialInstructions: body.specialInstructions,
        autoSchedulePickup: body.autoSchedulePickup,
        pickupFrequency: body.pickupFrequency,
        preferredPickupDay: body.preferredPickupDay,
        preferredPickupTime: body.preferredPickupTime,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(customerLaundryPreferences.customerId, id),
          eq(customers.organizationId, orgId)
        )
      )
      .returning();

    if (!prefs.length) {
      return NextResponse.json({ error: 'Preferences not found' }, { status: 404 });
    }

    return NextResponse.json({ preferences: prefs[0] });
  } catch (error) {
    console.error('Error updating customer laundry preferences:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
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

    const { id } = await params;
    const orgId = session.user.organizationId;

    await db
      .delete(customerLaundryPreferences)
      .where(
        and(
          eq(customerLaundryPreferences.customerId, id),
          eq(customers.organizationId, orgId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer laundry preferences:', error);
    return NextResponse.json({ error: 'Failed to delete preferences' }, { status: 500 });
  }
}