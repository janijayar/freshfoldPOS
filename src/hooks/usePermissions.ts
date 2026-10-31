'use client';

import { useSession } from 'next-auth/react';
import { hasPermission, hasSpecificPermission, UserRole, Permission } from '@/lib/permissions';

export function usePermissions() {
  const { data: session } = useSession();
  const role = (session?.user?.role as UserRole) || 'cashier';

  return {
    role,
    can: (permission: keyof Permission) => hasPermission(role, permission),
    canSpecific: (permission: keyof Permission, action: string) =>
      hasSpecificPermission(role, permission, action),
    isOwner: role === 'owner',
    isManager: role === 'manager',
    isCashier: role === 'cashier',
  };
}

export function useRequirePermission(permission: keyof Permission, action?: string) {
  const { can, canSpecific, role } = usePermissions();

  const hasAccess = action ? canSpecific(permission, action) : can(permission);

  return { hasAccess, role };
}