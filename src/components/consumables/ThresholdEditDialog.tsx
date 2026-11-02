'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

import type { ConsumableThreshold } from './ConsumablesDashboardContent';

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

interface ThresholdEditDialogProps {
  threshold: ConsumableThreshold | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<ConsumableThreshold>) => void;
  isSaving: boolean;
}

export function ThresholdEditDialog({ threshold, open, onClose, onSave, isSaving }: ThresholdEditDialogProps) {
  const [minimumQty, setMinimumQty] = React.useState('');
  const [unit, setUnit] = React.useState('');

  React.useEffect(() => {
    if (threshold) {
      setMinimumQty(String(threshold.minimumQty));
      setUnit(threshold.unit);
    }
  }, [threshold]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!threshold) return;

    const data: Partial<ConsumableThreshold> = {};
    if (minimumQty !== '') data.minimumQty = Number(minimumQty);
    if (unit !== '') data.unit = unit as 'ml' | 'kg' | 'pcs';

    if (data.unit && !['ml', 'kg', 'pcs'].includes(data.unit)) {
      toast.error('Invalid unit: must be ml, kg, or pcs');
      return;
    }

    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Threshold</DialogTitle>
          <DialogDescription>
            {threshold ? `${consumableLabels[threshold.consumableType]} • Current: ${threshold.minimumQty} ${consumableUnits[threshold.consumableType]}` : ''}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minimumQty">Minimum Quantity</Label>
              <Input
                id="minimumQty"
                type="number"
                min="0"
                step="1"
                value={minimumQty}
                onChange={(e) => setMinimumQty(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="pcs">pcs</SelectItem>
                </SelectContent>
              </Select>
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