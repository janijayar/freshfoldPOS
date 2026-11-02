'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
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
  Filter,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Tag,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton, SkeletonTable } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyTableState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/useApi';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

type Category = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
};

type SortConfig = { key: keyof Category; direction: 'asc' | 'desc' } | null;

function CategoryListContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sortOrder: 0,
    isActive: true,
    parentId: '',
  });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);

  const { data, loading, error, mutate: refetch } = useCategories({ active: 'true' });
  const categories = data?.categories || [];
  const isLoading = loading;
  const isOnline = !error;
  const fetchError = error?.message || null;

  const parentOptions = useMemo(() => [
    { id: '', name: 'None (Top Level)' },
    ...categories.filter(c => !c.parentId).map(c => ({ id: c.id, name: c.name }))
  ], [categories]);

  const handleSort = (key: keyof Category) => {
    setSortConfig((current) => {
      if (current?.key === key && current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const filteredCategories = useMemo(() => {
    return categories
      .filter((c) => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
        const matchesStatus = selectedStatus === 'All' || (c.isActive ? 'active' : 'inactive') === selectedStatus;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (!sortConfig) return 0;
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
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
  }, [categories, searchQuery, selectedStatus, sortConfig]);

  const paginatedCategories = useMemo(() => {
    return filteredCategories.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredCategories, page, pageSize]);

  const totalPages = Math.ceil(filteredCategories.length / pageSize);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create category');
      }

      setShowCreateDialog(false);
      setFormData({ name: '', description: '', sortOrder: 0, isActive: true, parentId: '' });
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setEditing(true);
    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update category');
      }

      setEditingCategory(null);
      setFormData({ name: '', description: '', sortOrder: 0, isActive: true, parentId: '' });
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update category');
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete category');
      }

      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete category');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      parentId: category.parentId || '',
    });
  };

  const handleCreateClick = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', sortOrder: 0, isActive: true, parentId: '' });
    setShowCreateDialog(true);
  };

  const SortIcon = ({ key }: { key: keyof Category }) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="h-4 w-4 text-text-muted" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 text-accent" /> : <ArrowDown className="h-4 w-4 text-accent" />;
  };

  const StatusBadge = ({ isActive }: { isActive: boolean }) => (
    <Badge variant={isActive ? 'success' : 'secondary'}>
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h1 className="text-xl font-bold">Categories</h1>
        </div>
        <div className="flex-1 p-4">
          <SkeletonTable rows={5} columns={5} />
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <ErrorState
        variant={!isOnline ? 'network' : 'server'}
        onRetry={() => { refetch(); }}
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
          <h1 className="text-xl font-bold">Categories</h1>
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
        <Button variant="primary" onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Add Category
        </Button>
      </div>

      <div className="p-4 border-b border-border bg-surface">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" aria-hidden="true" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-10"
              aria-label="Search categories"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <Select value={selectedStatus} onValueChange={(v) => { setSelectedStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Card>
          <CardContent className="p-0">
            {filteredCategories.length === 0 ? (
              <EmptyTableState
                title={searchQuery || selectedStatus !== 'All' ? 'No categories found' : 'No categories yet'}
                description={searchQuery || selectedStatus !== 'All'
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by adding your first category.'}
                icon={<Tag className="h-12 w-12 mx-auto text-text-muted/50" />}
                action={{
                  label: 'Add Category',
                  onClick: handleCreateClick,
                }}
              />
            ) : (
              <>
                <ScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                          <div className="flex items-center gap-1">
                            <Tag className="h-4 w-4" aria-hidden="true" />
                            Name <SortIcon key="name" />
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('description')}>
                          <div className="flex items-center gap-1">Description <SortIcon key="description" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('sortOrder')}>
                          <div className="flex items-center gap-1">Sort Order <SortIcon key="sortOrder" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('isActive')}>
                          <div className="flex items-center gap-1">Status <SortIcon key="isActive" /></div>
                        </TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCategories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell className="text-text-muted max-w-[200px] truncate">{category.description || '—'}</TableCell>
                          <TableCell className="font-mono tabular-nums">{category.sortOrder}</TableCell>
                          <TableCell><StatusBadge isActive={category.isActive} /></TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label={`Actions for ${category.name}`}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleEdit(category)} aria-label="Edit category">
                                  <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(category.id)}
                                  disabled={deletingId === category.id}
                                  className="text-danger focus:text-danger"
                                  aria-label="Delete category"
                                >
                                  {deletingId === category.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                                      Deleting...
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                                      Delete
                                    </>
                                  )}
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
                            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredCategories.length)} of {filteredCategories.length} categories
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

      {/* Create/Edit Category Dialog */}
      <Dialog open={showCreateDialog || !!editingCategory} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingCategory(null);
          setFormData({ name: '', description: '', sortOrder: 0, isActive: true, parentId: '' });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
            <DialogDescription>{editingCategory ? 'Update the category details' : 'Create a new product category'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={editingCategory ? handleUpdate : handleCreate} className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Enter category name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter category description (optional)"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value || '0', 10) }))}
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentId">Parent Category</Label>
                <Select value={formData.parentId} onValueChange={(value) => setFormData(prev => ({ ...prev, parentId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {parentOptions.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="isActive">
                <div className="flex items-center justify-between">
                  <span>Active</span>
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                  />
                </div>
              </Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowCreateDialog(false);
                setEditingCategory(null);
                setFormData({ name: '', description: '', sortOrder: 0, isActive: true, parentId: '' });
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating || editing}>
                {creating || editing ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CategoryListPage() {
  return (
    <PermissionGuard permission="inventory" action="view">
      <Suspense fallback={
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
            <h1 className="text-xl font-bold">Categories</h1>
          </div>
          <div className="flex-1 p-4">
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden="true" />
            </div>
          </div>
        </div>
      }>
        <CategoryListContent />
      </Suspense>
    </PermissionGuard>
  );
}