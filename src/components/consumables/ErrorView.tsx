'use client';

import React from 'react';
import { Package, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorViewProps {
  error: string;
  onRetry: () => void;
}

export function ErrorView({ error, onRetry }: ErrorViewProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-accent" />
          <h1 className="text-xl font-bold">Consumables Dashboard</h1>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-text-muted mb-4">{error}</div>
          <Button variant="outline" onClick={onRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}