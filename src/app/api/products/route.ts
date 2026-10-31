import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productVariants, categories } from '@/lib/db/schema';
import { eq, and, ilike, or, desc, asc, inArray } from 'drizzle-orm';
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
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const active = searchParams.get('active');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const conditions = [eq(products.organizationId, session.user.organizationId)];

    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }
    if (type) {
      conditions.push(eq(products.type, type));
    }
    if (active !== null) {
      conditions.push(eq(products.isActive, active === 'true'));
    }
    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.sku, `%${search}%`),
          ilike(products.barcode, `%${search}%`)
        )!
      );
    }

    const orderBy = sortOrder === 'desc'
      ? desc(products[sortBy as keyof typeof products] as any)
      : asc(products[sortBy as keyof typeof products] as any);

    const results = await db
      .select({
        product: products,
        category: categories,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const productIds = results.map(r => r.product.id);
    const variants = productIds.length > 0
      ? await db
          .select()
          .from(productVariants)
          .where(inArray(productVariants.productId, productIds))
      : [];

    const productsWithVariants = results.map(({ product, category }) => ({
      ...product,
      category: category?.name,
      variants: variants.filter(v => v.productId === product.id),
    }));

    return NextResponse.json({ products: productsWithVariants });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, variants, ...productData } = body;

    const [product] = await db
      .insert(products)
      .values({
        ...productData,
        organizationId: session.user.organizationId,
        categoryId: categoryId || null,
        price: productData.price || 0,
        cost: productData.cost || 0,
      })
      .returning();

    if (variants && variants.length > 0) {
      await db.insert(productVariants).values(
        variants.map((v: any) => ({
          ...v,
          productId: product.id,
        }))
      );
    }

    // Audit log
    await createAuditLog({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      action: auditActions.create,
      entityType: auditEntityTypes.product,
      entityId: product.id,
      newData: { ...product, variants },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}