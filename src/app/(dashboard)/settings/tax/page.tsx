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
  Save,
  Settings,
  Percent,
  Plus,
  Edit,
  Trash2,
  Calculator,
  FileText,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyTableState } from '@/components/ui/empty-state';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

type TaxRate = {
  id: string;
  name: string;
  rate: number;
  type: 'percentage' | 'fixed';
  appliesTo: 'all' | 'categories' | 'products';
  categoryIds: string[];
  productIds: string[];
  isDefault: boolean;
  isCompound: boolean;
  description: string;
};

type TaxGroup = {
  id: string;
  name: string;
  rates: string[];
  totalRate: number;
};

const mockTaxRates: TaxRate[] = [
  {
    id: 'tax-1',
    name: 'CA State Sales Tax',
    rate: 7.25,
    type: 'percentage',
    appliesTo: 'all',
    categoryIds: [],
    productIds: [],
    isDefault: true,
    isCompound: false,
    description: 'California state sales tax',
  },
  {
    id: 'tax-2',
    name: 'SF County Tax',
    rate: 1.25,
    type: 'percentage',
    appliesTo: 'all',
    categoryIds: [],
    productIds: [],
    isDefault: false,
    isCompound: false,
    description: 'San Francisco county tax',
  },
  {
    id: 'tax-3',
    name: 'SF District Tax',
    rate: 1.0,
    type: 'percentage',
    appliesTo: 'all',
    categoryIds: [],
    productIds: [],
    isDefault: false,
    isCompound: false,
    description: 'San Francisco district tax',
  },
  {
    id: 'tax-4',
    name: 'Food Tax Exemption',
    rate: 0,
    type: 'percentage',
    appliesTo: 'categories',
    categoryIds: ['cat-2'],
    productIds: [],
    isDefault: false,
    isCompound: false,
    description: 'Prepared food exemption',
  },
  {
    id: 'tax-5',
    name: 'Bottle Deposit',
    rate: 0.05,
    type: 'fixed',
    appliesTo: 'products',
    categoryIds: [],
    productIds: ['prod-1', 'prod-6'],
    isDefault: false,
    isCompound: false,
    description: 'CA CRV bottle deposit',
  },
];

const mockTaxGroups: TaxGroup[] = [
  {
    id: 'tg-1',
    name: 'Standard CA Tax',
    rates: ['tax-1', 'tax-2', 'tax-3'],
    totalRate: 9.5,
  },
  {
    id: 'tg-2',
    name: 'Food Items (Exempt)',
    rates: ['tax-1', 'tax-2', 'tax-3', 'tax-4'],
    totalRate: 9.5,
  },
];

const categories = [
  { id: 'cat-1', name: 'Beverages' },
  { id: 'cat-2', name: 'Food' },
  { id: 'cat-3', name: 'Merchandise' },
  { id: 'cat-4', name: 'Gift Cards' },
];

const products = [
  { id: 'prod-1', name: 'Organic Green Tea' },
  { id: 'prod-6', name: 'Sparkling Water' },
];

function TaxSettingsContent() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [taxGroups, setTaxGroups] = useState<TaxGroup[]>([]);
  const [pricesIncludeTax, setPricesIncludeTax] = useState(false);
  const [roundingMethod, setRoundingMethod] = useState<'round' | 'floor' | 'ceil'>('round');
  const [activeTab, setActiveTab] = useState<'rates' | 'groups' | 'settings'>('rates');

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setTaxRates(mockTaxRates);
      setTaxGroups(mockTaxGroups);
    } catch {
      setError('Failed to load tax settings. Please try again.');
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch {
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRate = (id: string) => {
    if (confirm('Are you sure you want to delete this tax rate?')) {
      setTaxRates(taxRates.filter(t => t.id !== id));
    }
  };

  const deleteGroup = (id: string) => {
    if (confirm('Are you sure you want to delete this tax group?')) {
      setTaxGroups(taxGroups.filter(tg => tg.id !== id));
    }
  };

  const getAppliesToLabel = (rate: TaxRate) => {
    if (rate.appliesTo === 'all') return 'All items';
    if (rate.appliesTo === 'categories') {
      const cats = categories.filter(c => rate.categoryIds.includes(c.id));
      return `Categories: ${cats.map(c => c.name).join(', ')}`;
    }
    if (rate.appliesTo === 'products') {
      const prods = products.filter(p => rate.productIds.includes(p.id));
      return `Products: ${prods.map(p => p.name).join(', ')}`;
    }
    return 'Unknown';
  };

  const getRateNames = (rateIds: string[]) => {
    return taxRates.filter(t => rateIds.includes(t.id)).map(t => t.name).join(' + ');
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Tax Settings</h1>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => <SkeletonCard key={i} />)}
          </div>
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
          <h1 className="text-xl font-bold">Tax Settings</h1>
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
        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" aria-hidden="true" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'rates' | 'groups' | 'settings')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rates">Tax Rates</TabsTrigger>
            <TabsTrigger value="groups">Tax Groups</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="rates" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tax Rates</CardTitle>
                    <CardDescription>Configure individual tax rates</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                    Add Rate
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {taxRates.length === 0 ? (
                  <EmptyTableState
                    title="No tax rates configured"
                    description="Add tax rates to calculate taxes on sales."
                    icon={<Percent className="h-12 w-12 mx-auto text-text-muted/50" />}
                  />
                ) : (
                  <ScrollArea>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Applies To</TableHead>
                          <TableHead>Default</TableHead>
                          <TableHead>Compound</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {taxRates.map((rate) => (
                          <TableRow key={rate.id}>
                            <TableCell className="font-medium">{rate.name}</TableCell>
                            <TableCell className="font-mono">
                              {rate.type === 'percentage' ? `${rate.rate}%` : formatCurrency(rate.rate)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{rate.type === 'percentage' ? '%' : '$'}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">{getAppliesToLabel(rate)}</TableCell>
                            <TableCell>
                              {rate.isDefault && <Badge variant="success">Default</Badge>}
                            </TableCell>
                            <TableCell>
                              {rate.isCompound && <Badge variant="warning">Yes</Badge>}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" aria-label="More actions">
                                    <Edit className="h-4 w-4" aria-hidden="true" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-danger" onClick={() => deleteRate(rate.id)}>
                                    <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tax Groups</CardTitle>
                    <CardDescription>Combine multiple rates into groups for easier application</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                    Add Group
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {taxGroups.length === 0 ? (
                  <EmptyTableState
                    title="No tax groups configured"
                    description="Create tax groups to combine multiple rates."
                    icon={<Calculator className="h-12 w-12 mx-auto text-text-muted/50" />}
                  />
                ) : (
                  <ScrollArea>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Rates</TableHead>
                          <TableHead>Total Rate</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {taxGroups.map((group) => (
                          <TableRow key={group.id}>
                            <TableCell className="font-medium">{group.name}</TableCell>
                            <TableCell className="text-sm">{getRateNames(group.rates)}</TableCell>
                            <TableCell className="font-mono font-bold text-lg">{group.totalRate}%</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" aria-label="More actions">
                                    <Edit className="h-4 w-4" aria-hidden="true" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-danger" onClick={() => deleteGroup(group.id)}>
                                    <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Tax Settings</CardTitle>
                <CardDescription>Configure how taxes are calculated and displayed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Prices Include Tax</p>
                    <p className="text-sm text-text-muted">Whether product prices already include tax</p>
                  </div>
                  <Switch checked={pricesIncludeTax} onCheckedChange={setPricesIncludeTax} />
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Rounding Method</h4>
                  <div className="flex gap-4">
                    <Label className="flex items-center gap-2 cursor-pointer">
                      <Input type="radio" name="rounding" value="round" checked={roundingMethod === 'round'} onChange={(e) => setRoundingMethod(e.target.value as 'round')} />
                      <span>Round (0.5 up)</span>
                    </Label>
                    <Label className="flex items-center gap-2 cursor-pointer">
                      <Input type="radio" name="rounding" value="floor" checked={roundingMethod === 'floor'} onChange={(e) => setRoundingMethod(e.target.value as 'floor')} />
                      <span>Floor (always down)</span>
                    </Label>
                    <Label className="flex items-center gap-2 cursor-pointer">
                      <Input type="radio" name="rounding" value="ceil" checked={roundingMethod === 'ceil'} onChange={(e) => setRoundingMethod(e.target.value as 'ceil')} />
                      <span>Ceiling (always up)</span>
                    </Label>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Tax Calculation</h4>
                  <div className="space-y-3">
                    <div className="p-4 bg-surface rounded-lg border">
                      <p className="font-medium">Subtotal: $100.00</p>
                      <p className="text-sm text-text-muted">Tax (9.5%): $9.50</p>
                      <p className="font-bold text-lg">Total: $109.50</p>
                    </div>
                    <p className="text-sm text-text-muted">Example calculation with standard CA tax group</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tax Exemptions</CardTitle>
                <CardDescription>Configure tax-exempt customers or organizations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface rounded-lg border">
                  <div>
                    <p className="font-medium">Tax-Exempt Customers</p>
                    <p className="text-sm text-text-muted">Allow tax-exempt status for qualified customers</p>
                  </div>
                  <Switch defaultChecked={false} />
                </div>
                <div className="flex items-center justify-between p-4 bg-surface rounded-lg border">
                  <div>
                    <p className="font-medium">Validate Exemption Certificates</p>
                    <p className="text-sm text-text-muted">Require valid exemption certificate on file</p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

const defaultRate: TaxRate = {
  id: '',
  name: '',
  rate: 0,
  type: 'percentage',
  appliesTo: 'all',
  categoryIds: [],
  productIds: [],
  isDefault: false,
  isCompound: false,
  description: '',
};

function TaxSettingsPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Tax Settings</h1>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    }>
      <TaxSettingsContent />
    </Suspense>
  );
}

export default function TaxSettingsPageWrapper() {
  return (
    <PermissionGuard permission="settings" action="tax" fallback={<div />}>
      <TaxSettingsPage />
    </PermissionGuard>
  );
}