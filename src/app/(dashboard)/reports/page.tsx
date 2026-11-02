'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart2,
  ShoppingBag,
  Users,
  Clock,
  TrendingUp,
  CreditCard,
  Receipt,
  Gift,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

const reportTypes = [
  {
    key: 'sales',
    title: 'Sales Report',
    description: 'Revenue, orders, average order value, and sales trends',
    icon: BarChart2,
    iconColor: 'bg-blue-500',
    href: '/reports/sales',
  },
  {
    key: 'products',
    title: 'Product Report',
    description: 'Top selling products, categories, and inventory performance',
    icon: ShoppingBag,
    iconColor: 'bg-green-500',
    href: '/reports/products',
  },
  {
    key: 'staff',
    title: 'Staff Report',
    description: 'Employee performance, hours, and sales by cashier',
    icon: Users,
    iconColor: 'bg-purple-500',
    href: '/reports/staff',
  },
  {
    key: 'shifts',
    title: 'Shift Report',
    description: 'Shift summaries, cash reconciliation, and discrepancies',
    icon: Clock,
    iconColor: 'bg-orange-500',
    href: '/reports/shifts',
  },
  {
    key: 'multi-location',
    title: 'Multi-Location Report',
    description: 'Compare performance across all locations',
    icon: TrendingUp,
    iconColor: 'bg-teal-500',
    href: '/reports/multi-location',
  },
];

function ReportsContent() {
  const router = useRouter();

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
        <div>
          <h1 className="text-xl font-bold">Reports</h1>
          <p className="text-sm text-text-muted mt-1">View and analyze your business performance</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reportTypes.map((report) => (
              <Card
                key={report.key}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(report.href)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={cn('p-3 rounded-lg', report.iconColor)}>
                      <report.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription className="mt-1">{report.description}</CardDescription>
                    </div>
                    <ChevronRight className="h-5 w-5 text-text-muted mt-1 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common reporting tasks</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col items-start gap-2"
                    onClick={() => router.push('/reports/sales')}
                  >
                    <BarChart2 className="h-6 w-6" />
                    <span className="font-medium">Daily Sales</span>
                    <span className="text-sm text-text-muted">Today's revenue summary</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col items-start gap-2"
                    onClick={() => router.push('/reports/products')}
                  >
                    <ShoppingBag className="h-6 w-6" />
                    <span className="font-medium">Top Products</span>
                    <span className="text-sm text-text-muted">Best sellers this week</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col items-start gap-2"
                    onClick={() => router.push('/reports/staff')}
                  >
                    <Users className="h-6 w-6" />
                    <span className="font-medium">Staff Performance</span>
                    <span className="text-sm text-text-muted">This month's leaders</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col items-start gap-2"
                    onClick={() => router.push('/reports/shifts')}
                  >
                    <Clock className="h-6 w-6" />
                    <span className="font-medium">Shift Summary</span>
                    <span className="text-sm text-text-muted">Open shifts & reconciliation</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <PermissionGuard permission="reports">
      <ReportsContent />
    </PermissionGuard>
  );
}