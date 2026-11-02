'use client';

import React from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { ConsumableThreshold, ConsumptionRule } from '../ConsumablesDashboardContent';

const thresholdStatusLabels = {
  OK: { label: 'OK', variant: 'success' as const, icon: CheckCircle },
  WARNING: { label: 'WARNING', variant: 'warning' as const, icon: AlertTriangle },
  LOW: { label: 'LOW', variant: 'danger' as const, icon: AlertTriangle },
};

const consumableLabels: Record<ConsumableThreshold['consumableType'], string> = {
  DETERGENT: 'Detergent',
  REGULAR_FABCON: 'Regular Fabcon',
  IMPORTED_FABCON: 'Imported Fabcon (Downy)',
  PLASTICS: 'Plastics',
  GASUL: 'Gas',
};

const consumableUnits: Record<ConsumableThreshold['consumableType'], string> = {
  DETERGENT: 'ml',
  REGULAR_FABCON: 'ml',
  IMPORTED_FABCON: 'ml',
  PLASTICS: 'pcs',
  GASUL: 'kg',
};

interface ThresholdsTabProps {
  thresholds: ConsumableThreshold[];
  rules: ConsumptionRule[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterConsumableType: string;
  setFilterConsumableType: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  onEdit: (threshold: ConsumableThreshold) => void;
}

export function ThresholdsTab({
  thresholds,
  rules,
  searchQuery,
  setSearchQuery,
  filterConsumableType,
  setFilterConsumableType,
  filterStatus,
  setFilterStatus,
  onEdit,
}: ThresholdsTabProps) {
  const thresholdsWithStatus = thresholds.map((threshold) => {
    const relevantRules = rules.filter((r) => r.locationId === threshold.locationId);
    let totalPerCycle = 0;

    switch (threshold.consumableType) {
      case 'DETERGENT':
        totalPerCycle = relevantRules.reduce((sum, r) => sum + r.detergentMl, 0) / relevantRules.length || 0;
        break;
      case 'REGULAR_FABCON':
        totalPerCycle = relevantRules.reduce((sum, r) => sum + r.regularFabconMl, 0) / relevantRules.length || 0;
        break;
      case 'IMPORTED_FABCON':
        totalPerCycle = relevantRules.reduce((sum, r) => sum + r.importedFabconMl, 0) / relevantRules.length || 0;
        break;
      case 'PLASTICS':
        totalPerCycle = relevantRules.reduce((sum, r) => sum + r.plasticsCount, 0) / relevantRules.length || 0;
        break;
      case 'GASUL':
        totalPerCycle = relevantRules.reduce((sum, r) => sum + parseFloat(r.gasKg), 0) / relevantRules.length || 0;
        break;
    }

    const cyclesPerDay = 50;
    const dailyUsage = totalPerCycle * cyclesPerDay;
    const daysRemaining = dailyUsage > 0 ? threshold.minimumQty / dailyUsage : 999;

    let status: 'OK' | 'WARNING' | 'LOW' = 'OK';
    if (daysRemaining <= 1) status = 'LOW';
    else if (daysRemaining <= 3) status = 'WARNING';

    return { ...threshold, totalPerCycle, dailyUsage, daysRemaining: Math.round(daysRemaining), status };
  });

  const filteredThresholds = thresholdsWithStatus.filter((t) => {
    const matchesSearch = t.consumableType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterConsumableType === 'all' || t.consumableType === filterConsumableType;
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <TabsContent value="thresholds" className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Consumable Thresholds</CardTitle>
              <CardDescription>
                Monitor inventory levels and get alerts when consumables run low.
                Thresholds are compared against estimated daily usage from consumption rules.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 p-4 bg-surface rounded-lg border">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Search thresholds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterConsumableType} onValueChange={setFilterConsumableType}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Consumable Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(consumableLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="OK">✓ OK</SelectItem>
                <SelectItem value="WARNING">⚠ Warning</SelectItem>
                <SelectItem value="LOW">🔴 Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface">
                  <TableHead className="w-52">Consumable</TableHead>
                  <TableHead className="w-32">Unit</TableHead>
                  <TableHead className="w-36">Min Qty</TableHead>
                  <TableHead className="w-36">Per Cycle</TableHead>
                  <TableHead className="w-36">Daily Usage</TableHead>
                  <TableHead className="w-32">Days Left</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredThresholds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-text-muted">
                      No thresholds found. Try re-seeding defaults.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredThresholds.map((t) => {
                    const statusInfo = thresholdStatusLabels[t.status];
                    const StatusIcon = statusInfo.icon;
                    return (
                      <TableRow key={t.id} className="hover:bg-accent-muted/50">
                        <TableCell className="font-medium">{consumableLabels[t.consumableType]}</TableCell>
                        <TableCell>{consumableUnits[t.consumableType]}</TableCell>
                        <TableCell>{t.minimumQty} {consumableUnits[t.consumableType]}</TableCell>
                        <TableCell>
                          {t.consumableType === 'GASUL'
                            ? parseFloat(t.totalPerCycle.toString()).toFixed(3) + ' kg'
                            : Math.round(t.totalPerCycle) + ' ' + consumableUnits[t.consumableType]}
                        </TableCell>
                        <TableCell>
                          {t.consumableType === 'GASUL'
                            ? t.dailyUsage.toFixed(2) + ' kg'
                            : Math.round(t.dailyUsage) + ' ' + consumableUnits[t.consumableType]}
                        </TableCell>
                        <TableCell className="font-mono font-medium">
                          {t.daysRemaining > 99 ? '99+' : t.daysRemaining}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => onEdit(t)} className="text-text-muted hover:text-accent">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}