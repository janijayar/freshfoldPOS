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
  DollarSign,
  Package,
  Users,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  MoreHorizontal,
  Eye,
  TrendingUp,
  TrendingDown,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
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
import { PermissionGuard } from '@/components/auth/PermissionGuard';

type ProductReport = {
  id: string;
  sku: string;
  name: string;
  category: string;
  sales: number;
  orders: number;
  quantity: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  avgPrice: number;
};

const mockProducts: ProductReport[] = [
  {
    id: 'prod-1',
    sku: 'BEV-001',
    name: 'Organic Green Tea',
    category: 'Beverages',
    sales: 125430,
    orders: 420,
    quantity: 850,
    revenue: 125430,
    cost: 62715,
    profit: 62715,
    margin: 50.0,
    avgPrice: 147.56,
  },
  {
    id: 'prod-2',
    sku: 'BEV-002',
    name: 'Cold Brew Coffee',
    category: 'Beverages',
    sales: 98760,
    orders: 310,
    quantity: 620,
    revenue: 98760,
    cost: 39504,
    profit: 59256,
    margin: 60.0,
    avgPrice: 159.29,
  },
  {
    id: 'prod-3',
    sku: 'FOOD-001',
    name: 'Avocado Toast',
    category: 'Food',
    sales: 87650,
    orders: 280,
    quantity: 420,
    revenue: 87650,
    cost: 35060,
    profit: 52590,
    margin: 60.0,
    avgPrice: 208.69,
  },
  {
    id: 'prod-4',
    sku: 'FOOD-002',
    name: 'Blueberry Muffin',
    category: 'Food',
    sales: 65430,
    orders: 350,
    quantity: 580,
    revenue: 65430,
    cost: 26172,
    profit: 39258,
    margin: 60.0,
    avgPrice: 112.81,
  },
  {
    id: 'prod-5',
    sku: 'MERCH-001',
    name: 'Branded Tote Bag',
    category: 'Merchandise',
    sales: 45670,
    orders: 95,
    quantity: 110,
    revenue: 45670,
    cost: 15984,
    profit: 29686,
    margin: 65.0,
    avgPrice: 415.18,
  },
  {
    id: 'prod-6',
    sku: 'BEV-003',
    name: 'Sparkling Water',
    category: 'Beverages',
    sales: 43210,
    orders: 210,
    quantity: 420,
    revenue: 43210,
    cost: 17284,
    profit: 25926,
    margin: 60.0,
    avgPrice: 102.88,
  },
  {
    id: 'prod-7',
    sku: 'FOOD-003',
    name: 'Croissant',
    category: 'Food',
    sales: 38900,
    orders: 180,
    quantity: 250,
    revenue: 38900,
    cost: 15560,
    profit: 23340,
    margin: 60.0,
    avgPrice: 155.60,
  },
  {
    id: 'prod-8',
    sku: 'MERCH-002',
    name: 'Ceramic Mug',
    category: 'Merchandise',
    sales: 29800,
    orders: 75,
    quantity: 85,
    revenue: 29800,
    cost: 10430,
    profit: 19370,
    margin: 65.0,
    avgPrice: 350.59,
  },
  {
    id: 'prod-9',
    sku: 'BEV-004',
    name: 'Iced Latte',
    category: 'Beverages',
    sales: 27650,
    orders: 120,
    quantity: 150,
    revenue: 27650,
    cost: 11060,
    profit: 16590,
    margin: 60.0,
    avgPrice: 184.33,
  },
  {
    id: 'prod-10',
    sku: 'FOOD-004',
    name: 'Granola Bowl',
    category: 'Food',
    sales: 24500,
    orders: 85,
    quantity: 105,
    revenue: 24500,
    cost: 9800,
    profit: 14700,
    margin: 60.0,
    avgPrice: 233.33,
  },
];

const categories = [
  { id: 'cat-1', name: 'Beverages' },
  { id: 'cat-2', name: 'Food' },
  { id: 'cat-3', name: 'Merchandise' },
  { id: 'cat-4', name: 'Gift Cards' },
];

const locations = [
  { id: 'loc-1', name: 'Main Street Store' },
  { id: 'loc-2', name: 'Downtown Branch' },
  { id: 'loc-3', name: 'Warehouse' },
];

const dateRanges = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'custom', label: 'Custom Range' },
];

type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;

type ViewMode = 'overview' | 'by_category' | 'by_location';

function ProductReportsPageInner() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [dateRange, setDateRange] = useState('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch {
      setError('Failed to load product data. Please try again.');
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

  const filteredProducts = mockProducts
    .filter((p) => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesCategory;
    });

  const SortIcon = ({ key }: { key: string }) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronDown className="h-4 w-4 text-text-muted" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 text-accent" /> : <ChevronDown className="h-4 w-4 text-accent" />;
  };

  const StatCard = ({ title, value, icon: IconComp, trend, subtitle }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    trend?: { direction: 'up' | 'down' | 'neutral'; percentage: number; label?: string };
    subtitle?: string;
  }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-text-muted">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trend.direction === 'up' && <TrendingUp className="h-4 w-4 text-success" />}
                {trend.direction === 'down' && <TrendingDown className="h-4 w-4 text-danger" />}
                {trend.direction === 'neutral' && <span className="h-4 w-4 text-text-muted">–</span>}
                <span className={cn('text-sm font-medium', trend.direction === 'up' ? 'text-success' : trend.direction === 'down' ? 'text-danger' : 'text-text-muted')}>
                  {trend.percentage}% {trend.label}
                </span>
              </div>
            )}
            {subtitle && !trend && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
          </div>
          <div className="p-2 bg-accent-muted rounded-lg">
            <IconComp className="h-5 w-5 text-accent" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderOverview = () => {
    const totalRevenue = filteredProducts.reduce((sum, p) => sum + p.revenue, 0);
    const totalProfit = filteredProducts.reduce((sum, p) => sum + p.profit, 0);
    const totalUnits = filteredProducts.reduce((sum, p) => sum + p.quantity, 0);
    const avgMargin = filteredProducts.length > 0
      ? filteredProducts.reduce((sum, p) => sum + p.margin, 0) / filteredProducts.length
      : 0;

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            icon={DollarSign}
            trend={{ direction: 'up', percentage: 12.5, label: 'vs last period' }}
          />
          <StatCard
            title="Total Profit"
            value={formatCurrency(totalProfit)}
            icon={ArrowUpRight}
            trend={{ direction: 'up', percentage: 8.3, label: 'vs last period' }}
          />
          <StatCard
            title="Units Sold"
            value={totalUnits.toLocaleString()}
            icon={Package}
            trend={{ direction: 'up', percentage: 5.2, label: 'vs last period' }}
          />
          <StatCard
            title="Avg Margin"
            value={`${avgMargin.toFixed(1)}%`}
            icon={BarChart2}
            trend={{ direction: 'neutral', percentage: 0.1, label: 'vs last period' }}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Products by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Units</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...filteredProducts].sort((a, b) => b.revenue - a.revenue).slice(0, 5).map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-text-muted">{product.sku} • {product.category}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(product.revenue)}</TableCell>
                      <TableCell className="text-right">{product.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{product.margin.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTableView = () => {
    const getData = () => {
      switch (viewMode) {
        case 'by_category': {
          const byCategory = new Map<string, { sales: number; orders: number; quantity: number; revenue: number; profit: number; count: number }>();
          filteredProducts.forEach((p) => {
            const existing = byCategory.get(p.category) || { sales: 0, orders: 0, quantity: 0, revenue: 0, profit: 0, count: 0 };
            byCategory.set(p.category, {
              sales: existing.sales + p.sales,
              orders: existing.orders + p.orders,
              quantity: existing.quantity + p.quantity,
              revenue: existing.revenue + p.revenue,
              profit: existing.profit + p.profit,
              count: existing.count + 1,
            });
          });
          const totalSales = filteredProducts.reduce((sum, p) => sum + p.sales, 0);
          return Array.from(byCategory.entries()).map(([category, data]) => ({
            id: category,
            name: category,
            sales: data.sales,
            orders: data.orders,
            quantity: data.quantity,
            revenue: data.revenue,
            profit: data.profit,
            percentage: totalSales > 0 ? Math.round((data.sales / totalSales) * 100) : 0,
          }));
        }
        case 'by_location': {
          const byLocation = new Map<string, { sales: number; orders: number; revenue: number }>();
          locations.forEach((loc) => {
            byLocation.set(loc.id, { sales: 0, orders: 0, revenue: 0 });
          });
          filteredProducts.forEach((p) => {
            locations.forEach((loc) => {
              const existing = byLocation.get(loc.id)!;
              const factor = 1 / locations.length;
              byLocation.set(loc.id, {
                sales: existing.sales + Math.round(p.sales * factor),
                orders: existing.orders + Math.round(p.orders * factor),
                revenue: existing.revenue + Math.round(p.revenue * factor),
              });
            });
          });
          return Array.from(byLocation.entries()).map(([locationId, data]) => ({
            id: locationId,
            name: locations.find((l) => l.id === locationId)?.name || locationId,
            sales: data.sales,
            orders: data.orders,
            revenue: data.revenue,
          }));
        }
        default:
          return filteredProducts.map((p) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            category: p.category,
            sales: p.sales,
            orders: p.orders,
            quantity: p.quantity,
            revenue: p.revenue,
            profit: p.profit,
            margin: p.margin,
            avgPrice: p.avgPrice,
          }));
      }
    };

    const data = getData();
    const sortedData = [...data].sort((a, b) => {
      if (!sortConfig) return 0;
      const aVal = (a as any)[sortConfig.key];
      const bVal = (b as any)[sortConfig.key];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bVal == null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    if (data.length === 0) {
      return (
        <EmptyTableState
          title="No products match"
          description="Try adjusting your filters or date range."
          icon={<Package className="h-12 w-12 mx-auto text-text-muted/50" />}
        />
      );
    }

    const columns = viewMode === 'by_category'
      ? [
          { key: 'name', label: 'Category' },
          { key: 'sales', label: 'Sales', format: (v: number) => formatCurrency(v) },
          { key: 'orders', label: 'Orders' },
          { key: 'quantity', label: 'Units Sold' },
          { key: 'revenue', label: 'Revenue', format: (v: number) => formatCurrency(v) },
          { key: 'profit', label: 'Profit', format: (v: number) => formatCurrency(v) },
          { key: 'percentage', label: '% of Total', format: (v: number) => `${v}%` },
        ]
      : viewMode === 'by_location'
      ? [
          { key: 'name', label: 'Location' },
          { key: 'sales', label: 'Sales', format: (v: number) => formatCurrency(v) },
          { key: 'orders', label: 'Orders' },
          { key: 'revenue', label: 'Revenue', format: (v: number) => formatCurrency(v) },
        ]
      : [
          { key: 'sku', label: 'SKU' },
          { key: 'name', label: 'Product' },
          { key: 'category', label: 'Category' },
          { key: 'sales', label: 'Sales', format: (v: number) => formatCurrency(v) },
          { key: 'orders', label: 'Orders' },
          { key: 'quantity', label: 'Units' },
          { key: 'revenue', label: 'Revenue', format: (v: number) => formatCurrency(v) },
          { key: 'profit', label: 'Profit', format: (v: number) => formatCurrency(v) },
          { key: 'margin', label: 'Margin', format: (v: number) => `${v}%` },
        ];

    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.key} className="cursor-pointer select-none" onClick={() => handleSort(col.key)}>
                      <div className="flex items-center gap-1">
                        {col.label} <SortIcon key={col.key} />
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((row) => (
                  <TableRow key={row.id}>
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        {col.format ? col.format((row as any)[col.key]) : (row as any)[col.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Product Reports</h1>
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
          <h1 className="text-xl font-bold">Product Reports</h1>
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
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {dateRanges.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {dateRange === 'custom' && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-[140px]"
                  aria-label="Start date"
                />
                <span className="text-text-muted">to</span>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-[140px]"
                  aria-label="End date"
                />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
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
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="View by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="by_category">By Category</SelectItem>
                <SelectItem value="by_location">By Location</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {viewMode === 'overview' ? (
          renderOverview()
        ) : (
          renderTableView()
        )}
      </div>
    </div>
  );
}

export default function ProductReportsPage() {
  return (
    <PermissionGuard permission="reports" action="view">
      <Suspense
        fallback={
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
              <h1 className="text-xl font-bold">Product Reports</h1>
            </div>
            <div className="flex-1 p-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
              </div>
              <SkeletonCard className="h-80" />
            </div>
          </div>
        }
      >
      <ProductReportsPageInner />
    </Suspense>
    </PermissionGuard>
  );
}