import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';
import { headers } from 'next/headers';

interface AuditLogParams {
  organizationId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldData?: Record<string, any> | null;
  newData?: Record<string, any> | null;
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') ||
                      headersList.get('x-real-ip') ||
                      'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    await db.insert(auditLogs).values({
      organizationId: params.organizationId,
      userId: params.userId || null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId || null,
      oldData: params.oldData || null,
      newData: params.newData || null,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    // Log error but don't throw - audit logging should never break the main operation
    console.error('Failed to create audit log:', error);
  }
}

// Helper function for common audit actions
export const auditActions = {
  create: 'create',
  update: 'update',
  delete: 'delete',
  login: 'login',
  logout: 'logout',
  view: 'view',
  export: 'export',
  import: 'import',
  print: 'print',
  refund: 'refund',
  void: 'void',
} as const;

export const auditEntityTypes = {
  order: 'order',
  orderItem: 'order_item',
  payment: 'payment',
  receipt: 'receipt',
  customer: 'customer',
  product: 'product',
  variant: 'variant',
  inventory: 'inventory',
  inventoryAdjustment: 'inventory_adjustment',
  shift: 'shift',
  user: 'user',
  register: 'register',
  location: 'location',
  organization: 'organization',
  discount: 'discount',
  category: 'category',
  washCycle: 'wash_cycle',
  garmentType: 'garment_type',
  pickupSchedule: 'pickup_schedule',
  deliverySchedule: 'delivery_schedule',
  laundryOrder: 'laundry_order',
  laundryOrderItem: 'laundry_order_item',
  customerLaundryPreferences: 'customer_laundry_preferences',
  gasulTank: 'gasul_tank',
  gasulRefill: 'gasul_refill',
  gasulUsage: 'gasul_usage',
  settings: 'settings',
} as const;