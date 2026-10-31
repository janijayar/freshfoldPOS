import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productVariants, categories, inventory, locations } from '@/lib/db/schema';
import { eq, and, ilike, or, desc, asc, inArray, sql, lte } from 'drizzle-orm';
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
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const active = searchParams.get('active');
    const lowStock = searchParams.get('lowStock');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const orgId = session.user.organizationId;

    // If no locationId, try to get the first active location for the org
    let targetLocationId = locationId;
    if (!targetLocationId) {
      const [firstLocation] = await db
        .select({ id: locations.id })
        .from(locations)
        .where(and(eq(locations.organizationId, orgId), eq(locations.isActive, true)))
        .limit(1);
      targetLocationId = firstLocation?.id;
    }

    // Build product conditions
    const productConditions = [eq(products.organizationId, orgId)];

    if (categoryId) {
      productConditions.push(eq(products.categoryId, categoryId));
    }
    if (type) {
      productConditions.push(eq(products.type, type));
    }
    if (active !== null) {
      productConditions.push(eq(products.isActive, active === 'true'));
    }
    if (search) {
      productConditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.sku, `%${search}%`),
          ilike(products.barcode, `%${search}%`)
        )!
      );
    }

    // Fetch products with categories
    const orderByColumn = (products[sortBy as keyof typeof products] as any) || products.name;
    const orderBy = sortOrder === 'desc' ? desc(orderByColumn) : asc(orderByColumn);

    const productsResults = await db
      .select({
        product: products,
        category: categories,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...productConditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const productIds = productsResults.map(r => r.product.id);

    // Fetch variants for these products
    const variants = productIds.length > 0
      ? await db
          .select()
          .from(productVariants)
          .where(inArray(productVariants.productId, productIds))
      : [];

    // Fetch inventory for these products at the target location
    let inventoryData: any[] = [];
    if (targetLocationId && productIds.length > 0) {
      const inventoryConditions = [
        eq(inventory.locationId, targetLocationId),
        inArray(inventory.productId, productIds),
      ];
      if (lowStock === 'true') {
        inventoryConditions.push(lte(inventory.quantity, inventory.reorderPoint));
      }
      inventoryData = await db
        .select()
        .from(inventory)
        .where(and(...inventoryConditions));
    }

    // Combine products with inventory and variants
    const productsWithInventory = productsResults.map(({ product, category }) => {
      const productVariants = variants.filter(v => v.productId === product.id);
      const productInventory = inventoryData.find(inv => inv.productId === product.id);
      const totalStock = productInventory?.quantity ?? 0;
      const reserved = productInventory?.reserved ?? 0;
      const availableStock = totalStock - reserved;
      const reorderPoint = productInventory?.reorderPoint ?? product.lowStockThreshold ?? 10;
      const isLowStock = product.trackInventory && totalStock > 0 && totalStock <= reorderPoint;
      const isOutOfStock = product.trackInventory && totalStock === 0;

      return {
        ...product,
        category: category?.name,
        categoryId: category?.id,
        variants: productVariants,
        inventory: productInventory
          ? {
              quantity: totalStock,
              reserved,
              available: availableStock,
              reorderPoint,
              reorderQuantity: productInventory.reorderQuantity,
              isLowStock,
              isOutOfStock,
            }
          : {
              quantity: 0,
              reserved: 0,
              available: 0,
              reorderPoint: product.lowStockThreshold ?? 10,
              reorderQuantity: (product.lowStockThreshold ?? 10) * 2,
              isLowStock: false,
              isOutOfStock: product.trackInventory,
            },
      };
    });

    return NextResponse.json({ products: productsWithInventory, locationId: targetLocationId });
  } catch (error) {
    console.error('Error fetching products with inventory:', error);
    return NextResponse.json({ error: 'Failed to fetch products with inventory' }, { status: 500 });
  }
}