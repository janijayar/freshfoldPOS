'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { ConsumablesDashboardContent } from '@/components/consumables/ConsumablesDashboardContent';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

type Location = {
  id: string;
  name: string;
  code: string;
};

function ConsumablesDashboardPageInner() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const locResponse = await fetch('/api/locations');
      if (!locResponse.ok) throw new Error('Failed to fetch locations');
      const locData = await locResponse.json();
      setLocations(locData.locations || []);
      if (locData.locations?.length > 0 && !selectedLocationId) {
        setSelectedLocationId(locData.locations[0].id);
      }
    } catch {
      setError('Failed to load locations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Consumables Dashboard</h1>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="h-32 bg-surface animate-pulse rounded" />
            <div className="h-32 bg-surface animate-pulse rounded" />
            <div className="h-32 bg-surface animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Consumables Dashboard</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-text-muted">{error}</p>
            <button onClick={fetchData} className="mt-4 text-accent hover:underline">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ConsumablesDashboardContent
      locations={locations}
      initialLocationId={selectedLocationId}
    />
  );
}

export default function ConsumablesDashboardPageWrapper() {
  return (
    <PermissionGuard permission="inventory" action="read">
      <Suspense fallback={
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
            <h1 className="text-xl font-bold">Consumables Dashboard</h1>
          </div>
          <div className="flex-1 p-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="h-32 bg-surface animate-pulse rounded" />
              <div className="h-32 bg-surface animate-pulse rounded" />
              <div className="h-32 bg-surface animate-pulse rounded" />
            </div>
          </div>
        </div>
      }>
        <ConsumablesDashboardPageInner />
      </Suspense>
    </PermissionGuard>
  );
}