import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function seedConsumablesDefaults(): Promise<void> {
  // Get all locations
  const locations = await db.select().from(schema.locations);

  if (locations.length === 0) {
    console.log('⚠️  No locations found, skipping consumables defaults');
    return;
  }

  // Service types: 5 services
  const serviceTypes = ['REGULAR', 'DELUXE', 'EXTRA_DRY', 'EXTRA_WASH', 'HAND_WASH'] as const;
  // Machine types: 2 machines
  const machineTypes = ['LG_GIANT', 'LG_TITAN'] as const;
  // Fabcon states: 2 states (has imported fabcon or not)
  const fabconStates = [false, true];

  console.log('🌱 Seeding consumption rules...');

  for (const location of locations) {
    // Seed consumption rules: 5 services × 2 machines × 2 fabcon states = 20 rules per location
    for (const serviceType of serviceTypes) {
      for (const machineType of machineTypes) {
        for (const hasImportedFabcon of fabconStates) {
          // Gas defaults per design doc:
          // Giant: 0.15kg normal, 0.04kg for Extra Dry (10min = 25% of 40min)
          // Titan: 0.20kg normal, 0.05kg for Extra Dry
          let gasKg = '0.15';

          if (machineType === 'LG_TITAN') {
            gasKg = '0.20';
          }

          if (serviceType === 'EXTRA_DRY') {
            gasKg = machineType === 'LG_GIANT' ? '0.04' : '0.05';
          }

          await db.insert(schema.consumptionRule).values({
            locationId: location.id,
            serviceType,
            machineType,
            hasImportedFabcon,
            detergentMl: 80,
            regularFabconMl: hasImportedFabcon ? 0 : 80,
            importedFabconMl: hasImportedFabcon ? 40 : 0,
            plasticsCount: 1,
            gasKg,
          }).onConflictDoUpdate({
            target: [
              schema.consumptionRule.locationId,
              schema.consumptionRule.serviceType,
              schema.consumptionRule.machineType,
              schema.consumptionRule.hasImportedFabcon,
            ],
            set: {
              detergentMl: 80,
              regularFabconMl: hasImportedFabcon ? 0 : 80,
              importedFabconMl: hasImportedFabcon ? 40 : 0,
              plasticsCount: 1,
              gasKg,
              updatedAt: new Date(),
            },
          });
        }
      }
    }

    console.log(`✅ Seeded ${serviceTypes.length * machineTypes.length * fabconStates.length} consumption rules for location ${location.code}`);
  }

  // Seed consumable thresholds: 5 thresholds per location
  console.log('🌱 Seeding consumable thresholds...');

  const thresholdsData = [
    { consumableType: 'DETERGENT' as const, minimumQty: 5000, unit: 'ml' as const },
    { consumableType: 'REGULAR_FABCON' as const, minimumQty: 5000, unit: 'ml' as const },
    { consumableType: 'IMPORTED_FABCON' as const, minimumQty: 2000, unit: 'ml' as const },
    { consumableType: 'PLASTICS' as const, minimumQty: 100, unit: 'pcs' as const },
    { consumableType: 'GASUL' as const, minimumQty: 5, unit: 'kg' as const },
  ];

  for (const location of locations) {
    for (const threshold of thresholdsData) {
      await db.insert(schema.consumableThreshold).values({
        locationId: location.id,
        consumableType: threshold.consumableType,
        minimumQty: threshold.minimumQty,
        unit: threshold.unit,
      }).onConflictDoUpdate({
        target: [
          schema.consumableThreshold.locationId,
          schema.consumableThreshold.consumableType,
        ],
        set: {
          minimumQty: threshold.minimumQty,
          unit: threshold.unit,
          updatedAt: new Date(),
        },
      });
    }
    console.log(`✅ Seeded ${thresholdsData.length} consumable thresholds for location ${location.code}`);
  }

  console.log('✅ Consumables defaults seeded successfully!');
}

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Create or update organization with fixed ID to match auth config
    const FIXED_ORG_ID = '00000000-0000-0000-0000-000000000001';
    const [org] = await db.insert(schema.organizations).values({
      id: FIXED_ORG_ID,
      name: 'FreshFold Laundry',
      slug: 'freshfold-laundry',
      email: 'admin@freshfold.com',
      phone: '+63 917 123 4567',
      address: '123 Rizal Avenue',
      city: 'Manila',
      state: 'NCR',
      zip: '1000',
      country: 'PH',
      timezone: 'Asia/Manila',
      currency: 'PHP',
      taxRate: '0.12',
      dataMode: 'demo',
    }).onConflictDoUpdate({
      target: schema.organizations.id,
      set: {
        name: 'FreshFold Laundry',
        slug: 'freshfold-laundry',
        email: 'admin@freshfold.com',
        phone: '+63 917 123 4567',
        address: '123 Rizal Avenue',
        city: 'Manila',
        state: 'NCR',
        zip: '1000',
        country: 'PH',
        timezone: 'Asia/Manila',
        currency: 'PHP',
        taxRate: '0.12',
        dataMode: 'demo',
        updatedAt: new Date(),
      },
    }).returning();

    console.log('✅ Organization created/updated:', org.id);

    // Create or update location
    const [location] = await db.insert(schema.locations).values({
      organizationId: org.id,
      name: 'Main Branch - Manila',
      code: 'MNL',
      email: 'manila@freshfold.com',
      phone: '+63 2 8123 4567',
      address: '123 Rizal Avenue',
      city: 'Manila',
      state: 'NCR',
      zip: '1000',
      country: 'PH',
      timezone: 'Asia/Manila',
    }).onConflictDoUpdate({
      target: schema.locations.code,
      set: {
        name: 'Main Branch - Manila',
        email: 'manila@freshfold.com',
        phone: '+63 2 8123 4567',
        address: '123 Rizal Avenue',
        city: 'Manila',
        state: 'NCR',
        zip: '1000',
        country: 'PH',
        timezone: 'Asia/Manila',
        updatedAt: new Date(),
      },
    }).returning();

    console.log('✅ Location created/updated:', location.id);

    // Create or update users
    const passwordHash = await hashPassword('password123');

    const [owner] = await db.insert(schema.users).values({
      organizationId: org.id,
      email: 'admin@freshfold.com',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Mitchell',
      role: 'owner',
      isActive: true,
    }).onConflictDoUpdate({
      target: schema.users.email,
      set: {
        organizationId: org.id,
        passwordHash,
        firstName: 'Sarah',
        lastName: 'Mitchell',
        role: 'owner',
        isActive: true,
        updatedAt: new Date(),
      },
    }).returning();

    const [manager] = await db.insert(schema.users).values({
      organizationId: org.id,
      email: 'manager@freshfold.com',
      passwordHash,
      firstName: 'Mike',
      lastName: 'Chen',
      role: 'manager',
      isActive: true,
    }).onConflictDoUpdate({
      target: schema.users.email,
      set: {
        organizationId: org.id,
        passwordHash,
        firstName: 'Mike',
        lastName: 'Chen',
        role: 'manager',
        isActive: true,
        updatedAt: new Date(),
      },
    }).returning();

    const [cashier1] = await db.insert(schema.users).values({
      organizationId: org.id,
      email: 'cashier1@freshfold.com',
      passwordHash,
      firstName: 'Emma',
      lastName: 'Davis',
      role: 'cashier',
      isActive: true,
    }).onConflictDoUpdate({
      target: schema.users.email,
      set: {
        organizationId: org.id,
        passwordHash,
        firstName: 'Emma',
        lastName: 'Davis',
        role: 'cashier',
        isActive: true,
        updatedAt: new Date(),
      },
    }).returning();

    const [cashier2] = await db.insert(schema.users).values({
      organizationId: org.id,
      email: 'cashier2@freshfold.com',
      passwordHash,
      firstName: 'James',
      lastName: 'Wilson',
      role: 'cashier',
      isActive: true,
    }).onConflictDoUpdate({
      target: schema.users.email,
      set: {
        organizationId: org.id,
        passwordHash,
        firstName: 'James',
        lastName: 'Wilson',
        role: 'cashier',
        isActive: true,
        updatedAt: new Date(),
      },
    }).returning();

    console.log('✅ Users created/updated');

    // Create or update registers
    const [register1] = await db.insert(schema.registers).values({
      locationId: location.id,
      name: 'Register 1',
      code: 'REG-001',
      deviceId: 'device-reg-001',
    }).onConflictDoUpdate({
      target: schema.registers.deviceId,
      set: {
        locationId: location.id,
        name: 'Register 1',
        code: 'REG-001',
        updatedAt: new Date(),
      },
    }).returning();

    const [register2] = await db.insert(schema.registers).values({
      locationId: location.id,
      name: 'Register 2',
      code: 'REG-002',
      deviceId: 'device-reg-002',
    }).onConflictDoUpdate({
      target: schema.registers.deviceId,
      set: {
        locationId: location.id,
        name: 'Register 2',
        code: 'REG-002',
        updatedAt: new Date(),
      },
    }).returning();

    const [register3] = await db.insert(schema.registers).values({
      locationId: location.id,
      name: 'Register 3',
      code: 'REG-003',
      deviceId: 'device-reg-003',
    }).onConflictDoUpdate({
      target: schema.registers.deviceId,
      set: {
        locationId: location.id,
        name: 'Register 3',
        code: 'REG-003',
        updatedAt: new Date(),
      },
    }).returning();

    console.log('✅ Registers created/updated');

    // Seed consumables defaults (consumption rules & thresholds)
    await seedConsumablesDefaults();

    // Create categories
    const beveragesResult = await db.insert(schema.categories).values({
      organizationId: org.id,
      name: 'Beverages',
      description: 'Coffee, tea, and cold drinks',
      sortOrder: 1,
    }).returning() as any;
    const beverages = beveragesResult[0];

    const foodResult = await db.insert(schema.categories).values({
      organizationId: org.id,
      name: 'Food',
      description: 'Pastries, sandwiches, and snacks',
      sortOrder: 2,
    }).returning() as any;
    const food = foodResult[0];

    const merchandiseResult = await db.insert(schema.categories).values({
      organizationId: org.id,
      name: 'Merchandise',
      description: 'Branded merchandise and accessories',
      sortOrder: 3,
    }).returning() as any;
    const merchandise = merchandiseResult[0];

    const giftCardsResult = await db.insert(schema.categories).values({
      organizationId: org.id,
      name: 'Gift Cards',
      description: 'Digital and physical gift cards',
      sortOrder: 4,
    }).returning() as any;
    const giftCards = giftCardsResult[0];

    const laundryCategoryResult = await db.insert(schema.categories).values({
      organizationId: org.id,
      name: 'Laundry Services',
      description: 'Professional laundry pickup, wash & fold, and delivery services',
      sortOrder: 5,
    }).returning() as any;
    const laundryCategory = laundryCategoryResult[0];

    const deliveryCategoryResult = await db.insert(schema.categories).values({
      organizationId: org.id,
      name: 'Delivery',
      description: 'Pickup and delivery services',
      sortOrder: 6,
    }).returning() as any;
    const deliveryCategory = deliveryCategoryResult[0];

    const suppliesCategoryResult = await db.insert(schema.categories).values({
      organizationId: org.id,
      name: 'Laundry Supplies',
      description: 'Detergents, fabric conditioners, packaging materials, and other consumables',
      sortOrder: 7,
    }).returning() as any;
    const suppliesCategory = suppliesCategoryResult[0];

    console.log('✅ Categories created');

    // Create or update products (laundry services + some retail)
    const productsData = [
      { name: 'Wash & Fold - Regular (7kg)', description: 'Professional washing and folding service for everyday clothes (7kg bundle)', sku: 'WASH-REG-7KG', barcode: 'WASH001', categoryId: laundryCategory.id, price: 21800, cost: 8000, lowStockThreshold: 0, type: 'service', trackInventory: false },
      { name: 'Wash & Fold - Deluxe (7kg)', description: 'Premium wash & fold with fabric softener and premium folding (7kg bundle)', sku: 'WASH-DLX-7KG', barcode: 'WASH002', categoryId: laundryCategory.id, price: 25800, cost: 10000, lowStockThreshold: 0, type: 'service', trackInventory: false },
      { name: 'Dry Cleaning', description: 'Expert dry cleaning for delicate fabrics and formal wear (Coming Soon)', sku: 'DRY-CLEAN', barcode: 'DRY001', categoryId: laundryCategory.id, price: 0, cost: 0, lowStockThreshold: 0, type: 'service', trackInventory: false, isActive: false },
      { name: 'Pickup & Delivery (One-way)', description: 'Convenient pickup OR delivery service to your door', sku: 'DELIVERY-ONEWAY', barcode: 'DELIV001', categoryId: deliveryCategory.id, price: 2000, cost: 1000, lowStockThreshold: 0, type: 'service', trackInventory: false },
      { name: 'Pickup & Delivery (Round-trip)', description: 'Full pickup AND delivery service - we pick up and deliver back', sku: 'DELIVERY-ROUNDTRIP', barcode: 'DELIV002', categoryId: deliveryCategory.id, price: 4000, cost: 2000, lowStockThreshold: 0, type: 'service', trackInventory: false },
      { name: 'Fabric Softener Add-on', description: 'Premium fabric softener for extra freshness', sku: 'ADDON-SOFTENER', barcode: 'ADD001', categoryId: laundryCategory.id, price: 5000, cost: 1500, lowStockThreshold: 20 },
      { name: 'Stain Remover Treatment', description: 'Specialized stain removal for tough stains', sku: 'ADDON-STAIN', barcode: 'ADD002', categoryId: laundryCategory.id, price: 3000, cost: 1000, lowStockThreshold: 15 },
      { name: 'Laundry Bag (Large)', description: 'Durable mesh laundry bag for 7kg loads', sku: 'BAG-LARGE', barcode: 'BAG001', categoryId: merchandise.id, price: 15000, cost: 5000, lowStockThreshold: 10 },
      { name: 'Gift Card ₱500', description: '₱500 gift card for laundry services', sku: 'GIFT-500', barcode: 'GIFT001', categoryId: giftCards.id, price: 50000, cost: 0, type: 'gift_card', trackInventory: false, lowStockThreshold: 0 },
      { name: 'Gift Card ₱1000', description: '₱1000 gift card for laundry services', sku: 'GIFT-1000', barcode: 'GIFT002', categoryId: giftCards.id, price: 100000, cost: 0, type: 'gift_card', trackInventory: false, lowStockThreshold: 0 },
      // Laundry Supplies (Consumables)
      { name: 'Detergent Powder (1kg)', description: 'High-efficiency laundry detergent powder for commercial use', sku: 'SUP-DET-POWDER-1KG', barcode: 'SUP001', categoryId: suppliesCategory.id, price: 18000, cost: 9000, lowStockThreshold: 10, trackInventory: true },
      { name: 'Detergent Liquid (5L)', description: 'Concentrated liquid detergent for bulk washing', sku: 'SUP-DET-LIQUID-5L', barcode: 'SUP002', categoryId: suppliesCategory.id, price: 45000, cost: 22000, lowStockThreshold: 5, trackInventory: true },
      { name: 'Fabcon (Fabric Conditioner) 1L', description: 'Standard fabric conditioner for softness and fragrance', sku: 'SUP-FABCON-1L', barcode: 'SUP003', categoryId: suppliesCategory.id, price: 12000, cost: 6000, lowStockThreshold: 10, trackInventory: true },
      { name: 'Imported Fabcon (Downy) 1L', description: 'Premium imported fabric conditioner - Downy', sku: 'SUP-FABCON-IMPORTED-1L', barcode: 'SUP004', categoryId: suppliesCategory.id, price: 25000, cost: 15000, lowStockThreshold: 5, trackInventory: true },
      { name: 'Plastic Laundry Bags (100pcs)', description: 'Clear plastic bags for laundry sorting and protection', sku: 'SUP-PLASTIC-BAGS-100', barcode: 'SUP005', categoryId: suppliesCategory.id, price: 8000, cost: 3000, lowStockThreshold: 20, trackInventory: true },
      { name: 'Scotch Tape (1 inch x 50m)', description: 'Clear adhesive tape for sealing bags and packaging', sku: 'SUP-SCOTCH-TAPE-1IN', barcode: 'SUP006', categoryId: suppliesCategory.id, price: 3500, cost: 1500, lowStockThreshold: 20, trackInventory: true },
      { name: 'Packaging Tape (2 inch x 100m)', description: 'Heavy-duty packaging tape for boxes and parcels', sku: 'SUP-PACKAGING-TAPE-2IN', barcode: 'SUP007', categoryId: suppliesCategory.id, price: 5500, cost: 2500, lowStockThreshold: 15, trackInventory: true },
    ];

    const createdProducts = [];
    for (const product of productsData) {
      const [created] = await db.insert(schema.products).values({
        organizationId: org.id,
        ...product,
      }).onConflictDoUpdate({
        target: schema.products.sku,
        set: {
          organizationId: org.id,
          ...product,
          updatedAt: new Date(),
        },
      }).returning();
      createdProducts.push(created);
    }

    console.log('✅ Products created/updated');

    // Create inventory for each product at the location
    for (const product of createdProducts) {
      const stock = product.sku.startsWith('GIFT') ? 100 : Math.floor(Math.random() * 50) + 20;
      await db.insert(schema.inventory).values({
        locationId: location.id,
        productId: product.id,
        quantity: stock,
        reserved: 0,
        reorderPoint: product.lowStockThreshold ?? 10,
        reorderQuantity: (product.lowStockThreshold ?? 10) * 2,
      });
    }

    console.log('✅ Inventory created');

    // Create customers (Philippines)
    const customersData = [
      { firstName: 'Maria', lastName: 'Santos', email: 'maria.santos@email.com', phone: '+63 917 123 4567', address: '456 Quezon Ave', city: 'Quezon City', state: 'NCR', zip: '1100', loyaltyTier: 'gold', loyaltyPoints: 1250, totalSpent: 4500000, visitCount: 12 },
      { firstName: 'Juan', lastName: 'Dela Cruz', email: 'juan.delacruz@email.com', phone: '+63 918 234 5678', address: '789 EDSA', city: 'Makati', state: 'NCR', zip: '1200', loyaltyTier: 'silver', loyaltyPoints: 560, totalSpent: 2300000, visitCount: 8 },
      { firstName: 'Ana', lastName: 'Reyes', email: 'ana.reyes@email.com', phone: '+63 919 345 6789', address: '321 Ayala Blvd', city: 'Makati', state: 'NCR', zip: '1209', loyaltyTier: 'bronze', loyaltyPoints: 120, totalSpent: 850000, visitCount: 3 },
      { firstName: 'Pedro', lastName: 'Garcia', email: 'pedro.garcia@email.com', phone: '+63 920 456 7890', address: '654 Roxas Blvd', city: 'Pasay', state: 'NCR', zip: '1300', loyaltyTier: 'gold', loyaltyPoints: 2100, totalSpent: 6700000, visitCount: 18 },
      { firstName: 'Carmen', lastName: 'Lopez', email: 'carmen.lopez@email.com', phone: '+63 921 567 8901', address: '987 Taft Ave', city: 'Manila', state: 'NCR', zip: '1004', loyaltyTier: 'silver', loyaltyPoints: 780, totalSpent: 3100000, visitCount: 10 },
    ];

    const createdCustomers = [];
    for (const customer of customersData) {
      const [created] = await db.insert(schema.customers).values({
        organizationId: org.id,
        ...customer,
        lastVisitAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      }).returning();
      createdCustomers.push(created);
    }

    console.log('✅ Customers created');

    // Create discounts (PHP amounts in cents)
    await db.insert(schema.discounts).values([
      {
        organizationId: org.id,
        name: 'Student Discount',
        description: '10% off for students with valid ID',
        type: 'percentage',
        value: '10.00',
        maxAmount: 50000, // ₱500
        appliesTo: 'all',
        isActive: true,
      },
      {
        organizationId: org.id,
        name: 'Senior Discount',
        description: '15% off for seniors 65+',
        type: 'percentage',
        value: '15.00',
        maxAmount: 100000, // ₱1000
        appliesTo: 'all',
        isActive: true,
      },
      {
        organizationId: org.id,
        name: 'First Time Customer',
        description: '20% off first laundry order',
        type: 'percentage',
        value: '20.00',
        maxAmount: 20000, // ₱200
        appliesTo: 'category',
        targetIds: [laundryCategory.id],
        isActive: true,
      },
    ]);

    console.log('✅ Discounts created');

    // Create wash cycles
    const washCyclesData = [
      { name: 'Delicate', cycleType: 'delicate' as const, description: 'Gentle cycle for delicate fabrics', durationMinutes: 45, temperatureCelsius: 30, spinSpeedRpm: 400, priceModifier: '1.00', sortOrder: 1 },
      { name: 'Normal', cycleType: 'normal' as const, description: 'Standard wash cycle for everyday clothes', durationMinutes: 60, temperatureCelsius: 40, spinSpeedRpm: 800, priceModifier: '1.00', sortOrder: 2 },
      { name: 'Heavy Duty', cycleType: 'heavy_duty' as const, description: 'Intensive cycle for heavily soiled items', durationMinutes: 90, temperatureCelsius: 60, spinSpeedRpm: 1000, priceModifier: '1.20', sortOrder: 3 },
      { name: 'Quick Wash', cycleType: 'quick_wash' as const, description: 'Fast cycle for lightly soiled items', durationMinutes: 30, temperatureCelsius: 30, spinSpeedRpm: 800, priceModifier: '0.90', sortOrder: 4 },
      { name: 'Wool', cycleType: 'wool' as const, description: 'Special cycle for wool and knits', durationMinutes: 50, temperatureCelsius: 30, spinSpeedRpm: 400, priceModifier: '1.10', sortOrder: 5 },
      { name: 'Hand Wash', cycleType: 'hand_wash' as const, description: 'Extra gentle cycle simulating hand wash', durationMinutes: 40, temperatureCelsius: 30, spinSpeedRpm: 300, priceModifier: '1.15', sortOrder: 6 },
    ];

    const createdWashCycles = [];
    for (const cycle of washCyclesData) {
      const [created] = await db.insert(schema.washCycles).values({
        organizationId: org.id,
        ...cycle,
      } as any).onConflictDoNothing().returning();
      if (created) createdWashCycles.push(created);
    }

    console.log('✅ Wash cycles created');

    // Create garment types
    const garmentTypesData = [
      { name: 'T-Shirt', type: 't_shirt' as const, description: 'Standard cotton t-shirt', basePrice: 5000, baseWeightGrams: 150, sortOrder: 1 },
      { name: 'Polo Shirt', type: 'shirt' as const, description: 'Polo/collared shirt', basePrice: 6000, baseWeightGrams: 180, sortOrder: 2 },
      { name: 'Dress Shirt', type: 'shirt' as const, description: 'Formal dress shirt', basePrice: 8000, baseWeightGrams: 200, requiresSpecialCare: true, careInstructions: 'Iron while damp', sortOrder: 3 },
      { name: 'Blouse', type: 'blouse' as const, description: 'Women\'s blouse', basePrice: 7000, baseWeightGrams: 150, requiresSpecialCare: true, sortOrder: 4 },
      { name: 'Pants', type: 'pants' as const, description: 'Casual or dress pants', basePrice: 8000, baseWeightGrams: 300, sortOrder: 5 },
      { name: 'Jeans', type: 'jeans' as const, description: 'Denim jeans', basePrice: 8000, baseWeightGrams: 400, sortOrder: 6 },
      { name: 'Shorts', type: 'shorts' as const, description: 'Casual shorts', basePrice: 5000, baseWeightGrams: 150, sortOrder: 7 },
      { name: 'Dress', type: 'dress' as const, description: 'Casual or formal dress', basePrice: 12000, baseWeightGrams: 300, requiresSpecialCare: true, sortOrder: 8 },
      { name: 'Skirt', type: 'skirt' as const, description: 'Women\'s skirt', basePrice: 6000, baseWeightGrams: 200, sortOrder: 9 },
      { name: 'Sweater', type: 'sweater' as const, description: 'Knitted sweater', basePrice: 10000, baseWeightGrams: 350, requiresSpecialCare: true, careInstructions: 'Lay flat to dry', sortOrder: 10 },
      { name: 'Jacket', type: 'jacket' as const, description: 'Light jacket or hoodie', basePrice: 12000, baseWeightGrams: 500, sortOrder: 11 },
      { name: 'Coat', type: 'coat' as const, description: 'Heavy winter coat', basePrice: 25000, baseWeightGrams: 1500, requiresSpecialCare: true, sortOrder: 12 },
      { name: 'Suit (2-piece)', type: 'suit' as const, description: 'Business suit', basePrice: 30000, baseWeightGrams: 800, requiresSpecialCare: true, careInstructions: 'Dry clean only', sortOrder: 13 },
      { name: 'Tie', type: 'tie' as const, description: 'Necktie', basePrice: 3000, baseWeightGrams: 50, requiresSpecialCare: true, sortOrder: 14 },
      { name: 'Scarf', type: 'scarf' as const, description: 'Scarf or shawl', basePrice: 4000, baseWeightGrams: 100, sortOrder: 15 },
      { name: 'Socks (pair)', type: 'socks' as const, description: 'Pair of socks', basePrice: 1000, baseWeightGrams: 50, sortOrder: 16 },
      { name: 'Underwear', type: 'underwear' as const, description: 'Undergarments', basePrice: 1500, baseWeightGrams: 50, sortOrder: 17 },
      { name: 'Bedding Set', type: 'bedding' as const, description: 'Sheet set, pillowcases', basePrice: 20000, baseWeightGrams: 1500, sortOrder: 18 },
      { name: 'Towel (bath)', type: 'towel' as const, description: 'Bath towel', basePrice: 3000, baseWeightGrams: 400, sortOrder: 19 },
      { name: 'Curtain Panel', type: 'curtain' as const, description: 'Window curtain panel', basePrice: 15000, baseWeightGrams: 500, sortOrder: 20 },
      { name: 'Tablecloth', type: 'tablecloth' as const, description: 'Dining tablecloth', basePrice: 8000, baseWeightGrams: 400, sortOrder: 21 },
      { name: 'Other Item', type: 'other' as const, description: 'Miscellaneous garment', basePrice: 5000, baseWeightGrams: 200, sortOrder: 22 },
    ];

    const createdGarmentTypes = [];
    for (const garment of garmentTypesData) {
      const [created] = await db.insert(schema.garmentTypes).values({
        organizationId: org.id,
        ...garment,
      } as any).onConflictDoNothing().returning();
      if (created) createdGarmentTypes.push(created);
    }

    console.log('✅ Garment types created');

    // Create gasul tanks
    const gasulTanksData = [
      { serialNumber: 'SOL-11-001', brand: 'Solane', capacityKg: 11, tareWeightKg: 9, status: 'full' as const, notes: 'Main dryer tank' },
      { serialNumber: 'SOL-11-002', brand: 'Solane', capacityKg: 11, tareWeightKg: 9, status: 'in_use' as const, notes: 'Backup dryer tank' },
      { serialNumber: 'PET-50-001', brand: 'Petron', capacityKg: 50, tareWeightKg: 42, status: 'full' as const, notes: 'Boiler tank' },
      { serialNumber: 'PRY-11-001', brand: 'Pryce', capacityKg: 11, tareWeightKg: 9, status: 'reserve' as const, notes: 'Emergency reserve' },
      { serialNumber: 'SOL-11-003', brand: 'Solane', capacityKg: 11, tareWeightKg: 9, status: 'empty' as const, notes: 'Needs refill' },
    ];

    const createdGasulTanks = [];
    for (const tank of gasulTanksData) {
      const [created] = await db.insert(schema.gasulTanks).values({
        organizationId: org.id,
        locationId: location.id,
        ...tank,
      }).onConflictDoNothing().returning();
      if (created) createdGasulTanks.push(created);
    }

    console.log('✅ Gasul tanks created');

    // Create gasul refills
    if (createdGasulTanks.length > 0) {
      const refillsData = [
        { tankId: createdGasulTanks[0].id, quantity: 2, pricePerTank: 95000, deliveryFee: 5000, totalAmount: 195000, status: 'delivered' as const, orderedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), invoiceNumber: 'INV-2026-001' },
        { tankId: createdGasulTanks[1].id, quantity: 1, pricePerTank: 95000, deliveryFee: 5000, totalAmount: 100000, status: 'delivered' as const, orderedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000), invoiceNumber: 'INV-2026-002' },
        { tankId: createdGasulTanks[2].id, quantity: 1, pricePerTank: 350000, deliveryFee: 10000, totalAmount: 360000, status: 'delivered' as const, orderedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000), invoiceNumber: 'INV-2026-003' },
        { tankId: createdGasulTanks[4].id, quantity: 1, pricePerTank: 95000, deliveryFee: 5000, totalAmount: 100000, status: 'ordered' as const, orderedAt: new Date(), invoiceNumber: 'INV-2026-004' },
      ];

      for (const refill of refillsData) {
        await db.insert(schema.gasulRefills).values({
          organizationId: org.id,
          locationId: location.id,
          orderedBy: owner.id,
          supplierId: owner.id,
          receivedBy: refill.status === 'delivered' ? owner.id : null,
          ...refill,
        }).onConflictDoNothing();
      }

      console.log('✅ Gasul refills created');
    }

    // Create sample shifts
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    await db.insert(schema.shifts).values([
      {
        locationId: location.id,
        registerId: register1.id,
        cashierId: owner.id,
        shiftNumber: 'SHF-001',
        status: 'closed',
        openedAt: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8:00 AM
        closedAt: new Date(today.getTime() + 16.5 * 60 * 60 * 1000), // 4:30 PM
        expectedCash: 125000,
        actualCash: 124950,
        cashSales: 125000,
        cardSales: 85000,
        totalSales: 210000,
        transactionCount: 47,
        closingNotes: 'Normal close, slight cash discrepancy',
        discrepancyAmount: -50,
        discrepancyReason: 'Rounding difference',
      },
      {
        locationId: location.id,
        registerId: register2.id,
        cashierId: manager.id,
        shiftNumber: 'SHF-002',
        status: 'closed',
        openedAt: new Date(today.getTime() + 8.25 * 60 * 60 * 1000), // 8:15 AM
        closedAt: new Date(today.getTime() + 16.75 * 60 * 60 * 1000), // 4:45 PM
        expectedCash: 98000,
        actualCash: 98100,
        cashSales: 98000,
        cardSales: 72000,
        totalSales: 170000,
        transactionCount: 38,
        closingNotes: 'Smooth close',
        discrepancyAmount: 100,
      },
      {
        locationId: location.id,
        registerId: register1.id,
        cashierId: cashier1.id,
        shiftNumber: 'SHF-003',
        status: 'open',
        openedAt: new Date(today.getTime() + 16.5 * 60 * 60 * 1000), // 4:30 PM
        cashSales: 0,
        cardSales: 45000,
        totalSales: 45000,
        transactionCount: 22,
        openingNotes: 'Afternoon shift started',
      },
      {
        locationId: location.id,
        registerId: register3.id,
        cashierId: cashier2.id,
        shiftNumber: 'SHF-004',
        status: 'closed',
        openedAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
        closedAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 16.5 * 60 * 60 * 1000),
        expectedCash: 110000,
        actualCash: 109800,
        cashSales: 110000,
        cardSales: 95000,
        totalSales: 205000,
        transactionCount: 52,
        closingNotes: 'Yesterday close',
        discrepancyAmount: -200,
        discrepancyReason: 'Short change given',
      },
    ]);

    console.log('✅ Shifts created');

    console.log('🎉 Seed completed successfully!');
    console.log('');
    console.log('Demo credentials:');
    console.log('  Owner: admin@freshfold.com / password123');
    console.log('  Manager: manager@freshfold.com / password123');
    console.log('  Cashier: cashier1@freshfold.com / password123');
    console.log('');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

export { seedConsumablesDefaults };