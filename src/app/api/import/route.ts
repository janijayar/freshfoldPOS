import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  customers,
  orders,
  orderItems,
  payments,
  products,
  inventory,
  categories,
  users,
  locations,
  registers,
  shifts
} from '@/lib/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';

export const dynamic = 'force-dynamic';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

async function importCustomers(orgId: string, data: any[]): Promise<ImportResult> {
  const result: ImportResult = { success: 0, failed: 0, errors: [] };

  for (const row of data) {
    try {
      // Map common POS fields to our schema
      const customer = {
        organizationId: orgId,
        firstName: row.firstName || row.first_name || row.name?.split(' ')[0] || '',
        lastName: row.lastName || row.last_name || row.name?.split(' ').slice(1).join(' ') || '',
        email: row.email || null,
        phone: row.phone || row.phoneNumber || row.phone_number || null,
        address: row.address || null,
        city: row.city || null,
        state: row.state || null,
        zip: row.zip || row.zipCode || row.zip_code || null,
        country: row.country || 'PH',
        loyaltyTier: row.loyaltyTier || row.loyalty_tier || 'bronze',
        loyaltyPoints: parseInt(row.loyaltyPoints || row.loyalty_points || '0') || 0,
        totalSpent: Math.round(parseFloat(row.totalSpent || row.total_spent || '0') * 100) || 0,
        visitCount: parseInt(row.visitCount || row.visit_count || '0') || 0,
        acceptsMarketing: row.acceptsMarketing || row.accepts_marketing || false,
        notes: row.notes || null,
        metadata: row.metadata || {},
      };

      if (!customer.firstName && !customer.lastName) {
        result.errors.push(`Row ${result.success + result.failed + 1}: Missing first/last name`);
        result.failed++;
        continue;
      }

      await db.insert(customers).values(customer).onConflictDoNothing();
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push(`Row ${result.success + result.failed + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return result;
}

async function importProducts(orgId: string, data: any[]): Promise<ImportResult> {
  const result: ImportResult = { success: 0, failed: 0, errors: [] };

  // Get default category
  const defaultCategory = await db.query.categories.findFirst({
    where: eq(categories.organizationId, orgId),
  });

  for (const row of data) {
    try {
      const product = {
        organizationId: orgId,
        categoryId: defaultCategory?.id || null,
        name: row.name || row.productName || '',
        description: row.description || null,
        sku: row.sku || row.code || `IMPORT-${Date.now()}-${result.success}`,
        barcode: row.barcode || row.upc || row.ean || null,
        type: row.type || 'physical',
        price: Math.round(parseFloat(row.price || row.unitPrice || row.unit_price || '0') * 100) || 0,
        cost: Math.round(parseFloat(row.cost || row.unitCost || row.unit_cost || '0') * 100) || 0,
        taxRate: row.taxRate || row.tax_rate ? parseFloat(row.taxRate).toFixed(4) : null,
        trackInventory: row.trackInventory !== false && row.track_inventory !== false,
        allowNegativeStock: row.allowNegativeStock || row.allow_negative_stock || false,
        lowStockThreshold: parseInt(row.lowStockThreshold || row.low_stock_threshold || '10') || 10,
        isActive: row.isActive !== false && row.is_active !== false,
        images: row.images || [],
        attributes: row.attributes || {},
      };

      if (!product.name) {
        result.errors.push(`Row ${result.success + result.failed + 1}: Missing product name`);
        result.failed++;
        continue;
      }

      const [created] = await db.insert(products).values(product).onConflictDoUpdate({
        target: products.sku,
        set: { ...product, updatedAt: new Date() },
      }).returning();

      // Create inventory entry for the first location
      const firstLocation = await db.query.locations.findFirst({
        where: eq(locations.organizationId, orgId),
      });

      if (firstLocation && created) {
        await db.insert(inventory).values({
          locationId: firstLocation.id,
          productId: created.id,
          quantity: parseInt(row.quantity || row.stock || '0') || 0,
          reserved: 0,
          reorderPoint: product.lowStockThreshold,
          reorderQuantity: product.lowStockThreshold * 2,
        }).onConflictDoNothing();
      }

      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push(`Row ${result.success + result.failed + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return result;
}

async function importSales(orgId: string, data: any[]): Promise<ImportResult> {
  const result: ImportResult = { success: 0, failed: 0, errors: [] };

  // Get first location and register
  const firstLocation = await db.query.locations.findFirst({
    where: eq(locations.organizationId, orgId),
  });
  const firstRegister = firstLocation ? await db.query.registers.findFirst({
    where: eq(registers.locationId, firstLocation.id),
  }) : null;

  for (const row of data) {
    try {
      // Generate order number
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(and(
          eq(orders.organizationId, orgId),
          eq(orders.locationId, firstLocation?.id || '')
        ));
      const orderNumber = `IMP-${dateStr}-${String((countResult[0]?.count as number) + 1 || 1).padStart(4, '0')}`;

      // Calculate totals
      const items = row.items || [];
      const subtotal = items.reduce((sum: number, item: any) =>
        sum + (parseFloat(item.unitPrice || item.price || '0') * parseInt(item.quantity || '1')), 0);
      const discountAmount = items.reduce((sum: number, item: any) =>
        sum + (parseFloat(item.discount || '0') * parseInt(item.quantity || '1')), 0);
      const taxAmount = items.reduce((sum: number, item: any) =>
        sum + (parseFloat(item.tax || '0') * parseInt(item.quantity || '1')), 0);
      const total = subtotal - discountAmount + taxAmount;

      const paymentMethod = row.paymentMethod || row.payment_method || 'cash';
      const paymentAmount = parseFloat(row.amount || row.total || '0') || total;

      const [order] = await db.insert(orders).values({
        organizationId: orgId,
        locationId: firstLocation?.id || '',
        registerId: firstRegister?.id || null,
        customerId: null, // Could match by email/phone if provided
        cashierId: null, // Could match by email if provided
        orderNumber,
        subtotal: Math.round(subtotal * 100),
        discountAmount: Math.round(discountAmount * 100),
        taxAmount: Math.round(taxAmount * 100),
        total: Math.round(total * 100),
        status: 'completed',
        completedAt: row.createdAt || row.date || new Date(),
        metadata: { imported: true, originalData: row },
      }).returning();

      // Insert order items
      for (const item of items) {
        // Find product by SKU
        const product = await db.query.products.findFirst({
          where: and(eq(products.organizationId, orgId), eq(products.sku, item.sku || item.productSku || '')),
        });

        await db.insert(orderItems).values({
          orderId: order.id,
          productId: product?.id || null,
          variantId: null,
          name: item.name || item.productName || 'Imported Item',
          sku: item.sku || item.productSku || null,
          quantity: parseInt(item.quantity || '1'),
          unitPrice: Math.round(parseFloat(item.unitPrice || item.price || '0') * 100),
          discountAmount: Math.round(parseFloat(item.discount || '0') * 100),
          taxAmount: Math.round(parseFloat(item.tax || '0') * 100),
          total: Math.round((parseFloat(item.unitPrice || item.price || '0') * parseInt(item.quantity || '1') + parseFloat(item.tax || '0') - parseFloat(item.discount || '0')) * 100),
          metadata: { imported: true, originalData: item },
        });
      }

      // Insert payment
      await db.insert(payments).values({
        orderId: order.id,
        method: paymentMethod as 'cash' | 'card' | 'gift_card' | 'split',
        amount: Math.round(paymentAmount * 100),
        status: 'completed',
        processedAt: row.createdAt || row.date || new Date(),
        metadata: { imported: true },
      });

      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push(`Row ${result.success + result.failed + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only owners and admins can import
    if (session.user.role !== 'owner' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only owners and admins can import data' }, { status: 403 });
    }

    const orgId = session.user.organizationId;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'customers', 'products', 'sales'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type || !['customers', 'products', 'sales'].includes(type)) {
      return NextResponse.json({ error: 'Invalid import type. Must be: customers, products, or sales' }, { status: 400 });
    }

    // Parse file
    const text = await file.text();
    let data: any[];

    if (file.name.endsWith('.json')) {
      data = JSON.parse(text);
    } else if (file.name.endsWith('.csv')) {
      // Simple CSV parsing
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj: any = {};
        headers.forEach((header, i) => {
          obj[header] = values[i];
        });
        return obj;
      });
    } else {
      return NextResponse.json({ error: 'Unsupported file format. Use CSV or JSON' }, { status: 400 });
    }

    if (!Array.isArray(data)) {
      data = [data];
    }

    let result: ImportResult;

    switch (type) {
      case 'customers':
        result = await importCustomers(orgId, data);
        break;
      case 'products':
        result = await importProducts(orgId, data);
        break;
      case 'sales':
        result = await importSales(orgId, data);
        break;
      default:
        return NextResponse.json({ error: 'Invalid import type' }, { status: 400 });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}