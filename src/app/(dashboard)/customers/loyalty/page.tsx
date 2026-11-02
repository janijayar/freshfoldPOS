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
  Star,
  Award,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Filter,
  Download,
  RefreshCw,
  MoreHorizontal,
  Eye,
  BarChart2,
  ArrowUpRight,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyTableState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

type LoyaltyCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: string;
  points: number;
  totalSpent: number;
  orderCount: number;
  lastVisit: string;
  pointsToNextTier: number;
  nextTier: string | null;
  tierProgress: number;
};

const mockLoyaltyCustomers: LoyaltyCustomer[] = [
  {
    id: 'cust-1',
    name: 'Robert Kim',
    email: 'rkim@email.com',
    phone: '+1 (555) 890-1234',
    tier: 'Platinum',
    points: 35600,
    totalSpent: 156780,
    orderCount: 312,
    lastVisit: '2026-10-25',
    pointsToNextTier: 0,
    nextTier: null,
    tierProgress: 100,
  },
  {
    id: 'cust-2',
    name: 'Michael Chen',
    email: 'mchen@email.com',
    phone: '+1 (555) 234-5678',
    tier: 'Platinum',
    points: 28900,
    totalSpent: 112340,
    orderCount: 203,
    lastVisit: '2026-10-24',
    pointsToNextTier: 0,
    nextTier: null,
    tierProgress: 100,
  },
  {
    id: 'cust-3',
    name: 'Emma Thompson',
    email: 'emma.thompson@email.com',
    phone: '+1 (555) 123-4567',
    tier: 'Gold',
    points: 12450,
    totalSpent: 45670,
    orderCount: 87,
    lastVisit: '2026-10-20',
    pointsToNextTier: 7550,
    nextTier: 'Platinum',
    tierProgress: 62,
  },
  {
    id: 'cust-4',
    name: 'Lisa Rodriguez',
    email: 'lisa.r@email.com',
    phone: '+1 (555) 567-8901',
    tier: 'Gold',
    points: 9870,
    totalSpent: 32100,
    orderCount: 56,
    lastVisit: '2026-10-22',
    pointsToNextTier: 10130,
    nextTier: 'Platinum',
    tierProgress: 49,
  },
  {
    id: 'cust-5',
    name: 'James Wilson',
    email: 'jwilson@email.com',
    phone: '+1 (555) 678-9012',
    tier: 'Silver',
    points: 5670,
    totalSpent: 18900,
    orderCount: 42,
    lastVisit: '2026-10-15',
    pointsToNextTier: 4330,
    nextTier: 'Gold',
    tierProgress: 57,
  },
  {
    id: 'cust-6',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+1 (555) 345-6789',
    tier: 'Silver',
    points: 4320,
    totalSpent: 15670,
    orderCount: 34,
    lastVisit: '2026-10-18',
    pointsToNextTier: 5680,
    nextTier: 'Gold',
    tierProgress: 43,
  },
  {
    id: 'cust-7',
    name: 'David Park',
    email: 'dpark@email.com',
    phone: '+1 (555) 456-7890',
    tier: 'Bronze',
    points: 890,
    totalSpent: 3450,
    orderCount: 8,
    lastVisit: '2026-09-30',
    pointsToNextTier: 110,
    nextTier: 'Silver',
    tierProgress: 89,
  },
  {
    id: 'cust-8',
    name: 'Amanda Foster',
    email: 'afoster@email.com',
    phone: '+1 (555) 789-0123',
    tier: 'Bronze',
    points: 210,
    totalSpent: 890,
    orderCount: 2,
    lastVisit: '2026-08-14',
    pointsToNextTier: 790,
    nextTier: 'Silver',
    tierProgress: 21,
  },
];

const tiers = [
  { name: 'Bronze', color: 'amber', minPoints: 0, benefit: 'Welcome bonus, birthday reward' },
  { name: 'Silver', color: 'gray', minPoints: 1000, benefit: '5% discount, free shipping, priority support' },
  { name: 'Gold', color: 'yellow', minPoints: 5000, benefit: '10% discount, free shipping, exclusive offers, early access' },
  { name: 'Platinum', color: 'purple', minPoints: 20000, benefit: '15% discount, free shipping, VIP events, dedicated support' },
];

type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;

function CustomerLoyaltyContent() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('All');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch {
      setError('Failed to load loyalty data. Please try again.');
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

  const filteredCustomers = mockLoyaltyCustomers
    .filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier = selectedTier === 'All' || c.tier === selectedTier;
      return matchesSearch && matchesTier;
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

  const SortIcon = ({ key }: { key: string }) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronDown className="h-4 w-4 text-text-muted" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 text-accent" /> : <ChevronDown className="h-4 w-4 text-accent" />;
  };

  const TierBadge = ({ tier }: { tier: string }) => {
    const tierConfig = tiers.find((t) => t.name === tier) || tiers[0];
    const colors = {
      amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };
    return (
      <Badge variant="secondary" className={cn('gap-1', colors[tierConfig.color as keyof typeof colors])}>
        <Star className="h-3 w-3" aria-hidden="true" />
        {tier}
      </Badge>
    );
  };

  const StatCard = ({ title, value, icon: IconComp, subtitle }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    subtitle?: string;
  }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-text-muted">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
          </div>
          <div className="p-2 bg-accent-muted rounded-lg">
            <IconComp className="h-5 w-5 text-accent" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const totalCustomers = mockLoyaltyCustomers.length;
  const totalPoints = mockLoyaltyCustomers.reduce((sum, c) => sum + c.points, 0);
  const avgPoints = totalCustomers > 0 ? Math.round(totalPoints / totalCustomers) : 0;
  const platinumCount = mockLoyaltyCustomers.filter(c => c.tier === 'Platinum').length;

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Customer Loyalty</h1>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
          <SkeletonCard className="h-80" />
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
          <h1 className="text-xl font-bold">Customer Loyalty</h1>
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
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            Refresh
          </Button>
          <Button variant="primary">
            <Download className="h-4 w-4 mr-2" aria-hidden="true" />
            Export
          </Button>
        </div>
      </div>

      <div className="p-4 border-b border-border bg-surface space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" aria-hidden="true" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label="Search customers"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Tiers</SelectItem>
                {tiers.map((tier) => (
                  <SelectItem key={tier.name} value={tier.name}>{tier.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Members"
            value={totalCustomers.toLocaleString()}
            icon={Users}
            subtitle="Active loyalty members"
          />
          <StatCard
            title="Total Points"
            value={totalPoints.toLocaleString()}
            icon={Award}
            subtitle="Points across all members"
          />
          <StatCard
            title="Avg Points/Member"
            value={avgPoints.toLocaleString()}
            icon={Star}
            subtitle="Average loyalty points"
          />
          <StatCard
            title="Platinum Members"
            value={platinumCount.toLocaleString()}
            icon={TrendingUp}
            subtitle="Top tier members"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Loyalty Members</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {sortedCustomers.length === 0 ? (
              <EmptyTableState
                title="No members found"
                description={searchQuery || selectedTier !== 'All'
                  ? 'Try adjusting your search or filters.'
                  : 'No loyalty members yet.'}
                icon={<Users className="h-12 w-12 mx-auto text-text-muted/50" />}
              />
            ) : (
              <ScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                        <div className="flex items-center gap-1">Member <SortIcon key="name" /></div>
                      </TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('points')}>
                        <div className="flex items-center gap-1">Points <SortIcon key="points" /></div>
                      </TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('totalSpent')}>
                        <div className="flex items-center gap-1">Total Spent <SortIcon key="totalSpent" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('orderCount')}>
                        <div className="flex items-center gap-1">Orders <SortIcon key="orderCount" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('lastVisit')}>
                        <div className="flex items-center gap-1">Last Visit <SortIcon key="lastVisit" /></div>
                      </TableHead>
                      <TableHead className="w-[60px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-xs text-text-muted">{customer.email}</p>
                          </div>
                        </TableCell>
                        <TableCell><TierBadge tier={customer.tier} /></TableCell>
                        <TableCell className="font-mono">{customer.points.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="w-32">
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-accent rounded-full transition-all"
                                style={{ width: `${customer.tierProgress}%` }}
                              />
                            </div>
                            <p className="text-xs text-text-muted mt-1">
                              {customer.nextTier
                                ? `${customer.pointsToNextTier.toLocaleString()} pts to ${customer.nextTier}`
                                : 'Max tier reached'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{formatCurrency(customer.totalSpent)}</TableCell>
                        <TableCell>{customer.orderCount.toLocaleString()}</TableCell>
                        <TableCell>{customer.lastVisit}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" asChild>
                            <a href={`/customers/${customer.id}`}>
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tier Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {tiers.map((tier) => {
                const count = mockLoyaltyCustomers.filter(c => c.tier === tier.name).length;
                const percentage = totalCustomers > 0 ? Math.round((count / totalCustomers) * 100) : 0;
                const colors = {
                  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-200',
                  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-200',
                  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200',
                  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200',
                };
                return (
                  <div key={tier.name} className={cn('p-4 rounded-lg border', colors[tier.color as keyof typeof colors])}>
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-5 w-5" style={{
                        color: tier.color === 'amber' ? '#f59e0b' :
                               tier.color === 'gray' ? '#6b7280' :
                               tier.color === 'yellow' ? '#eab308' : '#a855f7'
                      }} />
                      <span className="font-semibold">{tier.name}</span>
                    </div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-text-muted/80">{percentage}% of members</p>
                    <p className="text-xs text-text-muted/60 mt-2">{tier.benefit}</p>
                    <div className="mt-2 h-2 bg-white/50 dark:bg-black/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: tier.color === 'amber' ? '#f59e0b' :
                                       tier.color === 'gray' ? '#6b7280' :
                                       tier.color === 'yellow' ? '#eab308' : '#a855f7'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CustomerLoyaltyPageInner() {
  return (
    <Suspense fallback={
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Customer Loyalty</h1>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
          <SkeletonCard className="h-80" />
        </div>
      </div>
    }>
      <CustomerLoyaltyContent />
    </Suspense>
  );
}

export default function CustomerLoyaltyPage() {
  return (
    <PermissionGuard permission="customers" action="view">
      <CustomerLoyaltyPageInner />
    </PermissionGuard>
  );
}