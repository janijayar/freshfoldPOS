import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../src/lib/db/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function addServices() {
  console.log('🌱 Adding FreshFold laundry services...');

  const orgId = '00000000-0000-0000-0000-000000000001';

  // Find or create Laundry category
  let laundryCategory = await db.query.categories.findFirst({
    where: (cat, { eq }) => eq(cat.name, 'Laundry Services')
  });

  if (!laundryCategory) {
    const result = await db.insert(schema.categories).values({
      organizationId: orgId,
      name: 'Laundry Services',
      description: 'Professional laundry pickup, wash & fold, and delivery services',
      sortOrder: 5,
    }).returning() as any[];
    laundryCategory = result[0]!;
    console.log('✅ Created Laundry Services category:', laundryCategory!.id);
  }

  // Find or create Delivery category
  let deliveryCategory = await db.query.categories.findFirst({
    where: (cat, { eq }) => eq(cat.name, 'Delivery')
  });

  if (!deliveryCategory) {
    const result = await db.insert(schema.categories).values({
      organizationId: orgId,
      name: 'Delivery',
      description: 'Pickup and delivery services',
      sortOrder: 6,
    }).returning() as any[];
    deliveryCategory = result[0]!;
    console.log('✅ Created Delivery category:', deliveryCategory!.id);
  }

  // Get location for inventory
  const location = await db.query.locations.findFirst({
    where: (loc, { eq }) => eq(loc.organizationId, orgId)
  });

  if (!location) {
    console.error('❌ No location found');
    return;
  }

  // Services to add
  const services = [
    {
      name: 'Wash & Fold - Regular',
      description: 'Professional washing and folding service for everyday clothes (7kg bundle)',
      sku: 'WASH-REG-7KG',
      barcode: 'WASH001',
      categoryId: laundryCategory!.id,
      price: 21800, // ₱218 = 21800 cents
      cost: 8000,
      type: 'service' as const,
      trackInventory: false,
      lowStockThreshold: 0,
    },
    {
      name: 'Wash & Fold - Deluxe',
      description: 'Premium wash & fold with fabric softener and premium folding (7kg bundle)',
      sku: 'WASH-DLX-7KG',
      barcode: 'WASH002',
      categoryId: laundryCategory!.id,
      price: 25800, // ₱258 = 25800 cents
      cost: 10000,
      type: 'service' as const,
      trackInventory: false,
      lowStockThreshold: 0,
    },
    {
      name: 'Dry Cleaning',
      description: 'Expert dry cleaning for delicate fabrics and formal wear (Coming Soon)',
      sku: 'DRY-CLEAN',
      barcode: 'DRY001',
      categoryId: laundryCategory!.id,
      price: 0, // Coming soon
      cost: 0,
      type: 'service' as const,
      trackInventory: false,
      isActive: false,
      lowStockThreshold: 0,
    },
    {
      name: 'Pickup & Delivery (One-way)',
      description: 'Convenient pickup OR delivery service to your door',
      sku: 'DELIVERY-ONEWAY',
      barcode: 'DELIV001',
      categoryId: deliveryCategory!.id,
      price: 2000, // ₱20-25 = ~2000-2500 cents
      cost: 1000,
      type: 'service' as const,
      trackInventory: false,
      lowStockThreshold: 0,
    },
    {
      name: 'Pickup & Delivery (Round-trip)',
      description: 'Full pickup AND delivery service - we pick up and deliver back',
      sku: 'DELIVERY-ROUNDTRIP',
      barcode: 'DELIV002',
      categoryId: deliveryCategory!.id,
      price: 4000, // ₱40-50 round trip
      cost: 2000,
      type: 'service' as const,
      trackInventory: false,
      lowStockThreshold: 0,
    },
  ];

  for (const service of services) {
    const existing = await db.query.products.findFirst({
      where: (prod, { eq }) => eq(prod.sku, service.sku)
    });

    if (existing) {
      console.log(`⏭️  Skipping ${service.name} (already exists)`);
      continue;
    }

    const result = await db.insert(schema.products).values({
      organizationId: orgId,
      ...service,
    }).returning() as any[];
    const created = result[0]!;

    console.log(`✅ Created: ${service.name} - ₱${(service.price/100).toFixed(2)}`);

    // Add inventory entry
    if (location) {
      await db.insert(schema.inventory).values({
        locationId: location.id,
        productId: created.id,
        quantity: 999,
        reserved: 0,
        reorderPoint: 0,
        reorderQuantity: 0,
      }).onConflictDoNothing();
    }
  }

  console.log('\n🎉 Services added successfully!');
}

addServices().catch(console.error).finally(() => process.exit(0));