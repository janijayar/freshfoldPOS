'use client';

import { useState, useEffect, Suspense } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  WifiOff,
  Calendar,
  Search,
  Package,
  Truck,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, differenceInDays } from 'date-fns';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

interface SupplyItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  categoryName: string;
  currentStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  supplier: string;
}

interface SupplyPurchase {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
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

interface DayData {
  date: string;
  expected: SupplyPurchase[];
  received: SupplyPurchase[];
  lowStockAlerts: SupplyItem[];
}

function SuppliesCalendarContent() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [purchases, setPurchases] = useState<SupplyPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    unitCost: 0,
    supplier: '',
    expectedDate: format(new Date(), 'yyyy-MM-dd'),
    invoiceNumber: '',
    notes: '',
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch supplies (products in Laundry Supplies category)
      const suppliesRes = await fetch('/api/inventory?category=Laundry%20Supplies');
      if (suppliesRes.ok) {
        const suppliesData = await suppliesRes.json();
        setSupplies(suppliesData.products || []);
      }

      // Fetch supply purchases (inventory adjustments with reason=purchase for supplies)
      const purchasesRes = await fetch('/api/inventory/purchases');
      if (purchasesRes.ok) {
        const purchasesData = await purchasesRes.json();
        setPurchases(purchasesData.purchases || []);
      }
    } catch {
      setError('Failed to load supplies data. Please try again.');
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
          quantity: 1,
          unitCost: 0,
          supplier: '',
          expectedDate: format(new Date(), 'yyyy-MM-dd'),
          invoiceNumber: '',
          notes: '',
        });
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create supply order');
      }
    } catch {
      alert('Failed to create supply order');
    } finally {
      setCreating(false);
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
  }, {} as Record<string, SupplyPurchase[]>);

  // Group purchases by received date
  const receivedByDate = purchases.reduce((acc, purchase) => {
    if (purchase.receivedDate) {
      const dateKey = purchase.receivedDate;
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(purchase);
    }
    return acc;
  }, {} as Record<string, SupplyPurchase[]>);

  // Get low stock alerts for each day (simplified - shows items below reorder point)
  const getLowStockAlerts = (): SupplyItem[] => {
    return supplies.filter(s => s.currentStock <= s.reorderPoint);
  };

  const getDayData = (date: Date): DayData => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return {
      date: dateKey,
      expected: purchasesByDate[dateKey] || [],
      received: receivedByDate[dateKey] || [],
      lowStockAlerts: getLowStockAlerts(),
    };
  };

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

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-danger mx-auto mb-4" />
          <p className="text-text-muted">{error}</p>
          <Button variant="outline" onClick={fetchData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const lowStockItems = supplies.filter(s => s.currentStock <= s.reorderPoint);
  const outOfStockItems = supplies.filter(s => s.currentStock === 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laundry Supplies Calendar</h1>
          <p className="text-muted-foreground">
            Track supply orders, deliveries, and stock levels
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
          <Button variant="primary" onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Supply Order
          </Button>
        </div>
      </div>

      {/* Alerts Banner */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <Card className="border-warning/50 bg-warning-muted/50">
          <CardContent className="pt-4 pb-2">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="h-5 w-5 text-warning" />
              <h4 className="font-medium text-warning">Supply Alerts</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {outOfStockItems.map(item => (
                <Badge key={item.id} variant="danger" className="gap-1">
                  <Package className="h-3 w-3" />
                  Out of Stock: {item.productName} ({item.currentStock}/{item.reorderPoint})
                </Badge>
              ))}
              {lowStockItems.filter(s => s.currentStock > 0).map(item => (
                <Badge key={item.id} variant="warning" className="gap-1">
                  <Package className="h-3 w-3" />
                  Low Stock: {item.productName} ({item.currentStock}/{item.reorderPoint})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'calendar' | 'list')}>
        <TabsList className="grid w-[300px] grid-cols-2">
          <TabsTrigger value="calendar">
            <Calendar className="mr-2 h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="list">
            <Package className="mr-2 h-4 w-4" />
            Supply Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <div className="grid grid-cols-7 gap-0.5">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-text-muted py-2 px-1">
                {day}
              </div>
            ))}
            {days.map((day) => {
              const dayData = getDayData(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isTodayDate = isToday(day);
              const hasExpected = dayData.expected.length > 0;
              const hasReceived = dayData.received.length > 0;
              const hasAlerts = dayData.lowStockAlerts.length > 0;

              return (
                <div
                  key={day.toISOString()}
                  className={`
                    relative min-h-[100px] p-1 border border-border bg-surface
                    ${!isCurrentMonth ? 'bg-muted/30 text-text-muted/50' : 'hover:bg-accent-muted/30'}
                    ${isTodayDate ? 'ring-2 ring-accent' : ''}
                    cursor-pointer transition-colors
                  `}
                  onClick={() => setSelectedDay(dayData)}
                >
                  <div className="text-sm font-medium">{format(day, 'd')}</div>
                  <div className="mt-1 space-y-0.5 max-h-[70px] overflow-hidden">
                    {hasExpected && (
                      <div className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-1 py-0.5 rounded truncate">
                        📦 {dayData.expected.length} expected
                      </div>
                    )}
                    {hasReceived && (
                      <div className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-1 py-0.5 rounded truncate">
                        ✓ {dayData.received.length} received
                      </div>
                    )}
                    {hasAlerts && (
                      <div className="text-xs bg-warning/20 dark:bg-warning/30 text-warning px-1 py-0.5 rounded truncate">
                        ⚠ {dayData.lowStockAlerts.length} low stock
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Supply Purchase Orders</CardTitle>
              <CardDescription>All supply orders with expected and received dates</CardDescription>
            </CardHeader>
            <CardContent>
              {purchases.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto text-text-muted/50 mb-2" />
                  <p>No supply orders yet</p>
                  <Button variant="outline" onClick={() => setShowCreateDialog(true)} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Order
                  </Button>
                </div>
              ) : (
                <ScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Supply Item</TableHead>
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
                      {purchases.map(purchase => (
                        <TableRow key={purchase.id}>
                          <TableCell className="font-medium">{purchase.productName}</TableCell>
                          <TableCell>{purchase.quantity}</TableCell>
                          <TableCell>{formatCurrency(purchase.unitCost)}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(purchase.totalCost)}</TableCell>
                          <TableCell>{purchase.supplier}</TableCell>
                          <TableCell>{format(new Date(purchase.expectedDate), 'MMM d, yyyy')}</TableCell>
                          <TableCell>{purchase.receivedDate ? format(new Date(purchase.receivedDate), 'MMM d, yyyy') : '-'}</TableCell>
                          <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                          <TableCell className="font-mono text-sm">{purchase.invoiceNumber || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Day Detail Dialog */}
      {selectedDay && (
        <Dialog open={true} onOpenChange={() => setSelectedDay(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Supply Orders for {format(new Date(selectedDay.date), 'MMMM d, yyyy')}</DialogTitle>
              <DialogDescription>
                {selectedDay.expected.length} expected, {selectedDay.received.length} received
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 p-4 max-h-[60vh] overflow-auto">
              {selectedDay.lowStockAlerts.length > 0 && (
                <div className="space-y-2 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                  <h4 className="font-medium text-warning">⚠ Low Stock Alerts</h4>
                  {selectedDay.lowStockAlerts.map(item => (
                    <div key={item.id} className="text-sm">
                      {item.productName} - Current: {item.currentStock} | Reorder Point: {item.reorderPoint}
                    </div>
                  ))}
                </div>
              )}
              {selectedDay.expected.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200">Expected Deliveries</h4>
                  {selectedDay.expected.map(purchase => (
                    <div key={purchase.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="font-medium">{purchase.productName} ({purchase.productSku})</p>
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
                      <p className="font-medium">{purchase.productName} ({purchase.productSku})</p>
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
              {selectedDay.expected.length === 0 && selectedDay.received.length === 0 && selectedDay.lowStockAlerts.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No supply orders or alerts for this day</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedDay(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Supply Order Dialog */}
      {showCreateDialog && (
        <Dialog open={true} onOpenChange={() => setShowCreateDialog(false)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>New Supply Order</DialogTitle>
              <DialogDescription>Create a new laundry supply purchase order</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 p-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-2">
                <Label htmlFor="productId">Supply Item *</Label>
                <Select value={formData.productId} onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supply item" />
                  </SelectTrigger>
                  <SelectContent>
                    {supplies.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.productName} ({s.sku}) - Stock: {s.currentStock}
                      </SelectItem>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitCost">Unit Cost *</Label>
                  <Input
                    id="unitCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unitCost}
                    onChange={(e) => setFormData(prev => ({ ...prev, unitCost: Math.round(parseFloat(e.target.value) * 100) || 0 }))}
                    placeholder="0.00"
                    className="text-right"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier *</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  placeholder="Supplier name"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="expectedDate">Expected Delivery *</Label>
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
                    placeholder="Optional"
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
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Order'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function SuppliesCalendarPage() {
  return (
    <PermissionGuard permission="inventory" action="view" fallback={<div />}>
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <SuppliesCalendarContent />
      </Suspense>
    </PermissionGuard>
  );
}