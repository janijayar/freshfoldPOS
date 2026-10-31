'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  WifiOff,
  Package,
  Tag,
  DollarSign,
  Barcode,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

type Product = {
  id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  lowStockThreshold: number;
  type: 'product' | 'gift_card';
  trackInventory: boolean;
  barcode: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
};

const mockProducts: Record<string, Product> = {
  '1': { id: '1', name: 'Americano', description: 'Classic espresso with hot water', sku: 'BEV-001', category: 'Beverages', price: 350, cost: 50, stock: 50, lowStockThreshold: 20, type: 'product', trackInventory: true, barcode: '1234567890123', images: [], createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15') },
  '2': { id: '2', name: 'Latte', description: 'Espresso with steamed milk', sku: 'BEV-002', category: 'Beverages', price: 450, cost: 80, stock: 45, lowStockThreshold: 20, type: 'product', trackInventory: true, barcode: '1234567890124', images: [], createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15') },
  '3': { id: '3', name: 'Cappuccino', description: 'Espresso with steamed milk and foam', sku: 'BEV-003', category: 'Beverages', price: 450, cost: 80, stock: 40, lowStockThreshold: 20, type: 'product', trackInventory: true, barcode: '1234567890125', images: [], createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15') },
  '4': { id: '4', name: 'Cold Brew', description: 'Slow-steeped cold coffee', sku: 'BEV-004', category: 'Beverages', price: 500, cost: 100, stock: 30, lowStockThreshold: 15, type: 'product', trackInventory: true, barcode: '1234567890126', images: [], createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15') },
  '5': { id: '5', name: 'Croissant', description: 'Buttery, flaky pastry', sku: 'FOOD-001', category: 'Food', price: 350, cost: 100, stock: 25, lowStockThreshold: 10, type: 'product', trackInventory: true, barcode: '1234567890127', images: [], createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15') },
  '6': { id: '6', name: 'Bagel with Cream Cheese', description: 'Fresh bagel with cream cheese', sku: 'FOOD-002', category: 'Food', price: 450, cost: 150, stock: 20, lowStockThreshold: 10, type: 'product', trackInventory: true, barcode: '1234567890128', images: [], createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15') },
  '7': { id: '7', name: 'Blueberry Muffin', description: 'Fresh baked blueberry muffin', sku: 'FOOD-003', category: 'Food', price: 380, cost: 120, stock: 15, lowStockThreshold: 10, type: 'product', trackInventory: true, barcode: '1234567890129', images: [], createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15') },
  '8': { id: '8', name: 'Avocado Toast', description: 'Sourdough with smashed avocado', sku: 'FOOD-004', category: 'Food', price: 850, cost: 300, stock: 10, lowStockThreshold: 8, type: 'product', trackInventory: true, barcode: '1234567890130', images: [], createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15') },
  '9': { id: '9', name: 'Tote Bag', description: 'Canvas tote with logo', sku: 'MERCH-001', category: 'Merchandise', price: 1500, cost: 500, stock: 30, lowStockThreshold: 10, type: 'product', trackInventory: true, barcode: '1234567890131', images: [], createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15') },
  '10': { id: '10', name: 'Ceramic Mug', description: '12oz ceramic mug with logo', sku: 'MERCH-002', category: 'Merchandise', price: 1200, cost: 400, stock: 25, lowStockThreshold: 10, type: 'product', trackInventory: true, barcode: '1234567890132', images: [], createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15') },
  '11': { id: '11', name: 'Gift Card $25', description: '$25 gift card', sku: 'GIFT-001', category: 'Gift Cards', price: 2500, cost: 0, stock: 100, lowStockThreshold: 0, type: 'gift_card', trackInventory: false, barcode: '1234567890133', images: [], createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15') },
  '12': { id: '12', name: 'Gift Card $50', description: '$50 gift card', sku: 'GIFT-002', category: 'Gift Cards', price: 5000, cost: 0, stock: 100, lowStockThreshold: 0, type: 'gift_card', trackInventory: false, barcode: '1234567890134', images: [], createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15') },
};

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const fetchProduct = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const found = mockProducts[id];
      if (found) {
        setProduct(found);
      } else {
        setError('Product not found');
      }
    } catch {
      setError('Failed to load product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

    setDeleting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push('/inventory');
      router.refresh();
    } catch {
      setError('Failed to delete product. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    router.push(`/inventory/${id}/edit`);
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
        </div>
        <div className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        variant={!isOnline ? 'network' : 'not-found'}
        onRetry={fetchProduct}
        onGoHome={() => router.push('/inventory')}
        title={error === 'Product not found' ? 'Product not found' : undefined}
        description={error === 'Product not found' ? 'The product you are looking for does not exist.' : undefined}
      />
    );
  }

  if (!product) {
    return (
      <ErrorState
        variant="not-found"
        onRetry={fetchProduct}
        onGoHome={() => router.push('/inventory')}
      />
    );
  }

  const getStockBadge = () => {
    if (!product.trackInventory) return <Badge variant="secondary">N/A (No tracking)</Badge>;
    if (product.stock === 0) return <Badge variant="danger">Out of Stock</Badge>;
    if (product.stock <= product.lowStockThreshold) return <Badge variant="warning">Low Stock</Badge>;
    return <Badge variant="success">In Stock</Badge>;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Back to products">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{product.name}</h1>
            <p className="text-sm text-text-muted">{product.sku}</p>
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
          <Button variant="outline" onClick={handleEdit} aria-label="Edit product">
            <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
            Edit
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Product Details</CardTitle>
                <div className="flex items-center gap-2">
                  {getStockBadge()}
                  <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Description</label>
                  <p className="text-text">{product.description}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Type</label>
                  <p className="capitalize text-text">{product.type.replace('_', ' ')}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">SKU</label>
                  <p className="font-mono text-text">{product.sku}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Barcode</label>
                  <p className="font-mono text-text">{product.barcode}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Category</label>
                  <p className="text-text">{product.category}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Price</label>
                  <p className="text-2xl font-bold tabular-nums">{formatCurrency(product.price)}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Cost</label>
                  <p className="text-xl font-semibold tabular-nums text-text-muted">{formatCurrency(product.cost)}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Margin</label>
                  <p className="text-xl font-semibold tabular-nums text-success">
                    {product.price > 0 ? Math.round(((product.price - product.cost) / product.price) * 100) : 0}%
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Profit/Unit</label>
                  <p className="text-xl font-semibold tabular-nums text-success">{formatCurrency(product.price - product.cost)}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3 pt-4 border-t border-border">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Current Stock</label>
                  <p className="text-2xl font-bold tabular-nums">{product.trackInventory ? product.stock : 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Low Stock Threshold</label>
                  <p className="text-xl font-semibold tabular-nums">{product.lowStockThreshold}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Inventory Tracking</label>
                  <p className="capitalize text-text">{product.trackInventory ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-text-muted">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
                <p>Inventory history will be displayed here once connected to the backend.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sales History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-text-muted">
                <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
                <p>Sales history will be displayed here once connected to the backend.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}