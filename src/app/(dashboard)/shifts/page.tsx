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
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Eye,
  ArrowUpDown,
  Download,
  RefreshCw,
  Filter,
  MoreHorizontal,
  Coins,
  Calculator,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyTableState } from '@/components/ui/empty-state';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useShifts, useRegisters, useUsers } from '@/hooks/useApi';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

type Shift = {
  id: string;
  registerId: string;
  registerName: string;
  userId: string;
  userName: string;
  status: 'open' | 'closed' | 'reconciled';
  openedAt: string;
  closedAt: string | null;
  openingCashCents: number;
  closingCashCents: number | null;
  expectedCashCents: number | null;
  cashDifferenceCents: number | null;
  totalSalesCents: number;
  totalOrders: number;
  notes: string;
};

type SortConfig = { key: keyof Shift | 'cashDifference'; direction: 'asc' | 'desc' } | null;

function ShiftsPageInner({ searchParams }: { searchParams: { get: (key: string) => string | null } }) {
  const router = useRouter();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'openedAt', direction: 'desc' });
  const [filters, setFilters] = useState({
    status: 'all',
    registerId: 'all',
    userId: 'all',
    dateFrom: '',
    dateTo: '',
  });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });
  const [activeTab, setActiveTab] = useState<'list' | 'open'>('list');
  const [openShiftData, setOpenShiftData] = useState({
    registerId: '',
    openingCash: '',
    notes: '',
  });
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [reconcileData, setReconcileData] = useState({
    closingCash: '',
    notes: '',
  });

  const { data: shiftsData, loading: shiftsLoading, error: shiftsError, refetch: refetchShifts } = useShifts({});
  const { data: registersData, loading: registersLoading } = useRegisters({ active: 'true' });
  const { data: usersData, loading: usersLoading } = useUsers({ active: 'true' });

  const registers = registersData?.registers || [];
  const users = usersData?.users || [];

  useEffect(() => {
    if (shiftsData?.shifts) {
      setShifts(shiftsData.shifts.map((s: any) => ({
        id: s.shift.id,
        registerId: s.shift.registerId,
        registerName: s.register?.name || 'Unknown Register',
        userId: s.shift.cashierId,
        userName: s.cashier?.firstName ? `${s.cashier.firstName} ${s.cashier.lastName}` : 'Unknown User',
        status: s.shift.status,
        openedAt: s.shift.openedAt,
        closedAt: s.shift.closedAt,
        openingCashCents: s.shift.expectedCash ? 0 : s.shift.cashSales || 0,
        closingCashCents: s.shift.actualCash,
        expectedCashCents: s.shift.expectedCash,
        cashDifferenceCents: s.shift.discrepancyAmount || null,
        totalSalesCents: s.shift.totalSales || 0,
        totalOrders: s.shift.transactionCount || 0,
        notes: s.shift.closingNotes || s.shift.openingNotes || '',
      })));
    }
    if (shiftsLoading) setIsLoading(true);
    else setIsLoading(false);
    if (shiftsError) setError(shiftsError.message);
  }, [shiftsData, shiftsLoading, shiftsError]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await refetchShifts();
    } catch {
      setError('Failed to load shifts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleSort = (key: keyof Shift | 'cashDifference') => {
    setSortConfig((current) => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const filteredShifts = shifts.filter((shift) => {
    if (filters.status !== 'all' && shift.status !== filters.status) return false;
    if (filters.registerId !== 'all' && shift.registerId !== filters.registerId) return false;
    if (filters.userId !== 'all' && shift.userId !== filters.userId) return false;
    if (filters.dateFrom && new Date(shift.openedAt) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(shift.openedAt) > new Date(filters.dateTo)) return false;
    return true;
  });

  const sortedShifts = [...filteredShifts].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    let aVal: any = a[key as keyof Shift];
    let bVal: any = b[key as keyof Shift];
    if (key === 'cashDifference') {
      aVal = a.cashDifferenceCents ?? 0;
      bVal = b.cashDifferenceCents ?? 0;
    }
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedShifts = sortedShifts.slice(
    (pagination.page - 1) * pagination.pageSize,
    pagination.page * pagination.pageSize
  );

  const totalPages = Math.ceil(sortedShifts.length / pagination.pageSize);

  const handleOpenShift = async () => {
    if (!openShiftData.registerId || !openShiftData.openingCash) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: registers.find(r => r.id === openShiftData.registerId)?.locationId || registers[0]?.locationId,
          registerId: openShiftData.registerId,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create shift');
      }

      await refetchShifts();
      setOpenShiftData({ registerId: '', openingCash: '', notes: '' });
      setActiveTab('list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open shift. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseShift = async (shift: Shift) => {
    if (!reconcileData.closingCash) return;
    setIsLoading(true);
    try {
      const closingCashCents = parseFloat(reconcileData.closingCash) * 100;
      const expectedCashCents = shift.openingCashCents + shift.totalSalesCents;
      const cashDifferenceCents = closingCashCents - expectedCashCents;

      const response = await fetch('/api/shifts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: shift.id,
          status: 'closed',
          actualCash: closingCashCents,
          discrepancyAmount: cashDifferenceCents,
          closingNotes: reconcileData.notes || shift.notes,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to close shift');
      }

      await refetchShifts();
      setReconcileData({ closingCash: '', notes: '' });
      setSelectedShift(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close shift. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReconcile = async (shift: Shift) => {
    if (!reconcileData.closingCash) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/shifts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: shift.id,
          status: 'reconciled',
          discrepancyAmount: 0,
          closingNotes: reconcileData.notes || shift.notes,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to reconcile shift');
      }

      await refetchShifts();
      setReconcileData({ closingCash: '', notes: '' });
      setSelectedShift(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reconcile shift. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'success' | 'warning' | 'secondary' | 'danger' | 'default'; label: string }> = {
      open: { variant: 'success', label: 'Open' },
      closed: { variant: 'secondary', label: 'Closed' },
      reconciled: { variant: 'default', label: 'Reconciled' },
    };
    const c = config[status] || config.closed;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const SortIcon = ({ key }: { key: keyof Shift | 'cashDifference' }) => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="h-4 w-4 text-text-muted" />;
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-accent" />
    ) : (
      <ChevronDown className="h-4 w-4 text-accent" />
    );
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Shifts</h1>
          <Button variant="primary"><Plus className="h-4 w-4 mr-2" /> Open Shift</Button>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <SkeletonCard />
          <SkeletonCard />
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

  const openShifts = shifts.filter(s => s.status === 'open');

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Shifts</h1>
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
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={activeTab === 'open'} onOpenChange={(open) => setActiveTab(open ? 'open' : 'list')}>
            <DialogTrigger asChild>
              <Button variant="primary"><Plus className="h-4 w-4 mr-2" /> Open Shift</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Open New Shift</DialogTitle>
                <DialogDescription>Select register and enter opening cash amount</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label htmlFor="registerId">Register *</Label>
                  <Select value={openShiftData.registerId} onValueChange={(v) => setOpenShiftData({ ...openShiftData, registerId: v })} disabled={registersLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={registersLoading ? 'Loading registers...' : 'Select register'} />
                    </SelectTrigger>
                    <SelectContent>
                      {registers.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="openingCash">Opening Cash *</Label>
                  <Input
                    id="openingCash"
                    type="number"
                    step="0.01"
                    value={openShiftData.openingCash}
                    onChange={(e) => setOpenShiftData({ ...openShiftData, openingCash: e.target.value })}
                    placeholder="200.00"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={openShiftData.notes}
                    onChange={(e) => setOpenShiftData({ ...openShiftData, notes: e.target.value })}
                    placeholder="Optional notes"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setActiveTab('list')}>Cancel</Button>
                <Button variant="primary" onClick={handleOpenShift} disabled={!openShiftData.registerId || !openShiftData.openingCash || isLoading}>
                  Open Shift
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'open')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">All Shifts</TabsTrigger>
            <TabsTrigger value="open">Open Shifts ({openShifts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Shift History</CardTitle>
                    <CardDescription>View and manage all shifts</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                      <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="reconciled">Reconciled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filters.registerId} onValueChange={(v) => setFilters({ ...filters, registerId: v })}>
                      <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Registers" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Registers</SelectItem>
                        {registers.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {paginatedShifts.length === 0 ? (
                  <EmptyTableState
                    title="No shifts found"
                    description="Open your first shift to get started."
                    icon={<Clock className="h-12 w-12 mx-auto text-text-muted/50" />}
                  />
                ) : (
                  <ScrollArea>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="cursor-pointer" onClick={() => handleSort('openedAt')}>
                            <div className="flex items-center gap-2">Date <SortIcon key="openedAt" /></div>
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort('registerName')}>
                            <div className="flex items-center gap-2">Register <SortIcon key="registerName" /></div>
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort('userName')}>
                            <div className="flex items-center gap-2">Staff <SortIcon key="userName" /></div>
                          </TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort('openingCashCents')}>
                            <div className="flex items-center gap-2">Opening Cash <SortIcon key="openingCashCents" /></div>
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort('closingCashCents')}>
                            <div className="flex items-center gap-2">Closing Cash <SortIcon key="closingCashCents" /></div>
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort('expectedCashCents')}>
                            <div className="flex items-center gap-2">Expected <SortIcon key="expectedCashCents" /></div>
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort('cashDifference')}>
                            <div className="flex items-center gap-2">Difference <SortIcon key="cashDifference" /></div>
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort('totalSalesCents')}>
                            <div className="flex items-center gap-2">Sales <SortIcon key="totalSalesCents" /></div>
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort('totalOrders')}>
                            <div className="flex items-center gap-2">Orders <SortIcon key="totalOrders" /></div>
                          </TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedShifts.map((shift) => (
                          <TableRow key={shift.id}>
                            <TableCell className="font-mono text-sm">
                              {new Date(shift.openedAt).toLocaleDateString()} {new Date(shift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </TableCell>
                            <TableCell>{shift.registerName}</TableCell>
                            <TableCell>{shift.userName}</TableCell>
                            <TableCell>{getStatusBadge(shift.status)}</TableCell>
                            <TableCell className="font-mono tabular-nums">{formatCurrency(shift.openingCashCents)}</TableCell>
                            <TableCell className="font-mono tabular-nums">
                              {shift.closingCashCents !== null ? formatCurrency(shift.closingCashCents) : <span className="text-text-muted">—</span>}
                            </TableCell>
                            <TableCell className="font-mono tabular-nums">
                              {shift.expectedCashCents !== null ? formatCurrency(shift.expectedCashCents) : <span className="text-text-muted">—</span>}
                            </TableCell>
                            <TableCell>
                              {shift.cashDifferenceCents !== null ? (
                                <span className={cn('font-mono tabular-nums', shift.cashDifferenceCents === 0 ? 'text-success' : shift.cashDifferenceCents! < 0 ? 'text-danger' : 'text-warning')}>
                                  {shift.cashDifferenceCents >= 0 ? '+' : ''}{formatCurrency(shift.cashDifferenceCents)}
                                </span>
                              ) : (
                                <span className="text-text-muted">—</span>
                              )}
                            </TableCell>
                            <TableCell className="font-mono tabular-nums">{formatCurrency(shift.totalSalesCents)}</TableCell>
                            <TableCell className="font-mono tabular-nums">{shift.totalOrders}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" aria-label="More actions">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedShift(shift)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  {shift.status === 'closed' && (
                                    <DropdownMenuItem onClick={() => { setSelectedShift(shift); setReconcileData({ closingCash: '', notes: shift.notes || '' }); }}>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Reconcile
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => { setSelectedShift(shift); setReconcileData({ closingCash: (shift.expectedCashCents! / 100).toFixed(2), notes: shift.notes || '' }); }}>
                                    <Calculator className="h-4 w-4 mr-2" />
                                    Close Shift
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
                {totalPages > 1 && (
                  <TableFooter>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-muted">
                        Page {pagination.page} of {totalPages} ({sortedShifts.length} shifts)
                      </span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })} disabled={pagination.page === 1} aria-label="Previous page">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })} disabled={pagination.page === totalPages} aria-label="Next page">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </TableFooter>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="open" className="space-y-4">
            {openShifts.length === 0 ? (
              <EmptyTableState
                title="No open shifts"
                description="All shifts are currently closed. Open a new shift to start selling."
                icon={<Clock className="h-12 w-12 mx-auto text-text-muted/50" />}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Currently Open Shifts</CardTitle>
                  <CardDescription>These shifts are currently active</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {openShifts.map((shift) => (
                      <div key={shift.id} className="p-4 bg-surface rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{shift.registerName}</span>
                          <Badge variant="success">Open</Badge>
                        </div>
                        <div className="text-sm text-text-muted mb-2">Opened by {shift.userName}</div>
                        <div className="text-sm text-text-muted mb-2">{new Date(shift.openedAt).toLocaleString()}</div>
                        <div className="border-t pt-2 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-text-muted">Opening Cash</span>
                            <span className="font-mono tabular-nums">{formatCurrency(shift.openingCashCents)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-text-muted">Current Sales</span>
                            <span className="font-mono tabular-nums">{formatCurrency(shift.totalSalesCents)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-text-muted">Orders</span>
                            <span className="font-mono tabular-nums">{shift.totalOrders}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" className="flex-1" onClick={() => { setSelectedShift(shift); setReconcileData({ closingCash: '', notes: shift.notes || '' }); }}>
                            <Calculator className="h-4 w-4 mr-2" />
                            Close
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedShift && (
        <Dialog open={true} onOpenChange={() => setSelectedShift(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedShift.status === 'closed' ? 'Reconcile Shift' : 'Close Shift'}</DialogTitle>
              <DialogDescription>Register: {selectedShift.registerName} • Opened: {new Date(selectedShift.openedAt).toLocaleString()}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid gap-4">
                <div>
                  <Label>Opening Cash</Label>
                  <p className="font-mono text-lg">{formatCurrency(selectedShift.openingCashCents)}</p>
                </div>
                <div>
                  <Label>Total Sales</Label>
                  <p className="font-mono text-lg">{formatCurrency(selectedShift.totalSalesCents)}</p>
                </div>
                <div>
                  <Label>Expected Cash</Label>
                  <p className="font-mono text-lg font-bold">{formatCurrency(selectedShift.openingCashCents + selectedShift.totalSalesCents)}</p>
                </div>
                <div>
                  <Label htmlFor="closingCash">Closing Cash *</Label>
                  <Input
                    id="closingCash"
                    type="number"
                    step="0.01"
                    value={reconcileData.closingCash}
                    onChange={(e) => setReconcileData({ ...reconcileData, closingCash: e.target.value })}
                    placeholder="Enter closing cash amount"
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="reconcileNotes">Notes</Label>
                  <Input
                    id="reconcileNotes"
                    value={reconcileData.notes}
                    onChange={(e) => setReconcileData({ ...reconcileData, notes: e.target.value })}
                    placeholder="Optional notes"
                  />
                </div>
              </div>
              {reconcileData.closingCash && (
                <div className="p-3 bg-accent-muted rounded-lg border border-accent">
                  <div className="flex justify-between text-sm">
                    <span>Difference</span>
                    <span className="font-mono font-bold">
                      {((parseFloat(reconcileData.closingCash) * 100) - (selectedShift.openingCashCents + selectedShift.totalSalesCents)) >= 0 ? '+' : ''}
                      {formatCurrency((parseFloat(reconcileData.closingCash) * 100) - (selectedShift.openingCashCents + selectedShift.totalSalesCents))}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedShift(null)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => selectedShift.status === 'closed' ? handleReconcile(selectedShift) : handleCloseShift(selectedShift)}
                disabled={!reconcileData.closingCash || isLoading}
              >
                {selectedShift.status === 'closed' ? 'Reconcile' : 'Close Shift'}
              </Button>
            </DialogFooter>          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function ShiftsPage() {
  return (
    <PermissionGuard permission="shifts" action="view">
      <Suspense fallback={
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
            <h1 className="text-xl font-bold">Shifts</h1>
            <Button variant="primary"><Plus className="h-4 w-4 mr-2" /> Open Shift</Button>
          </div>
          <div className="flex-1 p-4 space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      }>
        <ShiftsPageInner searchParams={{ get: () => null }} />
      </Suspense>
    </PermissionGuard>
  );
}