'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Loader2,
  AlertCircle,
  WifiOff,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowUpDown,
  RefreshCw,
  Calendar,
  BarChart2,
  CreditCard,
  Receipt,
  Gift,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton, SkeletonCard, SkeletonStatCard } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyTableState } from '@/components/ui/empty-state';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useDashboard } from '@/hooks/useApi';
import { users } from '@/lib/db/schema';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

type StatCard = {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
};

type RecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: 'completed' | 'refunded' | 'pending';
  paymentMethod: string;
  createdAt: string;
};

type TopProduct = {
  id: string;
  name: string;
  category: string;
  quantitySold: number;
  revenue: number;
};

type LowStockProduct = {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  threshold: number;
};

function DashboardContent() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'products'>('overview');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const dashboardParams: Record<string, string> = {};
  if (dateRange.from) dashboardParams.fromDate = dateRange.from;
  if (dateRange.to) dashboardParams.toDate = dateRange.to;
  const { data, loading, mutate: refetch } = useDashboard(dashboardParams);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchData = () => {
    refetch();
  };

  const StatCardComponent = ({ stat }: { stat: StatCard }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-text-muted">{stat.title}</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">{stat.value}</p>
            <div className="flex items-center gap-1 mt-2">
              <span className={cn('text-sm font-medium', stat.change >= 0 ? 'text-success' : 'text-danger')}>
                {stat.change >= 0 ? '+' : ''}{stat.change}%
              </span>
              <span className="text-sm text-text-muted">{stat.changeLabel}</span>
            </div>
          </div>
          <div className={cn('p-3 rounded-lg', stat.iconColor)}>
            <stat.icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'success' | 'danger' | 'warning'; label: string }> = {
      completed: { variant: 'success', label: 'Completed' },
      refunded: { variant: 'danger', label: 'Refunded' },
      pending: { variant: 'warning', label: 'Pending' },
    };
    const c = config[status] || config.pending;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Build stat cards from real data
  const stats: StatCard[] = React.useMemo(() => {
    const current = data?.stats?.current || {};
    const previous = data?.stats?.previous || {};
    const totalSales = Number(current.totalSales || 0);
    const prevTotalSales = Number(previous.totalSales || 0);
    const orderCount = Number(current.orderCount || 0);
    const prevOrderCount = Number(previous.orderCount || 0);
    const avgOrderValue = Number(current.avgOrderValue || 0);
    const prevAvgOrderValue = Number(previous.avgOrderValue || 0);
    const customerCount = Number(data?.stats?.customerCount || 0);

    return [
      {
        title: 'Total Sales',
        value: formatCurrency(totalSales),
        change: calculateChange(totalSales, prevTotalSales),
        changeLabel: 'vs last period',
        icon: DollarSign,
        iconColor: 'text-success',
      },
      {
        title: 'Orders',
        value: orderCount.toLocaleString(),
        change: calculateChange(orderCount, prevOrderCount),
        changeLabel: 'vs last period',
        icon: ShoppingBag,
        iconColor: 'text-accent',
      },
      {
        title: 'Customers',
        value: customerCount.toLocaleString(),
        change: 0,
        changeLabel: 'total',
        icon: Users,
        iconColor: 'text-info',
      },
      {
        title: 'Avg Order Value',
        value: formatCurrency(avgOrderValue),
        change: calculateChange(avgOrderValue, prevAvgOrderValue),
        changeLabel: 'vs last period',
        icon: CreditCard,
        iconColor: 'text-warning',
      },
    ];
  }, [data]);

  // Transform recent orders
  const recentOrders: RecentOrder[] = React.useMemo(() => {
    return (data?.recentOrders || []).map((o: any) => ({
      id: o.order.id,
      orderNumber: o.order.orderNumber,
      customerName: o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : 'Walk-in',
      total: Number(o.order.total),
      status: o.order.status,
      paymentMethod: o.order.payments?.[0]?.method || 'Unknown',
      createdAt: o.order.createdAt,
    }));
  }, [data]);

  // Transform top products
  const topProducts: TopProduct[] = React.useMemo(() => {
    return (data?.topProducts || []).map((p: any) => ({
      id: p.product.id,
      name: p.product.name,
      category: p.product.category?.name || 'Unknown',
      quantitySold: Number(p.quantitySold || 0),
      revenue: Number(p.revenue || 0),
    }));
  }, [data]);

  // Transform low stock
  const lowStock: LowStockProduct[] = React.useMemo(() => {
    return (data?.lowStock || []).map((l: any) => ({
      id: l.product.id,
      name: l.product.name,
      sku: l.product.sku,
      currentStock: Number(l.inventory.quantity || 0),
      threshold: Number(l.inventory.reorderPoint || 10),
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-2">
            <Select value={dateRange.from} onValueChange={(v) => setDateRange({ ...dateRange, from: v })}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="From" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="last_week">Last Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange.to} onValueChange={(v) => setDateRange({ ...dateRange, to: v })}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="To" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="last_week">Last Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchData} aria-label="Refresh">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <SkeletonStatCard key={i} />)}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        variant={!isOnline ? 'network' : 'server'}
        onRetry={fetchData}
        onGoHome={() => router.push('/login')}
        title={!isOnline ? 'You are offline' : undefined}
        description={!isOnline ? 'Data will sync when connection is restored.' : undefined}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Select value={dateRange.from} onValueChange={(v) => setDateRange({ ...dateRange, from: v })}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="From" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="last_week">Last Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange.to} onValueChange={(v) => setDateRange({ ...dateRange, to: v })}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="To" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="last_week">Last Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchData} aria-label="Refresh">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {stats.map((stat) => (
            <StatCardComponent key={stat.title} stat={stat} />
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'overview' | 'sales' | 'products')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Recent Orders</TabsTrigger>
            <TabsTrigger value="products">Top Products</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Low Stock Alerts</CardTitle>
                  <CardDescription>Products below their reorder threshold</CardDescription>
                </CardHeader>
                <CardContent>
                  {lowStock.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-text-muted/50" />
                      <p className="text-text-muted mt-2">All products well stocked</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lowStock.map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-surface rounded-lg border">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-text-muted">{product.sku}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={product.currentStock === 0 ? 'danger' : 'warning'}>
                              {product.currentStock} left
                            </Badge>
                            <span className="text-sm text-text-muted">Threshold: {product.threshold}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button variant="outline" className="h-auto py-4 flex flex-col items-start gap-2" asChild>
                      <a href="/pos">
                        <ShoppingBag className="h-6 w-6" />
                        <span className="font-medium">Open POS</span>
                        <span className="text-sm text-text-muted">Start selling</span>
                      </a>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col items-start gap-2" asChild>
                      <a href="/inventory/new">
                        <Gift className="h-6 w-6" />
                        <span className="font-medium">Add Product</span>
                        <span className="text-sm text-text-muted">New inventory item</span>
                      </a>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col items-start gap-2" asChild>
                      <a href="/customers">
                        <Users className="h-6 w-6" />
                        <span className="font-medium">View Customers</span>
                        <span className="text-sm text-text-muted">Customer directory</span>
                      </a>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col items-start gap-2" asChild>
                      <a href="/reports/sales">
                        <BarChart2 className="h-6 w-6" />
                        <span className="font-medium">Sales Reports</span>
                        <span className="text-sm text-text-muted">View analytics</span>
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest orders across all registers</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-text-muted">
                            No recent orders
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono font-medium">{order.orderNumber}</TableCell>
                            <TableCell>{order.customerName}</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{formatCurrency(order.total)}</TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell>{order.paymentMethod}</TableCell>
                            <TableCell className="text-text-muted">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>Best performers by revenue</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Qty Sold</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-text-muted">
                            No sales data
                          </TableCell>
                        </TableRow>
                      ) : (
                        topProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell><Badge variant="secondary">{product.category}</Badge></TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{product.quantitySold}</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{formatCurrency(product.revenue)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <PermissionGuard permission="reports" action="view" fallback={<div />}>
      <Suspense fallback={
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
            <h1 className="text-xl font-bold">Dashboard</h1>
          </div>
          <div className="flex-1 p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => <SkeletonStatCard key={i} />)}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>
      }>
        <DashboardContent />
      </Suspense>
    </PermissionGuard>
  );
}