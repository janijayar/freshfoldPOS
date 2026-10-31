'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Loader2,
  AlertCircle,
  WifiOff,
  Package,
  Minus,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Edit,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton, SkeletonTable } from '@/components/ui/skeleton';
import { ErrorState, InlineError } from '@/components/ui/error-state';
import { EmptyTableState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

type Adjustment = {
  id: string;
  type: 'count' | 'adjustment' | 'transfer' | 'waste' | 'return';
  productId: string;
  productName: string;
  productSku: string;
  locationId: string;
  locationName: string;
  fromLocationId?: string;
  fromLocationName?: string;
  toLocationId?: string;
  toLocationName?: string;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected';
};

const adjustmentTypes = [
  { value: 'count', label: 'Stock Count', icon: Package },
  { value: 'adjustment', label: 'Adjustment', icon: Minus },
  { value: 'transfer', label: 'Transfer', icon: ArrowUpRight },
  { value: 'waste', label: 'Waste/Damage', icon: Trash2 },
  { value: 'return', label: 'Return', icon: ArrowDownLeft },
];

const locations = [
  { id: 'loc-1', name: 'Main Street Store' },
  { id: 'loc-2', name: 'Downtown Branch' },
  { id: 'loc-3', name: 'Warehouse' },
];

const mockProducts = [
  { id: '1', name: 'Americano', sku: 'BEV-001', stock: 50 },
  { id: '2', name: 'Latte', sku: 'BEV-002', stock: 45 },
  { id: '3', name: 'Croissant', sku: 'FOOD-001', stock: 25 },
  { id: '4', name: 'Tote Bag', sku: 'MERCH-001', stock: 30 },
];

const mockAdjustments: Adjustment[] = [
  {
    id: '1',
    type: 'count',
    productId: '1',
    productName: 'Americano',
    productSku: 'BEV-001',
    locationId: 'loc-1',
    locationName: 'Main Street Store',
    quantity: 50,
    previousQuantity: 48,
    newQuantity: 50,
    reason: 'Weekly stock count',
    notes: 'Counted during morning shift',
    createdBy: 'Sarah Mitchell',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'approved',
  },
  {
    id: '2',
    type: 'adjustment',
    productId: '2',
    productName: 'Latte',
    productSku: 'BEV-002',
    locationId: 'loc-1',
    locationName: 'Main Street Store',
    quantity: -3,
    previousQuantity: 48,
    newQuantity: 45,
    reason: 'Expired product removal',
    notes: '3 units past expiration date',
    createdBy: 'Mike Chen',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: 'approved',
  },
  {
    id: '3',
    type: 'transfer',
    productId: '3',
    productName: 'Croissant',
    productSku: 'FOOD-001',
    locationId: 'loc-1',
    locationName: 'Main Street Store',
    fromLocationId: 'loc-3',
    fromLocationName: 'Warehouse',
    toLocationId: 'loc-1',
    toLocationName: 'Main Street Store',
    quantity: 20,
    previousQuantity: 5,
    newQuantity: 25,
    reason: 'Restock from warehouse',
    notes: 'Weekly restock order',
    createdBy: 'Emma Davis',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    status: 'approved',
  },
  {
    id: '4',
    type: 'waste',
    productId: '4',
    productName: 'Tote Bag',
    productSku: 'MERCH-001',
    locationId: 'loc-1',
    locationName: 'Main Street Store',
    quantity: -2,
    previousQuantity: 32,
    newQuantity: 30,
    reason: 'Damaged goods',
    notes: '2 units with printing defects',
    createdBy: 'James Wilson',
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
    status: 'approved',
  },
];

type SortConfig = { key: keyof Adjustment; direction: 'asc' | 'desc' } | null;

function InventoryAdjustmentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAdjustment, setEditingAdjustment] = useState<Adjustment | null>(null);

  const fetchAdjustments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setAdjustments(mockAdjustments);
    } catch {
      setError('Failed to load adjustments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdjustments();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSort = (key: keyof Adjustment) => {
    setSortConfig((current) => {
      if (current?.key === key && current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const filteredAdjustments = adjustments
    .filter((a) => {
      const matchesSearch = a.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.productSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.id.includes(searchQuery);
      const matchesType = selectedType === 'All' || a.type === selectedType;
      const matchesLocation = selectedLocation === 'All' || a.locationId === selectedLocation;
      return matchesSearch && matchesType && matchesLocation;
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bVal == null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const paginatedAdjustments = filteredAdjustments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredAdjustments.length / itemsPerPage);

  const getTypeBadge = (type: Adjustment['type']) => {
    const config = adjustmentTypes.find(t => t.value === type);
    const variants: Record<Adjustment['type'], 'default' | 'success' | 'warning' | 'danger' | 'secondary'> = {
      count: 'default',
      adjustment: 'warning',
      transfer: 'secondary',
      waste: 'danger',
      return: 'success',
    };
    return <Badge variant={variants[type] || 'default'} className="gap-1">
      {config?.label || type}
    </Badge>;
  };

  const getStatusBadge = (status: Adjustment['status']) => {
    const variants: Record<Adjustment['status'], 'default' | 'success' | 'warning' | 'danger'> = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
    };
    return <Badge variant={variants[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const handleCreate = () => {
    setEditingAdjustment(null);
    setShowCreateDialog(true);
  };

  const handleEdit = (adjustment: Adjustment) => {
    setEditingAdjustment(adjustment);
    setShowCreateDialog(true);
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setEditingAdjustment(null);
  };

  const SortIcon = ({ key }: { key: keyof Adjustment }) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronDown className="h-4 w-4 text-text-muted" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 text-accent" /> : <ChevronDown className="h-4 w-4 text-accent" />;
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Inventory Adjustments</h1>
        </div>
        <div className="flex-1 p-4">
          <SkeletonTable rows={5} columns={8} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        variant={!isOnline ? 'network' : 'server'}
        onRetry={fetchAdjustments}
        onGoHome={() => router.push('/dashboard')}
        title={!isOnline ? 'You are offline' : undefined}
        description={!isOnline ? 'Changes will sync when connection is restored.' : undefined}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Inventory Adjustments</h1>
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
          <Button variant="outline" onClick={fetchAdjustments} aria-label="Refresh">
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            Refresh
          </Button>
          <Button variant="primary" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            New Adjustment
          </Button>
        </div>
      </div>

      <div className="p-4 border-b border-border bg-surface">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" aria-hidden="true" />
            <Input
              placeholder="Search product, SKU, reason, or ID..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-10"
              aria-label="Search adjustments"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <Select value={selectedType} onValueChange={(v) => { setSelectedType(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                {adjustmentTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedLocation} onValueChange={(v) => { setSelectedLocation(v); setCurrentPage(1); }}>
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
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {filteredAdjustments.length === 0 ? (
          <EmptyTableState
            title={searchQuery || selectedType !== 'All' || selectedLocation !== 'All' ? 'No adjustments match' : 'No adjustments yet'}
            description={searchQuery || selectedType !== 'All' || selectedLocation !== 'All'
              ? 'Try adjusting your search or filters.'
              : 'Create your first inventory adjustment to get started.'}
            icon={<Package className="h-12 w-12 mx-auto text-text-muted/50" />}
            action={{
              label: 'New Adjustment',
              onClick: handleCreate,
            }}
          />
        ) : (
          <ScrollArea className="h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('id')}>
                    <div className="flex items-center gap-1">ID <SortIcon key="id" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('type')}>
                    <div className="flex items-center gap-1">Type <SortIcon key="type" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('productName')}>
                    <div className="flex items-center gap-1">Product <SortIcon key="productName" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('locationName')}>
                    <div className="flex items-center gap-1">Location <SortIcon key="locationName" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('quantity')}>
                    <div className="flex items-center gap-1">Qty <SortIcon key="quantity" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('createdAt')}>
                    <div className="flex items-center gap-1">Date <SortIcon key="createdAt" /></div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAdjustments.map((adjustment) => (
                  <TableRow key={adjustment.id}>
                    <TableCell className="font-mono text-sm text-text-muted">{adjustment.id.slice(-6)}</TableCell>
                    <TableCell>{getTypeBadge(adjustment.type)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{adjustment.productName}</p>
                        <p className="text-xs text-text-muted">{adjustment.productSku}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {adjustment.type === 'transfer' && adjustment.fromLocationName && adjustment.toLocationName ? (
                          <div className="flex items-center gap-1 text-sm">
                            <span className="text-text-muted">{adjustment.fromLocationName}</span>
                            <ArrowUpRight className="h-3 w-3 text-text-muted" aria-hidden="true" />
                            <span className="font-medium">{adjustment.toLocationName}</span>
                          </div>
                        ) : (
                          <p>{adjustment.locationName}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn('font-mono', adjustment.quantity > 0 ? 'text-success' : adjustment.quantity < 0 ? 'text-danger' : '')}>
                        {adjustment.quantity > 0 ? '+' : ''}{adjustment.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-text-muted">{adjustment.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(adjustment.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Actions for adjustment ${adjustment.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleEdit(adjustment)} aria-label="View details">
                            <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                            View Details
                          </DropdownMenuItem>
                          {adjustment.status === 'pending' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-success" aria-label="Approve">
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-danger" aria-label="Reject">
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {totalPages > 1 && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={8} className="py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-muted">
                          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAdjustments.length)} of {filteredAdjustments.length} adjustments
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            aria-label="Previous page"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">
                            {currentPage} / {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            aria-label="Next page"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </ScrollArea>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{editingAdjustment ? 'Edit Adjustment' : 'New Inventory Adjustment'}</DialogTitle>
            <DialogDescription>
              {editingAdjustment
                ? `Editing ${editingAdjustment.productName} (${editingAdjustment.productSku})`
                : 'Record a stock count, adjustment, transfer, waste, or return.'}
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 overflow-y-auto max-h-[60vh]">
            <form className="space-y-4">
              <div className="space-y-2">
                <Label>Adjustment Type</Label>
                <div className="flex flex-wrap gap-2">
                  {adjustmentTypes.map((t) => (
                    <Button
                      key={t.value}
                      type="button"
                      variant="outline"
                      className={cn('gap-2', editingAdjustment?.type === t.value || (!editingAdjustment && t.value === 'adjustment') ? 'bg-accent-muted border-accent' : '')}
                      onClick={() => console.log(t.value)}
                    >
                      {React.createElement(t.icon, { className: 'h-4 w-4', 'aria-hidden': 'true' })}
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="product">Product *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockProducts.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="e.g., 10 or -5"
                  className="text-right"
                  inputMode="decimal"
                />
                <p className="text-xs text-text-muted">Positive for additions, negative for removals</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="count">Stock Count</SelectItem>
                    <SelectItem value="purchase">Purchase Order</SelectItem>
                    <SelectItem value="expired">Expired Product</SelectItem>
                    <SelectItem value="damaged">Damaged Goods</SelectItem>
                    <SelectItem value="restock">Restock from Supplier</SelectItem>
                    <SelectItem value="transfer">Inter-location Transfer</SelectItem>
                    <SelectItem value="return">Customer Return</SelectItem>
                    <SelectItem value="promo">Promotional Use</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  className="w-full min-h-[80px] rounded-md border border-border-input bg-surface px-3 py-2 text-base text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus"
                  placeholder="Additional details (optional)"
                  rows={3}
                />
              </div>
            </form>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button variant="primary" onClick={handleCloseDialog}>
              {editingAdjustment ? 'Save Changes' : 'Create Adjustment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function InventoryAdjustmentsPage() {
  return (
    <PermissionGuard permission="inventory" action="view" fallback={<div />}>
      <Suspense fallback={
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
            <h1 className="text-xl font-bold">Inventory Adjustments</h1>
          </div>
          <div className="flex-1 p-4">
            <SkeletonTable rows={5} columns={8} />
          </div>
        </div>
      }>
        <InventoryAdjustmentsContent />
      </Suspense>
    </PermissionGuard>
  );
}