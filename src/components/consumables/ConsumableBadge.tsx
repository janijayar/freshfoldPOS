'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

type ConsumableStatus = 'OK' | 'WARNING' | 'LOW';

const statusConfig: Record<ConsumableStatus, { variant: 'success' | 'warning' | 'danger'; icon: React.ComponentType<{ className?: string }>; label: string }> = {
  OK: { variant: 'success', icon: CheckCircle, label: 'OK' },
  WARNING: { variant: 'warning', icon: AlertTriangle, label: 'WARNING' },
  LOW: { variant: 'danger', icon: AlertCircle, label: 'LOW' },
};

interface ConsumableBadgeProps {
  status: ConsumableStatus;
  showLabel?: boolean;
}

export function ConsumableBadge({ status, showLabel = true }: ConsumableBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {showLabel && config.label}
    </Badge>
  );
}