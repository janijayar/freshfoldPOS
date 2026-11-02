'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CreditCard,
  Package,
  Users,
  BarChart3,
  Settings,
  Receipt,
  Clock,
  Store,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Activity,
  Calendar,
  Tag,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { getNavigationForRole } from '@/lib/permissions';

const iconMap = {
  LayoutDashboard,
  CreditCard,
  Package,
  Users,
  BarChart3,
  Settings,
  Receipt,
  Clock,
  Store,
  Droplets,
  Activity,
  Calendar,
  Tag,
} as const;

interface SidebarProps {
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed = false, onCollapseChange }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userRole = (session?.user?.role as 'owner' | 'manager' | 'cashier') || 'cashier';
  const navigation = useMemo(() => getNavigationForRole(userRole), [userRole]);

  const handleToggle = () => {
    const newCollapsed = !collapsed;
    onCollapseChange?.(newCollapsed);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-sticky h-screen bg-surface border-r border-border transition-all duration-200 flex flex-col',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
      aria-label="Main navigation"
    >
      <div className="flex h-header items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2" aria-label="freshfold home">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Store className="w-5 h-5 text-on-accent" aria-hidden="true" />
            </div>
            <span className="font-semibold text-lg text-text">freshfold</span>
          </Link>
        )}
        <button
          onClick={handleToggle}
          className="p-2 rounded-md text-text-muted hover:text-text hover:bg-border transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Navigation">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-accent-muted text-accent'
                  : 'text-text-muted hover:text-text hover:bg-border',
                collapsed && 'justify-center'
              )}
              aria-current={isActive ? 'page' : undefined}
              title={collapsed ? item.name : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              {!collapsed && <span className="font-medium truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <div className={cn('px-3 py-2 rounded-lg', collapsed && 'justify-center')}>
          {!collapsed && (
            <div className="text-xs text-text-muted">v0.1.0</div>
          )}
        </div>
      </div>
    </aside>
  );
}