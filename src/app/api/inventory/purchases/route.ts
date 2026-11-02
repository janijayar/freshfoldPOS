import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { inventoryAdjustments, inventory, products, productVariants, locations } from '@/lib/db/schema';
import { eq, and, desc, gte, lte, ilike, or, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';
import { hasSpecificPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check inventory.view permission
    if (!hasSpecificPermission(session.user.role as any, 'inventory', 'view')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
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

    // Transform to purchase order format with mock data for purchase-specific fields
    const purchases = adjustments.map(adj => {
      const product = Array.isArray(adj.product) ? adj.product[0] : adj.product;
      const variant = Array.isArray(adj.variant) ? adj.variant[0] : adj.variant;

      // Generate mock unit cost based on product cost or default
      const productCost = product?.cost ? Number(product.cost) : 100;
      const unitCost = Math.round(productCost * (0.8 + Math.random() * 0.4)); // 80-120% of product cost
      const totalCost = unitCost * adj.quantity;

      // Determine status based on referenceId (received) or random for demo
      const isReceived = !!adj.referenceId;
      const isPartial = isReceived && Math.random() > 0.5;
      let purchaseStatus: 'ordered' | 'partial' | 'received' | 'cancelled' = 'ordered';
      if (isReceived) {
        purchaseStatus = isPartial ? 'partial' : 'received';
      }

      const expectedDate = adj.createdAt.toISOString().split('T')[0];
      const receivedDate = isReceived
        ? new Date(adj.createdAt.getTime() + Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null;

      return {
        id: adj.id,
        productId: adj.productId,
        productName: product?.name || 'Unknown Product',
        productSku: product?.sku || variant?.sku || 'N/A',
        variantId: adj.variantId,
        variantName: variant?.name || null,
        quantity: adj.quantity,
        unitCost,
        totalCost,
        supplier: adj.referenceType || 'Unknown Supplier',
        expectedDate,
        receivedDate,
        status: purchaseStatus,
        invoiceNumber: adj.referenceId ? `INV-${adj.referenceId.slice(0, 8).toUpperCase()}` : null,
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

    // Check inventory.create permission
    if (!hasSpecificPermission(session.user.role as any, 'inventory', 'create')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
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