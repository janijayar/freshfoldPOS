import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only owners and admins can toggle data mode
    if (session.user.role !== 'owner' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only owners and admins can toggle data mode' }, { status: 403 });
    }

    const body = await request.json();
    const { dataMode } = body;

    if (!dataMode || !['demo', 'live'].includes(dataMode)) {
      return NextResponse.json({ error: 'Invalid dataMode. Must be "demo" or "live"' }, { status: 400 });
    }

    const [org] = await db
      .update(organizations)
      .set({
        dataMode,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, session.user.organizationId))
      .returning();

    return NextResponse.json({ organization: org });
  } catch (error) {
    console.error('Error toggling data mode:', error);
    return NextResponse.json({ error: 'Failed to toggle data mode' }, { status: 500 });
  }
}