export type UserRole = 'owner' | 'manager' | 'cashier';

export interface Permission {
  dashboard: boolean;
  pos: boolean;
  inventory: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  customers: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  reports: boolean;
  shifts: { view: boolean; manage: boolean };
  receipts: boolean;
  staff: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  settings: { view: boolean; organization: boolean; users: boolean; payments: boolean; locations: boolean; register: boolean; store: boolean; tax: boolean };
  gasul: boolean;
  auditLogs: boolean;
  notifications: boolean;
}

export const rolePermissions: Record<UserRole, Permission> = {
  owner: {
    dashboard: true,
    pos: true,
    inventory: { view: true, create: true, edit: true, delete: true },
    customers: { view: true, create: true, edit: true, delete: true },
    reports: true,
    shifts: { view: true, manage: true },
    receipts: true,
    staff: { view: true, create: true, edit: true, delete: true },
    settings: { view: true, organization: true, users: true, payments: true, locations: true, register: true, store: true, tax: true },
    gasul: true,
    auditLogs: true,
    notifications: true,
  },
  manager: {
    dashboard: true,
    pos: true,
    inventory: { view: true, create: true, edit: true, delete: false },
    customers: { view: true, create: true, edit: true, delete: false },
    reports: true,
    shifts: { view: true, manage: true },
    receipts: true,
    staff: { view: true, create: true, edit: true, delete: false },
    settings: { view: true, organization: false, users: true, payments: false, locations: true, register: true, store: true, tax: true },
    gasul: true,
    auditLogs: true,
    notifications: true,
  },
  cashier: {
    dashboard: false,
    pos: true,
    inventory: { view: true, create: false, edit: false, delete: false },
    customers: { view: true, create: true, edit: false, delete: false },
    reports: false,
    shifts: { view: true, manage: false },
    receipts: true,
    staff: { view: false, create: false, edit: false, delete: false },
    settings: { view: true, organization: false, users: false, payments: false, locations: false, register: false, store: false, tax: false },
    gasul: false,
    auditLogs: false,
    notifications: true,
  },
};

export function hasPermission(role: UserRole, permission: keyof Permission): boolean {
  const perm = rolePermissions[role]?.[permission];
  if (typeof perm === 'boolean') return perm;
  if (typeof perm === 'object') return Object.values(perm).some(v => v);
  return false;
}

export function hasSpecificPermission(role: UserRole, permission: keyof Permission, action: string): boolean {
  const perm = rolePermissions[role]?.[permission];
  if (typeof perm === 'boolean') return perm;
  if (typeof perm === 'object') return perm[action as keyof typeof perm] === true;
  return false;
}

export function getNavigationForRole(role: UserRole) {
  const perm = rolePermissions[role];
  const items = [];

  if (perm.dashboard) items.push({ name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' });
  if (perm.pos) items.push({ name: 'POS', href: '/pos', icon: 'CreditCard' });
  if (perm.inventory.view) items.push({ name: 'Product & Services', href: '/inventory', icon: 'Package' });
  if (perm.inventory.view) items.push({ name: 'Categories', href: '/categories', icon: 'Tag' });
  if (perm.inventory.view) items.push({ name: 'Supplies Calendar', href: '/inventory/supplies/calendar', icon: 'Calendar' });
  if (perm.customers.view) items.push({ name: 'Customers', href: '/customers', icon: 'Users' });
  if (perm.reports) items.push({ name: 'Reports', href: '/reports', icon: 'BarChart3' });
  if (perm.shifts.view) items.push({ name: 'Shifts', href: '/shifts', icon: 'Clock' });
  if (perm.receipts) items.push({ name: 'Receipts', href: '/receipts', icon: 'Receipt' });
  if (perm.staff.view) items.push({ name: 'Staff', href: '/employees', icon: 'Store' });
  if (perm.gasul) items.push({ name: 'Gasul Tracker', href: '/gasul', icon: 'Droplets' });
  if (perm.auditLogs) items.push({ name: 'Audit Logs', href: '/audit-logs', icon: 'Activity' });
  if (perm.settings.view) items.push({ name: 'Settings', href: '/settings', icon: 'Settings' });

  return items;
}