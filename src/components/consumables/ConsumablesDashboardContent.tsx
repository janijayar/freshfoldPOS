'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Package, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { HeaderView } from './HeaderView';
import { RulesTab } from './tabs/RulesTab';
import { ThresholdsTab } from './tabs/ThresholdsTab';
import { RuleEditDialog } from './RuleEditDialog';
import { ThresholdEditDialog } from './ThresholdEditDialog';
import { LoadingView } from './LoadingView';
import { ErrorView } from './ErrorView';

export type ConsumptionRule = {
  id: string;
  locationId: string;
  serviceType: 'REGULAR' | 'DELUXE' | 'EXTRA_DRY' | 'EXTRA_WASH' | 'HAND_WASH';
  machineType: 'LG_GIANT' | 'LG_TITAN';
  hasImportedFabcon: boolean;
  detergentMl: number;
  regularFabconMl: number;
  importedFabconMl: number;
  plasticsCount: number;
  gasKg: string;
  createdAt: string;
  updatedAt: string;
};

export type ConsumableThreshold = {
  id: string;
  locationId: string;
  consumableType: 'DETERGENT' | 'REGULAR_FABCON' | 'IMPORTED_FABCON' | 'PLASTICS' | 'GASUL';
  minimumQty: number;
  unit: 'ml' | 'kg' | 'pcs';
  createdAt: string;
  updatedAt: string;
};

export type Location = {
  id: string;
  name: string;
  code: string;
};

type ConsumablesDashboardContentProps = {
  locations: Location[];
  initialLocationId: string;
};

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

export function ConsumablesDashboardContent({ locations, initialLocationId }: ConsumablesDashboardContentProps) {
  const [viewState, setViewState] = useState<'loading' | 'error' | 'main'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(initialLocationId);
  const [consumptionRules, setConsumptionRules] = useState<ConsumptionRule[]>([]);
  const [thresholds, setThresholds] = useState<ConsumableThreshold[]>([]);
  const [activeTab, setActiveTab] = useState<'rules' | 'thresholds'>('rules');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterServiceType, setFilterServiceType] = useState<string>('all');
  const [filterMachineType, setFilterMachineType] = useState<string>('all');
  const [filterFabcon, setFilterFabcon] = useState<string>('all');
  const [filterConsumableType, setFilterConsumableType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingRule, setEditingRule] = useState<ConsumptionRule | null>(null);
  const [editingThreshold, setEditingThreshold] = useState<ConsumableThreshold | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isReseeding, setIsReseeding] = useState(false);

  const fetchConsumables = async (locationId: string) => {
    setViewState('loading');
    setError(null);
    try {
      const [rulesRes, thresholdsRes] = await Promise.all([
        fetch(`/api/consumption-rules?locationId=${locationId}`),
        fetch(`/api/consumable-thresholds?locationId=${locationId}`),
      ]);
      if (!rulesRes.ok) throw new Error('Failed to fetch consumption rules');
      if (!thresholdsRes.ok) throw new Error('Failed to fetch consumable thresholds');
      const rulesData = await rulesRes.json();
      const thresholdsData = await thresholdsRes.json();
      setConsumptionRules(rulesData.rules || []);
      setThresholds(thresholdsData.thresholds || []);
      setViewState('main');
    } catch {
      setError('Failed to load consumables data');
      setViewState('error');
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (selectedLocationId) {
      fetchConsumables(selectedLocationId);
    }
  }, [selectedLocationId]);

  const handleRuleEdit = (rule: ConsumptionRule) => {
    setEditingRule(rule);
  };

  const handleThresholdEdit = (threshold: ConsumableThreshold) => {
    setEditingThreshold(threshold);
  };

  const handleRuleSave = async (data: Partial<ConsumptionRule>) => {
    if (!editingRule || !selectedLocationId) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/consumption-rules/${editingRule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update rule');
      toast.success('Consumption rule updated');
      setEditingRule(null);
      fetchConsumables(selectedLocationId);
    } catch {
      toast.error('Failed to update rule');
    }
    finally { setIsSaving(false); }
  };

  const handleThresholdSave = async (data: Partial<ConsumableThreshold>) => {
    if (!editingThreshold || !selectedLocationId) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/consumable-thresholds/${editingThreshold.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update threshold');
      toast.success('Threshold updated');
      setEditingThreshold(null);
      fetchConsumables(selectedLocationId);
    } catch {
      toast.error('Failed to update threshold');
    }
    finally { setIsSaving(false); }
  };

  const handleReSeed = async () => {
    if (!selectedLocationId) return;
    if (!confirm('Re-seed default consumption rules and thresholds for this location? This will overwrite any custom changes.')) return;
    setIsReseeding(true);
    try {
      const response = await fetch('/api/consumables/reseed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId: selectedLocationId }),
      });
      if (!response.ok) throw new Error('Failed to re-seed');
      toast.success('Consumables re-seeded with defaults');
      fetchConsumables(selectedLocationId);
    } catch {
      toast.error('Failed to re-seed');
    }
    finally { setIsReseeding(false); }
  };

  const filteredRules = useMemo(() => consumptionRules.filter(rule => {
    if (filterServiceType !== 'all' && rule.serviceType !== filterServiceType) return false;
    if (filterMachineType !== 'all' && rule.machineType !== filterMachineType) return false;
    if (filterFabcon !== 'all' && rule.hasImportedFabcon !== (filterFabcon === 'true')) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!serviceTypeLabels[rule.serviceType].toLowerCase().includes(query) && !machineTypeLabels[rule.machineType].toLowerCase().includes(query)) return false;
    }
    return true;
  }), [consumptionRules, filterServiceType, filterMachineType, filterFabcon, searchQuery]);

  if (viewState === 'loading') return <LoadingView />;
  if (viewState === 'error') return <ErrorView error={error || 'Failed to load data'} onRetry={() => fetchConsumables(selectedLocationId)} />;

  return (
    <div className="h-full flex flex-col">
      <HeaderView
        locations={locations}
        selectedLocationId={selectedLocationId}
        onLocationChange={setSelectedLocationId}
        onReseed={handleReSeed}
        isReseeding={isReseeding}
      />
      <div className="flex-1 overflow-auto p-4 space-y-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'rules' | 'thresholds')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rules"><Package className="h-4 w-4 mr-2" /> Consumption Rules ({filteredRules.length})</TabsTrigger>
            <TabsTrigger value="thresholds"><AlertTriangle className="h-4 w-4 mr-2" /> Thresholds ({thresholds.length})</TabsTrigger>
          </TabsList>
          <RulesTab
            filteredRules={filteredRules}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterServiceType={filterServiceType}
            setFilterServiceType={setFilterServiceType}
            filterMachineType={filterMachineType}
            setFilterMachineType={setFilterMachineType}
            filterFabcon={filterFabcon}
            setFilterFabcon={setFilterFabcon}
            onEdit={handleRuleEdit}
          />
          <ThresholdsTab
            thresholds={thresholds}
            rules={consumptionRules}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterConsumableType={filterConsumableType}
            setFilterConsumableType={setFilterConsumableType}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            onEdit={handleThresholdEdit}
          />
        </Tabs>
      </div>
      <RuleEditDialog
        rule={editingRule}
        open={!!editingRule}
        onClose={() => setEditingRule(null)}
        onSave={handleRuleSave}
        isSaving={isSaving}
      />
      <ThresholdEditDialog
        threshold={editingThreshold}
        open={!!editingThreshold}
        onClose={() => setEditingThreshold(null)}
        onSave={handleThresholdSave}
        isSaving={isSaving}
      />
    </div>
  );
}