'use client';

import { ReactNode } from 'react';
import { usePermissions, useRequirePermission } from '@/hooks/usePermissions';
import { Card, CardContent } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { Permission } from '@/lib/permissions';

interface PermissionGuardProps {
  children: ReactNode;
  permission: keyof Permission;
  action?: string;
  fallback?: ReactNode;
}

export function PermissionGuard({ children, permission, action, fallback }: PermissionGuardProps) {
  const { hasAccess, role } = useRequirePermission(permission, action);

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Lock className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-text-muted mb-4">
              You don't have permission to access this page.
              {role && <span className="block mt-1 text-sm">Your role: <strong className="capitalize">{role}</strong></span>}
            </p>
            <p className="text-sm text-text-muted">Contact your manager or owner for access.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export function RoleGuard({ children, allowedRoles = ['owner', 'manager', 'cashier'] }: {
  children: ReactNode;
  allowedRoles?: Array<'owner' | 'manager' | 'cashier'>
}) {
  const { role } = usePermissions();

  if (!allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}