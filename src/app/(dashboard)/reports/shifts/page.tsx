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
  Clock,
  Coins,
  Users,
  Package,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Edit,
  TrendingUp,
  TrendingDown,
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

type Shift = {
  id: string;
  registerId: string;
  registerName: string;
  staffId: string;
  staffName: string;
  locationId: string;
  locationName: string;
  openedAt: Date;
  closedAt: Date | null;
  status: 'open' | 'closed' | 'reconciled';
  expectedCash: number;
  countedCash: number;
  cashDifference: number;
  sales: number;
  orders: number;
  cashSales: number;
  cardSales: number;
  otherSales: number;
  refunds: number;
  discounts: number;
};

const mockShifts: Shift[] = [
  {
    id: 'SHF-001',
    registerId: 'reg-1',
    registerName: 'Register 1',
    staffId: '1',
    staffName: 'Sarah Mitchell',
    locationId: 'loc-1',
    locationName: 'Main Street Store',
    openedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    closedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    status: 'reconciled',
    expectedCash: 12500,
    countedCash: 12520,
    cashDifference: 20,
    sales: 125430,
    orders: 42,
    cashSales: 45000,
    cardSales: 72000,
    otherSales: 8430,
    refunds: 1200,
    discounts: 850,
  },
  {
    id: 'SHF-002',
    registerId: 'reg-2',
    registerName: 'Register 2',
    staffId: '2',
    staffName: 'Mike Chen',
    locationId: 'loc-1',
    locationName: 'Main Street Store',
    openedAt: new Date(Date.now() - 7 * 60 * 60 * 1000),
    closedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'reconciled',
    expectedCash: 8900,
    countedCash: 8880,
    cashDifference: -20,
    sales: 89200,
    orders: 31,
    cashSales: 32000,
    cardSales: 52000,
    otherSales: 5200,
    refunds: 600,
    discounts: 450,
  },
  {
    id: 'SHF-003',
    registerId: 'reg-1',
    registerName: 'Register 1',
    staffId: '3',
    staffName: 'Emma Davis',
    locationId: 'loc-1',
    locationName: 'Main Street Store',
    openedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    closedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
    status: 'reconciled',
    expectedCash: 15600,
    countedCash: 15600,
    cashDifference: 0,
    sales: 156700,
    orders: 53,
    cashSales: 58000,
    cardSales: 88000,
    otherSales: 10700,
    refunds: 2100,
    discounts: 1200,
  },
  {
    id: 'SHF-004',
    registerId: 'reg-3',
    registerName: 'Register 3',
    staffId: '4',
    staffName: 'James Wilson',
    locationId: 'loc-2',
    locationName: 'Downtown Branch',
    openedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    closedAt: new Date(Date.now() - 42 * 60 * 60 * 1000),
    status: 'reconciled',
    expectedCash: 6200,
    countedCash: 6180,
    cashDifference: -20,
    sales: 62400,
    orders: 22,
    cashSales: 24000,
    cardSales: 35000,
    otherSales: 3400,
    refunds: 400,
    discounts: 300,
  },
  {
    id: 'SHF-005',
    registerId: 'reg-1',
    registerName: 'Register 1',
    staffId: '1',
    staffName: 'Sarah Mitchell',
    locationId: 'loc-1',
    locationName: 'Main Street Store',
    openedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    closedAt: null,
    status: 'open',
    expectedCash: 0,
    countedCash: 0,
    cashDifference: 0,
    sales: 24500,
    orders: 15,
    cashSales: 8500,
    cardSales: 14000,
    otherSales: 2000,
    refunds: 0,
    discounts: 200,
  },
];

const locations = [
  { id: 'loc-1', name: 'Main Street Store' },
  { id: 'loc-2', name: 'Downtown Branch' },
  { id: 'loc-3', name: 'Warehouse' },
];

const registers = [
  { id: 'reg-1', name: 'Register 1' },
  { id: 'reg-2', name: 'Register 2' },
  { id: 'reg-3', name: 'Register 3' },
];

const staff = [
  { id: '1', name: 'Sarah Mitchell' },
  { id: '2', name: 'Mike Chen' },
  { id: '3', name: 'Emma Davis' },
  { id: '4', name: 'James Wilson' },
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

function ShiftReportsPageInner() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [dateRange, setDateRange] = useState('this_week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedRegister, setSelectedRegister] = useState('All');
  const [selectedStaff, setSelectedStaff] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [shifts] = useState<Shift[]>(mockShifts);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch {
      setError('Failed to load shift data. Please try again.');
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

  const filteredShifts = shifts
    .filter((s) => {
      const matchesLocation = selectedLocation === 'All' || s.locationId === selectedLocation;
      const matchesRegister = selectedRegister === 'All' || s.registerId === selectedRegister;
      const matchesStaff = selectedStaff === 'All' || s.staffId === selectedStaff;
      const matchesStatus = selectedStatus === 'All' || s.status === selectedStatus;
      return matchesLocation && matchesRegister && matchesStaff && matchesStatus;
    })
    .sort((a, b) => {
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

  const getStatusBadge = (status: Shift['status']) => {
    const variants: Record<Shift['status'], 'default' | 'success' | 'warning' | 'secondary'> = {
      open: 'secondary',
      closed: 'warning',
      reconciled: 'success',
    };
    return <Badge variant={variants[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const getCashDiffBadge = (diff: number) => {
    if (diff === 0) return <Badge variant="success">Exact</Badge>;
    if (diff > 0) return <Badge variant="warning">Over ${diff / 100}</Badge>;
    return <Badge variant="danger">Short ${Math.abs(diff) / 100}</Badge>;
  };

  // StatCard defined inside component to match working sales reports pattern
  const StatCard = ({ title, value, icon: IconComp, subtitle, trend }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    subtitle?: string;
    trend?: { direction: 'up' | 'down' | 'neutral'; percentage: number; label?: string };
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

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Shift Reports</h1>
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
          <h1 className="text-xl font-bold">Shift Reports</h1>
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
            <Select value={selectedRegister} onValueChange={setSelectedRegister}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Registers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Registers</SelectItem>
                {registers.map((reg) => (
                  <SelectItem key={reg.id} value={reg.id}>{reg.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Staff</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="reconciled">Reconciled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatCard
            title="Total Shifts"
            value={filteredShifts.filter((s) => s.status !== 'open').length}
            icon={Clock}
            subtitle={filteredShifts.filter((s) => s.status === 'open').length > 0 ? `${filteredShifts.filter((s) => s.status === 'open').length} open` : undefined}
            trend={{ direction: 'up', percentage: 5.2, label: 'vs last period' }}
          />
          <StatCard
            title="Total Sales"
            value={formatCurrency(filteredShifts.filter((s) => s.status !== 'open').reduce((sum, s) => sum + s.sales, 0))}
            icon={DollarSign}
            trend={{ direction: 'up', percentage: 8.5, label: 'vs last period' }}
          />
          <StatCard
            title="Total Orders"
            value={filteredShifts.filter((s) => s.status !== 'open').reduce((sum, s) => sum + s.orders, 0).toLocaleString()}
            icon={Package}
            subtitle={`Avg ${Math.round((filteredShifts.filter((s) => s.status !== 'open').reduce((sum, s) => sum + s.sales, 0) / Math.max(filteredShifts.filter((s) => s.status !== 'open').length, 1)) / 100).toLocaleString()} per shift`}
            trend={{ direction: 'up', percentage: 3.1, label: 'vs last period' }}
          />
          <StatCard
            title="Cash Variance"
            value={
              (() => {
                const diff = filteredShifts.filter((s) => s.status !== 'open').reduce((sum, s) => sum + s.cashDifference, 0);
                return (diff >= 0 ? '+' : '') + formatCurrency(diff);
              })()
            }
            icon={Coins}
            subtitle={
              (() => {
                const diff = filteredShifts.filter((s) => s.status !== 'open').reduce((sum, s) => sum + s.cashDifference, 0);
                return diff === 0 ? 'All balanced' : diff > 0 ? 'Over' : 'Short';
              })()
            }
          />
        </div>

        {filteredShifts.length === 0 ? (
          <EmptyTableState
            title="No shifts match"
            description="Try adjusting your filters or date range."
            icon={<Clock className="h-12 w-12 mx-auto text-text-muted/50" />}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Shift List</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('id')}>
                        <div className="flex items-center gap-1">Shift ID <SortIcon key="id" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('staffName')}>
                        <div className="flex items-center gap-1">Staff <SortIcon key="staffName" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('registerName')}>
                        <div className="flex items-center gap-1">Register <SortIcon key="registerName" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('locationName')}>
                        <div className="flex items-center gap-1">Location <SortIcon key="locationName" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('openedAt')}>
                        <div className="flex items-center gap-1">Opened <SortIcon key="openedAt" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('closedAt')}>
                        <div className="flex items-center gap-1">Closed <SortIcon key="closedAt" /></div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">
                        <div className="flex items-center gap-1 justify-end">Sales <SortIcon key="sales" /></div>
                      </TableHead>
                      <TableHead className="text-right">Cash Diff</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShifts.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell className="font-mono text-sm">{shift.id}</TableCell>
                        <TableCell>{shift.staffName}</TableCell>
                        <TableCell>{shift.registerName}</TableCell>
                        <TableCell>{shift.locationName}</TableCell>
                        <TableCell className="text-text-muted">{shift.openedAt.toLocaleString()}</TableCell>
                        <TableCell className="text-text-muted">{shift.closedAt ? shift.closedAt.toLocaleString() : '—'}</TableCell>
                        <TableCell>{getStatusBadge(shift.status)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(shift.sales)}</TableCell>
                        <TableCell className="text-right">{getCashDiffBadge(shift.cashDifference)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label={`Actions for shift ${shift.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => {}} aria-label="View details">
                                <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                                View Details
                              </DropdownMenuItem>
                              {shift.status === 'closed' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => {}} aria-label="Reconcile">
                                    <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                                    Reconcile
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function ShiftReportsPage() {
  return (
    <PermissionGuard permission="reports" action="view">
      <Suspense
        fallback={
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
              <h1 className="text-xl font-bold">Shift Reports</h1>
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
      <ShiftReportsPageInner />
    </Suspense>
    </PermissionGuard>
  );
}