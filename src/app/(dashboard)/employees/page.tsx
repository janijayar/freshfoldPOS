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
  TrendingUp,
  TrendingDown,
  UserPlus,
  Shield,
  Clock,
  Mail,
  Phone,
  Calendar,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton, SkeletonTable, SkeletonCard } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyTableState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

type Employee = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'active' | 'inactive' | 'on_leave';
  hiredDate: string;
  hourlyRate: number;
  totalHours: number;
  totalPay: number;
  location: string;
  avatar?: string;
};

const mockEmployees: Employee[] = [
  {
    id: 'emp-1',
    name: 'Sarah Chen',
    email: 'sarah.chen@freshfold.com',
    phone: '+1 (555) 123-4567',
    role: 'Manager',
    status: 'active',
    hiredDate: '2024-01-15',
    hourlyRate: 28.50,
    totalHours: 168,
    totalPay: 4788,
    location: 'Main Street Store',
  },
  {
    id: 'emp-2',
    name: 'Marcus Johnson',
    email: 'marcus.j@freshfold.com',
    phone: '+1 (555) 234-5678',
    role: 'Cashier',
    status: 'active',
    hiredDate: '2024-03-22',
    hourlyRate: 18.00,
    totalHours: 160,
    totalPay: 2880,
    location: 'Main Street Store',
  },
  {
    id: 'emp-3',
    name: 'Emily Rodriguez',
    email: 'emily.r@freshfold.com',
    phone: '+1 (555) 345-6789',
    role: 'Cashier',
    status: 'active',
    hiredDate: '2024-06-10',
    hourlyRate: 17.50,
    totalHours: 152,
    totalPay: 2660,
    location: 'Downtown Branch',
  },
  {
    id: 'emp-4',
    name: 'James Wilson',
    email: 'james.w@freshfold.com',
    phone: '+1 (555) 456-7890',
    role: 'Barista',
    status: 'active',
    hiredDate: '2024-08-05',
    hourlyRate: 16.75,
    totalHours: 144,
    totalPay: 2412,
    location: 'Main Street Store',
  },
  {
    id: 'emp-5',
    name: 'Lisa Park',
    email: 'lisa.p@freshfold.com',
    phone: '+1 (555) 567-8901',
    role: 'Barista',
    status: 'on_leave',
    hiredDate: '2024-09-12',
    hourlyRate: 16.50,
    totalHours: 0,
    totalPay: 0,
    location: 'Downtown Branch',
  },
  {
    id: 'emp-6',
    name: 'David Kim',
    email: 'david.k@freshfold.com',
    phone: '+1 (555) 678-9012',
    role: 'Cashier',
    status: 'active',
    hiredDate: '2024-11-03',
    hourlyRate: 18.25,
    totalHours: 128,
    totalPay: 2336,
    location: 'Warehouse',
  },
  {
    id: 'emp-7',
    name: 'Amanda Foster',
    email: 'amanda.f@freshfold.com',
    phone: '+1 (555) 789-0123',
    role: 'Shift Lead',
    status: 'active',
    hiredDate: '2025-01-20',
    hourlyRate: 22.00,
    totalHours: 160,
    totalPay: 3520,
    location: 'Main Street Store',
  },
  {
    id: 'emp-8',
    name: 'Robert Kim',
    email: 'robert.k@freshfold.com',
    phone: '+1 (555) 890-1234',
    role: 'Barista',
    status: 'inactive',
    hiredDate: '2025-03-15',
    hourlyRate: 16.00,
    totalHours: 80,
    totalPay: 1280,
    location: 'Downtown Branch',
  },
];

const roles = [
  { id: 'role-1', name: 'Manager' },
  { id: 'role-2', name: 'Shift Lead' },
  { id: 'role-3', name: 'Cashier' },
  { id: 'role-4', name: 'Barista' },
];

const locations = [
  { id: 'loc-1', name: 'Main Street Store' },
  { id: 'loc-2', name: 'Downtown Branch' },
  { id: 'loc-3', name: 'Warehouse' },
];

type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;

function EmployeeListContent() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch {
      setError('Failed to load employees. Please try again.');
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

  const filteredEmployees = mockEmployees
    .filter((e) => {
      const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.phone.includes(searchQuery);
      const matchesRole = selectedRole === 'All' || e.role === selectedRole;
      const matchesStatus = selectedStatus === 'All' || e.status === selectedStatus;
      const matchesLocation = selectedLocation === 'All' || e.location === selectedLocation;
      return matchesSearch && matchesRole && matchesStatus && matchesLocation;
    });

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (!sortConfig) return 0;
    const aVal = (a as any)[sortConfig.key];
    const bVal = (b as any)[sortConfig.key];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return sortConfig.direction === 'asc' ? -1 : 1;
    if (bVal == null) return sortConfig.direction === 'asc' ? 1 : -1;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortConfig.direction === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedEmployees = sortedEmployees.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(sortedEmployees.length / pageSize);

  const SortIcon = ({ key }: { key: string }) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronDown className="h-4 w-4 text-text-muted" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 text-accent" /> : <ChevronDown className="h-4 w-4 text-accent" />;
  };

  const RoleBadge = ({ role }: { role: string }) => {
    const roleColors: Record<string, string> = {
      Manager: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Shift Lead': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      Cashier: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      Barista: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    };
    return (
      <Badge variant="secondary" className={roleColors[role] || roleColors.Cashier}>
        {role}
      </Badge>
    );
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig: Record<string, { variant: 'success' | 'warning' | 'secondary' | 'danger'; label: string }> = {
      active: { variant: 'success', label: 'Active' },
      inactive: { variant: 'secondary', label: 'Inactive' },
      on_leave: { variant: 'warning', label: 'On Leave' },
    };
    const config = statusConfig[status] || statusConfig.inactive;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Employees</h1>
          </div>
          <Button variant="primary">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Add Employee
          </Button>
        </div>
        <div className="p-4 border-b border-border bg-surface">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" aria-hidden="true" />
              <Input
                placeholder="Search employees..."
                className="pl-10"
                disabled
              />
            </div>
          </div>
        </div>
        <div className="flex-1 p-4">
          <SkeletonTable rows={5} columns={8} />
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
          <h1 className="text-xl font-bold">Employees</h1>
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
        <Button variant="primary">
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Add Employee
        </Button>
      </div>

      <div className="p-4 border-b border-border bg-surface space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" aria-hidden="true" />
            <Input
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-10"
              aria-label="Search employees"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <Select value={selectedRole} onValueChange={(v) => { setSelectedRole(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={(v) => { setSelectedStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedLocation} onValueChange={(v) => { setSelectedLocation(v); setPage(1); }}>
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
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Card>
          <CardContent className="p-0">
            {sortedEmployees.length === 0 ? (
              <EmptyTableState
                title="No employees found"
                description={searchQuery || selectedRole !== 'All' || selectedStatus !== 'All' || selectedLocation !== 'All'
                  ? 'Try adjusting your search or filters.'
                  : 'No employees yet. Add your first employee to get started.'}
                icon={<Users className="h-12 w-12 mx-auto text-text-muted/50" />}
              />
            ) : (
              <>
                <ScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                          <div className="flex items-center gap-1">Employee <SortIcon key="name" /></div>
                        </TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('location')}>
                          <div className="flex items-center gap-1">Location <SortIcon key="location" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('hiredDate')}>
                          <div className="flex items-center gap-1">Hired <SortIcon key="hiredDate" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('hourlyRate')}>
                          <div className="flex items-center gap-1">Rate <SortIcon key="hourlyRate" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('totalHours')}>
                          <div className="flex items-center gap-1">Hours <SortIcon key="totalHours" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('totalPay')}>
                          <div className="flex items-center gap-1">Pay <SortIcon key="totalPay" /></div>
                        </TableHead>
                        <TableHead className="w-[60px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-accent-muted flex items-center justify-center">
                                <span className="text-sm font-medium text-accent">
                                  {employee.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">{employee.name}</p>
                                <div className="flex flex-wrap gap-2 text-xs text-text-muted">
                                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" aria-hidden="true" />{employee.email}</span>
                                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" aria-hidden="true" />{employee.phone}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><RoleBadge role={employee.role} /></TableCell>
                          <TableCell><StatusBadge status={employee.status} /></TableCell>
                          <TableCell>{employee.location}</TableCell>
                          <TableCell>{employee.hiredDate}</TableCell>
                          <TableCell className="font-mono">${employee.hourlyRate.toFixed(2)}/hr</TableCell>
                          <TableCell>{employee.totalHours.toLocaleString()}</TableCell>
                          <TableCell className="font-mono">{formatCurrency(employee.totalPay)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="More actions">
                                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <a href={`/employees/${employee.id}`}>
                                    <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                                    View Details
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
                                  Email Employee
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <a href={`/employees/${employee.id}/shifts`}>
                                    <Clock className="h-4 w-4 mr-2" aria-hidden="true" />
                                    View Schedule
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-danger">
                                  <Shield className="h-4 w-4 mr-2" aria-hidden="true" />
                                  {employee.status === 'active' ? 'Deactivate' : 'Activate'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    {totalPages > 1 && (
                      <TableFooter>
                        <div className="flex items-center justify-between py-2">
                          <p className="text-sm text-text-muted">
                            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, sortedEmployees.length)} of {sortedEmployees.length} employees
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPage(p => Math.max(1, p - 1))}
                              disabled={page === 1}
                              aria-label="Previous page"
                            >
                              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <span className="text-sm text-text-muted w-20 text-center">
                              Page {page} of {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                              disabled={page === totalPages}
                              aria-label="Next page"
                            >
                              <ChevronRight className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </div>
                      </TableFooter>
                    )}
                  </Table>
                </ScrollArea>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function EmployeeListPage() {
  return (
    <PermissionGuard permission="staff" action="view">
      <Suspense fallback={
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
            <h1 className="text-xl font-bold">Employees</h1>
          </div>
          <div className="flex-1 p-4">
            <SkeletonTable rows={5} columns={8} />
          </div>
        </div>
      }>
        <EmployeeListContent />
      </Suspense>
    </PermissionGuard>
  );
}