'use client';

import React from 'react';
import { Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function LoadingView() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-accent" />
          <h1 className="text-xl font-bold">Consumables Dashboard</h1>
        </div>
      </div>
      <div className="flex-1 p-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="h-32 bg-surface animate-pulse rounded" />
          <div className="h-32 bg-surface animate-pulse rounded" />
          <div className="h-32 bg-surface animate-pulse rounded" />
        </div>
        <div className="h-96 bg-surface animate-pulse rounded" />
      </div>
    </div>
  );
}