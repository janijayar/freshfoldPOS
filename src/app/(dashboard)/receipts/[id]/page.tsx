'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  WifiOff,
  DollarSign,
  CreditCard,
  Receipt,
  Printer,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Package,
  Tag,
  User,
  Clock,
  MapPin,
  Phone,
  Mail,
  Download,
  MoreHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useReceipt } from '@/hooks/useApi';

type Receipt = {
  id: string;
  receiptNumber: string;
  orderId: string;
  locationId: string;
  locationName: string;
  registerId: string;
  registerName: string;
  userId: string;
  userName: string;
  customerId: string | null;
  customerName: string | null;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  currencySymbol: string;
  status: 'completed' | 'refunded' | 'voided';
  items: ReceiptItem[];
  payments: ReceiptPayment[];
  createdAt: string;
  printedAt: string | null;
};

type ReceiptItem = {
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

type ReceiptPayment = {
  id: string;
  method: 'cash' | 'card' | 'gift_card' | 'split';
  amountCents: number;
  cardDetails: { last4: string; brand: string } | null;
  cashReceivedCents: number | null;
  changeCents: number | null;
  status: 'completed' | 'failed' | 'refunded';
};

function ReceiptContent() {
  const router = useRouter();
  const params = useParams();
  const receiptId = params?.id as string;

  const { data: receiptData, loading, error, mutate: refetchReceipt } = useReceipt(receiptId);
  const [isOnline, setIsOnline] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  const receipt = receiptData?.receipt;

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

  const isLoading = loading;
  const errorMessage = error?.message || null;
  const isNotFound = errorMessage?.includes('404') || errorMessage?.includes('not found');

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownload = async () => {
    // In real app, would generate PDF
    alert('PDF download would start here');
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'success' | 'danger' | 'secondary'; label: string }> = {
      completed: { variant: 'success', label: 'Completed' },
      refunded: { variant: 'danger', label: 'Refunded' },
      voided: { variant: 'secondary', label: 'Voided' },
    };
    const c = config[status] || config.completed;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <DollarSign className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'gift_card': return <Tag className="h-4 w-4" />;
      case 'split': return <MoreHorizontal className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Receipt Detail</h1>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (errorMessage || !receipt) {
    return (
      <ErrorState
        variant={!isOnline ? 'network' : isNotFound ? 'not-found' : 'server'}
        onRetry={() => refetchReceipt()}
        onGoHome={() => router.push('/reports/sales')}
        title={!isOnline ? 'You are offline' : isNotFound ? 'Receipt not found' : undefined}
        description={!isOnline ? 'Data will sync when connection is restored.' : isNotFound ? 'The receipt you are looking for does not exist.' : undefined}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Receipt Detail</h1>
            <p className="text-sm text-text-muted">{receipt.receiptNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" aria-label="More actions">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handlePrint} disabled={isPrinting}>
                <Printer className="h-4 w-4 mr-2" />
                {isPrinting ? 'Printing...' : 'Print Receipt'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
              {receipt.status === 'completed' && (
                <DropdownMenuSeparator />
              )}
              {receipt.status === 'completed' && (
                <DropdownMenuItem className="text-danger" onClick={() => alert('Refund functionality would open here')}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Refund Order
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-muted text-accent mb-3">
                  <Receipt className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold">{receipt.locationName}</h2>
                <p className="text-text-muted">{receipt.registerName} • {new Date(receipt.createdAt).toLocaleDateString()} {new Date(receipt.createdAt).toLocaleTimeString()}</p>
                <p className="text-text-muted mt-1">Served by {receipt.userName}</p>
                {receipt.customerName && (
                  <p className="text-text-muted mt-1 flex items-center justify-center gap-1">
                    <User className="h-3 w-3" /> {receipt.customerName}
                  </p>
                )}
              </div>

              <div className="border-t border-b py-4 mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-muted">Receipt #</span>
                  <span className="font-mono font-medium">{receipt.receiptNumber}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-muted">Order #</span>
                  <span className="font-mono font-medium">{receipt.orderId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Status</span>
                  <span>{getStatusBadge(receipt.status)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-sm text-text-muted uppercase tracking-wider">Items</h3>
                <div className="space-y-2">
                  {receipt.items.map((item: ReceiptItem) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-surface rounded-lg border">
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-text-muted">{item.productSku} • Qty: {item.quantity} × {formatCurrency(item.unitPriceCents)}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        {item.discountCents > 0 && (
                          <span className="text-danger text-sm">−{formatCurrency(item.discountCents)}</span>
                        )}
                        <span className="font-mono tabular-nums font-medium">{formatCurrency(item.totalCents)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Subtotal</span>
                  <span className="font-mono tabular-nums">{formatCurrency(receipt.subtotalCents)}</span>
                </div>
                {receipt.discountCents > 0 && (
                  <div className="flex justify-between text-sm text-danger">
                    <span>Discount</span>
                    <span className="font-mono tabular-nums">−{formatCurrency(receipt.discountCents)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Tax</span>
                  <span className="font-mono tabular-nums">{formatCurrency(receipt.taxCents)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="font-mono tabular-nums">{formatCurrency(receipt.totalCents)}</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h3 className="font-medium text-sm text-text-muted uppercase tracking-wider">Payments</h3>
                <div className="space-y-2">
                  {receipt.payments.map((payment: ReceiptPayment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-surface rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent-muted rounded-lg text-accent">
                          {getPaymentMethodIcon(payment.method)}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{payment.method.replace('_', ' ')}</p>
                          {payment.cardDetails && (
                            <p className="text-sm text-text-muted">•••• {payment.cardDetails.last4} ({payment.cardDetails.brand})</p>
                          )}
                          {payment.method === 'cash' && payment.cashReceivedCents && (
                            <p className="text-sm text-text-muted">Received: {formatCurrency(payment.cashReceivedCents)} • Change: {formatCurrency(payment.changeCents || 0)}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono tabular-nums font-medium">{formatCurrency(payment.amountCents)}</p>
                        <p className="text-xs text-text-muted capitalize">{payment.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {receipt.printedAt && (
                <div className="border-t pt-4 text-center text-sm text-text-muted">
                  <p>Printed on {new Date(receipt.printedAt).toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-text-muted">
                  <MapPin className="h-4 w-4" />
                  <span>123 Main Street, San Francisco, CA 94102</span>
                </div>
                <div className="flex items-center gap-2 text-text-muted">
                  <Phone className="h-4 w-4" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-2 text-text-muted">
                  <Mail className="h-4 w-4" />
                  <span>main@freshfold.com</span>
                </div>
                <div className="flex items-center gap-2 text-text-muted">
                  <Clock className="h-4 w-4" />
                  <span>Mon-Fri 7am-9pm • Sat 8am-10pm • Sun 9am-8pm</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ReceiptDetailPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Receipt Detail</h1>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    }>
      <ReceiptContent />
    </Suspense>
  );
}