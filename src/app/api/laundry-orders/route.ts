import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { laundryOrders, laundryOrderItems, orders, customers, users, locations } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';
import { createAuditLog, auditActions, auditEntityTypes } from '@/lib/audit';

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
    const customerId = searchParams.get('customerId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const conditions = [eq(laundryOrders.organizationId, orgId)];
    if (status) conditions.push(eq(laundryOrders.status, status as any));
    if (customerId) conditions.push(eq(laundryOrders.customerId, customerId));

    const laundryOrdersList = await db.query.laundryOrders.findMany({
      where: and(...conditions),
      orderBy: (laundryOrders, { desc }) => [desc(laundryOrders.createdAt)],
      limit,
      offset,
      with: {
        customer: true,
        order: true,
        pickupSchedule: true,
        deliverySchedule: true,
        items: {
          with: {
            garmentType: true,
            washCycle: true,
          },
        },
      },
    });

    return NextResponse.json({ laundryOrders: laundryOrdersList });
  } catch (error) {
    console.error('Error fetching laundry orders:', error);
    return NextResponse.json({ error: 'Failed to fetch laundry orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const body = await request.json();

    // Get first location for the organization
    const location = await db.query.locations.findFirst({
      where: eq(locations.organizationId, orgId),
    });

    if (!location) {
      return NextResponse.json({ error: 'No location found for organization' }, { status: 400 });
    }

    // Create the laundry order
    const order = await db.insert(laundryOrders).values({
      organizationId: orgId,
      locationId: location.id,
      orderId: body.orderId,
      customerId: body.customerId,
      pickupScheduleId: body.pickupScheduleId,
      deliveryScheduleId: body.deliveryScheduleId,
      status: body.status || 'received',
      totalWeightKg: body.totalWeightKg,
      totalItems: body.totalItems || 0,
      bagCount: body.bagCount || 1,
      specialInstructions: body.specialInstructions,
      receivedAt: body.receivedAt ? new Date(body.receivedAt) : new Date(),
    }).returning();

    // Create laundry order items if provided
    if (body.items && body.items.length > 0) {
      for (const item of body.items) {
        await db.insert(laundryOrderItems).values({
          laundryOrderId: order[0].id,
          garmentTypeId: item.garmentTypeId,
          washCycleId: item.washCycleId,
          name: item.name,
          description: item.description,
          quantity: item.quantity || 1,
          weightGrams: item.weightGrams,
          price: item.price,
          status: item.status || 'received',
          stainTreatment: item.stainTreatment || false,
          specialCare: item.specialCare || false,
          notes: item.notes,
        });
      }
    }

    // Audit log
    await createAuditLog({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      action: auditActions.create,
      entityType: auditEntityTypes.laundryOrder,
      entityId: order[0].id,
      newData: { ...order[0], items: body.items },
    });

    return NextResponse.json({ laundryOrder: order[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating laundry order:', error);
    return NextResponse.json({ error: 'Failed to create laundry order' }, { status: 500 });
  }
}