'use client';

import React from 'react';
import { ChevronDown, Package } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { Location } from './ConsumablesDashboardContent';

interface HeaderViewProps {
  locations: Location[];
  selectedLocationId: string;
  onLocationChange: (id: string) => void;
  onReseed: () => void;
  isReseeding: boolean;
}

export function HeaderView({
  locations,
  selectedLocationId,
  onLocationChange,
  onReseed,
  isReseeding,
}: HeaderViewProps) {
  return (
    <Card className="border-b border-border bg-surface/50">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-accent" />
            <h1 className="text-xl font-bold">Consumables Dashboard</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-start sm:items-center">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-sm text-text-muted whitespace-nowrap">Location:</span>
              <Select value={selectedLocationId} onValueChange={onLocationChange}>
                <SelectTrigger className="w-full sm:w-[240px]">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onReseed}
              disabled={isReseeding}
              className="whitespace-nowrap"
            >
              {isReseeding ? 'Re-seeding...' : 'Re-seed Defaults'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}