'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, BellOff, Check, MessageSquare, CreditCard, Package, UserPlus, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

type Notification = {
  id: string;
  type: 'order' | 'payment' | 'inventory' | 'customer' | 'system' | 'shift';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
};

const mockNotifications: Notification[] = [
  { id: '1', type: 'order', title: 'New Order Received', message: 'Order #ORD-0042 for $45.50 at Register 1', read: false, createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), actionUrl: '/pos', actionLabel: 'View Order' },
  { id: '2', type: 'payment', title: 'Payment Successful', message: 'Stripe payment of $125.00 processed', read: false, createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), actionUrl: '/receipts', actionLabel: 'View Receipt' },
  { id: '3', type: 'inventory', title: 'Low Stock Alert', message: 'Cold Brew running low (5 remaining)', read: true, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), actionUrl: '/inventory', actionLabel: 'Restock' },
  { id: '4', type: 'customer', title: 'New Customer', message: 'John Smith joined loyalty program', read: true, createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), actionUrl: '/customers', actionLabel: 'View Customer' },
  { id: '5', type: 'system', title: 'Shift Closed', message: 'Morning shift closed with $2,100.00 sales', read: true, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), actionUrl: '/shifts', actionLabel: 'View Shift' },
  { id: '6', type: 'shift', title: 'Shift Opened', message: 'Evening shift opened by James Wilson', read: true, createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() },
];

const ICONS = {
  order: Package, payment: CreditCard, inventory: Package,
  customer: UserPlus, system: Settings, shift: MessageSquare,
};

const TYPE_COLORS = {
  order: 'bg-blue-100 text-blue-700', payment: 'bg-green-100 text-green-700',
  inventory: 'bg-orange-100 text-orange-700', customer: 'bg-purple-100 text-purple-700',
  system: 'bg-gray-100 text-gray-700', shift: 'bg-indigo-100 text-indigo-700',
};

function formatTimeAgo(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
}

function NotificationsContent() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const filtered = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;
  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const del = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));
  const act = (n: Notification) => { if (n.actionUrl) router.push(n.actionUrl); markRead(n.id); };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-xl font-bold">Notifications</h1>
            {unreadCount > 0 && <Badge variant="secondary" className="mt-1 gap-1"><Bell className="h-3 w-3" />{unreadCount} unread</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && <Button variant="outline" size="sm" onClick={markAllRead}><Check className="h-4 w-4 mr-2" />Mark all as read</Button>}
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><span className="capitalize">{filter}</span></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setFilter('all')}>All</DropdownMenuItem><DropdownMenuItem onClick={() => setFilter('unread')}>Unread</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 p-4 space-y-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4">
          {filtered.length === 0 ? (
            <EmptyState
              title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              description={filter === 'unread' ? 'All caught up!' : 'Notifications appear here for orders, payments, alerts.'}
              icon={<BellOff className="h-12 w-12 mx-auto text-text-muted/50" />}
            />
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {filtered.map(n => {
                  const Icon = ICONS[n.type] || Bell;
                  const color = TYPE_COLORS[n.type] || 'bg-gray-100 text-gray-700';
                  return (
                    <Card key={n.id} className={cn('flex items-start gap-3 p-3', !n.read && 'bg-accent/5 border-accent/20')}>
                      <div className={cn('p-2 rounded-lg flex-shrink-0', color)}><Icon className="h-5 w-5" /></div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('font-medium', !n.read ? 'text-text' : 'text-text-muted')}>{n.title}</p>
                        <p className={cn('text-sm mt-1', !n.read ? 'text-text' : 'text-text-muted')}>{n.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {!n.read && <Badge variant="outline" className="text-xs gap-1" onClick={(e) => { e.stopPropagation(); markRead(n.id); }}><Check className="h-3 w-3" />Mark as read</Badge>}
                          {n.actionUrl && <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); act(n); }}>{n.actionLabel || 'View'}</Button>}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationsPageInner() {
  return (
    <Suspense fallback={
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface"><h1 className="text-xl font-bold">Notifications</h1></div>
        <div className="flex-1 p-4 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      </div>
    }>
      <NotificationsContent />
    </Suspense>
  );
}

export default function NotificationsPage() {
  return (
    <PermissionGuard permission="notifications" action="view" fallback={<div />}>
      <NotificationsPageInner />
    </PermissionGuard>
  );
}