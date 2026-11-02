'use client';

import React from 'react';
import {
  Package,
  Search,
  Flame as FlameIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { ConsumptionRule } from '../ConsumablesDashboardContent';

const serviceTypeLabels: Record<ConsumptionRule['serviceType'], string> = {
  REGULAR: 'Regular Wash',
  DELUXE: 'Deluxe Wash',
  EXTRA_DRY: 'Extra Dry',
  EXTRA_WASH: 'Extra Wash',
  HAND_WASH: 'Hand Wash',
};

const machineTypeLabels: Record<ConsumptionRule['machineType'], string> = {
  LG_GIANT: 'LG Giant',
  LG_TITAN: 'LG Titan',
};

interface RulesTabProps {
  filteredRules: ConsumptionRule[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterServiceType: string;
  setFilterServiceType: (v: string) => void;
  filterMachineType: string;
  setFilterMachineType: (v: string) => void;
  filterFabcon: string;
  setFilterFabcon: (v: string) => void;
  onEdit: (rule: ConsumptionRule) => void;
}

export function RulesTab({
  filteredRules,
  searchQuery,
  setSearchQuery,
  filterServiceType,
  setFilterServiceType,
  filterMachineType,
  setFilterMachineType,
  filterFabcon,
  setFilterFabcon,
  onEdit,
}: RulesTabProps) {
  return (
    <TabsContent value="rules" className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Consumption Rules</CardTitle>
              <CardDescription>
                Define consumable usage per service type, machine, and fabcon combination.
                20 rules per location (5 services × 2 machines × 2 fabcon states).
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 p-4 bg-surface rounded-lg border">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Search rules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterServiceType} onValueChange={setFilterServiceType}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Service Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {Object.entries(serviceTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterMachineType} onValueChange={setFilterMachineType}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Machine" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Machines</SelectItem>
                {Object.entries(machineTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterFabcon} onValueChange={setFilterFabcon}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Fabcon Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fabcon</SelectItem>
                <SelectItem value="true">Imported (Downy)</SelectItem>
                <SelectItem value="false">Regular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface">
                  <TableHead className="w-48">Service Type</TableHead>
                  <TableHead className="w-36">Machine</TableHead>
                  <TableHead className="w-40">Fabcon</TableHead>
                  <TableHead className="w-32">Detergent (ml)</TableHead>
                  <TableHead className="w-32">Reg. Fabcon (ml)</TableHead>
                  <TableHead className="w-32">Imp. Fabcon (ml)</TableHead>
                  <TableHead className="w-28">Plastics</TableHead>
                  <TableHead className="w-28">Gas (kg)</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-text-muted">
                      No consumption rules found. Try re-seeding defaults.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRules.map((rule) => (
                    <TableRow key={rule.id} className="hover:bg-accent-muted/50">
                      <TableCell className="font-medium">{serviceTypeLabels[rule.serviceType]}</TableCell>
                      <TableCell>{machineTypeLabels[rule.machineType]}</TableCell>
                      <TableCell>
                        <Badge variant={rule.hasImportedFabcon ? 'success' : 'secondary'}>
                          {rule.hasImportedFabcon ? 'Imported (Downy)' : 'Regular'}
                        </Badge>
                      </TableCell>
                      <TableCell>{rule.detergentMl} ml</TableCell>
                      <TableCell>{rule.regularFabconMl} ml</TableCell>
                      <TableCell>{rule.importedFabconMl} ml</TableCell>
                      <TableCell>{rule.plasticsCount} pcs</TableCell>
                      <TableCell>{parseFloat(rule.gasKg).toFixed(3)} kg</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(rule)} className="text-text-muted hover:text-accent">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-accent/30 bg-accent-muted/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlameIcon className="h-5 w-5 text-orange-600" />
            Gas Usage Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-3 bg-surface rounded-lg border">
              <p className="font-medium text-orange-600">LG Giant (11kg/50kg)</p>
              <p className="text-sm text-text-muted">Normal: 0.150 kg/cycle</p>
              <p className="text-sm text-text-muted">Extra Dry (10min): 0.040 kg/cycle</p>
            </div>
            <div className="p-3 bg-surface rounded-lg border">
              <p className="font-medium text-orange-600">LG Titan (11kg/50kg)</p>
              <p className="text-sm text-text-muted">Normal: 0.200 kg/cycle</p>
              <p className="text-sm text-text-muted">Extra Dry (10min): 0.050 kg/cycle</p>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-2">
            Extra Dry = 10 minutes = 25% of 40-minute normal cycle. Gas scales proportionally.
          </p>
        </CardContent>
      </Card>
    </TabsContent>
  );
}