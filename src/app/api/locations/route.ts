import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { locations } from '@/lib/db/schema';
import { eq, and, ilike } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';


export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const search = searchParams.get('search');

    const conditions = [eq(locations.organizationId, session.user.organizationId)];

    if (active !== null) {
      conditions.push(eq(locations.isActive, active === 'true'));
    }
    if (search) {
      conditions.push(ilike(locations.name, `%${search}%`));
    }

    const results = await db
      .select()
      .from(locations)
      .where(and(...conditions))
      .orderBy(locations.createdAt);

    return NextResponse.json({ locations: results });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const [location] = await db
      .insert(locations)
      .values({
        ...body,
        organizationId: session.user.organizationId,
      })
      .returning();

    return NextResponse.json({ location }, { status: 201 });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 });
  }
}