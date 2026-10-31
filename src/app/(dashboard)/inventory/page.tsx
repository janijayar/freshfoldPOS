'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  WifiOff,
  Package,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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
import { useProductsWithInventory, useCategories } from '@/hooks/useApi';

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
};

type SortConfig = { key: keyof Product; direction: 'asc' | 'desc' } | null;

function ProductListContent() {
  const router = useRouter();
  const searchParamsHook = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  const productsParams: Record<string, string> = {};
  if (searchQuery) productsParams.search = searchQuery;
  const { data: productsData, loading: productsLoading, error: productsError, mutate: refetchProducts } = useProductsWithInventory(selectedLocationId || undefined, productsParams);
  const { data: categoriesData, loading: categoriesLoading, error: categoriesError } = useCategories({ active: 'true' });

  const products = useMemo(() => productsData?.products || [], [productsData]);
  const categories = useMemo(() => categoriesData?.categories || [], [categoriesData]);

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

  const isLoading = productsLoading || categoriesLoading;
  const isOnline = !productsError && !categoriesError;
  const error = productsError?.message || null;
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleSort = (key: keyof Product) => {
    setSortConfig((current) => {
      if (current?.key === key && current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.barcode.includes(searchQuery);
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (!sortConfig) return 0;
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [products, searchQuery, selectedCategory, sortConfig]);

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

    setDeletingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      // In real app, call delete API
      // await fetch(`/api/products/${id}`, { method: 'DELETE' });
      // refetchProducts();
    } catch {
      setDeleteError('Failed to delete product. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (product: Product) => {
    router.push(`/inventory/${product.id}/edit`);
  };

  const handleCreate = () => {
    router.push('/inventory/new');
  };

  const handleView = (product: Product) => {
    router.push(`/inventory/${product.id}`);
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Products</h1>
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
        onRetry={() => { refetchProducts(); }}
        onGoHome={() => router.push('/dashboard')}
        title={!isOnline ? 'You are offline' : undefined}
        description={!isOnline ? 'Changes will sync when connection is restored.' : undefined}
      />
    );
  }

  const getStockBadge = (product: Product) => {
    if (!product.trackInventory) return <Badge variant="secondary">N/A</Badge>;
    if (product.inventory.isOutOfStock) return <Badge variant="danger">Out of Stock</Badge>;
    if (product.inventory.isLowStock) return <Badge variant="warning">Low Stock</Badge>;
    return <Badge variant="success">In Stock</Badge>;
  };

  const SortIcon = ({ key }: { key: keyof Product }) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="h-4 w-4 text-text-muted" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 text-accent" /> : <ArrowDown className="h-4 w-4 text-accent" />;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Products</h1>
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
          <Button variant="primary" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Add Product
          </Button>
        </div>
      </div>

      <div className="p-4 border-b border-border bg-surface">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" aria-hidden="true" />
            <Input
              placeholder="Search products, SKU, or barcode..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-10"
              aria-label="Search products"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {filteredProducts.length === 0 ? (
          <EmptyTableState
            title={searchQuery || selectedCategory !== 'All' ? 'No products match' : 'No products yet'}
            description={searchQuery || selectedCategory !== 'All'
              ? 'Try adjusting your search or category filter.'
              : 'Get started by adding your first product.'}
            icon={<Package className="h-12 w-12 mx-auto text-text-muted/50" />}
            action={{
              label: 'Add Product',
              onClick: handleCreate,
            }}
          />
        ) : (
          <ScrollArea className="h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      Name
                      <SortIcon key="name" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('sku')}>
                    <div className="flex items-center gap-1">
                      SKU
                      <SortIcon key="sku" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('category')}>
                    <div className="flex items-center gap-1">
                      Category
                      <SortIcon key="category" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('price')}>
                    <div className="flex items-center gap-1">
                      Price
                      <SortIcon key="price" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('inventory')}>
                    <div className="flex items-center gap-1">
                      Stock
                      <SortIcon key="inventory" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('createdAt')}>
                    <div className="flex items-center gap-1">
                      Added
                      <SortIcon key="createdAt" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="font-mono text-sm text-text-muted">{product.sku}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{product.category || 'Uncategorized'}</Badge>
                    </TableCell>
                    <TableCell className="font-mono tabular-nums">{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStockBadge(product)}
                        {product.trackInventory && (
                          <span className="text-xs text-text-muted font-mono tabular-nums">
                            {product.inventory.available} / {product.inventory.quantity}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-text-muted">{new Date(product.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Actions for ${product.name}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleView(product)} aria-label="View product">
                            <Package className="h-4 w-4 mr-2" aria-hidden="true" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(product)} aria-label="Edit product">
                            <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(product.id)}
                            disabled={deletingId === product.id}
                            className="text-danger focus:text-danger"
                            aria-label="Delete product"
                          >
                            {deletingId === product.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                                Delete
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {totalPages > 1 && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={7} className="py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-muted">
                          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
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

import { Suspense } from 'react';

export default function ProductListPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Products</h1>
        </div>
        <div className="flex-1 p-4">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden="true" />
          </div>
        </div>
      </div>
    }>
      <ProductListContent />
    </Suspense>
  );
}