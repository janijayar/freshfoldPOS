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
  Users,
  Building,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Eye,
  ArrowUpDown,
  RefreshCw,
  Filter,
  MoreHorizontal,
  Trash2,
  MapPin,
  CreditCard,
  Store,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton, SkeletonTable, SkeletonCard } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyTableState } from '@/components/ui/empty-state';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

type Location = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
  isDefault: boolean;
  isActive: boolean;
  currency: string;
  currencySymbol: string;
  registersCount: number;
  staffCount: number;
  revenueCents: number;
  ordersCount: number;
  createdAt: Date;
};

const mockLocations: Location[] = [
  {
    id: 'loc-1',
    name: 'Main Street Store',
    address: '123 Main Street',
    city: 'San Francisco',
    state: 'CA',
    zip: '94102',
    country: 'US',
    phone: '+1 (555) 123-4567',
    email: 'main@freshfold.com',
    isDefault: true,
    isActive: true,
    currency: 'USD',
    currencySymbol: '$',
    registersCount: 2,
    staffCount: 5,
    revenueCents: 1245678,
    ordersCount: 342,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'loc-2',
    name: 'Downtown Mall',
    address: '456 Market Street',
    city: 'San Francisco',
    state: 'CA',
    zip: '94103',
    country: 'US',
    phone: '+1 (555) 234-5678',
    email: 'downtown@freshfold.com',
    isDefault: false,
    isActive: true,
    currency: 'USD',
    currencySymbol: '$',
    registersCount: 3,
    staffCount: 8,
    revenueCents: 987654,
    ordersCount: 256,
    createdAt: new Date('2024-02-15'),
  },
  {
    id: 'loc-3',
    name: 'Airport Terminal B',
    address: '789 Airport Blvd',
    city: 'San Francisco',
    state: 'CA',
    zip: '94128',
    country: 'US',
    phone: '+1 (555) 345-6789',
    email: 'airport@freshfold.com',
    isDefault: false,
    isActive: false,
    currency: 'USD',
    currencySymbol: '$',
    registersCount: 1,
    staffCount: 2,
    revenueCents: 234567,
    ordersCount: 89,
    createdAt: new Date('2024-03-01'),
  },
  {
    id: 'loc-4',
    name: 'Westside Plaza',
    address: '321 Ocean Avenue',
    city: 'San Francisco',
    state: 'CA',
    zip: '94132',
    country: 'US',
    phone: '+1 (555) 456-7890',
    email: 'westside@freshfold.com',
    isDefault: false,
    isActive: true,
    currency: 'USD',
    currencySymbol: '$',
    registersCount: 2,
    staffCount: 4,
    revenueCents: 567890,
    ordersCount: 178,
    createdAt: new Date('2024-04-10'),
  },
];

type SortConfig = { key: keyof Location; direction: 'asc' | 'desc' } | null;

function LocationsPageInner() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
  const [filters, setFilters] = useState({ status: 'all', search: '' });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    city: '',
    state: 'CA',
    zip: '',
    country: 'US',
    phone: '',
    email: '',
    currency: 'USD',
    currencySymbol: '$',
  });

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

  const handleSort = (key: keyof Location) => {
    setSortConfig((current) => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const filteredLocations = locations.filter((loc) => {
    if (filters.status === 'active' && !loc.isActive) return false;
    if (filters.status === 'inactive' && loc.isActive) return false;
    if (filters.search && !loc.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !loc.city.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const sortedLocations = [...filteredLocations].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    let aVal: any = a[key];
    let bVal: any = b[key];
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedLocations = sortedLocations.slice(
    (pagination.page - 1) * pagination.pageSize,
    pagination.page * pagination.pageSize
  );

  const totalPages = Math.ceil(sortedLocations.length / pagination.pageSize);

  const handleSaveLocation = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (editingLocation) {
        setLocations(locations.map((l) => (l.id === editingLocation.id ? { ...l, ...editingLocation } : l)));
      } else {
        const newLoc: Location = {
          id: `loc-${Date.now()}`,
          ...newLocation,
          isDefault: false,
          isActive: true,
          registersCount: 0,
          staffCount: 0,
          revenueCents: 0,
          ordersCount: 0,
          createdAt: new Date(),
        };
        setLocations([newLoc, ...locations]);
        setNewLocation({ name: '', address: '', city: '', state: 'CA', zip: '', country: 'US', phone: '', email: '', currency: 'USD', currencySymbol: '$' });
      }
      setEditingLocation(null);
    } catch {
      setError('Failed to save location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = (locationId: string) => {
    setLocations(locations.map((l) => ({ ...l, isDefault: l.id === locationId })));
  };

  const handleToggleActive = (location: Location) => {
    setLocations(locations.map((l) => (l.id === location.id ? { ...l, isActive: !l.isActive } : l)));
  };

  const handleDelete = (locationId: string) => {
    if (confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
      setLocations(locations.filter(l => l.id !== locationId));
    }
  };

  const SortIcon = ({ key }: { key: keyof Location }) => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="h-4 w-4 text-text-muted" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 text-accent" /> : <ChevronDown className="h-4 w-4 text-accent" />;
  };

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  ];

  const states = [
    { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
  ];

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Locations</h1>
          <Button variant="primary"><Plus className="h-4 w-4 mr-2" /> Add Location</Button>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <SkeletonCard />
          <SkeletonCard />
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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} aria-label="Refresh">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={!!editingLocation || !!newLocation.name} onOpenChange={(open) => { if (!open) { setEditingLocation(null); setNewLocation({ name: '', address: '', city: '', state: 'CA', zip: '', country: 'US', phone: '', email: '', currency: 'USD', currencySymbol: '$' }); } }}>
            <DialogTrigger asChild>
              <Button variant="primary"><Plus className="h-4 w-4 mr-2" /> Add Location</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingLocation ? 'Edit Location' : 'Add New Location'}</DialogTitle>
                <DialogDescription>Enter location details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2 grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="locName">Location Name *</Label>
                  <Input
                    id="locName"
                    value={editingLocation ? editingLocation.name : newLocation.name}
                    onChange={(e) => editingLocation ? setEditingLocation({ ...editingLocation!, name: e.target.value }) : setNewLocation({ ...newLocation, name: e.target.value })}
                    placeholder="Enter location name"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="locAddress">Address</Label>
                  <Input
                    id="locAddress"
                    value={editingLocation ? editingLocation.address : newLocation.address}
                    onChange={(e) => editingLocation ? setEditingLocation({ ...editingLocation!, address: e.target.value }) : setNewLocation({ ...newLocation, address: e.target.value })}
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <Label htmlFor="locCity">City</Label>
                  <Input
                    id="locCity"
                    value={editingLocation ? editingLocation.city : newLocation.city}
                    onChange={(e) => editingLocation ? setEditingLocation({ ...editingLocation!, city: e.target.value }) : setNewLocation({ ...newLocation, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="locState">State</Label>
                  <Select value={editingLocation ? editingLocation.state : newLocation.state} onValueChange={(v) => editingLocation ? setEditingLocation({ ...editingLocation!, state: v }) : setNewLocation({ ...newLocation, state: v })}>
                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>
                      {states.map((s) => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="locZip">ZIP</Label>
                  <Input
                    id="locZip"
                    value={editingLocation ? editingLocation.zip : newLocation.zip}
                    onChange={(e) => editingLocation ? setEditingLocation({ ...editingLocation!, zip: e.target.value }) : setNewLocation({ ...newLocation, zip: e.target.value })}
                    placeholder="ZIP code"
                  />
                </div>
                <div>
                  <Label htmlFor="locCountry">Country</Label>
                  <Input
                    id="locCountry"
                    value={editingLocation ? editingLocation.country : newLocation.country}
                    onChange={(e) => editingLocation ? setEditingLocation({ ...editingLocation!, country: e.target.value }) : setNewLocation({ ...newLocation, country: e.target.value })}
                    placeholder="US"
                  />
                </div>
                <div>
                  <Label htmlFor="locPhone">Phone</Label>
                  <Input
                    id="locPhone"
                    type="tel"
                    value={editingLocation ? editingLocation.phone : newLocation.phone}
                    onChange={(e) => editingLocation ? setEditingLocation({ ...editingLocation!, phone: e.target.value }) : setNewLocation({ ...newLocation, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="locEmail">Email</Label>
                  <Input
                    id="locEmail"
                    type="email"
                    value={editingLocation ? editingLocation.email : newLocation.email}
                    onChange={(e) => editingLocation ? setEditingLocation({ ...editingLocation!, email: e.target.value }) : setNewLocation({ ...newLocation, email: e.target.value })}
                    placeholder="location@freshfold.com"
                  />
                </div>
                <div>
                  <Label htmlFor="locCurrency">Currency</Label>
                  <Select value={editingLocation ? editingLocation.currency : newLocation.currency} onValueChange={(v) => editingLocation ? setEditingLocation({ ...editingLocation!, currency: v }) : setNewLocation({ ...newLocation, currency: v })}>
                    <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => <SelectItem key={c.code} value={c.code}>{c.code} - {c.name} ({c.symbol})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setEditingLocation(null); setNewLocation({ name: '', address: '', city: '', state: 'CA', zip: '', country: 'US', phone: '', email: '', currency: 'USD', currencySymbol: '$' }); }}>Cancel</Button>
                <Button variant="primary" onClick={handleSaveLocation} disabled={!editingLocation && !newLocation.name}>
                  {editingLocation ? 'Save Changes' : 'Add Location'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Locations</CardTitle>
                <CardDescription>Manage your store locations</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Search locations..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-[200px]"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {paginatedLocations.length === 0 ? (
              <EmptyTableState
                title="No locations found"
                description="Add your first location to get started."
                icon={<Building className="h-12 w-12 mx-auto text-text-muted/50" />}
              />
            ) : (
              <ScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                        <div className="flex items-center gap-2">Location <SortIcon key="name" /></div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('registersCount')}>
                        <div className="flex items-center gap-2">Registers <SortIcon key="registersCount" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('staffCount')}>
                        <div className="flex items-center gap-2">Staff <SortIcon key="staffCount" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('revenueCents')}>
                        <div className="flex items-center gap-2">Revenue <SortIcon key="revenueCents" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('ordersCount')}>
                        <div className="flex items-center gap-2">Orders <SortIcon key="ordersCount" /></div>
                      </TableHead>
                      <TableHead className="w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLocations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{location.name}</span>
                              {location.isDefault && <Badge variant="default" className="text-xs">Default</Badge>}
                            </div>
                            <p className="text-sm text-text-muted">{location.address}, {location.city}, {location.state} {location.zip}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={location.isActive}
                              onCheckedChange={() => handleToggleActive(location)}
                              aria-label={`${location.name} active`}
                            />
                            <Badge variant={location.isActive ? 'success' : 'secondary'}>
                              {location.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono tabular-nums">
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3 text-text-muted" />
                            {location.registersCount}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono tabular-nums">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-text-muted" />
                            {location.staffCount}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono tabular-nums">{formatCurrency(location.revenueCents)}</TableCell>
                        <TableCell className="font-mono tabular-nums">{location.ordersCount}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="More actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!location.isDefault && (
                                <DropdownMenuItem onClick={() => handleSetDefault(location.id)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Set as Default
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setEditingLocation(location)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/settings/store?id=${location.id}`)}>
                                <Store className="h-4 w-4 mr-2" />
                                Store Settings
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/settings/register?location=${location.id}`)}>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Register Settings
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-danger" onClick={() => handleDelete(location.id)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  {totalPages > 1 && (
                    <TableFooter>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-muted">
                          Page {pagination.page} of {totalPages} ({sortedLocations.length} locations)
                        </span>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })} disabled={pagination.page === 1} aria-label="Previous page">
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })} disabled={pagination.page === totalPages} aria-label="Next page">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </TableFooter>
                  )}
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LocationsPage() {
  return (
    <PermissionGuard permission="settings" action="locations">
      <Suspense fallback={
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
            <h1 className="text-xl font-bold">Locations</h1>
            <Button variant="primary"><Plus className="h-4 w-4 mr-2" /> Add Location</Button>
          </div>
          <div className="flex-1 p-4 space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      }>
        <LocationsPageInner />
      </Suspense>
    </PermissionGuard>
  );
}