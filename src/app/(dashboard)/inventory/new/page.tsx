'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  WifiOff,
  Save,
  ImagePlus,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useCategories, useLocations } from '@/hooks/useApi';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  sku: z.string().min(1, 'SKU is required').max(50),
  categoryId: z.string().min(1, 'Category is required'),
  price: z.number().min(0, 'Price must be positive'),
  cost: z.number().min(0, 'Cost must be positive').optional(),
  stock: z.number().min(0, 'Stock must be positive').optional(),
  lowStockThreshold: z.number().min(0).optional(),
  type: z.enum(['product', 'gift_card']),
  trackInventory: z.boolean(),
  barcode: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const defaultValues: ProductFormData = {
  name: '',
  description: '',
  sku: '',
  categoryId: '',
  price: 0,
  cost: 0,
  stock: 0,
  lowStockThreshold: 10,
  type: 'product',
  trackInventory: true,
  barcode: '',
};

function NewProductPageInner() {
  const router = useRouter();

  const [formData, setFormData] = useState<ProductFormData>(defaultValues);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('basic');

  const { data: categoriesData, loading: categoriesLoading, error: categoriesError } = useCategories({ active: 'true' });
  const { data: locationsData, loading: locationsLoading } = useLocations({ active: 'true' });

  const categories = categoriesData?.categories || [];
  const locations = locationsData?.locations || [];
  const defaultLocation = locations.find(l => l.isDefault) || locations[0];

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

  const validateField = (name: keyof ProductFormData, value: unknown) => {
    const result = productSchema.shape[name].safeParse(value);
    if (!result.success) {
      setErrors((prev) => ({ ...prev, [name]: result.error.errors[0].message }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleChange = (name: keyof ProductFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = productSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Partial<Record<keyof ProductFormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as keyof ProductFormData] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: formData.price,
          cost: formData.cost || 0,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create product');
      }

      const { product } = await response.json();

      // Create inventory record for the default location if tracking inventory
      if (formData.trackInventory && defaultLocation) {
        await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            locationId: defaultLocation.id,
            quantity: formData.stock || 0,
            reserved: 0,
            reorderPoint: formData.lowStockThreshold || 10,
            reorderQuantity: 50,
          }),
          credentials: 'include',
        });
      }

      router.push('/inventory');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (type: 'product' | 'gift_card') => {
    handleChange('type', type);
    if (type === 'gift_card') {
      handleChange('trackInventory', false);
      handleChange('stock', 0);
      handleChange('cost', 0);
      handleChange('lowStockThreshold', 0);
    } else {
      handleChange('trackInventory', true);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Back to products">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">New Product</h1>
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
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3" role="tablist" aria-label="Product form sections">
              <TabsTrigger value="basic" role="tab">Basic Info</TabsTrigger>
              <TabsTrigger value="pricing" role="tab">Pricing & Inventory</TabsTrigger>
              <TabsTrigger value="advanced" role="tab">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 pt-4" role="tabpanel">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter product name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  required
                />
                {errors.name && <p id="name-error" className="text-sm text-danger" role="alert">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter product description (optional)"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-text-muted">Max 500 characters</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    placeholder="e.g., BEV-001"
                    value={formData.sku}
                    onChange={(e) => handleChange('sku', e.target.value.toUpperCase())}
                    aria-invalid={!!errors.sku}
                    aria-describedby={errors.sku ? 'sku-error' : undefined}
                    required
                  />
                  {errors.sku && <p id="sku-error" className="text-sm text-danger" role="alert">{errors.sku}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    placeholder="Scan or enter barcode (optional)"
                    value={formData.barcode}
                    onChange={(e) => handleChange('barcode', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.categoryId} onValueChange={(v) => handleChange('categoryId', v)} disabled={categoriesLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={categoriesLoading ? 'Loading categories...' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && <p className="text-sm text-danger" role="alert">{errors.categoryId}</p>}
                {categoriesError && <p className="text-sm text-danger" role="alert">Failed to load categories</p>}
              </div>

              <div className="space-y-2">
                <Label>Product Type</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="product"
                      checked={formData.type === 'product'}
                      onChange={() => handleTypeChange('product')}
                      className="sr-only"
                    />
                    <div className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors',
                      formData.type === 'product'
                        ? 'border-accent bg-accent-muted'
                        : 'border-border hover:border-accent'
                    )}>
                      <span className="flex items-center gap-1">
                        <svg className={cn('h-5 w-5', formData.type === 'product' ? 'text-accent' : 'text-text-muted')} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="m7.5 4.27 9 5.15"></path>
                          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                          <path d="m3.3 7 8.7 5 8.7-5"></path>
                          <path d="M12 22V12"></path>
                        </svg>
                        <span className="font-medium">Product</span>
                      </span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="gift_card"
                      checked={formData.type === 'gift_card'}
                      onChange={() => handleTypeChange('gift_card')}
                      className="sr-only"
                    />
                    <div className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors',
                      formData.type === 'gift_card'
                        ? 'border-accent bg-accent-muted'
                        : 'border-border hover:border-accent'
                    )}>
                      <span className="flex items-center gap-1">
                        <Badge className={cn('h-5 w-5 flex items-center justify-center', formData.type === 'gift_card' ? 'bg-accent text-on-accent' : 'bg-border text-text-muted')}>
                          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                            <line x1="2" x2="22" y1="10" y2="10"></line>
                          </svg>
                        </Badge>
                        <span className="font-medium">Gift Card</span>
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 pt-4" role="tabpanel">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.price / 100}
                    onChange={(e) => handleChange('price', Math.round(parseFloat(e.target.value || '0') * 100))}
                    className="text-right"
                    inputMode="decimal"
                    required
                  />
                  {errors.price && <p className="text-sm text-danger" role="alert">{errors.price}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Cost</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.cost ? formData.cost / 100 : ''}
                    onChange={(e) => handleChange('cost', e.target.value ? Math.round(parseFloat(e.target.value) * 100) : 0)}
                    className="text-right"
                    inputMode="decimal"
                    disabled={formData.type === 'gift_card'}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2" hidden={formData.type === 'gift_card'}>
                <div className="space-y-2">
                  <Label htmlFor="stock">Initial Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={formData.stock}
                    onChange={(e) => handleChange('stock', parseInt(e.target.value || '0', 10))}
                    disabled={!formData.trackInventory}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="10"
                    value={formData.lowStockThreshold}
                    onChange={(e) => handleChange('lowStockThreshold', parseInt(e.target.value || '0', 10))}
                    disabled={!formData.trackInventory}
                  />
                </div>
              </div>

              <div className="space-y-2" hidden={formData.type === 'gift_card'}>
                <Label htmlFor="trackInventory">
                  <div className="flex items-center justify-between">
                    <span>Track Inventory</span>
                    <Switch
                      id="trackInventory"
                      checked={formData.trackInventory}
                      onCheckedChange={(checked) => handleChange('trackInventory', checked)}
                    />
                  </div>
                </Label>
                <p className="text-sm text-text-muted">
                  When enabled, stock levels will be tracked and low stock alerts will be shown.
                </p>
              </div>

              {formData.price > 0 && (formData.cost ?? 0) > 0 && formData.type === 'product' && (
                <div className="p-4 bg-surface-elevated rounded-lg border border-border">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Margin</p>
                      <p className="text-2xl font-bold text-success">
                        {Math.round(((formData.price - (formData.cost ?? 0)) / formData.price) * 100)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Profit/Unit</p>
                      <p className="text-2xl font-bold text-success">{formatCurrency(formData.price - (formData.cost ?? 0))}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Markup</p>
                      <p className="text-2xl font-bold text-accent">
                        {(formData.cost ?? 0) > 0 ? Math.round(((formData.price - (formData.cost ?? 0)) / (formData.cost ?? 0)) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 pt-4" role="tabpanel">
              <div className="space-y-2">
                <Label>Images</Label>
                <div className="flex flex-wrap gap-2">
                  {images.map((image, index) => (
                    <div key={index} className="relative h-20 w-20 rounded-lg border border-border overflow-hidden">
                      <img src={image} alt={`Product image ${index + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-20 w-20 flex-col gap-1"
                    onClick={() => {
                      const newImage = `https://picsum.photos/seed/${Date.now()}/200/200`;
                      setImages((prev) => [...prev, newImage]);
                    }}
                    aria-label="Add product image"
                  >
                    <ImagePlus className="h-6 w-6" />
                    <span className="text-xs">Add Image</span>
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium text-text">Danger Zone</h4>
                <p className="text-sm text-text-muted">
                  Discard changes and return to products.
                </p>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => {
                    if (confirm('Discard changes and return to products?')) {
                      router.push('/inventory');
                    }
                  }}
                  className="w-full sm:w-auto"
                >
                  Discard Changes
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </form>
    </div>
  );
}

export default function NewProductPage() {
  return (
    <PermissionGuard permission="inventory" action="create">
      <NewProductPageInner />
    </PermissionGuard>
  );
}