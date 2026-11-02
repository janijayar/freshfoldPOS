import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  consumptionRule,
  consumableThreshold,
  locations,
} from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';

export const dynamic = 'force-dynamic';

const serviceTypes = ['REGULAR', 'DELUXE', 'EXTRA_DRY', 'EXTRA_WASH', 'HAND_WASH'] as const;
const machineTypes = ['LG_GIANT', 'LG_TITAN'] as const;
const fabconStates = [false, true];

const thresholdsData = [
  { consumableType: 'DETERGENT' as const, minimumQty: 5000, unit: 'ml' as const },
  { consumableType: 'REGULAR_FABCON' as const, minimumQty: 5000, unit: 'ml' as const },
  { consumableType: 'IMPORTED_FABCON' as const, minimumQty: 2000, unit: 'ml' as const },
  { consumableType: 'PLASTICS' as const, minimumQty: 100, unit: 'pcs' as const },
  { consumableType: 'GASUL' as const, minimumQty: 5, unit: 'kg' as const },
];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only owners and admins can re-seed
    if (!['owner', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden: Only owners and admins can re-seed' }, { status: 403 });
    }

    const body = await request.json();
    const { locationId } = body;

    if (!locationId) {
      return NextResponse.json({ error: 'locationId is required' }, { status: 400 });
    }

    // Verify location belongs to organization
    const location = await db.query.locations.findFirst({
      where: eq(locations.id, locationId),
      columns: { id: true, organizationId: true },
    });

    if (!location || location.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Delete existing consumption rules for this location
    await db.delete(consumptionRule).where(eq(consumptionRule.locationId, locationId));

    // Delete existing thresholds for this location
    await db.delete(consumableThreshold).where(eq(consumableThreshold.locationId, locationId));

    // Re-seed consumption rules: 5 services × 2 machines × 2 fabcon states = 20 rules
    for (const serviceType of serviceTypes) {
      for (const machineType of machineTypes) {
        for (const hasImportedFabcon of fabconStates) {
          let gasKg = '0.15';

          if (machineType === 'LG_TITAN') {
            gasKg = '0.20';
          }

          if (serviceType === 'EXTRA_DRY') {
            gasKg = machineType === 'LG_GIANT' ? '0.04' : '0.05';
          }

          await db.insert(consumptionRule).values({
            locationId,
            serviceType,
            machineType,
            hasImportedFabcon,
            detergentMl: 80,
            regularFabconMl: hasImportedFabcon ? 0 : 80,
            importedFabconMl: hasImportedFabcon ? 40 : 0,
            plasticsCount: 1,
            gasKg,
          });
        }
      }
    }

    // Re-seed thresholds: 5 per location
    for (const threshold of thresholdsData) {
      await db.insert(consumableThreshold).values({
        locationId,
        consumableType: threshold.consumableType,
        minimumQty: threshold.minimumQty,
        unit: threshold.unit,
      });
    }

    return NextResponse.json({
      message: 'Consumables re-seeded successfully',
      rulesCreated: serviceTypes.length * machineTypes.length * fabconStates.length,
      thresholdsCreated: thresholdsData.length,
    });
  } catch (error) {
    console.error('Error re-seeding consumables:', error);
    return NextResponse.json({ error: 'Failed to re-seed consumables' }, { status: 500 });
  }
}