'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Copy, FileText } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

interface AuditLogDetail {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  oldData: Record<string, any> | null;
  newData: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | null;
}

const getActionBadge = (action: string) => {
  const variants: Record<string, 'default' | 'secondary' | 'danger' | 'outline' | 'success'> = {
    create: 'success',
    update: 'secondary',
    delete: 'danger',
    login: 'default',
    logout: 'default',
    view: 'outline',
    export: 'default',
    import: 'default',
    print: 'outline',
    refund: 'danger',
    void: 'danger',
  };
  return (
    <Badge variant={variants[action] || 'default'}>
      {action}
    </Badge>
  );
};

const getEntityTypeLabel = (type: string) => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

function formatJson(obj: Record<string, any> | null) {
  if (!obj) return '-';
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function AuditLogDetailContent() {
  const params = useParams();
  const id = params.id as string;
  const [log, setLog] = useState<AuditLogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLog = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/audit-logs/${id}`);
        if (res.ok) {
          const data = await res.json();
          setLog(data.auditLog);
        } else {
          setError('Failed to fetch audit log');
        }
      } catch (err) {
        console.error('Error fetching audit log:', err);
        setError('Failed to fetch audit log');
      } finally {
        setLoading(false);
      }
    };

    fetchLog();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !log) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Audit Log Not Found</h2>
            <p className="text-text-muted mb-4">The audit log you're looking for doesn't exist or has been removed.</p>
            <Link href="/audit-logs">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Audit Logs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/audit-logs">
          <Button variant="ghost" size="icon" aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log Detail</h1>
          <p className="text-muted-foreground">
            View detailed information about this activity
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="capitalize">{getEntityTypeLabel(log.entityType)} - {log.action}</CardTitle>
              <CardDescription>
                {log.user ? (
                  <>
                    {log.user.firstName} {log.user.lastName} ({log.user.role})
                  </>
                ) : (
                  'System'
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getActionBadge(log.action)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Entity ID</Label>
              <p className="font-mono text-sm text-text-muted">{log.entityId || '-'}</p>
            </div>
            <div className="space-y-2">
              <Label>Timestamp</Label>
              <p className="font-mono text-sm">{new Date(log.createdAt).toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <Label>User</Label>
              <p>
                {log.user ? (
                  <>
                    <span className="font-medium">{log.user.firstName} {log.user.lastName}</span>
                    <span className="text-text-muted ml-2">({log.user.email})</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">System</span>
                )}
              </p>
            </div>
            <div className="space-y-2">
              <Label>User Role</Label>
              <p>{log.user?.role || '-'}</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>IP Address</Label>
              <p className="font-mono text-sm text-text-muted">{log.ipAddress || '-'}</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>User Agent</Label>
              <p className="font-mono text-xs text-text-muted truncate max-w-full">{log.userAgent || '-'}</p>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Previous Data</Label>
                  <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(formatJson(log.oldData))}>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy JSON
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto">
                  {formatJson(log.oldData)}
                </pre>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>New Data</Label>
                  <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(formatJson(log.newData))}>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy JSON
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto">
                  {formatJson(log.newData)}
                </pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuditLogDetailPage() {
  return (
    <PermissionGuard permission="auditLogs">
      <AuditLogDetailContent />
    </PermissionGuard>
  );
}