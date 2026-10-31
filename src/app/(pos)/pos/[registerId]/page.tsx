'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Grid,
  List,
  CreditCard,
  Banknote,
  X,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Barcode,
  MoreHorizontal,
  RefreshCw,
  AlertCircle,
  WifiOff,
  Package,
  ClipboardList,
  Loader2,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { SkeletonPOS } from '@/components/ui/skeleton';
import { ErrorState, InlineError } from '@/components/ui/error-state';
import { EmptyListState } from '@/components/ui/empty-state';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useProductsWithInventory } from '@/hooks/useApi';
import { useRegisters } from '@/hooks/useApi';

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  sku: string;
  stock: number;
  barcode: string | null;
};

type CartItem = {
  product: Product;
  quantity: number;
};

type PaymentMethod = 'card' | 'cash' | 'split';

interface Register {
  id: string;
  name: string;
  code: string;
  locationId: string;
}

export default function PosPage({ params }: { params: { registerId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cashReceived, setCashReceived] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null);

  // Get register info
  const { data: registersData, loading: registersLoading } = useRegisters({ active: 'true' });
  const currentRegister = registersData?.registers?.find(r => r.id === params.registerId);

  // Get products with inventory for this location
  const { data: productsData, loading: productsLoading, error: productsError, refetch: refetchProducts } =
    useProductsWithInventory(currentRegister?.locationId, { active: 'true' });

  const products = productsData?.products || [];
  const categoryNames = products.map(p => p.category?.name).filter((name): name is string => Boolean(name));
  const categories = ['All', ...Array.from(new Set(categoryNames))];

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.0825);
  const total = subtotal + tax;
  const change = paymentMethod === 'cash' && cashReceived
    ? Math.max(0, parseFloat(cashReceived) * 100 - total)
    : 0;

  // Check for recalled ticket from URL param
  useEffect(() => {
    const recallParam = searchParams.get('recall');
    if (recallParam) {
      try {
        const ticket = JSON.parse(recallParam);
        const cartItems: CartItem[] = ticket.items.map((item: any) => {
          const product = products.find(p => p.id === item.productId || p.name === item.name);
          if (product) {
            return { product, quantity: item.quantity };
          }
          return null;
        }).filter(Boolean);
        setCart(cartItems);
        if (ticket.customerId) {
          // Would fetch customer details
        }
      } catch {
        console.error('Failed to parse recalled ticket');
      }
    }
  }, [searchParams, products]);

  // Check for recalled ticket from sessionStorage (legacy)
  useEffect(() => {
    const recalledTicket = sessionStorage.getItem('recalledTicket');
    if (recalledTicket && !searchParams.get('recall')) {
      try {
        const ticket = JSON.parse(recalledTicket);
        const cartItems: CartItem[] = ticket.items.map((item: any) => {
          const product = products.find(p => p.name === item.name);
          if (product) {
            return { product, quantity: item.quantity };
          }
          return null;
        }).filter(Boolean);
        setCart(cartItems);
        sessionStorage.removeItem('recalledTicket');
      } catch {
        console.error('Failed to parse recalled ticket');
      }
    }
  }, [products]);

  // Online/offline detection
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

  // Barcode scanner input handling
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime > 100) {
        buffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter' && buffer.length > 0) {
        e.preventDefault();
        handleBarcodeScan(buffer);
        buffer = '';
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  const handleBarcodeScan = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode || p.sku === barcode);
    if (product) {
      addToCart(product);
      setSuccess(`Added ${product.name} via barcode`);
      setTimeout(() => setSuccess(null), 2000);
    } else {
      setError('Product not found for barcode: ' + barcode);
      setTimeout(() => setError(null), 3000);
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock !== undefined && product.stock <= 0 && product.category !== 'Gift Cards') {
      setError(`${product.name} is out of stock`);
      setTimeout(() => setError(null), 3000);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + 1;
        if (product.stock !== undefined && newQty > product.stock && product.category !== 'Gift Cards') {
          setError(`Only ${product.stock} units of ${product.name} available`);
          setTimeout(() => setError(null), 3000);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: newQty }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setSearchQuery('');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
    } else {
      const item = cart.find(i => i.product.id === productId);
      if (item && item.product.stock !== undefined && quantity > item.product.stock && item.product.category !== 'Gift Cards') {
        setError(`Only ${item.product.stock} units of ${item.product.name} available`);
        setTimeout(() => setError(null), 3000);
        return;
      }
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCashReceived('');
    setSelectedCustomer(null);
  };

  const createOrder = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'cash' && cashReceived && parseFloat(cashReceived) * 100 < total) {
      setError('Insufficient cash received');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare order data
      const items = cart.map(item => ({
        productId: item.product.id,
        variantId: null,
        quantity: item.quantity,
        unitPrice: item.product.price,
        discount: 0,
        tax: Math.round(item.product.price * 0.0825),
      }));

      const payments = paymentMethod === 'split'
        ? [
            { method: 'card', amount: total - parseFloat(cashReceived || '0') * 100 },
            { method: 'cash', amount: parseFloat(cashReceived || '0') * 100 }
          ]
        : [{ method: paymentMethod, amount: total }];

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          payments,
          customerId: selectedCustomer?.id || null,
          registerId: params.registerId,
          locationId: currentRegister?.locationId,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create order');
      }

      const { order } = await response.json();

      // Print receipt (in real app, would use Web Serial/HID)
      if (typeof window !== 'undefined') {
        printReceipt(order, cart, payments, subtotal, tax, total, change);
      }

      setSuccess(`Order ${order.orderNumber} completed!`);
      clearCart();

      // Redirect to receipt after short delay
      setTimeout(() => {
        router.push(`/receipts/${order.id}`);
        router.refresh();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const printReceipt = (order: any, cartItems: CartItem[], payments: any[], subtotal: number, tax: number, total: number, change: number) => {
    // In production: use Web Serial API for thermal printer
    console.log('RECEIPT:', { order, items: cartItems, payments, subtotal, tax, total, change });

    // For demo: open print dialog with receipt content
    const receiptHtml = `
      <html>
        <body style="font-family: monospace; width: 300px; padding: 20px;">
          <div style="text-align: center;">
            <h2>freshfold</h2>
            <p>Main Street Store</p>
            <p>123 Main St, San Francisco</p>
            <hr>
          </div>
          <div>
            <p>Order: ${order.orderNumber}</p>
            <p>Date: ${new Date().toLocaleString()}</p>
            <p>Register: ${currentRegister?.name || params.registerId}</p>
            <hr>
          </div>
          ${cartItems.map(item => `
            <div style="display: flex; justify-content: space-between;">
              <span>${item.product.name} x${item.quantity}</span>
              <span>${formatCurrency(item.product.price * item.quantity)}</span>
            </div>
          `).join('')}
          <hr>
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal</span>
            <span>${formatCurrency(subtotal)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Tax</span>
            <span>${formatCurrency(tax)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>Total</span>
            <span>${formatCurrency(total)}</span>
          </div>
          <hr>
          ${payments.map(p => `
            <div style="display: flex; justify-content: space-between;">
              <span>${p.method.toUpperCase()}</span>
              <span>${formatCurrency(p.amount)}</span>
            </div>
          `).join('')}
          ${change > 0 ? `<div style="display: flex; justify-content: space-between;"><span>Change</span><span>${formatCurrency(change)}</span></div>` : ''}
          <hr>
          <p style="text-align: center;">Thank you!</p>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow?.document.write(receiptHtml);
    printWindow?.document.close();
    printWindow?.print();
  };

  const handlePayment = () => {
    if (paymentMethod === 'card') {
      // In production: integrate with Stripe Terminal
      // For now, simulate card payment
      createOrder();
    } else if (paymentMethod === 'cash') {
      createOrder();
    }
  };

  if (productsLoading || registersLoading) {
    return <SkeletonPOS />;
  }

  if (productsError) {
    return (
      <ErrorState
        variant={!isOnline ? 'network' : 'server'}
        onRetry={refetchProducts}
        onGoHome={() => window.location.href = '/dashboard'}
        title={!isOnline ? 'You are offline' : undefined}
        description={!isOnline ? 'Changes will sync when connection is restored.' : undefined}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">
            {currentRegister ? `Register: ${currentRegister.name}` : `Register ${params.registerId}`}
          </h1>
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/pos/${params.registerId}/tickets`)}
            aria-label="Open tickets"
          >
            <ClipboardList className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Scan barcode" title="Scan barcode (or type barcode and press Enter)">
            <Barcode className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => refetchProducts()} disabled={productsLoading} aria-label="Refresh products">
            <RefreshCw className={cn("h-5 w-5", productsLoading && "animate-spin")} />
          </Button>
          <Button variant="ghost" size="icon" aria-label="More options"><MoreHorizontal className="h-5 w-5" /></Button>
        </div>
      </div>

      {(error || success) && (
        <div className={cn('px-4 py-2 mx-4 mt-2 rounded-lg text-sm', error ? 'bg-danger/10 border border-danger/20 text-danger' : 'bg-success/10 border border-success/20 text-success')}>
          <div className="flex items-center gap-2">
            {error ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            <span>{error || success}</span>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-4 border-b border-border bg-surface">
            <div className="relative max-w-md mx-auto md:mx-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" aria-hidden="true" />
              <Input
                placeholder="Search products or scan barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-label="Search products"
                autoComplete="off"
                spellCheck={false}
              />
              <HelpCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted cursor-help" />
            </div>
          </div>

          <div className="p-2 border-b border-border bg-surface">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="gap-1 bg-transparent p-0" role="tablist" aria-label="Product categories">
                {categories.map((cat) => (
                  <TabsTrigger key={cat} value={cat} className="px-3 py-1.5 text-sm" role="tab">{cat}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <ScrollArea className="flex-1 p-4">
            {products.length === 0 ? (
              <EmptyListState
                title="No products available"
                description="Add products in the dashboard to get started."
                icon={<Package className="h-12 w-12 mx-auto text-text-muted/50" />}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products
                  .filter((p) => {
                    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.barcode === searchQuery;
                    const matchesCategory = selectedCategory === 'All' || p.category?.name === selectedCategory;
                    return matchesSearch && matchesCategory;
                  })
                  .map((product) => (
                    <Button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      variant="outline"
                      className="h-24 flex-col gap-2 p-3 hover:bg-accent-muted/50 transition-colors"
                      disabled={product.stock !== undefined && product.stock <= 0 && product.category !== 'Gift Cards'}
                      aria-label={product.stock !== undefined && product.stock <= 0 && product.category !== 'Gift Cards'
                        ? `${product.name} - out of stock`
                        : `Add ${product.name} to cart - ${formatCurrency(product.price)}`}
                    >
                      <div className="font-medium text-center truncate">{product.name}</div>
                      <div className="text-sm text-text-muted">{formatCurrency(product.price)}</div>
                      {(product.stock !== undefined && product.stock < 10 && product.stock > 0) && (
                        <Badge variant="warning" size="sm">Low: {product.stock}</Badge>
                      )}
                      {(product.stock !== undefined && product.stock <= 0 && product.category !== 'Gift Cards') && (
                        <Badge variant="danger" size="sm">Out of Stock</Badge>
                      )}
                    </Button>
                  ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="w-full lg:w-96 border-l border-border bg-surface-elevated flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle>Current Sale</CardTitle>
              <Badge variant={cart.length > 0 ? 'default' : 'secondary'}>
                {cart.length} items
              </Badge>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            {cart.length === 0 ? (
              <EmptyListState
                title="No items in cart"
                description="Scan or tap products to add"
                icon={<Receipt className="h-12 w-12 opacity-50" />}
              />
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-border">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.product.name}</p>
                      <p className="text-sm text-text-muted">{formatCurrency(item.product.price)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        aria-label={`Decrease quantity of ${item.product.name}`}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium" aria-live="polite">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        aria-label={`Increase quantity of ${item.product.name}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-danger hover:text-danger"
                        aria-label={`Remove ${item.product.name} from cart`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="w-24 text-right font-medium">
                      {formatCurrency(item.product.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t border-border bg-surface-elevated/50 space-y-3">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-text-muted">
              <span>Tax (8.25%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/pos/${params.registerId}/tickets?recallCallbackUrl=/pos/${params.registerId}`)}
              disabled={cart.length === 0}
              aria-label="View open tickets"
            >
              View Open Tickets
            </Button>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                if (cart.length === 0) return;
                const ticketNumber = `TKT-${Date.now().toString().slice(-6)}`;
                const ticket = {
                  id: Date.now().toString(),
                  ticketNumber,
                  customerName: selectedCustomer?.name || null,
                  items: cart.map(item => ({
                    productId: item.product.id,
                    name: item.product.name,
                    quantity: item.quantity,
                    price: item.product.price,
                  })),
                  subtotal,
                  tax,
                  total,
                  createdAt: new Date().toISOString(),
                  status: 'held',
                  registerId: params.registerId,
                };
                sessionStorage.setItem('heldTicket', JSON.stringify(ticket));
                alert(`Ticket ${ticketNumber} placed on hold`);
                clearCart();
              }}
              disabled={cart.length === 0}
              aria-label="Place current sale on hold"
            >
              Hold Sale
            </Button>

            <div className="space-y-2 pt-2">
              <div className="flex gap-2">
                <Button
                  variant={paymentMethod === 'card' ? 'primary' : 'outline'}
                  className="flex-1"
                  onClick={() => setPaymentMethod('card')}
                  aria-pressed={paymentMethod === 'card'}
                >
                  <CreditCard className="h-4 w-4 mr-2" aria-hidden="true" /> Card
                </Button>
                <Button
                  variant={paymentMethod === 'cash' ? 'primary' : 'outline'}
                  className="flex-1"
                  onClick={() => setPaymentMethod('cash')}
                  aria-pressed={paymentMethod === 'cash'}
                >
                  <Banknote className="h-4 w-4 mr-2" aria-hidden="true" /> Cash
                </Button>
              </div>

              {paymentMethod === 'cash' && (
                <div className="space-y-2">
                  <Input
                    label="Cash Received"
                    type="number"
                    placeholder="0.00"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="text-right text-lg"
                    inputMode="decimal"
                    aria-describedby={cashReceived ? "change-amount" : undefined}
                  />
                  {cashReceived && (
                    <div className="flex justify-between text-sm" id="change-amount" aria-live="polite">
                      <span className={change >= 0 ? 'text-success' : 'text-danger'}>Change</span>
                      <span className={change >= 0 ? 'text-success font-bold' : 'text-danger font-bold'}>
                        {formatCurrency(change)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <Button
                size="lg"
                className="w-full"
                onClick={handlePayment}
                disabled={cart.length === 0 || isProcessing || (paymentMethod === 'cash' && cashReceived.trim() !== '' && parseFloat(cashReceived) * 100 < total)}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    Processing...
                  </>
                ) : (
                  `Charge ${formatCurrency(total)}`
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}