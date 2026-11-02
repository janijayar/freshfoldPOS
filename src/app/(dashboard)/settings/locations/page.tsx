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
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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

type Location = {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
  timezone: string;
  currency: string;
  isActive: boolean;
  isDefault: boolean;
  registersCount: number;
  staffCount: number;
  monthlyRevenue: number;
  createdAt: string;
};

const mockLocations: Location[] = [
  {
    id: 'loc-1',
    name: 'Main Street Store',
    code: 'MAIN',
    address: '123 Main Street',
    city: 'San Francisco',
    state: 'CA',
    zip: '94102',
    country: 'US',
    phone: '+1 (555) 123-4567',
    email: 'main@freshfold.com',
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    isActive: true,
    isDefault: true,
    registersCount: 3,
    staffCount: 12,
    monthlyRevenue: 125000,
    createdAt: '2024-01-15',
  },
  {
    id: 'loc-2',
    name: 'Downtown Branch',
    code: 'DTWN',
    address: '456 Market Street',
    city: 'San Francisco',
    state: 'CA',
    zip: '94103',
    country: 'US',
    phone: '+1 (555) 234-5678',
    email: 'downtown@freshfold.com',
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    isActive: true,
    isDefault: false,
    registersCount: 2,
    staffCount: 8,
    monthlyRevenue: 87500,
    createdAt: '2024-06-20',
  },
  {
    id: 'loc-3',
    name: 'Oakland Warehouse',
    code: 'WHSE',
    address: '789 Broadway',
    city: 'Oakland',
    state: 'CA',
    zip: '94607',
    country: 'US',
    phone: '+1 (555) 345-6789',
    email: 'warehouse@freshfold.com',
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    isActive: true,
    isDefault: false,
    registersCount: 1,
    staffCount: 5,
    monthlyRevenue: 45000,
    createdAt: '2025-03-10',
  },
  {
    id: 'loc-4',
    name: 'Berkeley Pop-up',
    code: 'POP',
    address: '321 University Ave',
    city: 'Berkeley',
    state: 'CA',
    zip: '94704',
    country: 'US',
    phone: '+1 (555) 456-7890',
    email: 'popup@freshfold.com',
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    isActive: false,
    isDefault: false,
    registersCount: 1,
    staffCount: 3,
    monthlyRevenue: 12000,
    createdAt: '2025-08-01',
  },
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

function MultiLocationListContent() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setLocations(mockLocations);
    } catch {
      setError('Failed to load locations. Please try again.');
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

  const handleSetDefault = (id: string) => {
    setLocations(locations.map(loc => ({
      ...loc,
      isDefault: loc.id === id,
    })));
  };

  const handleToggleActive = (id: string) => {
    setLocations(locations.map(loc =>
      loc.id === id ? { ...loc, isActive: !loc.isActive } : loc
    ));
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
      setLocations(locations.filter(loc => loc.id !== id));
    }
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

  const activeLocations = locations.filter(l => l.isActive).length;
  const totalRegisters = locations.reduce((sum, l) => sum + l.registersCount, 0);
  const totalStaff = locations.reduce((sum, l) => sum + l.staffCount, 0);
  const totalRevenue = locations.reduce((sum, l) => sum + l.monthlyRevenue, 0);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Locations</h1>
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
          <h1 className="text-xl font-bold">Locations</h1>
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
        <Button variant="primary">
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Add Location
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Locations"
            value={locations.length}
            icon={Building2}
            subtitle={`${activeLocations} active`}
          />
          <StatCard
            title="Registers"
            value={totalRegisters}
            icon={Settings}
            subtitle="Across all locations"
          />
          <StatCard
            title="Staff"
            value={totalStaff}
            icon={Users}
            subtitle="Total employees"
          />
          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(totalRevenue)}
            icon={DollarSign}
            subtitle="Combined revenue"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Locations</CardTitle>
            <CardDescription>Manage your business locations</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {locations.length === 0 ? (
              <EmptyTableState
                title="No locations configured"
                description="Add your first location to get started."
                icon={<Building2 className="h-12 w-12 mx-auto text-text-muted/50" />}
              />
            ) : (
              <ScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Registers</TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead>Monthly Revenue</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{location.name}</p>
                              {location.isDefault && (
                                <Badge variant="success" className="text-xs">Default</Badge>
                              )}
                            </div>
                            <p className="text-sm text-text-muted">{location.city}, {location.state}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{location.code}</TableCell>
                        <TableCell className="text-sm">
                          {location.address}<br />
                          {location.city}, {location.state} {location.zip}
                        </TableCell>
                        <TableCell>{location.registersCount}</TableCell>
                        <TableCell>{location.staffCount}</TableCell>
                        <TableCell className="font-mono">{formatCurrency(location.monthlyRevenue)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={location.isActive}
                              onCheckedChange={() => handleToggleActive(location.id)}
                              aria-label={`${location.name} active`}
                            />
                            <span className="text-sm">
                              {location.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="More actions">
                                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <a href={`/settings/locations/${location.id}`}>
                                  <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                                  Edit Location
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a href={`/settings/store?location=${location.id}`}>
                                  <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
                                  Store Settings
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a href={`/settings/register?location=${location.id}`}>
                                  <Building className="h-4 w-4 mr-2" aria-hidden="true" />
                                  Register Settings
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {!location.isDefault && (
                                <DropdownMenuItem onClick={() => handleSetDefault(location.id)}>
                                  <CheckCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                                  Set as Default
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-danger" onClick={() => handleDelete(location.id)}>
                                <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                                Delete Location
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
      </div>
    </div>
  );
}

function MultiLocationListPageInner() {
  return (
    <Suspense fallback={
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Locations</h1>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
          <SkeletonCard className="h-80" />
        </div>
      </div>
    }>
      <MultiLocationListContent />
    </Suspense>
  );
}

export default function MultiLocationListPageWrapper() {
  return (
    <PermissionGuard permission="settings" action="locations">
      <MultiLocationListPageInner />
    </PermissionGuard>
  );
}