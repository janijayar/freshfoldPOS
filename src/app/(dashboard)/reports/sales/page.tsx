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
  BarChart2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Calendar,
  Filter,
  Download,
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton, SkeletonTable, SkeletonCard } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyTableState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

type SalesSummary = {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  totalItems: number;
  totalDiscounts: number;
  totalTax: number;
  netSales: number;
  prevPeriodSales: number;
};

type SalesByCategory = {
  category: string;
  sales: number;
  orders: number;
  items: number;
  percentage: number;
};

type SalesByStaff = {
  staffId: string;
  staffName: string;
  sales: number;
  orders: number;
  avgOrderValue: number;
};

type SalesByHour = {
  hour: number;
  sales: number;
  orders: number;
};

type SalesByLocation = {
  locationId: string;
  locationName: string;
  sales: number;
  orders: number;
};

const mockSummary: SalesSummary = {
  totalSales: 125430,
  totalOrders: 342,
  avgOrderValue: 36675,
  totalItems: 1026,
  totalDiscounts: 8230,
  totalTax: 11250,
  netSales: 117180,
  prevPeriodSales: 118200,
};

const mockByCategory: SalesByCategory[] = [
  { category: 'Beverages', sales: 62500, orders: 185, items: 450, percentage: 49.8 },
  { category: 'Food', sales: 38900, orders: 112, items: 310, percentage: 31.0 },
  { category: 'Merchandise', sales: 24030, orders: 45, items: 66, percentage: 19.2 },
];

const mockByStaff: SalesByStaff[] = [
  { staffId: '1', staffName: 'Sarah Mitchell', sales: 45200, orders: 120, avgOrderValue: 37667 },
  { staffId: '2', staffName: 'Mike Chen', sales: 38900, orders: 105, avgOrderValue: 37048 },
  { staffId: '3', staffName: 'Emma Davis', sales: 28500, orders: 78, avgOrderValue: 36538 },
  { staffId: '4', staffName: 'James Wilson', sales: 12830, orders: 39, avgOrderValue: 32897 },
];

const mockByHour: SalesByHour[] = [
  { hour: 6, sales: 1200, orders: 8 },
  { hour: 7, sales: 3400, orders: 15 },
  { hour: 8, sales: 8900, orders: 32 },
  { hour: 9, sales: 15600, orders: 48 },
  { hour: 10, sales: 12300, orders: 38 },
  { hour: 11, sales: 14500, orders: 42 },
  { hour: 12, sales: 18900, orders: 55 },
  { hour: 13, sales: 16700, orders: 50 },
  { hour: 14, sales: 11200, orders: 35 },
  { hour: 15, sales: 9800, orders: 28 },
  { hour: 16, sales: 7600, orders: 22 },
  { hour: 17, sales: 5400, orders: 18 },
  { hour: 18, sales: 3200, orders: 12 },
];

const mockByLocation: SalesByLocation[] = [
  { locationId: 'loc-1', locationName: 'Main Street Store', sales: 85430, orders: 245 },
  { locationId: 'loc-2', locationName: 'Downtown Branch', sales: 40000, orders: 97 },
];

const locations = [
  { id: 'loc-1', name: 'Main Street Store' },
  { id: 'loc-2', name: 'Downtown Branch' },
  { id: 'loc-3', name: 'Warehouse' },
];

const dateRanges = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'custom', label: 'Custom Range' },
];

type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;

function SalesReportsPageInner() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [dateRange, setDateRange] = useState('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStaff, setSelectedStaff] = useState('All');
  const [viewMode, setViewMode] = useState<'overview' | 'by_category' | 'by_staff' | 'by_hour' | 'by_location'>('overview');
  const [summary] = useState<SalesSummary>(mockSummary);
  const [byCategory] = useState<SalesByCategory[]>(mockByCategory);
  const [byStaff] = useState<SalesByStaff[]>(mockByStaff);
  const [byHour] = useState<SalesByHour[]>(mockByHour);
  const [byLocation] = useState<SalesByLocation[]>(mockByLocation);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch {
      setError('Failed to load sales data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key && current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const getTrend = (current: number, previous: number) => {
    if (previous === 0) return { direction: 'neutral' as const, percentage: 0 };
    const change = ((current - previous) / previous) * 100;
    return {
      direction: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const,
      percentage: Math.abs(Math.round(change * 10) / 10),
    };
  };

  const trend = getTrend(summary.totalSales, summary.prevPeriodSales);

  const SortIcon = ({ key }: { key: string }) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronDown className="h-4 w-4 text-text-muted" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 text-accent" /> : <ChevronDown className="h-4 w-4 text-accent" />;
  };

  const StatCard = ({ title, value, icon: Icon, trend, trendLabel }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    trend?: { direction: 'up' | 'down' | 'neutral'; percentage: number };
    trendLabel?: string;
  }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-text-muted">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trend.direction === 'up' && <TrendingUp className="h-4 w-4 text-success" />}
                {trend.direction === 'down' && <TrendingDown className="h-4 w-4 text-danger" />}
                {trend.direction === 'neutral' && <span className="h-4 w-4 text-text-muted">–</span>}
                <span className={cn('text-sm font-medium', trend.direction === 'up' ? 'text-success' : trend.direction === 'down' ? 'text-danger' : 'text-text-muted')}>
                  {trend.percentage}% {trendLabel}
                </span>
              </div>
            )}
          </div>
          <div className="p-2 bg-accent-muted rounded-lg">
            <Icon className="h-5 w-5 text-accent" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sales"
          value={formatCurrency(summary.totalSales)}
          icon={DollarSign}
          trend={trend}
          trendLabel="vs last period"
        />
        <StatCard
          title="Total Orders"
          value={summary.totalOrders.toLocaleString()}
          icon={ShoppingBag}
          trend={{ direction: 'up', percentage: 5.2 }}
          trendLabel="vs last period"
        />
        <StatCard
          title="Avg Order Value"
          value={formatCurrency(summary.avgOrderValue)}
          icon={BarChart2}
          trend={{ direction: 'up', percentage: 2.1 }}
          trendLabel="vs last period"
        />
        <StatCard
          title="Items Sold"
          value={summary.totalItems.toLocaleString()}
          icon={Package}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Net Sales"
          value={formatCurrency(summary.netSales)}
          icon={DollarSign}
        />
        <StatCard
          title="Total Discounts"
          value={formatCurrency(summary.totalDiscounts)}
          icon={TrendingDown}
        />
        <StatCard
          title="Total Tax"
          value={formatCurrency(summary.totalTax)}
          icon={TrendingUp}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sales by Hour</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end gap-1 px-2">
            {byHour.map((data, index) => {
              const maxSales = Math.max(...byHour.map(d => d.sales));
              const height = (data.sales / maxSales) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center justify-end min-w-0">
                  <div
                    className="w-full bg-accent rounded-t transition-all hover:bg-accent/80"
                    style={{ height: `${height}%` }}
                    title={`${data.hour}:00 - ${formatCurrency(data.sales)} (${data.orders} orders)`}
                  />
                  <span className="text-xs text-text-muted mt-1">{data.hour}:00</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTableView = () => {
    const getData = () => {
      switch (viewMode) {
        case 'by_category':
          return byCategory.map((item, i) => ({
            id: String(i),
            name: item.category,
            sales: item.sales,
            orders: item.orders,
            items: item.items,
            percentage: item.percentage,
          }));
        case 'by_staff':
          return byStaff.map((item) => ({
            id: item.staffId,
            name: item.staffName,
            sales: item.sales,
            orders: item.orders,
            avgOrder: item.avgOrderValue,
          }));
        case 'by_location':
          return byLocation.map((item) => ({
            id: item.locationId,
            name: item.locationName,
            sales: item.sales,
            orders: item.orders,
          }));
        default:
          return [];
      }
    };

    const data = getData();
    const sortedData = [...data].sort((a, b) => {
      if (!sortConfig) return 0;
      const aVal = (a as any)[sortConfig.key];
      const bVal = (b as any)[sortConfig.key];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bVal == null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    if (data.length === 0) {
      return (
        <EmptyTableState
          title="No data available"
          description="Try adjusting your filters or date range."
          icon={<BarChart2 className="h-12 w-12 mx-auto text-text-muted/50" />}
        />
      );
    }

    const columns = viewMode === 'by_category'
      ? [
          { key: 'name', label: 'Category' },
          { key: 'sales', label: 'Sales', format: (v: number) => formatCurrency(v) },
          { key: 'orders', label: 'Orders' },
          { key: 'items', label: 'Items' },
          { key: 'percentage', label: '% of Total', format: (v: number) => `${v}%` },
        ]
      : viewMode === 'by_staff'
      ? [
          { key: 'name', label: 'Staff' },
          { key: 'sales', label: 'Sales', format: (v: number) => formatCurrency(v) },
          { key: 'orders', label: 'Orders' },
          { key: 'avgOrder', label: 'Avg Order', format: (v: number) => formatCurrency(v) },
        ]
      : [
          { key: 'name', label: 'Location' },
          { key: 'sales', label: 'Sales', format: (v: number) => formatCurrency(v) },
          { key: 'orders', label: 'Orders' },
        ];

    return (
      <ScrollArea className="h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className="cursor-pointer select-none" onClick={() => handleSort(col.key)}>
                  <div className="flex items-center gap-1">
                    {col.label} <SortIcon key={col.key} />
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((row) => (
              <TableRow key={row.id}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {col.format ? col.format((row as any)[col.key]) : (row as any)[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Sales Reports</h1>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
          <SkeletonCard className="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        variant={!isOnline ? 'network' : 'server'}
        onRetry={fetchData}
        onGoHome={() => router.push('/dashboard')}
        title={!isOnline ? 'You are offline' : undefined}
        description={!isOnline ? 'Data will sync when connection is restored.' : undefined}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Sales Reports</h1>
          <Badge variant={isOnline ? 'success' : 'warning'} className="gap-1">
            {isOnline ? (
              <>
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" aria-hidden="true" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" aria-hidden="true" />
                Offline
              </>
            )}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} aria-label="Refresh">
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            Refresh
          </Button>
          <Button variant="primary">
            <Download className="h-4 w-4 mr-2" aria-hidden="true" />
            Export
          </Button>
        </div>
      </div>

      <div className="p-4 border-b border-border bg-surface space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {dateRanges.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {dateRange === 'custom' && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-[140px]"
                  aria-label="Start date"
                />
                <span className="text-text-muted">to</span>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-[140px]"
                  aria-label="End date"
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Locations</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                <SelectItem value="Beverages">Beverages</SelectItem>
                <SelectItem value="Food">Food</SelectItem>
                <SelectItem value="Merchandise">Merchandise</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Staff</SelectItem>
                <SelectItem value="1">Sarah Mitchell</SelectItem>
                <SelectItem value="2">Mike Chen</SelectItem>
                <SelectItem value="3">Emma Davis</SelectItem>
                <SelectItem value="4">James Wilson</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Report view">
          {([
            { value: 'overview', label: 'Overview', icon: BarChart2 },
            { value: 'by_category', label: 'By Category', icon: Package },
            { value: 'by_staff', label: 'By Staff', icon: Users },
            { value: 'by_location', label: 'By Location', icon: ShoppingBag },
          ] as const).map((tab) => (
            <Button
              key={tab.value}
              role="tab"
              aria-selected={viewMode === tab.value}
              variant={viewMode === tab.value ? 'primary' : 'outline'}
              onClick={() => setViewMode(tab.value)}
              className="gap-2"
            >
              <tab.icon className="h-4 w-4" aria-hidden="true" />
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {viewMode === 'overview' ? (
          renderOverview()
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="capitalize">{viewMode.replace('_', ' ')}</CardTitle>
            </CardHeader>
            <CardContent>
              {renderTableView()}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function SalesReportsPage() {
  return (
    <PermissionGuard permission="reports" action="view">
      <Suspense fallback={
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
            <h1 className="text-xl font-bold">Sales Reports</h1>
          </div>
          <div className="flex-1 p-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
            <SkeletonCard className="h-80" />
          </div>
        </div>
      }>
        <SalesReportsPageInner />
      </Suspense>
    </PermissionGuard>
  );
}