'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { ConsumptionRule } from './ConsumablesDashboardContent';

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

interface RuleEditDialogProps {
  rule: ConsumptionRule | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<ConsumptionRule>) => void;
  isSaving: boolean;
}

export function RuleEditDialog({ rule, open, onClose, onSave, isSaving }: RuleEditDialogProps) {

  const [detergentMl, setDetergentMl] = React.useState('');
  const [regularFabconMl, setRegularFabconMl] = React.useState('');
  const [importedFabconMl, setImportedFabconMl] = React.useState('');
  const [plasticsCount, setPlasticsCount] = React.useState('');
  const [gasKg, setGasKg] = React.useState('');

  React.useEffect(() => {
    if (rule) {
      setDetergentMl(String(rule.detergentMl));
      setRegularFabconMl(String(rule.regularFabconMl));
      setImportedFabconMl(String(rule.importedFabconMl));
      setPlasticsCount(String(rule.plasticsCount));
      setGasKg(String(rule.gasKg));
    }
  }, [rule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rule) return;

    const data: Partial<ConsumptionRule> = {};
    if (detergentMl !== '') data.detergentMl = Number(detergentMl);
    if (regularFabconMl !== '') data.regularFabconMl = Number(regularFabconMl);
    if (importedFabconMl !== '') data.importedFabconMl = Number(importedFabconMl);
    if (plasticsCount !== '') data.plasticsCount = Number(plasticsCount);
    if (gasKg !== '') data.gasKg = gasKg;

    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Consumption Rule</DialogTitle>
          <DialogDescription>
            {rule ? `${serviceTypeLabels[rule.serviceType]} • ${machineTypeLabels[rule.machineType]} • ${rule.hasImportedFabcon ? 'Imported (Downy)' : 'Regular'} Fabcon` : ''}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="detergentMl">Detergent (ml)</Label>
              <Input
                id="detergentMl"
                type="number"
                min="0"
                step="1"
                value={detergentMl}
                onChange={(e) => setDetergentMl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regularFabconMl">Regular Fabcon (ml)</Label>
              <Input
                id="regularFabconMl"
                type="number"
                min="0"
                step="1"
                value={regularFabconMl}
                onChange={(e) => setRegularFabconMl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="importedFabconMl">Imported Fabcon (ml)</Label>
              <Input
                id="importedFabconMl"
                type="number"
                min="0"
                step="1"
                value={importedFabconMl}
                onChange={(e) => setImportedFabconMl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plasticsCount">Plastics (pcs)</Label>
              <Input
                id="plasticsCount"
                type="number"
                min="0"
                step="1"
                value={plasticsCount}
                onChange={(e) => setPlasticsCount(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="gasKg">Gas (kg)</Label>
              <Input
                id="gasKg"
                type="number"
                min="0"
                step="0.001"
                value={gasKg}
                onChange={(e) => setGasKg(e.target.value)}
                placeholder="e.g., 0.150"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}