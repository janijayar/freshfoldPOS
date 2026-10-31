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
  Printer,
  Barcode,
  CreditCard,
  Usb,
  Bluetooth,
  Wifi,
  CheckCircle,
  XCircle,
  RefreshCw,
  TestTube,
  Trash2,
  Plus,
  Edit,
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
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

type HardwareDevice = {
  id: string;
  name: string;
  type: 'printer' | 'scanner' | 'cash_drawer' | 'payment_terminal' | 'scale' | 'customer_display';
  connection: 'usb' | 'bluetooth' | 'network' | 'serial';
  status: 'connected' | 'disconnected' | 'error' | 'configuring';
  model: string;
  driver: string;
  lastSeen: string;
  settings: Record<string, string>;
};

const mockDevices: HardwareDevice[] = [
  {
    id: 'dev-1',
    name: 'Receipt Printer',
    type: 'printer',
    connection: 'network',
    status: 'connected',
    model: 'Epson TM-m30III',
    driver: 'ESC/POS',
    lastSeen: '2 minutes ago',
    settings: { ip: '192.168.1.100', port: '9100', paperWidth: '80mm' },
  },
  {
    id: 'dev-2',
    name: 'Barcode Scanner',
    type: 'scanner',
    connection: 'bluetooth',
    status: 'connected',
    model: 'Zebra DS2278',
    driver: 'HID',
    lastSeen: '5 minutes ago',
    settings: { prefix: '', suffix: 'Enter', beep: 'enabled' },
  },
  {
    id: 'dev-3',
    name: 'Cash Drawer',
    type: 'cash_drawer',
    connection: 'usb',
    status: 'connected',
    model: 'APG Vasario 1616',
    driver: 'CDP',
    lastSeen: '1 minute ago',
    settings: { trigger: 'printer', delay: '0' },
  },
  {
    id: 'dev-4',
    name: 'Payment Terminal',
    type: 'payment_terminal',
    connection: 'network',
    status: 'connected',
    model: 'Stripe BBPOS WisePOS E',
    driver: 'Stripe Terminal SDK',
    lastSeen: 'Just now',
    settings: { locationId: 'loc-1', serial: 'BBPOS-123456' },
  },
  {
    id: 'dev-5',
    name: 'Customer Display',
    type: 'customer_display',
    connection: 'usb',
    status: 'disconnected',
    model: 'Logic Controls LD9000',
    driver: 'USB CDC',
    lastSeen: '2 hours ago',
    settings: { brightness: '80', contrast: '50' },
  },
];

const deviceTypes = [
  { id: 'printer', name: 'Receipt Printer', icon: Printer },
  { id: 'scanner', name: 'Barcode Scanner', icon: Barcode },
  { id: 'cash_drawer', name: 'Cash Drawer', icon: CreditCard },
  { id: 'payment_terminal', name: 'Payment Terminal', icon: CreditCard },
  { id: 'scale', name: 'Scale', icon: Settings },
  { id: 'customer_display', name: 'Customer Display', icon: Settings },
];

const connectionTypes = [
  { id: 'usb', name: 'USB', icon: Usb },
  { id: 'bluetooth', name: 'Bluetooth', icon: Bluetooth },
  { id: 'network', name: 'Network (Ethernet/WiFi)', icon: Wifi },
  { id: 'serial', name: 'Serial (RS-232)', icon: Usb },
];

function RegisterSettingsContent() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [devices, setDevices] = useState<HardwareDevice[]>([]);
  const [activeTab, setActiveTab] = useState<'devices' | 'add'>('devices');
  const [editingDevice, setEditingDevice] = useState<HardwareDevice | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setDevices(mockDevices);
    } catch {
      setError('Failed to load hardware devices. Please try again.');
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

  const handleTestPrint = async (device: HardwareDevice) => {
    // In real app, would send test print command
    alert(`Test print sent to ${device.name}`);
  };

  const handleTestOpen = async (device: HardwareDevice) => {
    // In real app, would send cash drawer open command
    alert(`Open command sent to ${device.name}`);
  };

  const handleRemove = (deviceId: string) => {
    if (confirm('Are you sure you want to remove this device?')) {
      setDevices(devices.filter(d => d.id !== deviceId));
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig: Record<string, { variant: 'success' | 'warning' | 'danger' | 'secondary'; label: string }> = {
      connected: { variant: 'success', label: 'Connected' },
      disconnected: { variant: 'secondary', label: 'Disconnected' },
      error: { variant: 'danger', label: 'Error' },
      configuring: { variant: 'warning', label: 'Configuring' },
    };
    const config = statusConfig[status] || statusConfig.disconnected;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const DeviceIcon = ({ type }: { type: string }) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      printer: Printer,
      scanner: Barcode,
      cash_drawer: CreditCard,
      payment_terminal: CreditCard,
      scale: Settings,
      customer_display: Settings,
    };
    const Icon = icons[type] || Settings;
    return <Icon className="h-5 w-5 text-accent" />;
  };

  const ConnectionIcon = ({ connection }: { connection: string }) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      usb: Usb,
      bluetooth: Bluetooth,
      network: Wifi,
      serial: Usb,
    };
    const Icon = icons[connection] || Usb;
    return <Icon className="h-4 w-4 text-text-muted" />;
  };

  const getTypeLabel = (type: string) => {
    return deviceTypes.find(t => t.id === type)?.name || type;
  };

  const getConnectionLabel = (connection: string) => {
    return connectionTypes.find(c => c.id === connection)?.name || connection;
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Register Settings</h1>
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
          <h1 className="text-xl font-bold">Register Settings</h1>
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
          <Button variant="primary" onClick={() => setActiveTab('add')}>
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Add Device
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'devices' | 'add')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="devices">Connected Devices</TabsTrigger>
            <TabsTrigger value="add">Add Device</TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hardware Devices</CardTitle>
                <CardDescription>Manage all hardware connected to this register</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {devices.length === 0 ? (
                  <EmptyTableState
                    title="No devices configured"
                    description="Add your first hardware device to get started."
                    icon={<Settings className="h-12 w-12 mx-auto text-text-muted/50" />}
                  />
                ) : (
                  <ScrollArea>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Device</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Connection</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Model</TableHead>
                          <TableHead>Driver</TableHead>
                          <TableHead>Last Seen</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {devices.map((device) => (
                          <TableRow key={device.id}>
                            <TableCell className="font-medium">{device.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <DeviceIcon type={device.type} />
                                <span>{getTypeLabel(device.type)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <ConnectionIcon connection={device.connection} />
                                <span>{getConnectionLabel(device.connection)}</span>
                              </div>
                            </TableCell>
                            <TableCell><StatusBadge status={device.status} /></TableCell>
                            <TableCell>{device.model}</TableCell>
                            <TableCell className="font-mono text-sm">{device.driver}</TableCell>
                            <TableCell className="text-text-muted text-sm">{device.lastSeen}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" aria-label="More actions">
                                    <Edit className="h-4 w-4" aria-hidden="true" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {device.type === 'printer' && (
                                    <DropdownMenuItem onClick={() => handleTestPrint(device)}>
                                      <TestTube className="h-4 w-4 mr-2" aria-hidden="true" />
                                      Test Print
                                    </DropdownMenuItem>
                                  )}
                                  {device.type === 'cash_drawer' && (
                                    <DropdownMenuItem onClick={() => handleTestOpen(device)}>
                                      <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                                      Test Open
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => setEditingDevice(device)}>
                                    <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                                    Configure
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-danger" onClick={() => handleRemove(device.id)}>
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

          <TabsContent value="add" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Device</CardTitle>
                <CardDescription>Configure a new hardware device for this register</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="deviceName">Device Name *</Label>
                    <Input
                      id="deviceName"
                      placeholder="e.g., Receipt Printer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deviceType">Device Type *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select device type" />
                      </SelectTrigger>
                      <SelectContent>
                        {deviceTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="connection">Connection Type *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select connection" />
                      </SelectTrigger>
                      <SelectContent>
                        {connectionTypes.map((conn) => (
                          <SelectItem key={conn.id} value={conn.id}>{conn.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      placeholder="e.g., Epson TM-m30III"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="driver">Driver</Label>
                    <Input
                      id="driver"
                      placeholder="e.g., ESC/POS, HID, CDP"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Connection Settings</h4>
                  <p className="text-sm text-text-muted mb-4">Settings vary by connection type. Common fields shown below.</p>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="ipAddress">IP Address</Label>
                      <Input
                        id="ipAddress"
                        type="text"
                        placeholder="192.168.1.100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="port">Port</Label>
                      <Input
                        id="port"
                        type="number"
                        placeholder="9100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="serialNumber">Serial Number</Label>
                      <Input
                        id="serialNumber"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button variant="primary" disabled={isSaving}>
                      <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                      {isSaving ? 'Saving...' : 'Add Device'}
                    </Button>
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

function RegisterSettingsPageInner() {
  return (
    <Suspense fallback={
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Register Settings</h1>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    }>
      <RegisterSettingsContent />
    </Suspense>
  );
}

export default function RegisterSettingsPageWrapper() {
  return (
    <PermissionGuard permission="settings" action="register" fallback={<div />}>
      <RegisterSettingsPageInner />
    </PermissionGuard>
  );
}