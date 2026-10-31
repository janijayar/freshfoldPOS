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
  Building2,
  DollarSign,
  CreditCard,
  Users,
  Shield,
  Mail,
  Phone,
  Globe,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Key,
  Bell,
  FileText,
  Database,
  Upload,
  Trash,
  ToggleLeft,
  ToggleRight,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

type Organization = {
  id: string;
  name: string;
  legalName: string;
  taxId: string;
  website: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  logo: string;
  timezone: string;
  currency: string;
  taxRate: number;
  settings: Record<string, any>;
  subscriptionPlan: string;
  subscriptionStatus: string;
  billingEmail: string;
  billingCycle: string;
  nextBillingDate: string;
  dataMode: 'demo' | 'live';
  demoDataErasedAt: string | null;
};

const plans = [
  { id: 'starter', name: 'Starter', price: 49, features: ['Up to 2 locations', 'Basic reporting', 'Email support'] },
  { id: 'professional', name: 'Professional', price: 149, features: ['Up to 10 locations', 'Advanced reporting', 'Priority support', 'API access'] },
  { id: 'enterprise', name: 'Enterprise', price: 399, features: ['Unlimited locations', 'Custom reporting', '24/7 support', 'API access', 'SSO', 'Custom integrations'] },
];

const billingCycles = [
  { id: 'monthly', name: 'Monthly' },
  { id: 'annual', name: 'Annual (save 20%)' },
];

const currencies = [
  { code: 'PHP', name: 'Philippine Peso (₱)', symbol: '₱' },
  { code: 'USD', name: 'US Dollar ($)', symbol: '$' },
  { code: 'EUR', name: 'Euro (€)', symbol: '€' },
  { code: 'GBP', name: 'British Pound (£)', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar (CA$)', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar (A$)', symbol: 'A$' },
];

const timezones = [
  'Asia/Manila',
  'America/Los_Angeles',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
];

const states = ['CA', 'NY', 'TX', 'FL', 'WA', 'IL', 'NCR', 'CEBU', 'DAVAO'];

function OrganizationSettingsContent() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [org, setOrg] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'security' | 'notifications' | 'data'>('general');

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'customers' | 'products' | 'sales'>('customers');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/organizations');
      if (!response.ok) {
        throw new Error('Failed to fetch organization');
      }
      const data = await response.json();
      setOrg(data.organization);
    } catch {
      setError('Failed to load organization settings. Please try again.');
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

  const handleChange = (field: string, value: any) => {
    if (org) {
      setOrg({ ...org, [field]: value });
    }
  };

  const handleSave = async () => {
    if (!org) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/organizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(org),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const data = await response.json();
      setOrg(data.organization);
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDataModeToggle = async (newMode: 'demo' | 'live') => {
    try {
      const response = await fetch('/api/organizations/data-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataMode: newMode }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle data mode');
      }

      const data = await response.json();
      setOrg(data.organization);
      toast.success(`Switched to ${newMode} mode`);
    } catch {
      toast.error('Failed to switch data mode');
    }
  };

  const handleEraseDemoData = async () => {
    if (!confirm('This will permanently delete all demo data (products, customers, orders, inventory, shifts). Test users will be preserved. Are you sure?')) {
      return;
    }

    try {
      const response = await fetch('/api/organizations/erase-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to erase demo data');
      }

      toast.success('Demo data erased successfully');
      fetchData(); // Refresh to show live data state
    } catch {
      toast.error('Failed to erase demo data');
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select a file first');
      return;
    }

    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('type', importType);

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
      }

      const data = await response.json();
      setImportResult(data.result);

      if (data.result.success > 0) {
        toast.success(`Imported ${data.result.success} ${importType} successfully`);
      }
      if (data.result.failed > 0) {
        toast.error(`${data.result.failed} ${importType} failed to import`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const getSampleCsv = (type: string): string => {
    switch (type) {
      case 'customers':
        return `firstName,lastName,email,phone,address,city,state,zip,country,loyaltyTier,loyaltyPoints,totalSpent,visitCount,acceptsMarketing,notes
John,Doe,john.doe@email.com,+63 917 111 2222,123 Main St,Manila,NCR,1000,PH,silver,500,500000,5,true,Imported from old POS
Jane,Smith,jane.smith@email.com,+63 918 333 4444,456 Oak Ave,Quezon City,NCR,1100,PH,gold,1200,1200000,12,false,VIP customer
Bob,Wilson,bob.wilson@email.com,+63 919 555 6666,789 Pine Rd,Makati,NCR,1200,PH,bronze,100,100000,2,true,New customer`;
      case 'products':
        return `name,description,sku,barcode,type,price,cost,taxRate,trackInventory,allowNegativeStock,lowStockThreshold,isActive,attributes
Americano,Classic espresso with hot water,BEV-001,1234567890123,physical,350,150,0.12,true,false,10,true,"{""size"": ""12oz""}"
Latte,Espresso with steamed milk,BEV-002,1234567890124,physical,450,200,0.12,true,false,10,true,"{""size"": ""12oz"", ""milk"": ""whole""}"
Croissant,Buttery flaky pastry,FOOD-001,1234567890125,physical,350,120,0.12,true,false,20,true,"{""type"": ""pastry""}"`;
      case 'sales':
        return `orderNumber,date,customerEmail,paymentMethod,amount,items
ORD-001,2024-01-15T10:30:00,john.doe@email.com,cash,1134,"[{""sku"": ""BEV-001"", ""name"": ""Americano"", ""quantity"": 2, ""unitPrice"": 350, ""discount"": 0, ""tax"": 56}, {""sku"": ""FOOD-001"", ""name"": ""Croissant"", ""quantity"": 1, ""unitPrice"": 350, ""discount"": 0, ""tax"": 28}]"
ORD-002,2024-01-15T11:15:00,jane.smith@email.com,card,1312,"[{""sku"": ""BEV-002"", ""name"": ""Latte"", ""quantity"": 1, ""unitPrice"": 450, ""discount"": 135, ""tax"": 36}, {""sku"": ""BEV-003"", ""name"": ""Cappuccino"", ""quantity"": 2, ""unitPrice"": 450, ""discount"": 0, ""tax"": 72}]"
ORD-003,2024-01-15T12:00:00,,cash,1620,"[{""sku"": ""BEV-004"", ""name"": ""Cold Brew"", ""quantity"": 3, ""unitPrice"": 500, ""discount"": 0, ""tax"": 120}]"`
      default:
        return '';
    }
  };

  const getSampleJson = (type: string): string => {
    switch (type) {
      case 'customers':
        return JSON.stringify([
          {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@email.com',
            phone: '+63 917 111 2222',
            address: '123 Main St',
            city: 'Manila',
            state: 'NCR',
            zip: '1000',
            country: 'PH',
            loyaltyTier: 'silver',
            loyaltyPoints: 500,
            totalSpent: 500000,
            visitCount: 5,
            acceptsMarketing: true,
            notes: 'Imported from old POS'
          },
          {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@email.com',
            phone: '+63 918 333 4444',
            address: '456 Oak Ave',
            city: 'Quezon City',
            state: 'NCR',
            zip: '1100',
            country: 'PH',
            loyaltyTier: 'gold',
            loyaltyPoints: 1200,
            totalSpent: 1200000,
            visitCount: 12,
            acceptsMarketing: false,
            notes: 'VIP customer'
          }
        ], null, 2);
      case 'products':
        return JSON.stringify([
          {
            name: 'Americano',
            description: 'Classic espresso with hot water',
            sku: 'BEV-001',
            barcode: '1234567890123',
            type: 'physical',
            price: 350,
            cost: 150,
            taxRate: 0.12,
            trackInventory: true,
            allowNegativeStock: false,
            lowStockThreshold: 10,
            isActive: true,
            attributes: { size: '12oz' }
          },
          {
            name: 'Latte',
            description: 'Espresso with steamed milk',
            sku: 'BEV-002',
            barcode: '1234567890124',
            type: 'physical',
            price: 450,
            cost: 200,
            taxRate: 0.12,
            trackInventory: true,
            allowNegativeStock: false,
            lowStockThreshold: 10,
            isActive: true,
            attributes: { size: '12oz', milk: 'whole' }
          }
        ], null, 2);
      case 'sales':
        return JSON.stringify([
          {
            orderNumber: 'ORD-001',
            date: '2024-01-15T10:30:00',
            customerEmail: 'john.doe@email.com',
            paymentMethod: 'cash',
            amount: 1134,
            items: [
              { sku: 'BEV-001', name: 'Americano', quantity: 2, unitPrice: 350, discount: 0, tax: 56 },
              { sku: 'FOOD-001', name: 'Croissant', quantity: 1, unitPrice: 350, discount: 0, tax: 28 }
            ]
          },
          {
            orderNumber: 'ORD-002',
            date: '2024-01-15T11:15:00',
            customerEmail: 'jane.smith@email.com',
            paymentMethod: 'card',
            amount: 1312,
            items: [
              { sku: 'BEV-002', name: 'Latte', quantity: 1, unitPrice: 450, discount: 135, tax: 36 },
              { sku: 'BEV-003', name: 'Cappuccino', quantity: 2, unitPrice: 450, discount: 0, tax: 72 }
            ]
          }
        ], null, 2);
      default:
        return '[]';
    }
  };

  const downloadSampleCsv = (type: string) => {
    const csv = getSampleCsv(type);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample-${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSampleJson = (type: string) => {
    const json = getSampleJson(type);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample-${type}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Organization Settings</h1>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !org) {
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

  const currentPlan = plans.find(p => p.id === org.subscriptionPlan) || plans[1];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Organization Settings</h1>
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
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'general' | 'billing' | 'security' | 'notifications' | 'data')}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="data">Data Management</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>Basic information about your organization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Organization Name *</Label>
                    <Input
                      id="name"
                      value={org.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="FreshFold"
                    />
                  </div>
                  <div>
                    <Label htmlFor="legalName">Legal Name</Label>
                    <Input
                      id="legalName"
                      value={org.legalName}
                      onChange={(e) => handleChange('legalName', e.target.value)}
                      placeholder="FreshFold Inc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxId">Tax ID / EIN</Label>
                    <Input
                      id="taxId"
                      value={org.taxId}
                      onChange={(e) => handleChange('taxId', e.target.value)}
                      placeholder="12-3456789"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={org.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                      placeholder="https://freshfold.com"
                    />
                  </div>
                </div>

                <div>
                  <Label>Address</Label>
                  <div className="grid gap-4 md:grid-cols-4 mt-2">
                    <div className="md:col-span-2">
                      <Label htmlFor="address" className="sr-only">Street Address</Label>
                      <Input
                        id="address"
                        value={org.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        placeholder="100 Market Street"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={org.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        placeholder="San Francisco"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State / Province</Label>
                      <Select value={org.state} onValueChange={(v) => handleChange('state', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state/province" />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="zip">ZIP</Label>
                      <Input
                        id="zip"
                        value={org.zip}
                        onChange={(e) => handleChange('zip', e.target.value)}
                        placeholder="94102"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={org.country}
                        onChange={(e) => handleChange('country', e.target.value)}
                        placeholder="US"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={org.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={org.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="hello@freshfold.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Localization</CardTitle>
                <CardDescription>Timezone and currency settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={org.timezone} onValueChange={(v) => handleChange('timezone', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={org.currency} onValueChange={(v) => handleChange('currency', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>Manage your subscription</CardDescription>
                  </div>
                  <Badge variant="success">{org.subscriptionStatus}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-surface rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">${currentPlan.price}<span className="text-xl font-normal text-text-muted">/month</span></p>
                      <p className="font-medium">{currentPlan.name} Plan</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-text-muted">Next billing</p>
                      <p className="font-medium">{org.nextBillingDate}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Available Plans</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        className={cn('p-4 rounded-lg border-2', org.subscriptionPlan === plan.id ? 'border-accent bg-accent-muted' : 'border-border')}
                      >
                        <div className="mb-3">
                          <p className="text-2xl font-bold">${plan.price}<span className="text-xl font-normal text-text-muted">/month</span></p>
                          <p className="font-medium">{plan.name}</p>
                          {org.subscriptionPlan === plan.id && <Badge variant="success" className="mt-1">Current</Badge>}
                        </div>
                        <ul className="space-y-2 mb-4">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-success" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Button
                          variant={org.subscriptionPlan === plan.id ? 'outline' : 'primary'}
                          className="w-full"
                          disabled={org.subscriptionPlan === plan.id}
                        >
                          {org.subscriptionPlan === plan.id ? 'Current Plan' : `Upgrade to ${plan.name}`}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Billing Details</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="billingEmail">Billing Email</Label>
                      <Input
                        id="billingEmail"
                        type="email"
                        value={org.billingEmail}
                        onChange={(e) => handleChange('billingEmail', e.target.value)}
                        placeholder="billing@freshfold.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billingCycle">Billing Cycle</Label>
                      <Select value={org.billingCycle} onValueChange={(v) => handleChange('billingCycle', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select cycle" />
                        </SelectTrigger>
                        <SelectContent>
                          {billingCycles.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Manage your payment method for subscription billing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-surface rounded-lg border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">Visa ending in 4242</p>
                      <p className="text-sm text-text-muted">Expires 12/2026</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Update</Button>
                </div>
                <p className="text-sm text-text-muted">Payment method is managed securely through Stripe.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure authentication and access controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface rounded-lg border">
                  <div>
                    <p className="font-medium">Two-Factor Authentication (2FA)</p>
                    <p className="text-sm text-text-muted">Require 2FA for all organization members</p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
                <div className="flex items-center justify-between p-4 bg-surface rounded-lg border">
                  <div>
                    <p className="font-medium">Single Sign-On (SSO)</p>
                    <p className="text-sm text-text-muted">Enable SAML/OIDC SSO for enterprise plans</p>
                  </div>
                  <Switch defaultChecked={false} disabled />
                </div>
                <div className="flex items-center justify-between p-4 bg-surface rounded-lg border">
                  <div>
                    <p className="font-medium">Password Policy</p>
                    <p className="text-sm text-text-muted">Enforce strong passwords and rotation</p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
                <div className="flex items-center justify-between p-4 bg-surface rounded-lg border">
                  <div>
                    <p className="font-medium">Session Timeout</p>
                    <p className="text-sm text-text-muted">Auto-logout after 30 minutes of inactivity</p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
                <div className="flex items-center justify-between p-4 bg-surface rounded-lg border">
                  <div>
                    <p className="font-medium">API Key Management</p>
                    <p className="text-sm text-text-muted">Allow creation of API keys for integrations</p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>Manage API keys for integrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-surface rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Active Keys</h4>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                      Create Key
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border">
                      <div>
                        <p className="font-mono text-sm">fk_live_abc123...xyz789</p>
                        <p className="text-xs text-text-muted">Created Oct 15, 2026 • Last used 2 hours ago</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="success">Active</Badge>
                        <Button variant="ghost" size="icon" className="text-danger">
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border">
                      <div>
                        <p className="font-mono text-sm">fk_test_def456...uvw012</p>
                        <p className="text-xs text-text-muted">Created Sep 20, 2026 • Last used 3 days ago</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Test</Badge>
                        <Button variant="ghost" size="icon" className="text-danger">
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Configure which emails you receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: 'Daily Sales Summary', desc: 'Receive daily revenue and order summaries', default: true },
                  { title: 'Low Stock Alerts', desc: 'Get notified when inventory runs low', default: true },
                  { title: 'Shift Reports', desc: 'End-of-shift cash reconciliation reports', default: true },
                  { title: 'New Customer Signups', desc: 'Notification when new customers join', default: false },
                  { title: 'Weekly Analytics', desc: 'Weekly performance overview', default: true },
                  { title: 'Billing Receipts', desc: 'Monthly invoice and payment confirmations', default: true },
                  { title: 'System Maintenance', desc: 'Scheduled maintenance notifications', default: true },
                  { title: 'Security Alerts', desc: 'Login attempts, 2FA changes, etc.', default: true },
                ].map((notif, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-surface rounded-lg border">
                    <div>
                      <p className="font-medium">{notif.title}</p>
                      <p className="text-sm text-text-muted">{notif.desc}</p>
                    </div>
                    <Switch defaultChecked={notif.default} />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Webhook Notifications</CardTitle>
                <CardDescription>Configure webhook endpoints for real-time events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-surface rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Webhook Endpoints</h4>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                      Add Endpoint
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border">
                      <div>
                        <p className="font-mono text-sm">https://api.freshfold.com/webhooks/orders</p>
                        <p className="text-xs text-text-muted">Events: order.created, order.updated, order.completed</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="success">Active</Badge>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Data Mode</CardTitle>
                    <CardDescription>Switch between demo and live data modes</CardDescription>
                  </div>
                  <Badge variant={org.dataMode === 'live' ? 'success' : 'secondary'}>
                    {org.dataMode === 'live' ? 'Live' : 'Demo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface rounded-lg border">
                  <div>
                    <p className="font-medium">Current Mode</p>
                    <p className="text-sm text-text-muted">
                      {org.dataMode === 'demo'
                        ? 'Using demo data (sample products, customers, orders). Switch to live mode to use real data.'
                        : 'Using live data. Switch to demo mode to explore with sample data.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={org.dataMode === 'live'}
                      onCheckedChange={(checked) => handleDataModeToggle(checked ? 'live' : 'demo')}
                    />
                    <span className="text-sm font-medium">
                      {org.dataMode === 'live' ? 'Live' : 'Demo'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-text-muted">
                  Demo mode provides sample data for testing. Live mode shows your actual business data.
                  Switching modes does not delete any data.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Erase Demo Data</CardTitle>
                <CardDescription>Permanently remove all demo data while preserving test users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-surface rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Remove Demo Data</p>
                      <p className="text-sm text-text-muted">
                        This will delete all demo products, customers, orders, inventory, shifts, and receipts.
                        Test users (admin, manager, cashiers) will be preserved.
                      </p>
                    </div>
                    <Button
                      variant="danger"
                      onClick={handleEraseDemoData}
                      disabled={org.dataMode !== 'demo'}
                    >
                      <Trash className="h-4 w-4 mr-2" aria-hidden="true" />
                      Erase Demo Data
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-text-muted">
                  {org.dataMode === 'live'
                    ? 'Switch to demo mode first to erase demo data.'
                    : 'This action cannot be undone. Demo data can be re-seeded if needed.'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Import from Other POS</CardTitle>
                <CardDescription>Import customers, sales, and transactions from CSV/JSON files</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-surface rounded-lg border">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">Supported Formats</p>
                      <p className="text-sm text-text-muted">CSV, JSON (exported from Square, Toast, Lightspeed, Clover, etc.)</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="importType">Import Type</Label>
                      <Select value={importType} onValueChange={(v) => setImportType(v as 'customers' | 'products' | 'sales')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select import type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customers">Customers</SelectItem>
                          <SelectItem value="products">Products</SelectItem>
                          <SelectItem value="sales">Sales (Orders)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="importFile">Select File</Label>
                      <Input
                        id="importFile"
                        type="file"
                        accept=".csv,.json"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                        className="mt-2"
                      />
                      {importFile && (
                        <p className="text-sm text-text-muted mt-1">
                          Selected: {importFile.name} ({Math.round(importFile.size / 1024)} KB)
                        </p>
                      )}
                      <div className="mt-2 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadSampleCsv(importType)}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Download Sample CSV
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadSampleJson(importType)}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Download Sample JSON
                        </Button>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={handleImport}
                      disabled={importing || !importFile}
                    >
                      <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                      {importing ? 'Importing...' : 'Import'}
                    </Button>

                    {importResult && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="font-medium text-green-800 dark:text-green-200">Import Complete</p>
                        <div className="flex gap-4 text-sm mt-1">
                          <span className="text-green-700 dark:text-green-300">✓ Success: {importResult.success}</span>
                          {importResult.failed > 0 && (
                            <span className="text-red-700 dark:text-red-300">✗ Failed: {importResult.failed}</span>
                          )}
                        </div>
                        {importResult.errors.length > 0 && (
                          <details className="mt-2">
                            <summary className="text-sm text-text-muted cursor-pointer">View Errors</summary>
                            <ul className="mt-1 text-xs text-red-600 dark:text-red-400 space-y-1">
                              {importResult.errors.slice(0, 10).map((err, i) => (
                                <li key={i} className="font-mono">{err}</li>
                              ))}
                              {importResult.errors.length > 10 && (
                                <li>... and {importResult.errors.length - 10} more errors</li>
                              )}
                            </ul>
                          </details>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-3 mt-6 pt-4 border-t">
                    <div className="p-4 border-2 border-dashed rounded-lg text-center hover:border-accent transition-colors">
                      <Database className="h-8 w-8 mx-auto mb-2 text-text-muted" />
                      <p className="font-medium">Customers</p>
                      <p className="text-sm text-text-muted">Names, contacts, loyalty data</p>
                    </div>
                    <div className="p-4 border-2 border-dashed rounded-lg text-center hover:border-accent transition-colors">
                      <Database className="h-8 w-8 mx-auto mb-2 text-text-muted" />
                      <p className="font-medium">Products</p>
                      <p className="text-sm text-text-muted">SKUs, prices, inventory</p>
                    </div>
                    <div className="p-4 border-2 border-dashed rounded-lg text-center hover:border-accent transition-colors">
                      <Database className="h-8 w-8 mx-auto mb-2 text-text-muted" />
                      <p className="font-medium">Sales</p>
                      <p className="text-sm text-text-muted">Orders, line items, payments</p>
                    </div>
                  </div>
                  <p className="text-sm text-text-muted text-center">
                    Field mapping is automatic based on common POS export formats.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function OrganizationSettingsPageInner() {
  return (
    <Suspense fallback={
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Organization Settings</h1>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    }>
      <OrganizationSettingsContent />
    </Suspense>
  );
}

export default function OrganizationSettingsPageWrapper() {
  return (
    <PermissionGuard permission="settings" action="organization" fallback={<div />}>
      <OrganizationSettingsPageInner />
    </PermissionGuard>
  );
}