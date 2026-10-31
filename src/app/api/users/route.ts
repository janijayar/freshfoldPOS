import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and, ilike, or } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const active = searchParams.get('active');
    const search = searchParams.get('search');

    const conditions = [eq(users.organizationId, session.user.organizationId)];

    if (role) {
      conditions.push(eq(users.role, role as 'owner' | 'admin' | 'manager' | 'cashier'));
    }
    if (active !== null) {
      conditions.push(eq(users.isActive, active === 'true'));
    }
    if (search) {
      conditions.push(
        or(
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )!
      );
    }

    const results = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        avatarUrl: users.avatarUrl,
        phone: users.phone,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(...conditions))
      .orderBy(users.createdAt);

    return NextResponse.json({ users: results });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { password, ...userData } = body;

    const passwordHash = password ? await bcrypt.hash(password, 12) : null;

    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        organizationId: session.user.organizationId,
        passwordHash,
        role: userData.role || 'cashier',
      })
      .returning();

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, password, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const updateData: any = { ...updates, updatedAt: new Date() };
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(and(eq(users.id, id), eq(users.organizationId, session.user.organizationId)))
      .returning();

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}