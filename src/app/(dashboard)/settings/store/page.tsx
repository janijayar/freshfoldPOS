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
  Building,
  DollarSign,
  Receipt,
  MapPin,
  Globe,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
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
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

type StoreSettings = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  timezone: string;
  currency: string;
  currencySymbol: string;
  taxIncluded: boolean;
  receiptHeader: string;
  receiptFooter: string;
  businessHours: {
    day: string;
    open: string;
    close: string;
    closed: boolean;
  }[];
};

const mockStore: StoreSettings = {
  id: 'loc-1',
  name: 'Main Street Store',
  address: '123 Main Street',
  city: 'San Francisco',
  state: 'CA',
  zip: '94102',
  country: 'US',
  phone: '+1 (555) 123-4567',
  email: 'main@freshfold.com',
  website: 'https://freshfold.com/main',
  timezone: 'America/Los_Angeles',
  currency: 'USD',
  currencySymbol: '$',
  taxIncluded: false,
  receiptHeader: 'Thank you for visiting!',
  receiptFooter: 'Visit us again soon. Follow us @freshfold',
  businessHours: [
    { day: 'Monday', open: '07:00', close: '21:00', closed: false },
    { day: 'Tuesday', open: '07:00', close: '21:00', closed: false },
    { day: 'Wednesday', open: '07:00', close: '21:00', closed: false },
    { day: 'Thursday', open: '07:00', close: '21:00', closed: false },
    { day: 'Friday', open: '07:00', close: '22:00', closed: false },
    { day: 'Saturday', open: '08:00', close: '22:00', closed: false },
    { day: 'Sunday', open: '09:00', close: '20:00', closed: false },
  ],
};

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

const timezones = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const states = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

function StoreSettingsContent() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [store, setStore] = useState<StoreSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'localization' | 'receipt' | 'hours'>('general');

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setStore(mockStore);
    } catch {
      setError('Failed to load store settings. Please try again.');
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
    if (store) {
      setStore({ ...store, [field]: value });
    }
  };

  const handleNestedChange = (field: string, nestedField: string, value: any) => {
    if (store) {
      setStore({
        ...store,
        [field]: {
          ...store[field as keyof StoreSettings] as object,
          [nestedField]: value,
        },
      });
    }
  };

  const handleBusinessHoursChange = (index: number, field: string, value: any) => {
    if (store) {
      const newHours = [...store.businessHours];
      newHours[index] = { ...newHours[index], [field]: value };
      setStore({ ...store, businessHours: newHours });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // In real app, would call API to save
    } catch {
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Store Settings</h1>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !store) {
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
          <h1 className="text-xl font-bold">Store Settings</h1>
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

      <div className="flex-1 overflow-auto p-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'general' | 'localization' | 'receipt' | 'hours')}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="localization">Localization</TabsTrigger>
            <TabsTrigger value="receipt">Receipt</TabsTrigger>
            <TabsTrigger value="hours">Business Hours</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
                <CardDescription>Basic information about this location</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Store Name *</Label>
                    <Input
                      id="name"
                      value={store.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="Enter store name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={store.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={store.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="store@freshfold.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={store.website}
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
                        value={store.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={store.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        placeholder="San Francisco"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Select value={store.state} onValueChange={(v) => handleChange('state', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map((s) => (
                            <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="zip">ZIP</Label>
                      <Input
                        id="zip"
                        value={store.zip}
                        onChange={(e) => handleChange('zip', e.target.value)}
                        placeholder="94102"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={store.country}
                        onChange={(e) => handleChange('country', e.target.value)}
                        placeholder="US"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="localization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Localization</CardTitle>
                <CardDescription>Currency, timezone, and regional settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="timezone">Timezone *</Label>
                    <Select value={store.timezone} onValueChange={(v) => handleChange('timezone', v)}>
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
                    <Label htmlFor="currency">Currency *</Label>
                    <Select value={store.currency} onValueChange={(v) => handleChange('currency', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.code} - {c.name} ({c.symbol})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currencySymbol">Currency Symbol</Label>
                    <Input
                      id="currencySymbol"
                      value={store.currencySymbol}
                      onChange={(e) => handleChange('currencySymbol', e.target.value)}
                      placeholder="$"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Tax Included in Prices</Label>
                      <p className="text-sm text-text-muted">Display prices with tax included</p>
                    </div>
                    <Switch
                      checked={store.taxIncluded}
                      onCheckedChange={(checked) => handleChange('taxIncluded', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receipt" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Receipt Customization</CardTitle>
                <CardDescription>Customize the header and footer text on receipts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="receiptHeader">Receipt Header</Label>
                  <Textarea
                    id="receiptHeader"
                    value={store.receiptHeader}
                    onChange={(e) => handleChange('receiptHeader', e.target.value)}
                    placeholder="Thank you for visiting!"
                    rows={3}
                  />
                  <p className="text-sm text-text-muted mt-1">Shown at the top of every receipt</p>
                </div>
                <div>
                  <Label htmlFor="receiptFooter">Receipt Footer</Label>
                  <Textarea
                    id="receiptFooter"
                    value={store.receiptFooter}
                    onChange={(e) => handleChange('receiptFooter', e.target.value)}
                    placeholder="Visit us again soon..."
                    rows={3}
                  />
                  <p className="text-sm text-text-muted mt-1">Shown at the bottom of every receipt</p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Preview</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm max-w-xs">
                    <div className="text-center mb-2">
                      <p className="font-bold">{store.name}</p>
                      <p className="text-xs">{store.address}, {store.city}, {store.state} {store.zip}</p>
                      <p className="text-xs">{store.phone}</p>
                    </div>
                    <div className="border-t my-2"></div>
                    <p className="text-center text-xs mb-2">{store.receiptHeader}</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span>Coffee</span><span>{store.currencySymbol}5.00</span></div>
                      <div className="flex justify-between"><span>Pastry</span><span>{store.currencySymbol}3.50</span></div>
                    </div>
                    <div className="border-t my-2"></div>
                    <div className="flex justify-between font-bold"><span>Total</span><span>{store.currencySymbol}8.50</span></div>
                    <div className="border-t my-2"></div>
                    <p className="text-center text-xs">{store.receiptFooter}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hours" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Hours</CardTitle>
                <CardDescription>Set opening hours for each day of the week</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {store.businessHours.map((hours, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-surface rounded-lg border">
                    <div className="w-24 font-medium">{hours.day}</div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!hours.closed}
                        onCheckedChange={(checked) => handleBusinessHoursChange(index, 'closed', !checked)}
                        aria-label={`${hours.day} open`}
                      />
                      <span className="text-sm text-text-muted w-16">
                        {hours.closed ? 'Closed' : 'Open'}
                      </span>
                    </div>
                    {!hours.closed && (
                      <>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`open-${index}`} className="sr-only">Open time</Label>
                          <Input
                            id={`open-${index}`}
                            type="time"
                            value={hours.open}
                            onChange={(e) => handleBusinessHoursChange(index, 'open', e.target.value)}
                            className="w-32"
                          />
                          <span className="text-text-muted">to</span>
                          <Input
                            id={`close-${index}`}
                            type="time"
                            value={hours.close}
                            onChange={(e) => handleBusinessHoursChange(index, 'close', e.target.value)}
                            className="w-32"
                          />
                        </div>
                      </>
                    )}
                    {hours.closed && (
                      <div className="text-text-muted text-sm">Closed</div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StoreSettingsPageInner() {
  return (
    <Suspense fallback={
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Store Settings</h1>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    }>
      <StoreSettingsContent />
    </Suspense>
  );
}

export default function StoreSettingsPageWrapper() {
  return (
    <PermissionGuard permission="settings" action="store" fallback={<div />}>
      <StoreSettingsPageInner />
    </PermissionGuard>
  );
}