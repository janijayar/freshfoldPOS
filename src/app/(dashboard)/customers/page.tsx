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

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyTier: string;
  loyaltyPoints: number;
  totalSpent: number;
  orderCount: number;
  lastVisit: string;
  createdAt: string;
  status: 'active' | 'inactive';
};

const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Emma Thompson',
    email: 'emma.thompson@email.com',
    phone: '+1 (555) 123-4567',
    loyaltyTier: 'Gold',
    loyaltyPoints: 12450,
    totalSpent: 45670,
    orderCount: 87,
    lastVisit: '2026-10-20',
    createdAt: '2025-03-15',
    status: 'active',
  },
  {
    id: 'cust-2',
    name: 'Michael Chen',
    email: 'mchen@email.com',
    phone: '+1 (555) 234-5678',
    loyaltyTier: 'Platinum',
    loyaltyPoints: 28900,
    totalSpent: 112340,
    orderCount: 203,
    lastVisit: '2026-10-24',
    createdAt: '2024-11-02',
    status: 'active',
  },
  {
    id: 'cust-3',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+1 (555) 345-6789',
    loyaltyTier: 'Silver',
    loyaltyPoints: 4320,
    totalSpent: 15670,
    orderCount: 34,
    lastVisit: '2026-10-18',
    createdAt: '2025-07-22',
    status: 'active',
  },
  {
    id: 'cust-4',
    name: 'David Park',
    email: 'dpark@email.com',
    phone: '+1 (555) 456-7890',
    loyaltyTier: 'Bronze',
    loyaltyPoints: 890,
    totalSpent: 3450,
    orderCount: 8,
    lastVisit: '2026-09-30',
    createdAt: '2026-01-10',
    status: 'active',
  },
  {
    id: 'cust-5',
    name: 'Lisa Rodriguez',
    email: 'lisa.r@email.com',
    phone: '+1 (555) 567-8901',
    loyaltyTier: 'Gold',
    loyaltyPoints: 9870,
    totalSpent: 32100,
    orderCount: 56,
    lastVisit: '2026-10-22',
    createdAt: '2025-05-18',
    status: 'active',
  },
  {
    id: 'cust-6',
    name: 'James Wilson',
    email: 'jwilson@email.com',
    phone: '+1 (555) 678-9012',
    loyaltyTier: 'Silver',
    loyaltyPoints: 5670,
    totalSpent: 18900,
    orderCount: 42,
    lastVisit: '2026-10-15',
    createdAt: '2025-09-03',
    status: 'active',
  },
  {
    id: 'cust-7',
    name: 'Amanda Foster',
    email: 'afoster@email.com',
    phone: '+1 (555) 789-0123',
    loyaltyTier: 'Bronze',
    loyaltyPoints: 210,
    totalSpent: 890,
    orderCount: 2,
    lastVisit: '2026-08-14',
    createdAt: '2026-06-20',
    status: 'inactive',
  },
  {
    id: 'cust-8',
    name: 'Robert Kim',
    email: 'rkim@email.com',
    phone: '+1 (555) 890-1234',
    loyaltyTier: 'Platinum',
    loyaltyPoints: 35600,
    totalSpent: 156780,
    orderCount: 312,
    lastVisit: '2026-10-25',
    createdAt: '2024-08-14',
    status: 'active',
  },
];

const loyaltyTiers = [
  { id: 'tier-1', name: 'Bronze', color: 'amber' },
  { id: 'tier-2', name: 'Silver', color: 'gray' },
  { id: 'tier-3', name: 'Gold', color: 'yellow' },
  { id: 'tier-4', name: 'Platinum', color: 'purple' },
];

const locations = [
  { id: 'loc-1', name: 'Main Street Store' },
  { id: 'loc-2', name: 'Downtown Branch' },
  { id: 'loc-3', name: 'Warehouse' },
];

type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;

function CustomerListContent() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch {
      setError('Failed to load customers. Please try again.');
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

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key && current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const filteredCustomers = mockCustomers
    .filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery);
      const matchesTier = selectedTier === 'All' || c.loyaltyTier === selectedTier;
      const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;
      return matchesSearch && matchesTier && matchesStatus;
    });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
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

  const paginatedCustomers = sortedCustomers.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(sortedCustomers.length / pageSize);

  const SortIcon = ({ key }: { key: string }) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronDown className="h-4 w-4 text-text-muted" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 text-accent" /> : <ChevronDown className="h-4 w-4 text-accent" />;
  };

  const TierBadge = ({ tier }: { tier: string }) => {
    const tierConfig = loyaltyTiers.find((t) => t.name === tier) || loyaltyTiers[0];
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

  const StatusBadge = ({ status }: { status: string }) => (
    <Badge variant={status === 'active' ? 'success' : 'secondary'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Customers</h1>
          </div>
          <Button variant="primary">
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
        <Button variant="primary">
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
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
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
            <Select value={selectedLocation} onValueChange={(v) => { setSelectedLocation(v); setPage(1); }}>
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
        <Card>
          <CardContent className="p-0">
            {sortedCustomers.length === 0 ? (
              <EmptyTableState
                title="No customers found"
                description={searchQuery || selectedTier !== 'All' || selectedStatus !== 'All'
                  ? 'Try adjusting your search or filters.'
                  : 'No customers yet. Add your first customer to get started.'}
                icon={<Users className="h-12 w-12 mx-auto text-text-muted/50" />}
              />
            ) : (
              <>
                <ScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                          <div className="flex items-center gap-1">Customer <SortIcon key="name" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('loyaltyTier')}>
                          <div className="flex items-center gap-1">Tier <SortIcon key="loyaltyTier" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('totalSpent')}>
                          <div className="flex items-center gap-1">Total Spent <SortIcon key="totalSpent" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('orderCount')}>
                          <div className="flex items-center gap-1">Orders <SortIcon key="orderCount" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('loyaltyPoints')}>
                          <div className="flex items-center gap-1">Points <SortIcon key="loyaltyPoints" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('lastVisit')}>
                          <div className="flex items-center gap-1">Last Visit <SortIcon key="lastVisit" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('status')}>
                          <div className="flex items-center gap-1">Status <SortIcon key="status" /></div>
                        </TableHead>
                        <TableHead className="w-[60px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <div className="flex flex-wrap gap-2 text-xs text-text-muted">
                                <span className="flex items-center gap-1"><Mail className="h-3 w-3" aria-hidden="true" />{customer.email}</span>
                                <span className="flex items-center gap-1"><Phone className="h-3 w-3" aria-hidden="true" />{customer.phone}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><TierBadge tier={customer.loyaltyTier} /></TableCell>
                          <TableCell className="font-mono">{formatCurrency(customer.totalSpent)}</TableCell>
                          <TableCell>{customer.orderCount.toLocaleString()}</TableCell>
                          <TableCell className="font-mono">{customer.loyaltyPoints.toLocaleString()}</TableCell>
                          <TableCell>{customer.lastVisit}</TableCell>
                          <TableCell><StatusBadge status={customer.status} /></TableCell>
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
                                <DropdownMenuItem>
                                  <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
                                  Email Customer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-danger">
                                  <TrendingDown className="h-4 w-4 mr-2" aria-hidden="true" />
                                  Deactivate
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
                {totalPages > 1 && (
                  <TableFooter>
                    <div className="flex items-center justify-between py-2">
                      <p className="text-sm text-text-muted">
                        Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, sortedCustomers.length)} of {sortedCustomers.length} customers
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