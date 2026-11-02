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
  Users,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  MoreHorizontal,
  Eye,
  TrendingUp,
  TrendingDown,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Clock,
  Award,
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

type StaffReport = {
  id: string;
  name: string;
  role: string;
  sales: number;
  orders: number;
  revenue: number;
  avgOrderValue: number;
  hoursWorked: number;
  salesPerHour: number;
  tips: number;
};

const mockStaff: StaffReport[] = [
  {
    id: 'staff-1',
    name: 'Sarah Chen',
    role: 'Manager',
    sales: 125430,
    orders: 420,
    revenue: 125430,
    avgOrderValue: 298.64,
    hoursWorked: 168,
    salesPerHour: 746.61,
    tips: 12543,
  },
  {
    id: 'staff-2',
    name: 'Marcus Johnson',
    role: 'Cashier',
    sales: 98760,
    orders: 380,
    revenue: 98760,
    avgOrderValue: 259.89,
    hoursWorked: 160,
    salesPerHour: 617.25,
    tips: 9876,
  },
  {
    id: 'staff-3',
    name: 'Emily Rodriguez',
    role: 'Cashier',
    sales: 87650,
    orders: 310,
    revenue: 87650,
    avgOrderValue: 282.74,
    hoursWorked: 152,
    salesPerHour: 576.64,
    tips: 8765,
  },
  {
    id: 'staff-4',
    name: 'James Wilson',
    role: 'Barista',
    sales: 76540,
    orders: 450,
    revenue: 76540,
    avgOrderValue: 170.09,
    hoursWorked: 144,
    salesPerHour: 531.53,
    tips: 11481,
  },
  {
    id: 'staff-5',
    name: 'Lisa Park',
    role: 'Barista',
    sales: 65430,
    orders: 390,
    revenue: 65430,
    avgOrderValue: 167.77,
    hoursWorked: 136,
    salesPerHour: 481.10,
    tips: 9814,
  },
  {
    id: 'staff-6',
    name: 'David Kim',
    role: 'Cashier',
    sales: 54320,
    orders: 280,
    revenue: 54320,
    avgOrderValue: 194.00,
    hoursWorked: 128,
    salesPerHour: 424.38,
    tips: 5432,
  },
];

const roles = [
  { id: 'role-1', name: 'Manager' },
  { id: 'role-2', name: 'Cashier' },
  { id: 'role-3', name: 'Barista' },
  { id: 'role-4', name: 'Shift Lead' },
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

type ViewMode = 'overview' | 'by_role' | 'by_location';

function StaffReportsPageInner() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [dateRange, setDateRange] = useState('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch {
      setError('Failed to load staff data. Please try again.');
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

  const filteredStaff = mockStaff
    .filter((s) => {
      const matchesRole = selectedRole === 'All' || s.role === selectedRole;
      return matchesRole;
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

  const renderOverview = () => {
    const totalRevenue = filteredStaff.reduce((sum, s) => sum + s.revenue, 0);
    const totalOrders = filteredStaff.reduce((sum, s) => sum + s.orders, 0);
    const totalHours = filteredStaff.reduce((sum, s) => sum + s.hoursWorked, 0);
    const totalTips = filteredStaff.reduce((sum, s) => sum + s.tips, 0);
    const avgSalesPerHour = totalHours > 0 ? totalRevenue / totalHours : 0;

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            icon={DollarSign}
            trend={{ direction: 'up', percentage: 12.5, label: 'vs last period' }}
          />
          <StatCard
            title="Total Orders"
            value={totalOrders.toLocaleString()}
            icon={Users}
            trend={{ direction: 'up', percentage: 8.3, label: 'vs last period' }}
          />
          <StatCard
            title="Hours Worked"
            value={totalHours.toLocaleString()}
            icon={Clock}
            trend={{ direction: 'neutral', percentage: 1.2, label: 'vs last period' }}
          />
          <StatCard
            title="Total Tips"
            value={formatCurrency(totalTips)}
            icon={Award}
            trend={{ direction: 'up', percentage: 15.7, label: 'vs last period' }}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Staff by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">$/Hour</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...filteredStaff].sort((a, b) => b.revenue - a.revenue).slice(0, 5).map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{staff.name}</p>
                          <p className="text-xs text-text-muted">{staff.role}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(staff.revenue)}</TableCell>
                      <TableCell className="text-right">{staff.orders.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(staff.salesPerHour)}/hr</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTableView = () => {
    const getData = () => {
      switch (viewMode) {
        case 'by_role': {
          const byRole = new Map<string, { sales: number; orders: number; revenue: number; hours: number; tips: number; count: number }>();
          filteredStaff.forEach((s) => {
            const existing = byRole.get(s.role) || { sales: 0, orders: 0, revenue: 0, hours: 0, tips: 0, count: 0 };
            byRole.set(s.role, {
              sales: existing.sales + s.sales,
              orders: existing.orders + s.orders,
              revenue: existing.revenue + s.revenue,
              hours: existing.hours + s.hoursWorked,
              tips: existing.tips + s.tips,
              count: existing.count + 1,
            });
          });
          const totalSales = filteredStaff.reduce((sum, s) => sum + s.sales, 0);
          return Array.from(byRole.entries()).map(([role, data]) => ({
            id: role,
            name: role,
            sales: data.sales,
            orders: data.orders,
            revenue: data.revenue,
            hours: data.hours,
            tips: data.tips,
            avgSalesPerHour: data.hours > 0 ? data.revenue / data.hours : 0,
            count: data.count,
            percentage: totalSales > 0 ? Math.round((data.sales / totalSales) * 100) : 0,
          }));
        }
        case 'by_location': {
          const byLocation = new Map<string, { sales: number; orders: number; revenue: number; hours: number }>();
          locations.forEach((loc) => {
            byLocation.set(loc.id, { sales: 0, orders: 0, revenue: 0, hours: 0 });
          });
          filteredStaff.forEach((s) => {
            locations.forEach((loc) => {
              const existing = byLocation.get(loc.id)!;
              const factor = 1 / locations.length;
              byLocation.set(loc.id, {
                sales: existing.sales + Math.round(s.sales * factor),
                orders: existing.orders + Math.round(s.orders * factor),
                revenue: existing.revenue + Math.round(s.revenue * factor),
                hours: existing.hours + Math.round(s.hoursWorked * factor),
              });
            });
          });
          return Array.from(byLocation.entries()).map(([locationId, data]) => ({
            id: locationId,
            name: locations.find((l) => l.id === locationId)?.name || locationId,
            sales: data.sales,
            orders: data.orders,
            revenue: data.revenue,
            hours: data.hours,
          }));
        }
        default:
          return filteredStaff.map((s) => ({
            id: s.id,
            name: s.name,
            role: s.role,
            sales: s.sales,
            orders: s.orders,
            revenue: s.revenue,
            avgOrderValue: s.avgOrderValue,
            hoursWorked: s.hoursWorked,
            salesPerHour: s.salesPerHour,
            tips: s.tips,
          }));
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
          title="No staff match"
          description="Try adjusting your filters or date range."
          icon={<Users className="h-12 w-12 mx-auto text-text-muted/50" />}
        />
      );
    }

    const columns = viewMode === 'by_role'
      ? [
          { key: 'name', label: 'Role' },
          { key: 'sales', label: 'Sales', format: (v: number) => formatCurrency(v) },
          { key: 'orders', label: 'Orders' },
          { key: 'revenue', label: 'Revenue', format: (v: number) => formatCurrency(v) },
          { key: 'hours', label: 'Hours' },
          { key: 'tips', label: 'Tips', format: (v: number) => formatCurrency(v) },
          { key: 'avgSalesPerHour', label: '$/Hour', format: (v: number) => formatCurrency(v) },
          { key: 'count', label: 'Staff Count' },
          { key: 'percentage', label: '% of Total', format: (v: number) => `${v}%` },
        ]
      : viewMode === 'by_location'
      ? [
          { key: 'name', label: 'Location' },
          { key: 'sales', label: 'Sales', format: (v: number) => formatCurrency(v) },
          { key: 'orders', label: 'Orders' },
          { key: 'revenue', label: 'Revenue', format: (v: number) => formatCurrency(v) },
          { key: 'hours', label: 'Hours' },
        ]
      : [
          { key: 'name', label: 'Staff' },
          { key: 'role', label: 'Role' },
          { key: 'sales', label: 'Sales', format: (v: number) => formatCurrency(v) },
          { key: 'orders', label: 'Orders' },
          { key: 'revenue', label: 'Revenue', format: (v: number) => formatCurrency(v) },
          { key: 'avgOrderValue', label: 'Avg Order', format: (v: number) => formatCurrency(v) },
          { key: 'hoursWorked', label: 'Hours' },
          { key: 'salesPerHour', label: '$/Hour', format: (v: number) => formatCurrency(v) },
          { key: 'tips', label: 'Tips', format: (v: number) => formatCurrency(v) },
        ];

    return (
      <Card>
        <CardHeader>
          <CardTitle>Staff Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
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
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Staff Reports</h1>
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
          <h1 className="text-xl font-bold">Staff Reports</h1>
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
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="View by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="by_role">By Role</SelectItem>
                <SelectItem value="by_location">By Location</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {viewMode === 'overview' ? (
          renderOverview()
        ) : (
          renderTableView()
        )}
      </div>
    </div>
  );
}

export default function StaffReportsPage() {
  return (
    <PermissionGuard permission="reports" action="view">
      <Suspense
        fallback={
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
              <h1 className="text-xl font-bold">Staff Reports</h1>
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
      <StaffReportsPageInner />
    </Suspense>
    </PermissionGuard>
  );
}