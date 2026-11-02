'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
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
  RefreshCw,
  Filter,
  MoreHorizontal,
  RotateCcw,
  Trash2,
  Save,
  Receipt,
  User,
  Tag,
  Package,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton, SkeletonTable, SkeletonCard } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyTableState } from '@/components/ui/empty-state';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

type HeldOrder = {
  id: string;
  name: string;
  registerId: string;
  registerName: string;
  customerId: string | null;
  customerName: string | null;
  items: CartItem[];
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  createdAt: Date;
  updatedAt: Date;
};

type CartItem = {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
};

const mockHeldOrders: HeldOrder[] = [
  {
    id: 'held-1',
    name: 'Table 5',
    registerId: 'reg-1',
    registerName: 'Register 1',
    customerId: null,
    customerName: null,
    items: [
      { id: 'item-1', productId: 'prod-1', productName: 'Americano', productSku: 'BEV-001', quantity: 2, unitPriceCents: 350, discountCents: 0, taxCents: 56, totalCents: 756 },
      { id: 'item-2', productId: 'prod-5', productName: 'Croissant', productSku: 'FOOD-001', quantity: 1, unitPriceCents: 350, discountCents: 0, taxCents: 28, totalCents: 378 },
    ],
    subtotalCents: 1050,
    discountCents: 0,
    taxCents: 84,
    totalCents: 1134,
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T10:30:00'),
  },
  {
    id: 'held-2',
    name: 'John\'s Order',
    registerId: 'reg-1',
    registerName: 'Register 1',
    customerId: 'cust-1',
    customerName: 'John Smith',
    items: [
      { id: 'item-3', productId: 'prod-2', productName: 'Latte', productSku: 'BEV-002', quantity: 1, unitPriceCents: 450, discountCents: 0, taxCents: 36, totalCents: 486 },
      { id: 'item-4', productId: 'prod-3', productName: 'Cappuccino', productSku: 'BEV-003', quantity: 2, unitPriceCents: 450, discountCents: 0, taxCents: 72, totalCents: 972 },
    ],
    subtotalCents: 1350,
    discountCents: 135,
    taxCents: 97,
    totalCents: 1312,
    createdAt: new Date('2024-01-15T11:15:00'),
    updatedAt: new Date('2024-01-15T11:15:00'),
  },
  {
    id: 'held-3',
    name: 'Takeout #12',
    registerId: 'reg-2',
    registerName: 'Register 2',
    customerId: null,
    customerName: null,
    items: [
      { id: 'item-5', productId: 'prod-4', productName: 'Cold Brew', productSku: 'BEV-004', quantity: 3, unitPriceCents: 500, discountCents: 0, taxCents: 120, totalCents: 1620 },
    ],
    subtotalCents: 1500,
    discountCents: 0,
    taxCents: 120,
    totalCents: 1620,
    createdAt: new Date('2024-01-15T12:00:00'),
    updatedAt: new Date('2024-01-15T12:00:00'),
  },
];

function TicketsContent() {
  const router = useRouter();
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<HeldOrder | null>(null);
  const [voidConfirmOrder, setVoidConfirmOrder] = useState<HeldOrder | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setHeldOrders(mockHeldOrders);
    } catch {
      setError('Failed to load held orders. Please try again.');
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

  const handleRecall = (order: HeldOrder) => {
    setSelectedOrder(order);
    router.push('/pos');
  };

  const handleVoid = (order: HeldOrder) => {
    setVoidConfirmOrder(order);
  };

  const handleConfirmVoid = () => {
    if (voidConfirmOrder) {
      setHeldOrders(heldOrders.filter(o => o.id !== voidConfirmOrder.id));
      setVoidConfirmOrder(null);
    }
  };

  const handleEdit = (order: HeldOrder) => {
    setSelectedOrder(order);
    router.push('/pos');
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Open Tickets</h1>
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

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Open Tickets</h1>
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
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Held Orders</CardTitle>
                <CardDescription>Orders on hold waiting to be completed or voided</CardDescription>
              </div>
              <Badge variant="default" className="text-lg px-3 py-1">{heldOrders.length} tickets</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {heldOrders.length === 0 ? (
              <EmptyTableState
                title="No held orders"
                description="All tickets have been completed or voided. New held orders will appear here."
                icon={<Receipt className="h-12 w-12 mx-auto text-text-muted/50" />}
              />
            ) : (
              <ScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket Name</TableHead>
                      <TableHead>Register</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-right">Tax</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {heldOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.name}</TableCell>
                        <TableCell>{order.registerName}</TableCell>
                        <TableCell>
                          {order.customerName ? (
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-text-muted" />
                              <span>{order.customerName}</span>
                            </div>
                          ) : (
                            <span className="text-text-muted">Walk-in</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {order.items.map((item) => (
                              <Badge key={item.id} variant="secondary" className="text-xs">
                                {item.productName} × {item.quantity}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">{formatCurrency(order.subtotalCents)}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-danger">−{formatCurrency(order.discountCents)}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">{formatCurrency(order.taxCents)}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums font-medium">{formatCurrency(order.totalCents)}</TableCell>
                        <TableCell className="text-text-muted text-sm">{order.createdAt.toLocaleString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="More actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleRecall(order)}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Recall to POS
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(order)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit & Recall
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-danger" onClick={() => handleVoid(order)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Void Ticket
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
          </CardContent>
        </Card>
      </div>

      {voidConfirmOrder && (
        <Dialog open={true} onOpenChange={() => setVoidConfirmOrder(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Void Ticket</DialogTitle>
              <DialogDescription>Are you sure you want to void "{voidConfirmOrder.name}"? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setVoidConfirmOrder(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleConfirmVoid}>
                <Trash2 className="h-4 w-4 mr-2" />
                Void Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedOrder && (
        <Dialog open={true} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Recall Ticket: {selectedOrder.name}</DialogTitle>
              <DialogDescription>Review the order before sending to POS</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2 max-h-[60vh] overflow-auto">
              <div className="space-y-2">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-surface rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-text-muted">{item.productSku} • Qty: {item.quantity} × {formatCurrency(item.unitPriceCents)}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {item.discountCents > 0 && <span className="text-danger">−{formatCurrency(item.discountCents)}</span>}
                      <span className="font-mono tabular-nums font-medium">{formatCurrency(item.totalCents)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Subtotal</span>
                  <span className="font-mono tabular-nums">{formatCurrency(selectedOrder.subtotalCents)}</span>
                </div>
                {selectedOrder.discountCents > 0 && (
                  <div className="flex justify-between text-sm text-danger">
                    <span>Discount</span>
                    <span className="font-mono tabular-nums">−{formatCurrency(selectedOrder.discountCents)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Tax</span>
                  <span className="font-mono tabular-nums">{formatCurrency(selectedOrder.taxCents)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="font-mono tabular-nums">{formatCurrency(selectedOrder.totalCents)}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
              <Button variant="primary" onClick={() => { handleRecall(selectedOrder); setSelectedOrder(null); }}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Send to POS
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function TicketsPageInner() {
  return (
    <Suspense fallback={
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Open Tickets</h1>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    }>
      <TicketsContent />
    </Suspense>
  );
}

export default function TicketsPage() {
  return (
    <PermissionGuard permission="pos" action="view">
      <TicketsPageInner />
    </PermissionGuard>
  );
}