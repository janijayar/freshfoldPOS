'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Loader2,
  AlertCircle,
  WifiOff,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  CreditCard,
  ShoppingBag,
  Clock,
  ArrowLeft,
  Edit,
  MoreHorizontal,
  Trash2,
  Award,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyTableState } from '@/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  loyaltyTier: string;
  loyaltyPoints: number;
  totalSpent: number;
  orderCount: number;
  avgOrderValue: number;
  lastVisit: string;
  firstVisit: string;
  createdAt: string;
  status: 'active' | 'inactive';
  marketingConsent: boolean;
  notes: string;
};

type Order = {
  id: string;
  date: string;
  total: number;
  items: number;
  status: string;
  paymentMethod: string;
};

const mockCustomer: Customer = {
  id: 'cust-1',
  name: 'Emma Thompson',
  email: 'emma.thompson@email.com',
  phone: '+1 (555) 123-4567',
  address: '123 Main Street',
  city: 'San Francisco',
  state: 'CA',
  zip: '94102',
  loyaltyTier: 'Gold',
  loyaltyPoints: 12450,
  totalSpent: 45670,
  orderCount: 87,
  avgOrderValue: 524.94,
  lastVisit: '2026-10-20',
  firstVisit: '2025-03-15',
  createdAt: '2025-03-15',
  status: 'active',
  marketingConsent: true,
  notes: 'Prefers oat milk. Birthday discount used annually.',
};

const mockOrders: Order[] = [
  { id: 'ord-1', date: '2026-10-20', total: 5670, items: 3, status: 'completed', paymentMethod: 'Card' },
  { id: 'ord-2', date: '2026-10-15', total: 3450, items: 2, status: 'completed', paymentMethod: 'Cash' },
  { id: 'ord-3', date: '2026-10-10', total: 7890, items: 4, status: 'completed', paymentMethod: 'Card' },
  { id: 'ord-4', date: '2026-10-05', total: 2340, items: 1, status: 'completed', paymentMethod: 'Card' },
  { id: 'ord-5', date: '2026-09-28', total: 4560, items: 2, status: 'completed', paymentMethod: 'Card' },
  { id: 'ord-6', date: '2026-09-20', total: 6780, items: 3, status: 'completed', paymentMethod: 'Cash' },
  { id: 'ord-7', date: '2026-09-15', total: 1230, items: 1, status: 'completed', paymentMethod: 'Card' },
  { id: 'ord-8', date: '2026-09-10', total: 8900, items: 5, status: 'completed', paymentMethod: 'Card' },
];

const loyaltyTiers = [
  { id: 'tier-1', name: 'Bronze', color: 'amber', minPoints: 0 },
  { id: 'tier-2', name: 'Silver', color: 'gray', minPoints: 1000 },
  { id: 'tier-3', name: 'Gold', color: 'yellow', minPoints: 5000 },
  { id: 'tier-4', name: 'Platinum', color: 'purple', minPoints: 20000 },
];

function CustomerDetailContent() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'loyalty'>('overview');

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setCustomer(mockCustomer);
      setOrders(mockOrders);
    } catch {
      setError('Failed to load customer. Please try again.');
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
  }, [customerId]);

  const TierBadge = ({ tier }: { tier: string }) => {
    const tierConfig = loyaltyTiers.find((t) => t.name === tier) || loyaltyTiers[0];
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

  const StatusBadge = ({ status }: { status: string }) => (
    <Badge variant={status === 'active' ? 'success' : 'secondary'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );

  const getNextTier = (currentTier: string, points: number) => {
    const currentIndex = loyaltyTiers.findIndex(t => t.name === currentTier);
    if (currentIndex === -1 || currentIndex === loyaltyTiers.length - 1) return null;
    const nextTier = loyaltyTiers[currentIndex + 1];
    const pointsNeeded = nextTier.minPoints - points;
    return { ...nextTier, pointsNeeded: Math.max(0, pointsNeeded) };
  };

  const nextTier = customer ? getNextTier(customer.loyaltyTier, customer.loyaltyPoints) : null;

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <h1 className="text-xl font-bold">Customer Details</h1>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
          <SkeletonCard className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <ErrorState
        variant={!isOnline ? 'network' : 'not-found'}
        onRetry={fetchData}
        onGoHome={() => router.push('/customers')}
        title={!isOnline ? 'You are offline' : 'Customer not found'}
        description={!isOnline ? 'Data will sync when connection is restored.' : 'The customer you are looking for does not exist.'}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{customer.name}</h1>
            <p className="text-sm text-text-muted">{customer.email}</p>
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
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Button variant="ghost" className="w-full justify-start" onClick={() => router.push(`/customers/${customer.id}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                  Edit Customer
                </Button>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-danger">
                <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                Delete Customer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-text-muted">Loyalty Tier</p>
                  <div className="flex items-center gap-2 mt-1">
                    <TierBadge tier={customer.loyaltyTier} />
                    <Badge variant="outline">
                      {customer.loyaltyPoints.toLocaleString()} pts
                    </Badge>
                  </div>
                  {nextTier && (
                    <p className="text-xs text-text-muted mt-2">
                      {nextTier.pointsNeeded} points to {nextTier.name}
                    </p>
                  )}
                </div>
                <div className="p-3 bg-accent-muted rounded-lg">
                  <Award className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-text-muted">Total Spent</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(customer.totalSpent)}</p>
                  <p className="text-xs text-text-muted mt-1">{customer.orderCount} orders • Avg {formatCurrency(customer.avgOrderValue)}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-text-muted">Last Visit</p>
                  <p className="text-2xl font-bold mt-1">{customer.lastVisit}</p>
                  <p className="text-xs text-text-muted mt-1">Member since {customer.firstVisit}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'overview' | 'orders' | 'loyalty')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Order History</TabsTrigger>
            <TabsTrigger value="loyalty">Loyalty</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-text-muted" aria-hidden="true" />
                    <div>
                      <p className="text-sm text-text-muted">Email</p>
                      <p>{customer.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-text-muted" aria-hidden="true" />
                    <div>
                      <p className="text-sm text-text-muted">Phone</p>
                      <p>{customer.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-text-muted" aria-hidden="true" />
                    <div>
                      <p className="text-sm text-text-muted">Address</p>
                      <p>{customer.address}, {customer.city}, {customer.state} {customer.zip}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-text-muted" aria-hidden="true" />
                    <div>
                      <p className="text-sm text-text-muted">Member Since</p>
                      <p>{customer.createdAt}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Marketing Consent</p>
                      <p className="text-sm text-text-muted">Email promotions and updates</p>
                    </div>
                    <Badge variant={customer.marketingConsent ? 'success' : 'secondary'}>
                      {customer.marketingConsent ? 'Subscribed' : 'Unsubscribed'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Status</p>
                      <p className="text-sm text-text-muted">Account status</p>
                    </div>
                    <StatusBadge status={customer.status} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {customer.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-muted">{customer.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                {orders.length === 0 ? (
                  <EmptyTableState
                    title="No orders yet"
                    description="This customer hasn't placed any orders."
                    icon={<ShoppingBag className="h-12 w-12 mx-auto text-text-muted/50" />}
                  />
                ) : (
                  <>
                    <ScrollArea>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Payment</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-mono text-sm">{order.id}</TableCell>
                              <TableCell>{order.date}</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(order.total)}</TableCell>
                              <TableCell>{order.items}</TableCell>
                              <TableCell>
                                <Badge variant={order.status === 'completed' ? 'success' : 'secondary'}>
                                  {order.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{order.paymentMethod}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loyalty" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Loyalty Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Current Tier: {customer.loyaltyTier}</p>
                    <p className="text-sm text-text-muted">{customer.loyaltyPoints.toLocaleString()} points</p>
                  </div>
                  <TierBadge tier={customer.loyaltyTier} />
                </div>

                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${Math.min(100, (customer.loyaltyPoints / (nextTier?.minPoints || 1)) * 100)}%` }}
                  />
                </div>

                {nextTier && (
                  <div className="flex items-center justify-between text-sm text-text-muted">
                    <span>Progress to {nextTier.name}</span>
                    <span>{customer.loyaltyPoints.toLocaleString()} / {nextTier.minPoints.toLocaleString()} points</span>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Tier Benefits</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {loyaltyTiers.map((tier) => (
                      <div
                        key={tier.id}
                        className={cn('p-3 rounded-lg border', tier.name === customer.loyaltyTier ? 'border-accent bg-accent-muted' : 'border-border')}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="h-4 w-4" style={{ color: tier.color === 'amber' ? '#f59e0b' : tier.color === 'gray' ? '#6b7280' : tier.color === 'yellow' ? '#eab308' : '#a855f7' }} />
                          <span className="font-medium">{tier.name}</span>
                          {tier.name === customer.loyaltyTier && <Badge variant="outline" className="ml-auto text-xs">Current</Badge>}
                        </div>
                        <p className="text-xs text-text-muted">
                          {tier.name === 'Bronze' && 'Welcome bonus, birthday reward'}
                          {tier.name === 'Silver' && '5% discount, free shipping, priority support'}
                          {tier.name === 'Gold' && '10% discount, free shipping, exclusive offers, early access'}
                          {tier.name === 'Platinum' && '15% discount, free shipping, VIP events, dedicated support'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CustomerDetailPageInner() {
  return (
    <Suspense fallback={
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <Button variant="ghost" size="icon" aria-label="Go back">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <h1 className="text-xl font-bold">Customer Details</h1>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
          <SkeletonCard className="h-64" />
        </div>
      </div>
    }>
      <CustomerDetailContent />
    </Suspense>
  );
}

export default function CustomerDetailPage() {
  return (
    <PermissionGuard permission="customers" action="view" fallback={<div />}>
      <CustomerDetailPageInner />
    </PermissionGuard>
  );
}