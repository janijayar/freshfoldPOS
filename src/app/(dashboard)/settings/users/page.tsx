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
  Search,
  Plus,
  Edit,
  Eye,
  X,
  Mail,
  Phone,
  Shield,
  UserPlus,
  UserCheck,
  UserX,
  MoreHorizontal,
  Download,
  RefreshCw,
  Key,
  Bell,
  Calendar,
  Activity,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton, SkeletonTable, SkeletonCard } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyTableState } from '@/components/ui/empty-state';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'owner' | 'admin' | 'manager' | 'cashier';
  status: 'active' | 'inactive' | 'invited' | 'suspended';
  locationIds: string[];
  lastLoginAt?: Date;
  createdAt: Date;
  mfaEnabled: boolean;
  avatar?: string;
};

const roles = [
  { value: 'owner', label: 'Owner', permissions: 'Full access' },
  { value: 'admin', label: 'Admin', permissions: 'Manage org, users, settings' },
  { value: 'manager', label: 'Manager', permissions: 'Manage location, staff, inventory' },
  { value: 'cashier', label: 'Cashier', permissions: 'POS, customers, basic reports' },
];

const statuses = ['All', 'active', 'inactive', 'invited', 'suspended'];

const locations = [
  { id: 'loc-1', name: 'Main Street Store' },
  { id: 'loc-2', name: 'Downtown Branch' },
  { id: 'loc-3', name: 'Oakland Warehouse' },
];

const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Alex Johnson',
    email: 'alex@freshfold.com',
    phone: '+1 555-0100',
    role: 'owner',
    status: 'active',
    locationIds: ['loc-1', 'loc-2', 'loc-3'],
    lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    createdAt: new Date('2024-01-15'),
    mfaEnabled: true,
  },
  {
    id: 'user-2',
    name: 'Sarah Mitchell',
    email: 'sarah@freshfold.com',
    phone: '+1 555-0101',
    role: 'manager',
    status: 'active',
    locationIds: ['loc-1'],
    lastLoginAt: new Date(Date.now() - 30 * 60 * 1000),
    createdAt: new Date('2024-02-20'),
    mfaEnabled: true,
  },
  {
    id: 'user-3',
    name: 'Mike Chen',
    email: 'mike@freshfold.com',
    phone: '+1 555-0102',
    role: 'cashier',
    status: 'active',
    locationIds: ['loc-1'],
    lastLoginAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    createdAt: new Date('2024-03-10'),
    mfaEnabled: false,
  },
  {
    id: 'user-4',
    name: 'Emma Davis',
    email: 'emma@freshfold.com',
    phone: '+1 555-0103',
    role: 'manager',
    status: 'active',
    locationIds: ['loc-2'],
    lastLoginAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    createdAt: new Date('2024-06-15'),
    mfaEnabled: true,
  },
  {
    id: 'user-5',
    name: 'James Wilson',
    email: 'james@freshfold.com',
    phone: '+1 555-0104',
    role: 'cashier',
    status: 'inactive',
    locationIds: ['loc-1'],
    lastLoginAt: new Date('2026-10-01'),
    createdAt: new Date('2024-08-20'),
    mfaEnabled: false,
  },
  {
    id: 'user-6',
    name: 'Lisa Brown',
    email: 'lisa@freshfold.com',
    phone: '+1 555-0105',
    role: 'admin',
    status: 'invited',
    locationIds: ['loc-1', 'loc-2'],
    createdAt: new Date('2026-10-20'),
    mfaEnabled: false,
  },
];

const roleColors: Record<User['role'], string> = {
  owner: 'purple',
  admin: 'blue',
  manager: 'green',
  cashier: 'gray',
};

const statusColors: Record<User['status'], 'default' | 'success' | 'warning' | 'danger' | 'secondary'> = {
  active: 'success',
  inactive: 'secondary',
  invited: 'warning',
  suspended: 'danger',
};

type SortConfig = { key: keyof User; direction: 'asc' | 'desc' } | null;

function UserManagementContent() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'audit'>('users');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setUsers(mockUsers);
    } catch {
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSort = (key: keyof User) => {
    setSortConfig((current) => {
      if (current?.key === key && current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const filteredUsers = users
    .filter((u) => {
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone.includes(searchQuery);
      const matchesRole = selectedRole === 'All' || u.role === selectedRole;
      const matchesStatus = selectedStatus === 'All' || u.status === selectedStatus;
      const matchesLocation = selectedLocation === 'All' || u.locationIds.includes(selectedLocation);
      return matchesSearch && matchesRole && matchesStatus && matchesLocation;
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bVal == null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const getRoleBadge = (role: User['role']) => (
    <Badge variant="outline" className={cn('gap-1', `text-${roleColors[role]}`)}>
      {roles.find(r => r.value === role)?.label}
    </Badge>
  );

  const getStatusBadge = (status: User['status']) => (
    <Badge variant={statusColors[status]} className="capitalize">{status}</Badge>
  );

  const getLastLogin = (date?: Date) => {
    if (!date) return 'Never';
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const handleInvite = () => {
    setShowInviteDialog(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowInviteDialog(true);
  };

  const handleToggleStatus = (user: User) => {
    const newStatus: User['status'] = user.status === 'active' ? 'inactive' : 'active';
    setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
  };

  const handleResendInvite = (user: User) => {
    // In real app, resend invitation email
  };

  const handleRevokeAccess = (user: User) => {
    if (confirm(`Revoke access for ${user.name}? This will suspend their account.`)) {
      setUsers(users.map(u => u.id === user.id ? { ...u, status: 'suspended' } : u));
    }
  };

  const handleDelete = (user: User) => {
    if (confirm(`Delete ${user.name}? This action cannot be undone.`)) {
      setUsers(users.filter(u => u.id !== user.id));
    }
  };

  const SortIcon = ({ key }: { key: keyof User }) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronDown className="h-4 w-4 text-text-muted" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 text-accent" /> : <ChevronDown className="h-4 w-4 text-accent" />;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">User Management</h1>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
          <SkeletonTable rows={5} columns={8} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        variant={!isOnline ? 'network' : 'server'}
        onRetry={fetchUsers}
        onGoHome={() => router.push('/dashboard')}
        title={!isOnline ? 'You are offline' : undefined}
        description={!isOnline ? 'Data will sync when connection is restored.' : undefined}
      />
    );
  }

  const activeUsers = users.filter(u => u.status === 'active').length;
  const invitedUsers = users.filter(u => u.status === 'invited').length;
  const mfaEnabled = users.filter(u => u.mfaEnabled).length;
  const adminCount = users.filter(u => u.role === 'admin' || u.role === 'owner').length;

  const StatCard = ({ title, value, icon: IconComp, subtitle, trend }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    subtitle?: string;
    trend?: { direction: 'up' | 'down' | 'neutral'; percentage: number };
  }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-text-muted">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trend.direction === 'up' && <ChevronUp className="h-4 w-4 text-success" />}
                {trend.direction === 'down' && <ChevronDown className="h-4 w-4 text-danger" />}
                {trend.direction === 'neutral' && <span className="h-4 w-4 text-text-muted">–</span>}
                <span className={cn('text-sm font-medium', trend.direction === 'up' ? 'text-success' : trend.direction === 'down' ? 'text-danger' : 'text-text-muted')}>
                  {trend.percentage}% vs last month
                </span>
              </div>
            )}
            {subtitle && !trend && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
          </div>
          <div className="p-2 bg-accent-muted rounded-lg">
            <IconComp className="h-5 w-5 text-accent" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">User Management</h1>
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
        <Button variant="primary" onClick={handleInvite}>
          <UserPlus className="h-4 w-4 mr-2" aria-hidden="true" />
          Invite User
        </Button>
      </div>

      <div className="p-4 border-b border-border bg-surface space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total Users" value={users.length} icon={UserCheck} subtitle={`${activeUsers} active`} />
          <StatCard title="Pending Invites" value={invitedUsers} icon={UserPlus} subtitle="Awaiting acceptance" />
          <StatCard title="MFA Enabled" value={`${mfaEnabled}/${users.length}`} icon={Shield} subtitle="Security compliance" />
          <StatCard title="Admins" value={adminCount} icon={Shield} subtitle="Owner + Admin roles" />
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'users' | 'roles' | 'audit')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" aria-hidden="true" />
                <Input
                  placeholder="Search name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-10"
                  aria-label="Search users"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-text-muted" aria-hidden="true" />
                <Select value={selectedRole} onValueChange={(v) => { setSelectedRole(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Roles" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Roles</SelectItem>
                    {roles.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={(v) => { setSelectedStatus(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => <SelectItem key={s} value={s}>{s === 'All' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={selectedLocation} onValueChange={(v) => { setSelectedLocation(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Locations" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Locations</SelectItem>
                    {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                {filteredUsers.length === 0 ? (
                  <EmptyTableState
                    title={searchQuery || selectedRole !== 'All' || selectedStatus !== 'All' ? 'No users match' : 'No users yet'}
                    description={searchQuery || selectedRole !== 'All' || selectedStatus !== 'All'
                      ? 'Try adjusting your search or filters.'
                      : 'Invite team members to get started.'}
                    icon={<UserPlus className="h-12 w-12 mx-auto text-text-muted/50" />}
                    action={{ label: 'Invite User', onClick: handleInvite }}
                  />
                ) : (
                  <ScrollArea>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead className="cursor-pointer select-none" onClick={() => handleSort('role')}>
                            <div className="flex items-center gap-1">Role <SortIcon key="role" /></div>
                          </TableHead>
                          <TableHead>Locations</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>MFA</TableHead>
                          <TableHead className="cursor-pointer select-none" onClick={() => handleSort('lastLoginAt')}>
                            <div className="flex items-center gap-1">Last Login <SortIcon key="lastLoginAt" /></div>
                          </TableHead>
                          <TableHead className="cursor-pointer select-none" onClick={() => handleSort('createdAt')}>
                            <div className="flex items-center gap-1">Joined <SortIcon key="createdAt" /></div>
                          </TableHead>
                          <TableHead className="w-[140px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-accent-muted flex items-center justify-center font-medium text-accent">
                                  {user.avatar ? null : getInitials(user.name)}
                                </div>
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                  <p className="text-sm text-text-muted">{user.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {user.locationIds.map((locId) => {
                                  const loc = locations.find(l => l.id === locId);
                                  return loc ? (
                                    <Badge key={locId} variant="secondary" className="text-xs">{loc.name}</Badge>
                                  ) : null;
                                })}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(user.status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {user.mfaEnabled ? (
                                  <Shield className="h-4 w-4 text-success" aria-hidden="true" />
                                ) : (
                                  <Shield className="h-4 w-4 text-text-muted" aria-hidden="true" />
                                )}
                                <span className="text-sm">{user.mfaEnabled ? 'Enabled' : 'Disabled'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-text-muted">{getLastLogin(user.lastLoginAt)}</TableCell>
                            <TableCell className="text-text-muted">{user.createdAt.toLocaleDateString()}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" aria-label={`Actions for ${user.name}`}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52">
                                  <DropdownMenuItem onClick={() => handleEdit(user)}>
                                    <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                                    Edit User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                                    {user.status === 'active' ? (
                                      <>
                                        <UserX className="h-4 w-4 mr-2" aria-hidden="true" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck className="h-4 w-4 mr-2" aria-hidden="true" />
                                        Activate
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  {user.status === 'invited' && (
                                    <DropdownMenuItem onClick={() => handleResendInvite(user)}>
                                      <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
                                      Resend Invitation
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleRevokeAccess(user)} className="text-danger">
                                    <Shield className="h-4 w-4 mr-2" aria-hidden="true" />
                                    Revoke Access
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDelete(user)} className="text-danger">
                                    <X className="h-4 w-4 mr-2" aria-hidden="true" />
                                    Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      {totalPages > 1 && (
                        <TableFooter>
                          <TableRow>
                            <TableCell colSpan={8} className="py-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-text-muted">
                                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                                </span>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
                                  <span className="text-sm font-medium w-8 text-center">{currentPage} / {totalPages}</span>
                                  <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        </TableFooter>
                      )}
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Roles & Permissions</CardTitle>
                <CardDescription>Configure what each role can access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {roles.map((role) => (
                  <div key={role.value} className="p-4 bg-surface rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', `bg-${roleColors[role.value as keyof typeof roleColors]}/10`)}>
                          <Shield className={cn('h-5 w-5', `text-${roleColors[role.value as keyof typeof roleColors]}`)} aria-hidden="true" />
                        </div>
                        <div>
                          <p className="font-medium">{role.label}</p>
                          <p className="text-sm text-text-muted">{role.permissions}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn(`text-${roleColors[role.value as keyof typeof roleColors]}`)}>
                        {users.filter(u => u.role === role.value).length} users
                      </Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="p-3 bg-background rounded border">
                        <p className="font-medium">POS Access</p>
                        <p className="text-text-muted">{['owner', 'admin', 'manager', 'cashier'].includes(role.value) ? 'Full' : 'Limited'}</p>
                      </div>
                      <div className="p-3 bg-background rounded border">
                        <p className="font-medium">Reports</p>
                        <p className="text-text-muted">{['owner', 'admin', 'manager'].includes(role.value) ? 'Full' : 'View Only'}</p>
                      </div>
                      <div className="p-3 bg-background rounded border">
                        <p className="font-medium">Inventory</p>
                        <p className="text-text-muted">{['owner', 'admin', 'manager'].includes(role.value) ? 'Manage' : 'View'}</p>
                      </div>
                      <div className="p-3 bg-background rounded border">
                        <p className="font-medium">Settings</p>
                        <p className="text-text-muted">{['owner', 'admin'].includes(role.value) ? 'Full' : 'None'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>Track all user management actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-text-muted">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
                  <p>Audit log will show user invitations, role changes, status updates, and permission modifications.</p>
                  <p className="text-sm">Each entry includes actor, action, target, timestamp, and IP address.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Invite New User'}</DialogTitle>
            <DialogDescription>{editingUser ? `Editing ${editingUser.name}` : 'Send an invitation to join your organization'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter full name"
                defaultValue={editingUser?.name}
                disabled={!!editingUser}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@company.com"
                defaultValue={editingUser?.email}
                disabled={!!editingUser}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 555-0000"
                defaultValue={editingUser?.phone}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select defaultValue={editingUser?.role || 'cashier'} onValueChange={(v) => {}}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Locations *</Label>
              <div className="space-y-2">
                {locations.map((loc) => (
                  <Label key={loc.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-border-input" defaultChecked={editingUser?.locationIds.includes(loc.id)} />
                    <span>{loc.name}</span>
                  </Label>
                ))}
              </div>
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="message">Personal Message (optional)</Label>
                <textarea
                  id="message"
                  className="w-full min-h-[80px] rounded-md border border-border-input bg-surface px-3 py-2 text-base text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus"
                  placeholder="Add a personal message to the invitation..."
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowInviteDialog(false); setEditingUser(null); }}>Cancel</Button>
            <Button variant="primary" onClick={() => { setShowInviteDialog(false); setEditingUser(null); }}>
              {editingUser ? 'Save Changes' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserManagementPageInner() {
  return (
    <Suspense fallback={
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">User Management</h1>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
          <SkeletonTable rows={5} columns={8} />
        </div>
      </div>
    }>
      <UserManagementContent />
    </Suspense>
  );
}

export default function UserManagementPageWrapper() {
  return (
    <PermissionGuard permission="settings" action="users" fallback={<div />}>
      <UserManagementPageInner />
    </PermissionGuard>
  );
}