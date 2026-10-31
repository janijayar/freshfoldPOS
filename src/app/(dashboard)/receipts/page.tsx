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
  Search,
  Filter,
  Calendar,
  Download,
  MoreHorizontal,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton, SkeletonTable } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyTableState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useReceipts } from '@/hooks/useApi';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

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
  items: any[];
  payments: any[];
  createdAt: string;
  printedAt: string | null;
};

type SortConfig = { key: keyof Receipt; direction: 'asc' | 'desc' } | null;

function ReceiptListPageInner() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const { data: receiptsData, loading, error, mutate: refetchReceipts } = useReceipts({
    ...(searchQuery && { search: searchQuery }),
    ...(selectedStatus !== 'All' && { status: selectedStatus }),
    ...(dateRange.from && { fromDate: dateRange.from }),
    ...(dateRange.to && { toDate: dateRange.to }),
  });

  const receipts = receiptsData?.receipts || [];

  useEffect(() => {
    const handleOnline = () => window.dispatchEvent(new Event('online'));
    const handleOffline = () => window.dispatchEvent(new Event('offline'));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isLoading = loading;
  const isOnline = !error;
  const errorMessage = error?.message || null;

  const handleSort = (key: keyof Receipt) => {
    setSortConfig((current) => {
      if (current?.key === key && current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const filteredReceipts = receipts
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const paginatedReceipts = filteredReceipts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);

  const handleView = (receipt: Receipt) => {
    router.push(`/receipts/${receipt.id}`);
  };

  const handlePrint = async (receipt: Receipt) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      window.print();
    } catch {
      alert('Failed to print');
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'success' | 'danger' | 'secondary' | 'warning'; label: string }> = {
      completed: { variant: 'success', label: 'Completed' },
      refunded: { variant: 'danger', label: 'Refunded' },
      voided: { variant: 'secondary', label: 'Voided' },
    };
    const c = config[status] || config.completed;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const SortIcon = ({ key }: { key: keyof Receipt }) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowLeft className="h-4 w-4 text-text-muted" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 text-accent" /> : <ChevronDown className="h-4 w-4 text-accent" />;
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Receipts</h1>
        </div>
        <div className="flex-1 p-4">
          <SkeletonTable rows={5} columns={6} />
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <ErrorState
        variant={!isOnline ? 'network' : 'server'}
        onRetry={() => refetchReceipts()}
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
          <h1 className="text-xl font-bold">Receipts</h1>
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
          <Button variant="outline" onClick={() => alert('PDF export would start here')}>
            <Download className="h-4 w-4 mr-2" aria-hidden="true" />
            Export
          </Button>
        </div>
      </div>

      <div className="p-4 border-b border-border bg-surface">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" aria-hidden="true" />
            <Input
              placeholder="Search receipt #, order #, customer..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-10"
              aria-label="Search receipts"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="voided">Voided</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <Input
              type="date"
              value={dateRange.from}
              onChange={(e) => { setDateRange(prev => ({ ...prev, from: e.target.value })); setCurrentPage(1); }}
              className="w-[160px]"
              aria-label="From date"
            />
            <span className="text-text-muted">to</span>
            <Input
              type="date"
              value={dateRange.to}
              onChange={(e) => { setDateRange(prev => ({ ...prev, to: e.target.value })); setCurrentPage(1); }}
              className="w-[160px]"
              aria-label="To date"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {filteredReceipts.length === 0 ? (
          <EmptyTableState
            title={searchQuery || selectedStatus !== 'All' || dateRange.from || dateRange.to ? 'No receipts match' : 'No receipts yet'}
            description={searchQuery || selectedStatus !== 'All' || dateRange.from || dateRange.to
              ? 'Try adjusting your search or filters.'
              : 'Receipts will appear here after transactions are completed.'}
            icon={<Download className="h-12 w-12 mx-auto text-text-muted/50" />}
          />
        ) : (
          <ScrollArea className="h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('receiptNumber')}>
                    <div className="flex items-center gap-1">
                      Receipt #
                      <SortIcon key="receiptNumber" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('createdAt')}>
                    <div className="flex items-center gap-1">
                      Date
                      <SortIcon key="createdAt" />
                    </div>
                  </TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Register</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('totalCents')}>
                    <div className="flex items-center gap-1">
                      Total
                      <SortIcon key="totalCents" />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedReceipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-mono font-medium">{receipt.receiptNumber}</TableCell>
                    <TableCell className="text-text-muted">{new Date(receipt.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{receipt.locationName}</TableCell>
                    <TableCell className="text-text-muted">{receipt.registerName}</TableCell>
                    <TableCell className="font-mono tabular-nums font-medium">{formatCurrency(receipt.totalCents)}</TableCell>
                    <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                    <TableCell className="text-text-muted">{receipt.userName}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Actions for ${receipt.receiptNumber}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleView(receipt)} aria-label="View receipt">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrint(receipt)} aria-label="Print receipt">
                            <Download className="h-4 w-4 mr-2" />
                            Print Receipt
                          </DropdownMenuItem>
                          {receipt.status === 'completed' && (
                            <DropdownMenuSeparator />
                          )}
                          {receipt.status === 'completed' && (
                            <DropdownMenuItem className="text-danger" onClick={() => alert('Refund functionality would open here')}>
                              <ArrowLeft className="h-4 w-4 mr-2" />
                              Refund Order
                            </DropdownMenuItem>
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
                          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredReceipts.length)} of {filteredReceipts.length} receipts
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
    </div>
  );
}

export default function ReceiptListPage() {
  return (
    <PermissionGuard permission="receipts" action="view" fallback={<div />}>
      <Suspense fallback={
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
            <h1 className="text-xl font-bold">Receipts</h1>
          </div>
          <div className="flex-1 p-4">
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden="true" />
            </div>
          </div>
        </div>
      }>
        <ReceiptListPageInner />
      </Suspense>
    </PermissionGuard>
  );
}