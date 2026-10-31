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
  CreditCard,
  DollarSign,
  CheckCircle,
  XCircle,
  ExternalLink,
  Lock,
  Shield,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
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

type PaymentMethod = {
  id: string;
  name: string;
  type: 'card' | 'cash' | 'digital_wallet' | 'gift_card' | 'loyalty' | 'other';
  enabled: boolean;
  provider: string;
  fees: {
    fixed: number;
    percentage: number;
  };
  settings: Record<string, string>;
};

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'pm-1',
    name: 'Credit/Debit Cards',
    type: 'card',
    enabled: true,
    provider: 'Stripe Terminal',
    fees: { fixed: 0.30, percentage: 2.9 },
    settings: { terminalId: 'term-123', locationId: 'loc-1' },
  },
  {
    id: 'pm-2',
    name: 'Apple Pay / Google Pay',
    type: 'digital_wallet',
    enabled: true,
    provider: 'Stripe Terminal',
    fees: { fixed: 0.30, percentage: 2.9 },
    settings: { terminalId: 'term-123' },
  },
  {
    id: 'pm-3',
    name: 'Cash',
    type: 'cash',
    enabled: true,
    provider: 'Internal',
    fees: { fixed: 0, percentage: 0 },
    settings: { currency: 'USD', rounding: 'none' },
  },
  {
    id: 'pm-4',
    name: 'Gift Cards',
    type: 'gift_card',
    enabled: true,
    provider: 'Internal',
    fees: { fixed: 0, percentage: 0 },
    settings: { prefix: 'GFT', length: '16' },
  },
  {
    id: 'pm-5',
    name: 'Loyalty Points',
    type: 'loyalty',
    enabled: true,
    provider: 'Internal',
    fees: { fixed: 0, percentage: 0 },
    settings: { pointsPerDollar: '10', minRedemption: '100' },
  },
];

const paymentTypes = [
  { id: 'card', name: 'Credit/Debit Card', icon: CreditCard },
  { id: 'cash', name: 'Cash', icon: DollarSign },
  { id: 'digital_wallet', name: 'Digital Wallet', icon: CreditCard },
  { id: 'gift_card', name: 'Gift Card', icon: CreditCard },
  { id: 'loyalty', name: 'Loyalty Points', icon: Shield },
  { id: 'other', name: 'Other', icon: Settings },
];

const stripeModes = [
  { id: 'test', name: 'Test Mode', description: 'Use test API keys for development' },
  { id: 'live', name: 'Live Mode', description: 'Use live API keys for production' },
];

function PaymentSettingsContent() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [stripeMode, setStripeMode] = useState<'test' | 'live'>('test');
  const [stripePublishableKey, setStripePublishableKey] = useState('pk_test_...');
  const [stripeSecretKey, setStripeSecretKey] = useState('sk_test_...');
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('whsec_...');
  const [autoCapture, setAutoCapture] = useState(true);
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [requireCvc, setRequireCvc] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPaymentMethods(mockPaymentMethods);
    } catch {
      setError('Failed to load payment settings. Please try again.');
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

  const toggleMethod = (id: string) => {
    setPaymentMethods(paymentMethods.map(pm =>
      pm.id === id ? { ...pm, enabled: !pm.enabled } : pm
    ));
  };

  const removeMethod = (id: string) => {
    if (confirm('Are you sure you want to remove this payment method?')) {
      setPaymentMethods(paymentMethods.filter(pm => pm.id !== id));
    }
  };

  const getTypeLabel = (type: string) => {
    return paymentTypes.find(t => t.id === type)?.name || type;
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = paymentTypes.find(t => t.id === type);
    if (!typeConfig) return Settings;
    return typeConfig.icon;
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Payment Settings</h1>
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
          <h1 className="text-xl font-bold">Payment Settings</h1>
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
        <Tabs defaultValue="providers" onValueChange={() => {}}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="methods">Methods</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Stripe Terminal</CardTitle>
                    <CardDescription>Configure Stripe for in-person payments</CardDescription>
                  </div>
                  <Switch
                    checked={stripeMode === 'live'}
                    onCheckedChange={(checked) => setStripeMode(checked ? 'live' : 'test')}
                    aria-label="Stripe mode"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border">
                  <span className={cn('px-3 py-1 rounded-full text-sm font-medium',
                    stripeMode === 'live' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  )}>
                    {stripeMode === 'live' ? 'Live Mode' : 'Test Mode'}
                  </span>
                  <p className="text-sm text-text-muted">
                    {stripeMode === 'live'
                      ? 'Processing real payments with live API keys'
                      : 'Using test API keys - no real charges'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="publishableKey">Publishable Key</Label>
                    <div className="relative">
                      <Input
                        id="publishableKey"
                        type="password"
                        value={stripePublishableKey}
                        onChange={(e) => setStripePublishableKey(e.target.value)}
                        placeholder="pk_test_... or pk_live_..."
                        readOnly
                      />
                      <Button variant="ghost" size="sm" className="absolute right-2 top-2">
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secretKey">Secret Key</Label>
                    <div className="relative">
                      <Input
                        id="secretKey"
                        type="password"
                        value={stripeSecretKey}
                        onChange={(e) => setStripeSecretKey(e.target.value)}
                        placeholder="sk_test_... or sk_live_..."
                        readOnly
                      />
                      <Button variant="ghost" size="sm" className="absolute right-2 top-2">
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="webhookSecret">Webhook Signing Secret</Label>
                    <Input
                      id="webhookSecret"
                      type="password"
                      value={stripeWebhookSecret}
                      onChange={(e) => setStripeWebhookSecret(e.target.value)}
                      placeholder="whsec_..."
                      readOnly
                    />
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-medium">Payment Processing Options</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-capture payments</p>
                      <p className="text-sm text-text-muted">Automatically capture authorized payments</p>
                    </div>
                    <Switch checked={autoCapture} onCheckedChange={setAutoCapture} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Save payment methods</p>
                      <p className="text-sm text-text-muted">Allow customers to save cards for future use</p>
                    </div>
                    <Switch checked={savePaymentMethod} onCheckedChange={setSavePaymentMethod} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Require CVC</p>
                      <p className="text-sm text-text-muted">Require CVC for saved payment methods</p>
                    </div>
                    <Switch checked={requireCvc} onCheckedChange={setRequireCvc} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="methods" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Payment Methods</CardTitle>
                    <CardDescription>Enable or disable payment methods for this register</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                    Add Method
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {paymentMethods.length === 0 ? (
                  <EmptyTableState
                    title="No payment methods configured"
                    description="Add payment methods to accept payments."
                    icon={<CreditCard className="h-12 w-12 mx-auto text-text-muted/50" />}
                  />
                ) : (
                  <ScrollArea>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Method</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Provider</TableHead>
                          <TableHead>Fees</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentMethods.map((method) => (
                          <TableRow key={method.id}>
                            <TableCell className="font-medium">{method.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const Icon = getTypeIcon(method.type);
                                  return <Icon className="h-5 w-5 text-accent" />;
                                })()}
                                <span>{getTypeLabel(method.type)}</span>
                              </div>
                            </TableCell>
                            <TableCell>{method.provider}</TableCell>
                            <TableCell>
                              {method.fees.percentage > 0 || method.fees.fixed > 0 ? (
                                <>
                                  {method.fees.percentage > 0 && (
                                    <span className="font-mono">{method.fees.percentage}% + </span>
                                  )}
                                  {method.fees.fixed > 0 && (
                                    <span className="font-mono">${method.fees.fixed.toFixed(2)}</span>
                                  )}
                                  {method.fees.percentage === 0 && method.fees.fixed === 0 && (
                                    <span className="text-text-muted">No fees</span>
                                  )}
                                </>
                              ) : (
                                <span className="text-text-muted">No fees</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={method.enabled}
                                onCheckedChange={() => toggleMethod(method.id)}
                                aria-label={method.name}
                              />
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
                                    Configure
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-danger" onClick={() => removeMethod(method.id)}>
                                    <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                                    Remove
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

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security & Compliance</CardTitle>
                <CardDescription>PCI compliance and security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">PCI SAQ-A Compliant</p>
                        <p className="text-sm text-text-muted">Stripe handles all card data. No card numbers touch your servers.</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium">End-to-End Encryption</p>
                        <p className="text-sm text-text-muted">All terminal communication encrypted with TLS 1.2+</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-medium">Compliance Features</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span>PCI DSS SAQ-A eligibility</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span>Point-to-point encryption (P2PE)</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span>Tokenization - no card storage</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span>EMV chip & contactless support</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span>3D Secure for online payments</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span>Automatic fraud detection (Radar)</span>
                    </div>
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

function PaymentSettingsPageInner() {
  return (
    <Suspense fallback={
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Payment Settings</h1>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    }>
      <PaymentSettingsContent />
    </Suspense>
  );
}

export default function PaymentSettingsPageWrapper() {
  return (
    <PermissionGuard permission="settings" action="payments" fallback={<div />}>
      <PaymentSettingsPageInner />
    </PermissionGuard>
  );
}