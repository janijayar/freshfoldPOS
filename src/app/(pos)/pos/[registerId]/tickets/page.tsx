'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  X,
  Receipt,
  CreditCard,
  Banknote,
  MoreHorizontal,
  Trash2,
  ArrowRight,
  Clock,
  Loader2,
  AlertCircle,
  WifiOff,
  User,
  Package,
  ChevronLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton, SkeletonTable, SkeletonCard } from '@/components/ui/skeleton';
import { ErrorState, InlineError } from '@/components/ui/error-state';
import { EmptyListState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

type Ticket = {
  id: string;
  ticketNumber: string;
  customerName: string | null;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: Date;
  status: 'held' | 'recalled';
  registerId: string;
};

const mockTickets: Ticket[] = [
  {
    id: '1',
    ticketNumber: 'TKT-001',
    customerName: 'John Smith',
    items: [
      { name: 'Latte', quantity: 2, price: 450 },
      { name: 'Croissant', quantity: 1, price: 350 },
    ],
    subtotal: 1250,
    tax: 103,
    total: 1353,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'held',
    registerId: 'REG-001',
  },
  {
    id: '2',
    ticketNumber: 'TKT-002',
    customerName: null,
    items: [
      { name: 'Americano', quantity: 1, price: 350 },
      { name: 'Blueberry Muffin', quantity: 1, price: 380 },
    ],
    subtotal: 730,
    tax: 60,
    total: 790,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    status: 'held',
    registerId: 'REG-001',
  },
  {
    id: '3',
    ticketNumber: 'TKT-003',
    customerName: 'Jane Doe',
    items: [
      { name: 'Cold Brew', quantity: 1, price: 500 },
      { name: 'Bagel with Cream Cheese', quantity: 1, price: 450 },
      { name: 'Tote Bag', quantity: 1, price: 1500 },
    ],
    subtotal: 2450,
    tax: 202,
    total: 2652,
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
    status: 'held',
    registerId: 'REG-001',
  },
];

function TicketCard({
  ticket,
  onRecall,
  onVoid,
  isProcessing,
}: {
  ticket: Ticket;
  onRecall: (ticket: Ticket) => void;
  onVoid: (ticketId: string) => void;
  isProcessing: string | null;
}) {
  const isProcessingThis = isProcessing === ticket.id;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-muted rounded-lg">
              <Receipt className="h-5 w-5 text-accent" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium">{ticket.ticketNumber}</p>
              <p className="text-sm text-text-muted">
                {ticket.customerName ? (
                  <>
                    <User className="h-3 w-3 inline mr-1" aria-hidden="true" />
                    {ticket.customerName}
                  </>
                ) : (
                  'Walk-in customer'
                )}
              </p>
            </div>
          </div>
          <Badge variant={ticket.status === 'held' ? 'default' : 'success'}>
            {ticket.status === 'held' ? 'On Hold' : 'Recalled'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {ticket.items.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="truncate pr-2">{item.name} × {item.quantity}</span>
              <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex items-center justify-between font-medium">
            <span>Total</span>
            <span>{formatCurrency(ticket.total)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-text-muted pt-2">
            <span>
              <Clock className="h-3 w-3 inline mr-1" aria-hidden="true" />
              {ticket.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span>Register {ticket.registerId}</span>
          </div>
        </div>
        <div className="flex gap-2 mt-4 pt-3 border-t border-border">
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => onRecall(ticket)}
            disabled={isProcessingThis || isProcessing !== null}
            aria-busy={isProcessingThis}
          >
            {isProcessingThis ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                Recalling...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" aria-hidden="true" />
                Recall to POS
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onVoid(ticket.id)}
            disabled={isProcessingThis || isProcessing !== null}
            aria-label={`Void ticket ${ticket.ticketNumber}`}
            className="text-danger hover:text-danger hover:bg-danger/10"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TicketSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Separator />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex gap-2 mt-4 pt-3 border-t border-border">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function TicketsPage({ params }: { params: { registerId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recallCallbackUrl = searchParams.get('recallCallbackUrl') || `/pos/${params.registerId}`;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [processingTicketId, setProcessingTicketId] = useState<string | null>(null);

  const fetchTickets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setTickets(mockTickets);
    } catch {
      setError('Failed to load open tickets. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRecall = async (ticket: Ticket) => {
    setProcessingTicketId(ticket.id);
    try {
      // Simulate API call to recall ticket
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Store ticket in sessionStorage for the POS page to retrieve
      const recallData = {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        customerName: ticket.customerName,
        items: ticket.items,
        subtotal: ticket.subtotal,
        tax: ticket.tax,
        total: ticket.total,
      };
      sessionStorage.setItem('recalledTicket', JSON.stringify(recallData));

      // Navigate back to POS with recall flag
      router.push(`${recallCallbackUrl}?recalled=${ticket.id}`);
      router.refresh();
    } catch {
      setError(`Failed to recall ticket ${ticket.ticketNumber}`);
    } finally {
      setProcessingTicketId(null);
    }
  };

  const handleVoid = async (ticketId: string) => {
    if (!confirm('Are you sure you want to void this ticket? This action cannot be undone.')) return;

    setProcessingTicketId(ticketId);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    } catch {
      setError('Failed to void ticket. Please try again.');
    } finally {
      setProcessingTicketId(null);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleGoBack} aria-label="Back to POS">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Open Tickets</h1>
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="space-y-3">
            <SkeletonTable rows={3} columns={4} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        variant={!isOnline ? 'network' : 'server'}
        onRetry={fetchTickets}
        onGoHome={handleGoBack}
        title={!isOnline ? 'You are offline' : undefined}
        description={!isOnline ? 'Changes will sync when connection is restored.' : undefined}
      />
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleGoBack} aria-label="Back to POS">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Open Tickets</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isOnline ? 'success' : 'warning'} className="gap-1">
              {isOnline ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse" aria-hidden="true" />
                  Online
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" aria-hidden="true" />
                  Offline
                </>
              )}
            </Badge>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <EmptyListState
            title="No open tickets"
            description="Tickets placed on hold will appear here. Recall them to continue the sale."
            icon={<Package className="h-12 w-12 mx-auto text-text-muted/50" />}
            action={{
              label: 'Back to POS',
              onClick: handleGoBack,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleGoBack} aria-label="Back to POS">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Open Tickets</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isOnline ? 'success' : 'warning'} className="gap-1">
            {isOnline ? (
              <>
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" aria-hidden="true" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" aria-hidden="true" />
                Offline
              </>
            )}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchTickets}
            disabled={isLoading}
            aria-label="Refresh tickets"
          >
            <Loader2 className={cn("h-5 w-5", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <ScrollArea className="h-full">
          <div className="space-y-3 max-w-2xl mx-auto">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onRecall={handleRecall}
                onVoid={handleVoid}
                isProcessing={processingTicketId}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}