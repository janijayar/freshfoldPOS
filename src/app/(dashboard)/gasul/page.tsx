'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, RefreshCw, Trash2, Edit, Package, Droplets, AlertTriangle, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

interface GasulTank {
  id: string;
  serialNumber: string;
  brand: string;
  capacityKg: number;
  tareWeightKg: number;
  status: 'full' | 'in_use' | 'empty' | 'reserve' | 'returned';
  notes: string | null;
  location: { name: string };
  refills: GasulRefill[];
  createdAt: string;
}

interface GasulRefill {
  id: string;
  tankId: string;
  quantity: number;
  pricePerTank: number;
  deliveryFee: number;
  totalAmount: number;
  status: 'ordered' | 'delivered' | 'cancelled';
  orderedAt: string;
  deliveredAt: string | null;
  invoiceNumber: string | null;
  tank: { serialNumber: string };
}

interface GasulUsage {
  id: string;
  tankId: string;
  equipment: string;
  startWeightKg: number;
  endWeightKg: number | null;
  consumedKg: number | null;
  startedAt: string;
  endedAt: string | null;
  recordedBy: { name: string };
  tank: { serialNumber: string };
}

function GasulTrackerPage() {
  const [tanks, setTanks] = useState<GasulTank[]>([]);
  const [refills, setRefills] = useState<GasulRefill[]>([]);
  const [usage, setUsage] = useState<GasulUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tanks' | 'refills' | 'usage'>('tanks');
  const [showTankModal, setShowTankModal] = useState(false);
  const [editingTank, setEditingTank] = useState<GasulTank | null>(null);
  const [tankForm, setTankForm] = useState({
    serialNumber: '',
    brand: '',
    capacityKg: '',
    tareWeightKg: '',
    status: 'full' as 'full' | 'in_use' | 'empty' | 'reserve' | 'returned',
    notes: '',
    locationId: '',
  });

  const fetchTanks = async () => {
    try {
      const res = await fetch('/api/gasul-tanks');
      if (res.ok) {
        const data = await res.json();
        setTanks(data.gasulTanks || []);
      }
    } catch (error) {
      console.error('Error fetching tanks:', error);
    }
  };

  const fetchRefills = async () => {
    try {
      const res = await fetch('/api/gasul-refills');
      if (res.ok) {
        const data = await res.json();
        setRefills(data.gasulRefills || []);
      }
    } catch (error) {
      console.error('Error fetching refills:', error);
    }
  };

  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/gasul-usage');
      if (res.ok) {
        const data = await res.json();
        setUsage(data.gasulUsage || []);
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTanks(), fetchRefills(), fetchUsage()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleTankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTank ? `/api/gasul-tanks/${editingTank.id}` : '/api/gasul-tanks';
      const method = editingTank ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tankForm,
          capacityKg: parseInt(tankForm.capacityKg),
          tareWeightKg: parseInt(tankForm.tareWeightKg),
        }),
      });
      if (res.ok) {
        setShowTankModal(false);
        setEditingTank(null);
        setTankForm({
          serialNumber: '',
          brand: '',
          capacityKg: '',
          tareWeightKg: '',
          status: 'full',
          notes: '',
          locationId: '',
        });
        await fetchTanks();
      }
    } catch (error) {
      console.error('Error saving tank:', error);
    }
  };

  const handleDeleteTank = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tank?')) return;
    try {
      const res = await fetch(`/api/gasul-tanks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchTanks();
      }
    } catch (error) {
      console.error('Error deleting tank:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'danger' | 'outline'> = {
      full: 'default',
      in_use: 'secondary',
      empty: 'danger',
      reserve: 'outline',
      returned: 'secondary',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getRefillStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'danger' | 'outline'> = {
      ordered: 'outline',
      delivered: 'default',
      cancelled: 'danger',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gasul Tracker</h1>
          <p className="text-muted-foreground">
            Monitor LPG tank inventory, refills, and usage
          </p>
        </div>
        {activeTab === 'tanks' && (
          <Button onClick={() => { setEditingTank(null); setShowTankModal(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tank
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'tanks' | 'refills' | 'usage')} className="space-y-4">
        <TabsList>
          <TabsTrigger value="tanks">Tanks ({tanks.length})</TabsTrigger>
          <TabsTrigger value="refills">Refills ({refills.length})</TabsTrigger>
          <TabsTrigger value="usage">Usage Log ({usage.length})</TabsTrigger>
        </TabsList>

        {/* Tanks Tab */}
        <TabsContent value="tanks">
          <Card>
            <CardHeader>
              <CardTitle>LPG Tanks</CardTitle>
              <CardDescription>Track tank status, capacity, and location</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Capacity (kg)</TableHead>
                    <TableHead>Tare Weight (kg)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tanks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No tanks found. Click "Add Tank" to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tanks.map((tank) => (
                      <TableRow key={tank.id}>
                        <TableCell className="font-mono">{tank.serialNumber}</TableCell>
                        <TableCell>{tank.brand}</TableCell>
                        <TableCell>{tank.capacityKg} kg</TableCell>
                        <TableCell>{tank.tareWeightKg} kg</TableCell>
                        <TableCell>{getStatusBadge(tank.status)}</TableCell>
                        <TableCell>{tank.location?.name || 'N/A'}</TableCell>
                        <TableCell className="max-w-xs truncate">{tank.notes || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => {
                            setEditingTank(tank);
                            setTankForm({
                              serialNumber: tank.serialNumber,
                              brand: tank.brand,
                              capacityKg: tank.capacityKg.toString(),
                              tareWeightKg: tank.tareWeightKg.toString(),
                              status: tank.status,
                              notes: tank.notes || '',
                              locationId: '',
                            });
                            setShowTankModal(true);
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteTank(tank.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Refills Tab */}
        <TabsContent value="refills">
          <Card>
            <CardHeader>
              <CardTitle>Refill History</CardTitle>
              <CardDescription>Track LPG tank refill orders and deliveries</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tank</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price/Tank</TableHead>
                    <TableHead>Delivery Fee</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ordered</TableHead>
                    <TableHead>Delivered</TableHead>
                    <TableHead>Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No refill records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    refills.map((refill) => (
                      <TableRow key={refill.id}>
                        <TableCell className="font-mono">{refill.tank?.serialNumber || 'N/A'}</TableCell>
                        <TableCell>{refill.quantity}</TableCell>
                        <TableCell>{formatCurrency(refill.pricePerTank)}</TableCell>
                        <TableCell>{formatCurrency(refill.deliveryFee)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(refill.totalAmount)}</TableCell>
                        <TableCell>{getRefillStatusBadge(refill.status)}</TableCell>
                        <TableCell>{new Date(refill.orderedAt).toLocaleDateString()}</TableCell>
                        <TableCell>{refill.deliveredAt ? new Date(refill.deliveredAt).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="font-mono text-sm">{refill.invoiceNumber || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Usage Log</CardTitle>
              <CardDescription>Track LPG consumption by equipment</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tank</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Start Weight (kg)</TableHead>
                    <TableHead>End Weight (kg)</TableHead>
                    <TableHead>Consumed (kg)</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Ended</TableHead>
                    <TableHead>Recorded By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usage.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No usage records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    usage.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono">{record.tank?.serialNumber || 'N/A'}</TableCell>
                        <TableCell>{record.equipment}</TableCell>
                        <TableCell>{record.startWeightKg?.toFixed(2) || '-'}</TableCell>
                        <TableCell>{record.endWeightKg?.toFixed(2) || '-'}</TableCell>
                        <TableCell className="font-semibold text-primary">{record.consumedKg?.toFixed(2) || '-'}</TableCell>
                        <TableCell>{new Date(record.startedAt).toLocaleString()}</TableCell>
                        <TableCell>{record.endedAt ? new Date(record.endedAt).toLocaleString() : '-'}</TableCell>
                        <TableCell>{record.recordedBy?.name || 'N/A'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Tank Modal */}
      {showTankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>{editingTank ? 'Edit Tank' : 'Add New Tank'}</CardTitle>
            </CardHeader>
            <form onSubmit={handleTankSubmit} className="space-y-4 p-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input id="serialNumber" value={tankForm.serialNumber} onChange={(e) => setTankForm({ ...tankForm, serialNumber: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input id="brand" value={tankForm.brand} onChange={(e) => setTankForm({ ...tankForm, brand: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacityKg">Capacity (kg)</Label>
                    <Input id="capacityKg" type="number" value={tankForm.capacityKg} onChange={(e) => setTankForm({ ...tankForm, capacityKg: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tareWeightKg">Tare Weight (kg)</Label>
                    <Input id="tareWeightKg" type="number" value={tankForm.tareWeightKg} onChange={(e) => setTankForm({ ...tankForm, tareWeightKg: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={tankForm.status} onValueChange={(value) => setTankForm({ ...tankForm, status: value as any })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full</SelectItem>
                      <SelectItem value="in_use">In Use</SelectItem>
                      <SelectItem value="empty">Empty</SelectItem>
                      <SelectItem value="reserve">Reserve</SelectItem>
                      <SelectItem value="returned">Returned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input id="notes" value={tankForm.notes} onChange={(e) => setTankForm({ ...tankForm, notes: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setShowTankModal(false); setEditingTank(null); }}>
                  Cancel
                </Button>
                <Button type="submit">{editingTank ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function GasulPage() {
  return (
    <PermissionGuard permission="gasul">
      <GasulTrackerPage />
    </PermissionGuard>
  );
}