'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Loader2,
  AlertCircle,
  WifiOff,
  Users,
  Search,
  Filter,
  Download,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Clock,
  Calendar,
  Plus,
  CheckCircle,
  XCircle,
  Minus,
  PlusCircle,
  Sun,
  Moon,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton, SkeletonTable, SkeletonCard } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyTableState } from '@/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

type Shift = {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  date: string;
  startTime: string;
  endTime: string;
  scheduledHours: number;
  actualHours: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled';
  location: string;
  breakMinutes: number;
  overtimeHours: number;
};

const mockShifts: Shift[] = [
  {
    id: 'shift-1',
    employeeId: 'emp-1',
    employeeName: 'Sarah Chen',
    role: 'Manager',
    date: '2026-10-26',
    startTime: '08:00',
    endTime: '16:00',
    scheduledHours: 8,
    actualHours: 8,
    status: 'completed',
    location: 'Main Street Store',
    breakMinutes: 30,
    overtimeHours: 0,
  },
  {
    id: 'shift-2',
    employeeId: 'emp-2',
    employeeName: 'Marcus Johnson',
    role: 'Cashier',
    date: '2026-10-26',
    startTime: '09:00',
    endTime: '17:00',
    scheduledHours: 8,
    actualHours: 8.25,
    status: 'completed',
    location: 'Main Street Store',
    breakMinutes: 30,
    overtimeHours: 0.25,
  },
  {
    id: 'shift-3',
    employeeId: 'emp-3',
    employeeName: 'Emily Rodriguez',
    role: 'Cashier',
    date: '2026-10-26',
    startTime: '12:00',
    endTime: '20:00',
    scheduledHours: 8,
    actualHours: 0,
    status: 'in_progress',
    location: 'Downtown Branch',
    breakMinutes: 0,
    overtimeHours: 0,
  },
  {
    id: 'shift-4',
    employeeId: 'emp-4',
    employeeName: 'James Wilson',
    role: 'Barista',
    date: '2026-10-26',
    startTime: '06:00',
    endTime: '14:00',
    scheduledHours: 8,
    actualHours: 8.5,
    status: 'completed',
    location: 'Main Street Store',
    breakMinutes: 30,
    overtimeHours: 0.5,
  },
  {
    id: 'shift-5',
    employeeId: 'emp-6',
    employeeName: 'David Kim',
    role: 'Cashier',
    date: '2026-10-26',
    startTime: '10:00',
    endTime: '18:00',
    scheduledHours: 8,
    actualHours: 0,
    status: 'scheduled',
    location: 'Warehouse',
    breakMinutes: 0,
    overtimeHours: 0,
  },
  {
    id: 'shift-6',
    employeeId: 'emp-7',
    employeeName: 'Amanda Foster',
    role: 'Shift Lead',
    date: '2026-10-25',
    startTime: '08:00',
    endTime: '16:00',
    scheduledHours: 8,
    actualHours: 8,
    status: 'completed',
    location: 'Main Street Store',
    breakMinutes: 30,
    overtimeHours: 0,
  },
  {
    id: 'shift-7',
    employeeId: 'emp-2',
    employeeName: 'Marcus Johnson',
    role: 'Cashier',
    date: '2026-10-25',
    startTime: '09:00',
    endTime: '17:00',
    scheduledHours: 8,
    actualHours: 0,
    status: 'missed',
    location: 'Main Street Store',
    breakMinutes: 0,
    overtimeHours: 0,
  },
  {
    id: 'shift-8',
    employeeId: 'emp-4',
    employeeName: 'James Wilson',
    role: 'Barista',
    date: '2026-10-24',
    startTime: '06:00',
    endTime: '14:00',
    scheduledHours: 8,
    actualHours: 8,
    status: 'completed',
    location: 'Main Street Store',
    breakMinutes: 30,
    overtimeHours: 0,
  },
];

const statuses = [
  { id: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  { id: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { id: 'missed', label: 'Missed', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  { id: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
];

const locations = [
  { id: 'loc-1', name: 'Main Street Store' },
  { id: 'loc-2', name: 'Downtown Branch' },
  { id: 'loc-3', name: 'Warehouse' },
];

const dateRanges = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'custom', label: 'Custom Range' },
];

type ViewMode = 'list' | 'calendar';

function EmployeeShiftsContent() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [dateRange, setDateRange] = useState('this_week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch {
      setError('Failed to load shifts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key && current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const filteredShifts = mockShifts
    .filter((s) => {
      const matchesStatus = selectedStatus === 'All' || s.status === selectedStatus;
      const matchesLocation = selectedLocation === 'All' || s.location === selectedLocation;
      return matchesStatus && matchesLocation;
    });

  const sortedShifts = [...filteredShifts].sort((a, b) => {
    if (!sortConfig) return 0;
    const aVal = (a as any)[sortConfig.key];
    const bVal = (b as any)[sortConfig.key];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return sortConfig.direction === 'asc' ? -1 : 1;
    if (bVal == null) return sortConfig.direction === 'asc' ? 1 : -1;
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ key }: { key: string }) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronDown className="h-4 w-4 text-text-muted" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 text-accent" /> : <ChevronDown className="h-4 w-4 text-accent" />;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig = statuses.find((s) => s.id === status) || statuses[0];
    return <Badge variant="secondary" className={statusConfig.color}>{statusConfig.label}</Badge>;
  };

  const StatCard = ({ title, value, icon: IconComp, subtitle }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    subtitle?: string;
  }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-text-muted">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
          </div>
          <div className="p-2 bg-accent-muted rounded-lg">
            <IconComp className="h-5 w-5 text-accent" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const totalScheduled = filteredShifts.reduce((sum, s) => sum + s.scheduledHours, 0);
  const totalActual = filteredShifts.reduce((sum, s) => sum + s.actualHours, 0);
  const totalOvertime = filteredShifts.reduce((sum, s) => sum + s.overtimeHours, 0);
  const completedCount = filteredShifts.filter(s => s.status === 'completed').length;
  const inProgressCount = filteredShifts.filter(s => s.status === 'in_progress').length;
  const missedCount = filteredShifts.filter(s => s.status === 'missed').length;

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Employee Shifts</h1>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
          <SkeletonCard className="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        variant={!isOnline ? 'network' : 'server'}
        onRetry={fetchData}
        onGoHome={() => router.push('/dashboard')}
        title={!isOnline ? 'You are offline' : undefined}
        description={!isOnline ? 'Data will sync when connection is restored.' : undefined}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Employee Shifts</h1>
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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} aria-label="Refresh">
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            Refresh
          </Button>
          <Button variant="primary">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Add Shift
          </Button>
        </div>
      </div>

      <div className="p-4 border-b border-border bg-surface space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {dateRanges.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {dateRange === 'custom' && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-[140px]"
                  aria-label="Start date"
                />
                <span className="text-text-muted">to</span>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-[140px]"
                  aria-label="End date"
                />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Locations</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list">List View</SelectItem>
                <SelectItem value="calendar">Calendar View</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <StatCard
            title="Scheduled Hours"
            value={totalScheduled.toFixed(1)}
            icon={Clock}
            subtitle="Total scheduled"
          />
          <StatCard
            title="Actual Hours"
            value={totalActual.toFixed(1)}
            icon={CheckCircle}
            subtitle="Total worked"
          />
          <StatCard
            title="Overtime"
            value={totalOvertime.toFixed(2)}
            icon={PlusCircle}
            subtitle="Overtime hours"
          />
          <StatCard
            title="Completed"
            value={completedCount}
            icon={CheckCircle}
            subtitle="Completed shifts"
          />
          <StatCard
            title="In Progress"
            value={inProgressCount}
            icon={RotateCcw}
            subtitle="Currently working"
          />
          <StatCard
            title="Missed"
            value={missedCount}
            icon={XCircle}
            subtitle="Missed shifts"
          />
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <Card>
              <CardContent className="p-0">
                {sortedShifts.length === 0 ? (
                  <EmptyTableState
                    title="No shifts found"
                    description={selectedStatus !== 'All' || selectedLocation !== 'All'
                      ? 'Try adjusting your filters.'
                      : 'No shifts scheduled for this period.'}
                    icon={<Calendar className="h-12 w-12 mx-auto text-text-muted/50" />}
                  />
                ) : (
                  <ScrollArea>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="cursor-pointer select-none" onClick={() => handleSort('date')}>
                            <div className="flex items-center gap-1">Date <SortIcon key="date" /></div>
                          </TableHead>
                          <TableHead className="cursor-pointer select-none" onClick={() => handleSort('employeeName')}>
                            <div className="flex items-center gap-1">Employee <SortIcon key="employeeName" /></div>
                          </TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="cursor-pointer select-none" onClick={() => handleSort('location')}>
                            <div className="flex items-center gap-1">Location <SortIcon key="location" /></div>
                          </TableHead>
                          <TableHead>Schedule</TableHead>
                          <TableHead className="cursor-pointer select-none" onClick={() => handleSort('actualHours')}>
                            <div className="flex items-center gap-1">Actual <SortIcon key="actualHours" /></div>
                          </TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Break</TableHead>
                          <TableHead>OT</TableHead>
                          <TableHead className="w-[60px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedShifts.map((shift) => (
                          <TableRow key={shift.id}>
                            <TableCell>{shift.date}</TableCell>
                            <TableCell className="font-medium">{shift.employeeName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{shift.role}</Badge>
                            </TableCell>
                            <TableCell>{shift.location}</TableCell>
                            <TableCell>{shift.startTime} - {shift.endTime}</TableCell>
                            <TableCell className="font-mono">
                              {shift.actualHours > 0 ? `${shift.actualHours.toFixed(2)}h` : '—'}
                            </TableCell>
                            <TableCell><StatusBadge status={shift.status} /></TableCell>
                            <TableCell>{shift.breakMinutes > 0 ? `${shift.breakMinutes}min` : '—'}</TableCell>
                            <TableCell className="font-mono text-amber-600 dark:text-amber-400">
                              {shift.overtimeHours > 0 ? `+${shift.overtimeHours.toFixed(2)}h` : '—'}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" aria-label="More actions">
                                    <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <a href={`/employees/${shift.employeeId}`}>
                                      <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                                      View Employee
                                    </a>
                                  </DropdownMenuItem>
                                  {shift.status === 'scheduled' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem>
                                        <Sun className="h-4 w-4 mr-2" aria-hidden="true" />
                                        Clock In
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {shift.status === 'in_progress' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem>
                                        <Moon className="h-4 w-4 mr-2" aria-hidden="true" />
                                        Clock Out
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <Card>
              <CardContent className="p-4">
                <div className="text-center text-text-muted py-12">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-text-muted/30" aria-hidden="true" />
                  <p className="font-medium">Calendar View</p>
                  <p className="text-sm mt-1">Weekly calendar view coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EmployeeShiftsPageInner() {
  return (
    <Suspense fallback={
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Employee Shifts</h1>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
          <SkeletonCard className="h-80" />
        </div>
      </div>
    }>
      <EmployeeShiftsContent />
    </Suspense>
  );
}

export default function EmployeeShiftsPage() {
  return (
    <PermissionGuard permission="staff" action="view">
      <EmployeeShiftsPageInner />
    </PermissionGuard>
  );
}