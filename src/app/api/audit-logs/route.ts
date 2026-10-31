import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auditLogs, users } from '@/lib/db/schema';
import { eq, and, desc, gte, lte, ilike, count } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only owners and managers can view audit logs
    if (!['owner', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const orgId = session.user.organizationId;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const userId = searchParams.get('userId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const conditions = [eq(auditLogs.organizationId, orgId)];

    if (action) conditions.push(eq(auditLogs.action, action));
    if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
    if (userId) conditions.push(eq(auditLogs.userId, userId));
    if (fromDate) conditions.push(gte(auditLogs.createdAt, new Date(fromDate)));
    if (toDate) conditions.push(lte(auditLogs.createdAt, new Date(toDate)));
    if (search) {
      conditions.push(
        ilike(auditLogs.entityType, `%${search}%`)
      );
    }

    const logs = await db.query.auditLogs.findMany({
      where: and(...conditions),
      orderBy: (auditLogs, { desc }) => [desc(auditLogs.createdAt)],
      limit,
      offset,
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const totalResult = await db
      .select({ count: count() })
      .from(auditLogs)
      .where(and(...conditions));

    return NextResponse.json({
      auditLogs: logs,
      total: totalResult[0]?.count || 0,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}