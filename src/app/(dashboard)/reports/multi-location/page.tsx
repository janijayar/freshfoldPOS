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
  Building2,
  DollarSign,
  Users,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  BarChart2,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyTableState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

type LocationReport = {
  id: string;
  name: string;
  code: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
  itemsSold: number;
  staffCount: number;
  registersCount: number;
  revenueChange: number;
  ordersChange: number;
};

const mockLocationReports: LocationReport[] = [
  {
    id: 'loc-1',
    name: 'Main Street Store',
    code: 'MAIN',
    revenue: 125430,
    orders: 420,
    avgOrderValue: 298.64,
    itemsSold: 850,
    staffCount: 12,
    registersCount: 3,
    revenueChange: 12.5,
    ordersChange: 8.3,
  },
  {
    id: 'loc-2',
    name: 'Downtown Branch',
    code: 'DTWN',
    revenue: 87650,
    orders: 310,
    avgOrderValue: 282.74,
    itemsSold: 580,
    staffCount: 8,
    registersCount: 2,
    revenueChange: 5.2,
    ordersChange: 3.1,
  },
  {
    id: 'loc-3',
    name: 'Oakland Warehouse',
    code: 'WHSE',
    revenue: 45670,
    orders: 180,
    avgOrderValue: 253.72,
    itemsSold: 320,
    staffCount: 5,
    registersCount: 1,
    revenueChange: -2.1,
    ordersChange: 1.5,
  },
  {
    id: 'loc-4',
    name: 'Berkeley Pop-up',
    code: 'POP',
    revenue: 12340,
    orders: 65,
    avgOrderValue: 189.85,
    itemsSold: 120,
    staffCount: 3,
    registersCount: 1,
    revenueChange: 45.7,
    ordersChange: 38.2,
  },
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

function MultiLocationReportsPageInner() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [dateRange, setDateRange] = useState('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch {
      setError('Failed to load multi-location reports. Please try again.');
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

  const sortedReports = [...mockLocationReports].sort((a, b) => {
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

  const SortIcon = ({ key }: { key: string }) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronDown className="h-4 w-4 text-text-muted" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 text-accent" /> : <ChevronDown className="h-4 w-4 text-accent" />;
  };

  const StatCard = ({ title, value, icon: IconComp, trend, subtitle }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    trend?: { direction: 'up' | 'down' | 'neutral'; percentage: number; label?: string };
    subtitle?: string;
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
                  {trend.percentage}% {trend.label}
                </span>
              </div>
            )}
            {subtitle && !trend && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
          </div>
          <div className="p-2 bg-accent-muted rounded-lg">
            <IconComp className="h-5 w-5 text-accent" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const totalRevenue = mockLocationReports.reduce((sum, l) => sum + l.revenue, 0);
  const totalOrders = mockLocationReports.reduce((sum, l) => sum + l.orders, 0);
  const totalItems = mockLocationReports.reduce((sum, l) => sum + l.itemsSold, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Multi-Location Reports</h1>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
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
          <h1 className="text-xl font-bold">Multi-Location Reports</h1>
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
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            icon={DollarSign}
            trend={{ direction: 'up', percentage: 8.7, label: 'vs last period' }}
          />
          <StatCard
            title="Total Orders"
            value={totalOrders.toLocaleString()}
            icon={ShoppingBag}
            trend={{ direction: 'up', percentage: 5.4, label: 'vs last period' }}
          />
          <StatCard
            title="Items Sold"
            value={totalItems.toLocaleString()}
            icon={ShoppingBag}
            trend={{ direction: 'up', percentage: 6.2, label: 'vs last period' }}
          />
          <StatCard
            title="Avg Order Value"
            value={formatCurrency(avgOrderValue)}
            icon={BarChart2}
            trend={{ direction: 'up', percentage: 3.1, label: 'vs last period' }}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Location Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {mockLocationReports.length === 0 ? (
              <EmptyTableState
                title="No location data"
                description="No location reports available for the selected period."
                icon={<Building2 className="h-12 w-12 mx-auto text-text-muted/50" />}
              />
            ) : (
              <ScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                        <div className="flex items-center gap-1">Location <SortIcon key="name" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('revenue')}>
                        <div className="flex items-center gap-1">Revenue <SortIcon key="revenue" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('revenueChange')}>
                        <div className="flex items-center gap-1">Rev Change <SortIcon key="revenueChange" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('orders')}>
                        <div className="flex items-center gap-1">Orders <SortIcon key="orders" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('ordersChange')}>
                        <div className="flex items-center gap-1">Ord Change <SortIcon key="ordersChange" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('avgOrderValue')}>
                        <div className="flex items-center gap-1">Avg Order <SortIcon key="avgOrderValue" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('itemsSold')}>
                        <div className="flex items-center gap-1">Items <SortIcon key="itemsSold" /></div>
                      </TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead>Registers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedReports.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{location.name}</p>
                            <p className="text-xs text-text-muted font-mono">{location.code}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{formatCurrency(location.revenue)}</TableCell>
                        <TableCell>
                          <span className={cn('font-medium', location.revenueChange >= 0 ? 'text-success' : 'text-danger')}>
                            {location.revenueChange >= 0 ? '+' : ''}{location.revenueChange.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>{location.orders.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={cn('font-medium', location.ordersChange >= 0 ? 'text-success' : 'text-danger')}>
                            {location.ordersChange >= 0 ? '+' : ''}{location.ordersChange.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="font-mono">{formatCurrency(location.avgOrderValue)}</TableCell>
                        <TableCell>{location.itemsSold.toLocaleString()}</TableCell>
                        <TableCell>{location.staffCount}</TableCell>
                        <TableCell>{location.registersCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell>Total</TableCell>
                      <TableCell className="font-mono">{formatCurrency(totalRevenue)}</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell>{totalOrders.toLocaleString()}</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell className="font-mono">{formatCurrency(avgOrderValue)}</TableCell>
                      <TableCell>{totalItems.toLocaleString()}</TableCell>
                      <TableCell>{mockLocationReports.reduce((sum, l) => sum + l.staffCount, 0)}</TableCell>
                      <TableCell>{mockLocationReports.reduce((sum, l) => sum + l.registersCount, 0)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function MultiLocationReportsPage() {
  return (
    <PermissionGuard permission="reports" action="view">
      <Suspense
        fallback={
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
              <h1 className="text-xl font-bold">Multi-Location Reports</h1>
            </div>
            <div className="flex-1 p-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
              </div>
              <SkeletonCard className="h-80" />
            </div>
          </div>
        }
      >
      <MultiLocationReportsPageInner />
    </Suspense>
    </PermissionGuard>
  );
}