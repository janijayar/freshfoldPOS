import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { inventory, products, productVariants, locations, categories } from '@/lib/db/schema';
import { eq, and, or, ilike, desc, asc, gte, lte, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';
import { createAuditLog, auditActions, auditEntityTypes } from '@/lib/audit';


export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const productId = searchParams.get('productId');
    const category = searchParams.get('category');
    const lowStock = searchParams.get('lowStock');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const conditions = [];

    if (locationId) {
      conditions.push(eq(inventory.locationId, locationId));
    }
    if (productId) {
      conditions.push(eq(inventory.productId, productId));
    }
    if (lowStock === 'true') {
      conditions.push(lte(inventory.quantity, inventory.reorderPoint));
    }
    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.sku, `%${search}%`),
          ilike(productVariants.sku, `%${search}%`)
        )!
      );
    }
    if (category) {
      conditions.push(eq(categories.name, category));
    }

    const results = await db
      .select({
        inventory: inventory,
        product: products,
        variant: productVariants,
        location: locations,
      })
      .from(inventory)
      .leftJoin(products, eq(inventory.productId, products.id))
      .leftJoin(productVariants, eq(inventory.variantId, productVariants.id))
      .leftJoin(locations, eq(inventory.locationId, locations.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(asc(products.name))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ inventory: results });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const [inv] = await db
      .insert(inventory)
      .values(body)
      .returning();

    // Audit log
    await createAuditLog({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      action: auditActions.create,
      entityType: auditEntityTypes.inventory,
      entityId: inv.id,
      newData: inv,
    });

    return NextResponse.json({ inventory: inv }, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory:', error);
    return NextResponse.json({ error: 'Failed to create inventory' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, quantity, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Inventory ID required' }, { status: 400 });
    }

    // Get old data for audit log
    const [oldInv] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.id, id))
      .limit(1);

    const [inv] = await db
      .update(inventory)
      .set({ ...updates, quantity: quantity ?? undefined, updatedAt: new Date() })
      .where(eq(inventory.id, id))
      .returning();

    // Audit log
    await createAuditLog({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      action: auditActions.update,
      entityType: auditEntityTypes.inventory,
      entityId: id,
      oldData: oldInv || null,
      newData: inv,
    });

    return NextResponse.json({ inventory: inv });
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}