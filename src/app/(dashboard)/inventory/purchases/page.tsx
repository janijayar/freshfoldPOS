'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, ChevronLeft, ChevronRight, Calendar, Search, Package, Truck, Loader2, X, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

interface InventoryPurchase {
  id: string;
  productId: string;
  productName: string;
  variantId: string | null;
  variantName: string | null;
  quantity: number;
  unitCost: number;
  totalCost: number;
  supplier: string;
  expectedDate: string;
  receivedDate: string | null;
  status: 'ordered' | 'partial' | 'received' | 'cancelled';
  invoiceNumber: string | null;
  notes: string | null;
  createdAt: string;
}

function InventoryPurchasesCalendarPage() {
  const [purchases, setPurchases] = useState<InventoryPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const handleViewModeChange = (value: string) => {
    setViewMode(value as 'calendar' | 'list');
  };
  const [filters, setFilters] = useState({
    status: '',
    supplier: '',
    search: '',
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    variantId: '',
    quantity: 1,
    unitCost: 0,
    supplier: '',
    expectedDate: format(new Date(), 'yyyy-MM-dd'),
    invoiceNumber: '',
    notes: '',
  });
  const [selectedDay, setSelectedDay] = useState<{ date: string; purchases: InventoryPurchase[]; received: InventoryPurchase[] } | null>(null);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      // We'll fetch from the inventory adjustments or create a mock for now
      // In real implementation, this would come from a purchase orders API
      const res = await fetch('/api/inventory/purchases');
      if (res.ok) {
        const data = await res.json();
        setPurchases(data.purchases || []);
      } else {
        // Mock data for demonstration
        setPurchases([
          {
            id: '1',
            productId: '1',
            productName: 'Laundry Detergent - Premium',
            variantId: '1',
            variantName: '5kg',
            quantity: 10,
            unitCost: 2500,
            totalCost: 25000,
            supplier: 'CleanSupply Co.',
            expectedDate: format(addMonths(new Date(), 0), 'yyyy-MM-dd'),
            receivedDate: null,
            status: 'ordered',
            invoiceNumber: 'INV-2026-001',
            notes: 'Monthly restock',
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            productId: '2',
            productName: 'Fabric Softener',
            variantId: null,
            variantName: null,
            quantity: 20,
            unitCost: 1800,
            totalCost: 36000,
            supplier: 'FreshChemicals Ltd.',
            expectedDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
            receivedDate: null,
            status: 'ordered',
            invoiceNumber: 'INV-2026-002',
            notes: '',
            createdAt: new Date().toISOString(),
          },
          {
            id: '3',
            productId: '3',
            productName: 'Stain Remover',
            variantId: '2',
            variantName: '1L',
            quantity: 15,
            unitCost: 1200,
            totalCost: 18000,
            supplier: 'CleanSupply Co.',
            expectedDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
            receivedDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
            status: 'received',
            invoiceNumber: 'INV-2025-012',
            notes: 'Received on time',
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/inventory/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        setPurchases(prev => [data.purchase, ...prev]);
        setShowCreateDialog(false);
        setFormData({
          productId: '',
          variantId: '',
          quantity: 1,
          unitCost: 0,
          supplier: '',
          expectedDate: format(new Date(), 'yyyy-MM-dd'),
          invoiceNumber: '',
          notes: '',
        });
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create purchase order');
      }
    } catch (error) {
      alert('Failed to create purchase order');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  // Calendar calculations
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group purchases by expected date
  const purchasesByDate = purchases.reduce((acc, purchase) => {
    const dateKey = purchase.expectedDate;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(purchase);
    return acc;
  }, {} as Record<string, InventoryPurchase[]>);

  // Group purchases by received date
  const receivedByDate = purchases.reduce((acc, purchase) => {
    if (purchase.receivedDate) {
      const dateKey = purchase.receivedDate;
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(purchase);
    }
    return acc;
  }, {} as Record<string, InventoryPurchase[]>);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'danger' | 'outline' | 'success'> = {
      ordered: 'outline',
      partial: 'secondary',
      received: 'success',
      cancelled: 'danger',
    };
    return (
      <Badge variant={variants[status] || 'default'} className="text-xs">
        {status}
      </Badge>
    );
  };

  const filteredPurchases = purchases.filter(p => {
    if (filters.status && p.status !== filters.status) return false;
    if (filters.supplier && !p.supplier.toLowerCase().includes(filters.supplier.toLowerCase())) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (!p.productName.toLowerCase().includes(search) &&
          !p.supplier.toLowerCase().includes(search) &&
          !(p.invoiceNumber?.toLowerCase().includes(search))) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Purchases Calendar</h1>
          <p className="text-muted-foreground">
            Track incoming inventory orders and receipts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-4 font-medium">{format(currentMonth, 'MMMM yyyy')}</span>
          <Button variant="outline" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentMonth(new Date())} className="ml-2">
            <Calendar className="mr-2 h-4 w-4" />
            Today
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Purchase Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>New Purchase Order</DialogTitle>
                <DialogDescription>Create a new inventory purchase order</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 p-4 overflow-y-auto max-h-[60vh]">
                <div className="space-y-2">
                  <Label htmlFor="productId">Product *</Label>
                  <Select value={formData.productId} onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {purchases.map((p) => (
                        <SelectItem key={p.productId} value={p.productId}>{p.productName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variantId">Variant</Label>
                  <Select value={formData.variantId} onValueChange={(value) => setFormData(prev => ({ ...prev, variantId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select variant (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {purchases.map((p) => p.variantId && (
                        <SelectItem key={p.variantId} value={p.variantId}>{p.variantName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      className="text-right"
                      inputMode="decimal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitCost">Unit Cost (₱) *</Label>
                    <Input
                      id="unitCost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.unitCost / 100}
                      onChange={(e) => setFormData(prev => ({ ...prev, unitCost: Math.round(parseFloat(e.target.value) * 100) || 0 }))}
                      className="text-right"
                      inputMode="decimal"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier *</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    placeholder="e.g., CleanSupply Co."
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="expectedDate">Expected Date *</Label>
                    <Input
                      id="expectedDate"
                      type="date"
                      value={formData.expectedDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, expectedDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                    <Input
                      id="invoiceNumber"
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                      placeholder="e.g., INV-2026-001"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    className="w-full min-h-[80px] rounded-md border border-border-input bg-surface px-3 py-2 text-base text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus"
                    placeholder="Additional details (optional)"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" disabled={creating}>
                    {creating ? 'Creating...' : 'Create Purchase Order'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={handleViewModeChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">
            <Calendar className="mr-2 h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="list">
            <Package className="mr-2 h-4 w-4" />
            List View
          </TabsTrigger>
        </TabsList>

        {/* Calendar View */}
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Expected Deliveries</CardTitle>
              <CardDescription>
                Click on a day to see purchase orders expected that day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-0.5">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                {days.map(day => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const dayPurchases = purchasesByDate[dateKey] || [];
                  const dayReceived = receivedByDate[dateKey] || [];
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isTodayDate = isToday(day);

                  return (
                    <div
                      key={dateKey}
                      className={`
                        min-h-[100px] p-2 border rounded-lg transition-colors
                        ${isCurrentMonth ? 'bg-surface' : 'bg-muted/30'}
                        ${isTodayDate ? 'ring-2 ring-accent' : ''}
                        hover:bg-border/50
                      `}
                    >
                      <div className={`text-sm font-medium ${isTodayDate ? 'text-accent' : isCurrentMonth ? 'text-text' : 'text-muted-foreground'}`}>
                        {format(day, 'd')}
                      </div>
                      {dayPurchases.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {dayPurchases.slice(0, 3).map(purchase => (
                            <div key={purchase.id} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded truncate cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50" onClick={() => setSelectedDay({ date: dateKey, purchases: dayPurchases, received: dayReceived })}>
                              {purchase.productName} ×{purchase.quantity}
                            </div>
                          ))}
                          {dayPurchases.length > 3 && (
                            <div className="text-xs text-muted-foreground cursor-pointer hover:text-text" onClick={() => setSelectedDay({ date: dateKey, purchases: dayPurchases, received: dayReceived })}>
                              +{dayPurchases.length - 3} more
                            </div>
                          )}
                        </div>
                      )}
                      {dayReceived.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {dayReceived.slice(0, 2).map(purchase => (
                            <div key={purchase.id} className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-1.5 py-0.5 rounded truncate cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/50" onClick={() => setSelectedDay({ date: dateKey, purchases: dayPurchases, received: dayReceived })}>
                              ✓ {purchase.productName}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>All Purchase Orders</CardTitle>
                  <CardDescription>Manage and track all inventory purchases</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                    <Input
                      placeholder="Search products, suppliers, invoices..."
                      value={filters.search}
                      onChange={(e) => setFilters({...filters, search: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Status</SelectItem>
                      <SelectItem value="ordered">Ordered</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No purchase orders found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPurchases.map(purchase => (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium">{purchase.productName}</TableCell>
                        <TableCell>{purchase.variantName || '-'}</TableCell>
                        <TableCell>{purchase.quantity}</TableCell>
                        <TableCell>{formatCurrency(purchase.unitCost)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(purchase.totalCost)}</TableCell>
                        <TableCell>{purchase.supplier}</TableCell>
                        <TableCell>{format(new Date(purchase.expectedDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{purchase.receivedDate ? format(new Date(purchase.receivedDate), 'MMM d, yyyy') : '-'}</TableCell>
                        <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                        <TableCell className="font-mono text-sm">{purchase.invoiceNumber || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    {selectedDay && (
      <Dialog open={true} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Purchase Orders for {format(new Date(selectedDay.date), 'MMMM d, yyyy')}</DialogTitle>
            <DialogDescription>
              {selectedDay.purchases.length} expected, {selectedDay.received.length} received
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-4 max-h-[60vh] overflow-auto">
            {selectedDay.purchases.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-blue-800 dark:text-blue-200">Expected Deliveries</h4>
                {selectedDay.purchases.map(purchase => (
                  <div key={purchase.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="font-medium">{purchase.productName} {purchase.variantName ? `(${purchase.variantName})` : ''}</p>
                    <p className="text-sm text-text-muted">Qty: {purchase.quantity} × {formatCurrency(purchase.unitCost)} = {formatCurrency(purchase.totalCost)}</p>
                    <p className="text-sm text-text-muted">Supplier: {purchase.supplier}</p>
                    {purchase.invoiceNumber && <p className="text-sm text-text-muted">Invoice: {purchase.invoiceNumber}</p>}
                    {purchase.notes && <p className="text-sm text-text-muted">Notes: {purchase.notes}</p>}
                    <Badge variant={purchase.status === 'ordered' ? 'outline' : purchase.status === 'received' ? 'success' : 'secondary'} className="mt-1">{purchase.status}</Badge>
                  </div>
                ))}
              </div>
            )}
            {selectedDay.received.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-green-800 dark:text-green-200">Received</h4>
                {selectedDay.received.map(purchase => (
                  <div key={purchase.id} className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="font-medium">{purchase.productName} {purchase.variantName ? `(${purchase.variantName})` : ''}</p>
                    <p className="text-sm text-text-muted">Qty: {purchase.quantity} × {formatCurrency(purchase.unitCost)} = {formatCurrency(purchase.totalCost)}</p>
                    <p className="text-sm text-text-muted">Supplier: {purchase.supplier}</p>
                    {purchase.invoiceNumber && <p className="text-sm text-text-muted">Invoice: {purchase.invoiceNumber}</p>}
                    {purchase.receivedDate && <p className="text-sm text-text-muted">Received: {format(new Date(purchase.receivedDate), 'MMM d, yyyy')}</p>}
                    {purchase.notes && <p className="text-sm text-text-muted">Notes: {purchase.notes}</p>}
                    <Badge variant="success" className="mt-1">Received</Badge>
                  </div>
                ))}
              </div>
            )}
            {selectedDay.purchases.length === 0 && selectedDay.received.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No purchase orders for this day</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDay(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}
    </div>
  );
}

// Simple formatCurrency for client-side
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

export default function InventoryPurchasesPage() {
  return (
    <PermissionGuard permission="inventory" action="view">
      <InventoryPurchasesCalendarPage />
    </PermissionGuard>
  );
}