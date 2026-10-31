import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { inventoryAdjustments, inventory, products, productVariants, locations } from '@/lib/db/schema';
import { eq, and, desc, gte, lte, ilike, or, inArray } from 'drizzle-orm';
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
    const supplier = searchParams.get('supplier');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get location IDs for this organization
    const orgLocations = await db.query.locations.findMany({
      where: eq(locations.organizationId, orgId),
      columns: { id: true },
    });
    const locationIds = orgLocations.map(l => l.id);

    if (locationIds.length === 0) {
      return NextResponse.json({ purchases: [] });
    }

    // For now, we'll use inventory adjustments with type 'adjustment' and reason 'purchase' as purchase orders
    // In a real implementation, you'd have a separate purchase_orders table
    const conditions = [
      inArray(inventoryAdjustments.locationId, locationIds),
      eq(inventoryAdjustments.type, 'adjustment'),
      eq(inventoryAdjustments.reason, 'purchase'),
    ];

    if (status && status !== 'purchase') conditions.push(eq(inventoryAdjustments.reason, status));
    if (fromDate) conditions.push(gte(inventoryAdjustments.createdAt, new Date(fromDate)));
    if (toDate) conditions.push(lte(inventoryAdjustments.createdAt, new Date(toDate)));

    const adjustments = await db.query.inventoryAdjustments.findMany({
      where: and(...conditions),
      orderBy: (inventoryAdjustments, { desc }) => [desc(inventoryAdjustments.createdAt)],
      limit,
      offset,
      with: {
        product: true,
        variant: true,
        user: true,
      },
    });

    // Transform to purchase order format
    // Note: Using existing columns + mock data for missing purchase-specific fields
    const purchases = adjustments.map(adj => {
      const product = Array.isArray(adj.product) ? adj.product[0] : adj.product;
      const variant = Array.isArray(adj.variant) ? adj.variant[0] : adj.variant;
      return {
        id: adj.id,
        productId: adj.productId,
        productName: product?.name || 'Unknown Product',
        variantId: adj.variantId,
        variantName: variant?.name || null,
        quantity: adj.quantity,
        unitCost: 0, // Not stored in inventoryAdjustments - would need schema migration
        totalCost: 0,
        supplier: adj.referenceType || 'Unknown Supplier', // Using referenceType as supplier
        expectedDate: adj.createdAt.toISOString().split('T')[0], // Using createdAt as expected date
        receivedDate: adj.referenceId ? adj.createdAt.toISOString().split('T')[0] : null, // Using referenceId as received indicator
        status: adj.reason === 'purchase' ? 'ordered' : adj.reason || 'ordered',
        invoiceNumber: adj.referenceId ? `INV-${adj.referenceId.slice(0, 8)}` : null,
        notes: null,
        createdAt: adj.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ purchases });
  } catch (error) {
    console.error('Error fetching inventory purchases:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory purchases' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const orgId = session.user.organizationId;

    // Get first location for the organization
    const location = await db.query.locations.findFirst({
      where: eq(locations.organizationId, orgId),
    });

    if (!location) {
      return NextResponse.json({ error: 'No location found for organization' }, { status: 400 });
    }

    // Create inventory adjustment as purchase order
    const adjustment = await db.insert(inventoryAdjustments).values({
      locationId: location.id,
      productId: body.productId,
      variantId: body.variantId || null,
      quantity: body.quantity,
      type: 'adjustment',
      reason: 'purchase',
      previousQuantity: 0,
      newQuantity: body.quantity,
      referenceType: body.supplier || 'Unknown Supplier', // Using referenceType for supplier
      referenceId: body.invoiceNumber ? crypto.randomUUID() : null, // Using referenceId for invoice
      userId: session.user.id,
    }).returning();

    return NextResponse.json({ purchase: adjustment[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory purchase:', error);
    return NextResponse.json({ error: 'Failed to create inventory purchase' }, { status: 500 });
  }
}