import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { registers, locations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
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
    const active = searchParams.get('active');

    const conditions = [eq(locations.organizationId, session.user.organizationId)];

    if (locationId) {
      conditions.push(eq(registers.locationId, locationId));
    }
    if (active !== null) {
      conditions.push(eq(registers.isActive, active === 'true'));
    }

    const results = await db
      .select({
        register: registers,
        location: locations,
      })
      .from(registers)
      .innerJoin(locations, eq(registers.locationId, locations.id))
      .where(and(...conditions));

    return NextResponse.json({ registers: results });
  } catch (error) {
    console.error('Error fetching registers:', error);
    return NextResponse.json({ error: 'Failed to fetch registers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const [register] = await db
      .insert(registers)
      .values(body)
      .returning();

    return NextResponse.json({ register }, { status: 201 });
  } catch (error) {
    console.error('Error creating register:', error);
    return NextResponse.json({ error: 'Failed to create register' }, { status: 500 });
  }
}