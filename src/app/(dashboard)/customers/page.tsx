'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Loader2,
  AlertCircle,
  WifiOff,
  Users,
  Search,
  Filter,
  Download,
  RefreshCw,
  MoreHorizontal,
  Eye,
  TrendingUp,
  TrendingDown,
  Star,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Plus,
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
import { useCustomers } from '@/hooks/useApi';

type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  loyaltyTier: string;
  loyaltyPoints: number;
  totalSpent: number;
  visitCount: number;
  lastVisitAt: string | null;
  createdAt: string;
  isActive: boolean;
};

const loyaltyTiers = [
  { id: 'tier-1', name: 'Bronze', color: 'amber' },
  { id: 'tier-2', name: 'Silver', color: 'gray' },
  { id: 'tier-3', name: 'Gold', color: 'yellow' },
  { id: 'tier-4', name: 'Platinum', color: 'purple' },
];

type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;

function CustomerListContent() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const params: Record<string, string> = {};
  const [searchQuerySubmitted, setSearchQuerySubmitted] = useState('');
  
  if (searchQuery) params.search = searchQuery;
  if (selectedTier !== 'All') params.loyaltyTier = selectedTier.toLowerCase();
  if (selectedStatus !== 'All') params.status = selectedStatus.toLowerCase();

  const { data, loading, error, mutate: refetch } = useCustomers(params);

  const customers = data?.customers || [];
  const isLoading = loading;
  const isOnline = !error;
  const fetchError = error?.message || null;

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key && current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const name = `${c.firstName} ${c.lastName}`;
        const matchesSearch = name.toLowerCase().includes(searchQuerySubmitted.toLowerCase()) ||
          (c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
          (c.phone?.includes(searchQuerySubmitted) ?? false);
        const matchesTier = selectedTier === 'All' || c.loyaltyTier === selectedTier;
        const matchesStatus = selectedStatus === 'All' || (c.isActive ? 'active' : 'inactive') === selectedStatus;
        return matchesSearch && matchesTier && matchesStatus;
      })
      .sort((a, b) => {
        if (!sortConfig) return 0;
        const aVal = (a as any)[sortConfig.key];
        const bVal = (b as any)[sortConfig.key];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bVal == null) return sortConfig.direction === 'asc' ? 1 : -1;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortConfig.direction === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [customers, searchQuery, selectedTier, selectedStatus, sortConfig]);

  const paginatedCustomers = useMemo(() => {
    return filteredCustomers.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredCustomers, page, pageSize]);

  const totalPages = Math.ceil(filteredCustomers.length / pageSize);

  const handleCreate = () => {
    router.push('/customers/new');
  };

  const handleView = (customer: Customer) => {
    router.push(`/customers/${customer.id}`);
  };

  const handleEdit = (customer: Customer) => {
    router.push(`/customers/${customer.id}/edit`);
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Customers</h1>
          </div>
          <Button variant="primary" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Add Customer
          </Button>
        </div>
        <div className="p-4 border-b border-border bg-surface">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" aria-hidden="true" />
              <Input
                placeholder="Search customers..."
                className="pl-10"
                disabled
              />
            </div>
          </div>
        </div>
        <div className="flex-1 p-4">
          <SkeletonTable rows={5} columns={7} />
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <ErrorState
        variant={!isOnline ? 'network' : 'server'}
        onRetry={() => refetch()}
        onGoHome={() => router.push('/dashboard')}
        title={!isOnline ? 'You are offline' : undefined}
        description={!isOnline ? 'Data will sync when connection is restored.' : undefined}
      />
    );
  }

  const SortIcon = ({ key }: { key: string }) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronDown className="h-4 w-4 text-text-muted" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 text-accent" /> : <ChevronDown className="h-4 w-4 text-accent" />;
  };

  const TierBadge = ({ tier }: { tier: string }) => {
    const tierConfig = loyaltyTiers.find((t) => t.name.toLowerCase() === tier.toLowerCase()) || loyaltyTiers[0];
    const colors = {
      amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };
    return (
      <Badge variant="secondary" className={colors[tierConfig.color as keyof typeof colors]}>
        <Star className="h-3 w-3 mr-1" aria-hidden="true" />
        {tier}
      </Badge>
    );
  };

  const StatusBadge = ({ isActive }: { isActive: boolean }) => (
    <Badge variant={isActive ? 'success' : 'secondary'}>
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Customers</h1>
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
        <Button variant="primary" onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Add Customer
        </Button>
      </div>

      <div className="p-4 border-b border-border bg-surface space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" aria-hidden="true" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setSearchQuerySubmitted((e.target as HTMLInputElement).value) && setPage(1)}
              className="pl-10"
              aria-label="Search customers"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <Select value={selectedTier} onValueChange={(v) => { setSelectedTier(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Tiers</SelectItem>
                {loyaltyTiers.map((tier) => (
                  <SelectItem key={tier.id} value={tier.name}>{tier.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={(v) => { setSelectedStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Card>
          <CardContent className="p-0">
            {filteredCustomers.length === 0 ? (
              <EmptyTableState
                title={searchQuery || selectedTier !== 'All' || selectedStatus !== 'All' ? 'No customers found' : 'No customers yet'}
                description={searchQuery || selectedTier !== 'All' || selectedStatus !== 'All'
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by adding your first customer.'}
                icon={<Users className="h-12 w-12 mx-auto text-text-muted/50" />}
                action={{
                  label: 'Add Customer',
                  onClick: handleCreate,
                }}
              />
            ) : (
              <>
                <ScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('firstName')}>
                          <div className="flex items-center gap-1">Customer <SortIcon key="firstName" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('loyaltyTier')}>
                          <div className="flex items-center gap-1">Tier <SortIcon key="loyaltyTier" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('totalSpent')}>
                          <div className="flex items-center gap-1">Total Spent <SortIcon key="totalSpent" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('visitCount')}>
                          <div className="flex items-center gap-1">Visits <SortIcon key="visitCount" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('loyaltyPoints')}>
                          <div className="flex items-center gap-1">Points <SortIcon key="loyaltyPoints" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('lastVisitAt')}>
                          <div className="flex items-center gap-1">Last Visit <SortIcon key="lastVisitAt" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('isActive')}>
                          <div className="flex items-center gap-1">Status <SortIcon key="isActive" /></div>
                        </TableHead>
                        <TableHead className="w-[60px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCustomers.map((customer) => {
                        const name = `${customer.firstName} ${customer.lastName}`;
                        return (
                          <TableRow key={customer.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{name}</p>
                                <div className="flex flex-wrap gap-2 text-xs text-text-muted">
                                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" aria-hidden="true" />{customer.email || '—'}</span>
                                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" aria-hidden="true" />{customer.phone || '—'}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell><TierBadge tier={customer.loyaltyTier} /></TableCell>
                            <TableCell className="font-mono">{formatCurrency(customer.totalSpent)}</TableCell>
                            <TableCell>{customer.visitCount.toLocaleString()}</TableCell>
                            <TableCell className="font-mono">{customer.loyaltyPoints.toLocaleString()}</TableCell>
                            <TableCell>{customer.lastVisitAt ? new Date(customer.lastVisitAt).toLocaleDateString() : '—'}</TableCell>
                            <TableCell><StatusBadge isActive={customer.isActive} /></TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" aria-label="More actions">
                                    <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <a href={`/customers/${customer.id}`}>
                                      <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                                      View Details
                                    </a>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEdit(customer)}>
                                    <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-danger" onClick={() => handleEdit(customer)}>
                                    <TrendingDown className="h-4 w-4 mr-2" aria-hidden="true" />
                                    {customer.isActive ? 'Deactivate' : 'Activate'}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    {totalPages > 1 && (
                      <TableFooter>
                        <div className="flex items-center justify-between py-2">
                          <p className="text-sm text-text-muted">
                            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredCustomers.length)} of {filteredCustomers.length} customers
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPage(p => Math.max(1, p - 1))}
                              disabled={page === 1}
                              aria-label="Previous page"
                            >
                              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <span className="text-sm text-text-muted w-20 text-center">
                              Page {page} of {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                              disabled={page === totalPages}
                              aria-label="Next page"
                            >
                              <ChevronRight className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </div>
                      </TableFooter>
                    )}
                  </Table>
                </ScrollArea>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CustomerListPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Customers</h1>
        </div>
        <div className="flex-1 p-4">
          <SkeletonTable rows={5} columns={7} />
        </div>
      </div>
    }>
      <CustomerListContent />
    </Suspense>
  );
}
