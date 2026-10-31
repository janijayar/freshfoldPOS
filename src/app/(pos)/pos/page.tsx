'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Plus,
  Minus,
  X,
  Loader2,
  AlertCircle,
  WifiOff,
  User,
  UserPlus,
  CreditCard,
  DollarSign,
  Receipt,
  Tag,
  Package,
  Truck,
  Clock,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Filter,
  MoreHorizontal,
  ArrowUpRight,
  RotateCcw,
  Save,
  Printer,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useProductsWithInventory, useCustomers } from '@/hooks/useApi';

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  categoryId: string | null;
  price: number;
  cost: number;
  type: 'product' | 'gift_card';
  trackInventory: boolean;
  barcode: string;
  createdAt: string;
  inventory: {
    quantity: number;
    reserved: number;
    available: number;
    reorderPoint: number;
    reorderQuantity: number;
    isLowStock: boolean;
    isOutOfStock: boolean;
  };
  variants: any[];
  popular?: boolean;
};

type CartItem = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  variantName?: string;
};

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyTier: string;
  loyaltyPoints: number;
};

type HeldOrder = {
  id: string;
  name: string;
  itemCount: number;
  total: number;
  createdAt: Date;
  customerId?: string;
  customerName?: string;
};

const categories = ['All', 'Beverages', 'Food', 'Merchandise', 'Gift Cards'];

const taxRate = 0.095;

function POSContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showHoldDialog, setShowHoldDialog] = useState(false);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'gift_card' | 'split'>('card');
  const [cashReceived, setCashReceived] = useState(0);
  const [processingPayment, setProcessingPayment] = useState(false);

  const { data: productsData, loading: productsLoading, error: productsError, mutate: refetchProducts } = useProductsWithInventory();
  const { data: customersData, loading: customersLoading, error: customersError } = useCustomers();

  const products = useMemo(() => productsData?.products || [], [productsData]);
  const customers = useMemo(() => customersData?.customers || [], [customersData]);

  useEffect(() => {
    setIsLoading(productsLoading || customersLoading);
    setError(productsError?.message || customersError?.message || null);
    setIsOnline(!productsError && !customersError);
  }, [productsLoading, customersLoading, productsError, customersError]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.barcode.includes(searchQuery);
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
  }, [products, searchQuery, selectedCategory]);

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalDiscount = cart.reduce((sum, item) => sum + item.discount * item.quantity, 0) + discountAmount + (subtotal * discountPercent / 100);
  const taxableAmount = subtotal - totalDiscount;
  const tax = taxableAmount * taxRate;
  const total = taxableAmount + tax;

  const isLowStock = (product: Product) => product.trackInventory && product.inventory.isLowStock;
  const isOutOfStock = (product: Product) => product.trackInventory && product.inventory.isOutOfStock;
  const getAvailableStock = (product: Product) => product.inventory.available;

  const addToCart = (product: Product) => {
    if (isOutOfStock(product)) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      const availableStock = getAvailableStock(product);
      if (existing) {
        if (product.trackInventory && existing.quantity >= availableStock) return prev;
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, {
        id: `cart-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: 1,
        unitPrice: product.price,
        discount: 0,
        tax: product.price * taxRate,
      }];
    });
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== cartItemId));
      return;
    }
    const item = cart.find((i) => i.id === cartItemId);
    const product = products.find((p) => p.id === item?.productId);
    const availableStock = product ? getAvailableStock(product) : 0;
    if (product && product.trackInventory && quantity > availableStock) return;

    setCart((prev) => prev.map((item) =>
      item.id === cartItemId ? { ...item, quantity } : item
    ));
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (confirm('Clear all items from cart?')) {
      setCart([]);
      setSelectedCustomer(null);
      setDiscountPercent(0);
      setDiscountAmount(0);
    }
  };

  const holdOrder = () => {
    if (cart.length === 0) return;
    setShowHoldDialog(true);
  };

  const applyHold = (name: string) => {
    const newHeldOrder: HeldOrder = {
      id: `held-${Date.now()}`,
      name: name || `Order ${Date.now().toString().slice(-4)}`,
      itemCount: cart.length,
      total: Math.round(total),
      createdAt: new Date(),
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
    };
    setHeldOrders(prev => [...prev, newHeldOrder]);
    setShowHoldDialog(false);
    clearCart();
  };

  const retrieveHeldOrder = (heldOrder: HeldOrder) => {
    setShowHoldDialog(false);
    // In real app, would restore cart from backend
    // For now just clear the held order
    setHeldOrders(prev => prev.filter(o => o.id !== heldOrder.id));
  };

  const openPayment = () => {
    if (cart.length === 0) return;
    setShowPaymentDialog(true);
  };

  const processPayment = async () => {
    setProcessingPayment(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // In real app: create order, process payment, print receipt
      setShowPaymentDialog(false);
      clearCart();
    } catch {
      setError('Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleBarcodeScan = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery) {
      const product = products.find(p => p.barcode === searchQuery);
      if (product) addToCart(product);
      setSearchQuery('');
    }
  };

  const getStockBadge = (product: Product) => {
    if (!product.trackInventory) return <Badge variant="secondary" className="text-xs">No tracking</Badge>;
    if (product.inventory.isOutOfStock) return <Badge variant="danger" className="text-xs">Out of Stock</Badge>;
    if (product.inventory.isLowStock) return <Badge variant="warning" className="text-xs">Low Stock</Badge>;
    return <Badge variant="success" className="text-xs">In Stock</Badge>;
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <Button
      variant={isOutOfStock(product) ? 'outline' : 'secondary'}
      className={cn('h-24 w-full flex-col gap-2 p-3', isOutOfStock(product) && 'opacity-50 cursor-not-allowed')}
      onClick={() => addToCart(product)}
      disabled={isOutOfStock(product)}
      aria-label={isOutOfStock(product) ? `${product.name} - Out of Stock` : `Add ${product.name} to cart`}
    >
      <div className="flex items-center justify-between w-full">
        <span className="font-medium text-sm truncate">{product.name}</span>
        {product.popular && <Badge variant="default" className="text-xs">Popular</Badge>}
      </div>
      <div className="flex items-center justify-between w-full">
        <span className="font-bold text-lg tabular-nums">{formatCurrency(product.price)}</span>
        {getStockBadge(product)}
      </div>
    </Button>
  );

  const ProductListItem = ({ product }: { product: Product }) => (
    <Button
      variant={isOutOfStock(product) ? 'outline' : 'secondary'}
      className={cn('h-16 w-full justify-start gap-4 p-2', isOutOfStock(product) && 'opacity-50 cursor-not-allowed')}
      onClick={() => addToCart(product)}
      disabled={isOutOfStock(product)}
      aria-label={isOutOfStock(product) ? `${product.name} - Out of Stock` : `Add ${product.name} to cart`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{product.name}</span>
          {product.popular && <Badge variant="default" className="text-xs">Popular</Badge>}
        </div>
        <span className="text-xs text-text-muted font-mono">{product.sku}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-bold tabular-nums w-20 text-right">{formatCurrency(product.price)}</span>
        {getStockBadge(product)}
      </div>
    </Button>
  );

  const CartItemRow = ({ item }: { item: CartItem }) => (
    <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.productName}</p>
        <p className="text-xs text-text-muted font-mono">{item.sku}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Decrease quantity">
          <Minus className="h-4 w-4" />
        </Button>
        <span className="font-mono tabular-nums w-8 text-center">{item.quantity}</span>
        <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Increase quantity">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <span className="font-mono tabular-nums font-medium w-24 text-right">
        {formatCurrency((item.unitPrice - item.discount) * item.quantity)}
      </span>
      <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)} aria-label="Remove item" className="text-danger">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-4">
          <h1 className="text-xl font-bold">POS Terminal</h1>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" aria-hidden="true" />
            <span className="text-sm font-medium">Online</span>
          </div>
        </header>
        <div className="flex-1 flex overflow-hidden p-4 gap-4">
          <div className="flex-1 max-w-2xl p-4">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} className="h-24" />)}
            </div>
          </div>
          <div className="w-80 max-w-full flex flex-col">
            <SkeletonCard className="h-40" />
            <SkeletonCard className="flex-1" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        variant={!isOnline ? 'network' : 'server'}
        onRetry={() => { refetchProducts(); }}
        onGoHome={() => router.push('/dashboard')}
        title={!isOnline ? 'You are offline' : undefined}
        description={!isOnline ? 'POS will sync when connection is restored.' : undefined}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">POS Terminal</h1>
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
          <Button variant="ghost" size="icon" aria-label="Settings">
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Help">
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        <div className="flex-1 max-w-2xl flex flex-col min-w-0">
          <div className="flex items-center gap-2 mb-4 p-4 bg-surface rounded-lg border">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" aria-hidden="true" />
              <Input
                placeholder="Scan barcode or search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleBarcodeScan}
                className="pl-10"
                autoFocus
                aria-label="Search products"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex border border-border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid'}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  aria-pressed={viewMode === 'list'}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {filteredProducts.length === 0 ? (
              <EmptyState
                title={searchQuery || selectedCategory !== 'All' ? 'No products match' : 'No products available'}
                description={searchQuery || selectedCategory !== 'All'
                  ? 'Try adjusting your search or category filter.'
                  : 'Add products in Inventory to start selling.'}
                icon={<Package className="h-12 w-12 mx-auto text-text-muted/50" />}
              />
            ) : (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <ProductListItem key={product.id} product={product} />
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        <div className="w-80 max-w-full flex flex-col bg-surface border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Cart ({cart.length})</h2>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart} className="text-danger">
                  <RotateCcw className="h-4 w-4 mr-1" aria-hidden="true" />
                  Clear
                </Button>
              )}
            </div>

            {selectedCustomer && (
              <div className="flex items-center justify-between p-2 bg-accent-muted rounded-lg mb-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-accent" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-sm">{selectedCustomer.name}</p>
                    <p className="text-xs text-text-muted">{selectedCustomer.loyaltyTier} • {selectedCustomer.loyaltyPoints} pts</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(null)} aria-label="Remove customer">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {cart.length === 0 && (
              <EmptyState
                title="Cart is empty"
                description="Add products from the catalog to start a sale."
                icon={<Receipt className="h-12 w-12 mx-auto text-text-muted/50" />}
              />
            )}

            {cart.length > 0 && (
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-2 pr-2">
                  {cart.map((item) => <CartItemRow key={item.id} item={item} />)}
                </div>
              </ScrollArea>
            )}
          </div>

          <div className="p-4 border-b border-border space-y-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCustomerDialog(true)}
                disabled={showCustomerDialog}
              >
                <UserPlus className="h-4 w-4 mr-2" aria-hidden="true" />
                {selectedCustomer ? 'Change Customer' : 'Add Customer'}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={holdOrder}
                disabled={cart.length === 0}
              >
                <ArrowUpRight className="h-4 w-4 mr-2" aria-hidden="true" />
                Hold
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Discount %</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                  className="text-right"
                  inputMode="decimal"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Discount $</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="text-right"
                  inputMode="decimal"
                />
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="space-y-2 border-t border-border pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Subtotal</span>
                <span className="font-mono tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              {(discountPercent > 0 || discountAmount > 0 || cart.some(i => i.discount > 0)) && (
                <div className="flex justify-between text-sm text-success">
                  <span>Discount</span>
                  <span className="font-mono tabular-nums">-{formatCurrency(totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Tax (9.5%)</span>
                <span className="font-mono tabular-nums">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(total)}</span>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full h-14 text-lg"
              onClick={openPayment}
              disabled={cart.length === 0 || processingPayment}
            >
              {processingPayment ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" aria-hidden="true" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" aria-hidden="true" />
                  Pay {formatCurrency(total)}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
            <DialogDescription>Search or select a customer for this order</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Search customers..." className="mb-2" />
            <div className="space-y-2 max-h-60 overflow-auto">
              {customers.map((customer) => (
                <Button
                  key={customer.id}
                  variant={selectedCustomer?.id === customer.id ? 'secondary' : 'outline'}
                  className="w-full justify-start gap-3"
                  onClick={() => { setSelectedCustomer(customer); setShowCustomerDialog(false); }}
                >
                  <div className="flex-1 text-left">
                    <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                    <p className="text-xs text-text-muted">{customer.email} • {customer.loyaltyTier}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{customer.loyaltyPoints} pts</Badge>
                </Button>
              ))}
              {customers.length === 0 && (
                <p className="text-center text-text-muted py-4">No customers found</p>
              )}
            </div>
            <Button variant="outline" className="w-full" onClick={() => { /* navigate to customers */ }}>
              <UserPlus className="h-4 w-4 mr-2" aria-hidden="true" />
              Create New Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showHoldDialog} onOpenChange={setShowHoldDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hold Order</DialogTitle>
            <DialogDescription>Save this cart for later retrieval</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Order Name</label>
              <Input placeholder="e.g., Walk-in Order" defaultValue={`Order ${Date.now().toString().slice(-4)}`} />
            </div>
            {heldOrders.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Existing Held Orders</label>
                <div className="space-y-2 max-h-40 overflow-auto">
                  {heldOrders.map((order) => (
                    <Button
                      key={order.id}
                      variant="outline"
                      className="w-full justify-start gap-3"
                      onClick={() => retrieveHeldOrder(order)}
                    >
                      <div className="flex-1 text-left">
                        <p className="font-medium">{order.name}</p>
                        <p className="text-xs text-text-muted">{order.itemCount} items • {formatCurrency(order.total)}</p>
                      </div>
                      <Clock className="h-4 w-4 text-text-muted" />
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHoldDialog(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => applyHold('')}>Hold Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment</DialogTitle>
            <DialogDescription>Total due: {formatCurrency(total)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {(['cash', 'card', 'gift_card', 'split'] as const).map((method) => (
                <Button
                  key={method}
                  variant={paymentMethod === method ? 'secondary' : 'outline'}
                  className="flex-col gap-1 h-20"
                  onClick={() => setPaymentMethod(method)}
                >
                  {method === 'cash' && <DollarSign className="h-6 w-6" />}
                  {method === 'card' && <CreditCard className="h-6 w-6" />}
                  {method === 'gift_card' && <Tag className="h-6 w-6" />}
                  {method === 'split' && <Receipt className="h-6 w-6" />}
                  <span className="text-sm capitalize">{method.replace('_', ' ')}</span>
                </Button>
              ))}
            </div>

            {paymentMethod === 'cash' || paymentMethod === 'split' ? (
              <div className="space-y-2">
                <Input
                  name="cashAmount"
                  label="Cash Received"
                  type="number"
                  step="0.01"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                  className="text-right text-xl font-mono"
                  inputMode="decimal"
                  autoFocus
                />
                <p className="text-sm">
                  Change: <span className="font-bold text-success">{formatCurrency(Math.max(0, cashReceived - total))}</span>
                </p>
              </div>
            ) : null}

            {paymentMethod === 'card' && (
              <div className="p-4 bg-accent-muted rounded-lg border text-center text-sm">
                <CreditCard className="h-8 w-8 mx-auto mb-2 text-accent" aria-hidden="true" />
                <p>Tap or insert card on terminal</p>
              </div>
            )}

            {paymentMethod === 'gift_card' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Gift Card Code</label>
                <Input placeholder="Enter gift card code" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} disabled={processingPayment}>Cancel</Button>
            <Button variant="primary" onClick={processPayment} disabled={processingPayment} className="w-full sm:w-auto">
              {processingPayment ? 'Processing...' : `Charge ${formatCurrency(total)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function POSPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex flex-col bg-background">
        <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-4">
          <h1 className="text-xl font-bold">POS Terminal</h1>
        </header>
        <div className="flex-1 flex overflow-hidden p-4 gap-4">
          <div className="flex-1 max-w-2xl p-4">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} className="h-24" />)}
            </div>
          </div>
          <div className="w-80 max-w-full flex flex-col">
            <SkeletonCard className="h-40" />
            <SkeletonCard className="flex-1" />
          </div>
        </div>
      </div>
    }>
      <POSContent />
    </Suspense>
  );
}