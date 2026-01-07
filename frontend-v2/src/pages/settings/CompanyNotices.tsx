import { useState, useEffect } from 'react';
import { settingsService, staffService } from '../../services/api';
import { showAlert, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { 
  CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Bell, 
  Check, 
  Filter, 
  Search, 
  MoreHorizontal,
  X,
  Users,
  Star,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

/* =========================
   TYPES
========================= */
interface CompanyNotice {
  id: number;
  title: string;
  content: string;
  publish_date: string;
  expire_date: string | null;
  is_company_wide: boolean;
  is_featured: boolean;
  author_id: number;
  author?: {
    id: number;
    name: string;
    email: string;
  };
  recipients?: StaffMember[];
  created_at: string;
  updated_at: string;
}

interface StaffMember {
  id: number;
  full_name: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/* =========================
   COMPONENT
========================= */
export default function CompanyNotices() {
  const [notices, setNotices] = useState<CompanyNotice[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    active_only: false,
    featured_only: false,
  });

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<CompanyNotice | null>(null);
  const [viewingNotice, setViewingNotice] = useState<CompanyNotice | null>(null);

  // Staff members for recipients
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    publish_date: new Date().toISOString().split('T')[0], // yyyy-MM-dd format
    expire_date: '',
    is_company_wide: true,
    is_featured: false,
    recipient_ids: [] as number[],
  });

  /* =========================
     FETCH NOTICES
  ========================= */
  useEffect(() => {
    fetchNotices();
  }, [page, filters]);

  useEffect(() => {
    if (search) {
      const debounceTimer = setTimeout(() => {
        fetchNotices();
      }, 500);
      return () => clearTimeout(debounceTimer);
    } else {
      fetchNotices();
    }
  }, [search]);

  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = {
        page,
        ...filters,
      };
      if (search) params.search = search;

      const response = await settingsService.getAll(params);
      setNotices(response.data.data || []);
      setMeta(response.data.meta);
    } catch (error) {
      console.error('Failed to fetch notices:', error);
      showAlert('error', 'Error', 'Failed to fetch company notices');
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================
     FETCH STAFF MEMBERS
  ========================= */
  useEffect(() => {
    if (!formData.is_company_wide) {
      fetchStaffMembers();
    }
  }, [formData.is_company_wide]);

  const fetchStaffMembers = async () => {
    setIsLoadingStaff(true);
    try {
      const response = await staffService.getAll({ per_page: 100 });
      setStaffMembers(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch staff members:', error);
      setStaffMembers([]);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  /* =========================
     FORM HANDLERS
  ========================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        recipient_ids: formData.is_company_wide ? [] : formData.recipient_ids,
      };

      if (editingNotice) {
        await settingsService.update(editingNotice.id, payload);
        showAlert('success', 'Success!', 'Notice updated successfully', 2000);
      } else {
        await settingsService.create(payload);
        showAlert('success', 'Success!', 'Notice created successfully', 2000);
      }

      setIsDialogOpen(false);
      setEditingNotice(null);
      resetForm();
      fetchNotices();
    } catch (error) {
      console.error('Failed to save notice:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to save notice'));
    }
  };

  const handleEdit = (notice: CompanyNotice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      publish_date: notice.publish_date.split('T')[0],
      expire_date: notice.expire_date ? notice.expire_date.split('T')[0] : '',
      is_company_wide: notice.is_company_wide,
      is_featured: notice.is_featured,
      recipient_ids: notice.recipients?.map(r => r.id) || [],
    });
    setIsDialogOpen(true);
  };

  const handleView = (notice: CompanyNotice) => {
    setViewingNotice(notice);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await showAlert(
      'warning',
      'Are you sure?',
      'This action cannot be undone. The notice will be permanently deleted.'
    );

    if (!result.isConfirmed) return;

    try {
      await settingsService.delete(id);
      showAlert('success', 'Deleted!', 'Notice deleted successfully', 2000);
      fetchNotices();
    } catch (error) {
      console.error('Failed to delete notice:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to delete notice'));
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await settingsService.markAsRead(id);
      showAlert('success', 'Success!', 'Notice marked as read', 1500);
      fetchNotices();
    } catch (error) {
      console.error('Failed to mark notice as read:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to mark notice as read'));
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      publish_date: new Date().toISOString().split('T')[0],
      expire_date: '',
      is_company_wide: true,
      is_featured: false,
      recipient_ids: [],
    });
    setEditingNotice(null);
  };

  /* =========================
     HELPER FUNCTIONS
  ========================= */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = (expireDate: string | null) => {
    if (!expireDate) return false;
    return new Date(expireDate) < new Date();
  };

  const isActive = (publishDate: string, expireDate: string | null) => {
    const now = new Date();
    const publish = new Date(publishDate);
    if (expireDate) {
      const expire = new Date(expireDate);
      return now >= publish && now <= expire;
    }
    return now >= publish;
  };

  const getStatusBadge = (notice: CompanyNotice) => {
    if (isExpired(notice.expire_date)) {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Expired</Badge>;
    }
    if (isActive(notice.publish_date, notice.expire_date)) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Active</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Scheduled</Badge>;
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page when searching
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Company Notices</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage company-wide announcements and notices</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                setEditingNotice(null);
                resetForm();
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Notice
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingNotice ? 'Edit Notice' : 'Create Notice'}
              </DialogTitle>
              <DialogDescription>
                {editingNotice
                  ? 'Update the company notice details'
                  : 'Create a new company notice or announcement'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                {/* Title */}
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter notice title"
                    required
                  />
                </div>

                {/* Content */}
                <div>
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter notice content..."
                    rows={8}
                    required
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="publish_date">Publish Date *</Label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="publish_date"
                        type="date"
                        value={formData.publish_date}
                        onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expire_date">Expire Date (Optional)</Label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="expire_date"
                        type="date"
                        value={formData.expire_date}
                        onChange={(e) => setFormData({ ...formData, expire_date: e.target.value })}
                        className="pl-10"
                        min={formData.publish_date}
                      />
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Company Wide</Label>
                      <p className="text-sm text-gray-500">
                        Send this notice to all staff members
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_company_wide}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_company_wide: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Featured Notice</Label>
                      <p className="text-sm text-gray-500">
                        Pin this notice to the top
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_featured: checked })
                      }
                    />
                  </div>
                </div>

                {/* Recipients (if not company-wide) */}
                {!formData.is_company_wide && (
                  <div>
                    <Label>Recipients *</Label>
                    <p className="text-sm text-gray-500 mb-2">
                      Select specific staff members who should receive this notice
                    </p>
                    {isLoadingStaff ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <div className="space-y-3">
                        <Select
                          value=""
                          onValueChange={(value) => {
                            const id = parseInt(value);
                            if (!formData.recipient_ids.includes(id)) {
                              setFormData({
                                ...formData,
                                recipient_ids: [...formData.recipient_ids, id],
                              });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select staff members..." />
                          </SelectTrigger>
                          <SelectContent>
                            {staffMembers
                              .filter(staff => !formData.recipient_ids.includes(staff.id))
                              .map((staff) => (
                                <SelectItem key={staff.id} value={staff.id.toString()}>
                                  {staff.full_name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>

                        {/* Selected recipients */}
                        {formData.recipient_ids.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm">Selected Recipients:</Label>
                            <div className="flex flex-wrap gap-2">
                              {formData.recipient_ids.map((id) => {
                                const staff = staffMembers.find(s => s.id === id);
                                return staff ? (
                                  <Badge
                                    key={id}
                                    variant="secondary"
                                    className="flex items-center gap-1 pl-2"
                                  >
                                    {staff.full_name}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormData({
                                          ...formData,
                                          recipient_ids: formData.recipient_ids.filter(rid => rid !== id),
                                        });
                                      }}
                                      className="ml-1 hover:text-red-500 p-1"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingNotice ? 'Update' : 'Create'} Notice
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* FILTERS AND SEARCH */}
      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search notices..."
                  value={search}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Button
                variant={filters.active_only ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilters({ ...filters, active_only: !filters.active_only });
                  setPage(1);
                }}
                className={filters.active_only ? "bg-green-600 hover:bg-green-700" : ""}
              >
                <Filter className="mr-2 h-4 w-4" />
                Active Only
              </Button>
              <Button
                variant={filters.featured_only ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilters({ ...filters, featured_only: !filters.featured_only });
                  setPage(1);
                }}
                className={filters.featured_only ? "bg-yellow-600 hover:bg-yellow-700" : ""}
              >
                <Star className="mr-2 h-4 w-4" />
                Featured
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* STATS */}
      <div className="grid gap-6 sm:grid-cols-4">
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Notices</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{meta?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Bell className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {notices.filter(n => isActive(n.publish_date, n.expire_date)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Featured</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {notices.filter(n => n.is_featured).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <Bell className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Expired</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {notices.filter(n => isExpired(n.expire_date)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NOTICES TABLE */}
      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader>
          <CardTitle>Company Notices</CardTitle>
          <CardDescription>
            {filters.active_only && 'Showing active notices only. '}
            {filters.featured_only && 'Showing featured notices only. '}
            {search && `Search results for "${search}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : notices.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No notices found</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {search || filters.active_only || filters.featured_only
                  ? 'Try changing your search or filters'
                  : 'Create your first company notice'}
              </p>
              <Button 
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Notice
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Publish Date</TableHead>
                      <TableHead>Expire Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notices.map((notice) => (
                      <TableRow key={notice.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span>{notice.title}</span>
                            {notice.is_featured && (
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                                Featured
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {truncateContent(notice.content, 60)}
                          </p>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(notice)}
                        </TableCell>
                        <TableCell>
                          {formatDate(notice.publish_date)}
                        </TableCell>
                        <TableCell>
                          {notice.expire_date ? formatDate(notice.expire_date) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={notice.is_company_wide 
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          }>
                            {notice.is_company_wide ? 'Company Wide' : 'Specific'}
                            {!notice.is_company_wide && notice.recipients && (
                              <span className="ml-1">({notice.recipients.length})</span>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(notice)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(notice)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMarkAsRead(notice.id)}>
                                  <Check className="mr-2 h-4 w-4" />
                                  Mark as Read
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(notice.id)}
                                  className="text-red-600 dark:text-red-400"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* PAGINATION */}
              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Page {meta.current_page} of {meta.last_page} ({meta.total} total)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === meta.last_page}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* VIEW NOTICE DIALOG */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Notice Details</DialogTitle>
          </DialogHeader>
          {viewingNotice && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-bold">{viewingNotice.title}</h3>
                <div className="flex items-center gap-2">
                  {getStatusBadge(viewingNotice)}
                  {viewingNotice.is_featured && (
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                      Featured
                    </Badge>
                  )}
                  <Badge className={viewingNotice.is_company_wide 
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                  }>
                    {viewingNotice.is_company_wide ? 'Company Wide' : 'Specific Recipients'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Publish Date</Label>
                  <p className="font-medium">{formatDate(viewingNotice.publish_date)}</p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Expire Date</Label>
                  <p className="font-medium">{viewingNotice.expire_date ? formatDate(viewingNotice.expire_date) : 'No expiration'}</p>
                </div>
              </div>

              {!viewingNotice.is_company_wide && viewingNotice.recipients && viewingNotice.recipients.length > 0 && (
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Recipients</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {viewingNotice.recipients.map((recipient) => (
                      <Badge key={recipient.id} variant="secondary">
                        <Users className="mr-1 h-3 w-3" />
                        {recipient.full_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-gray-600 dark:text-gray-400">Content</Label>
                <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg whitespace-pre-wrap">
                  {viewingNotice.content}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Created By</Label>
                  <p className="font-medium">{viewingNotice.author?.name || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Created At</Label>
                  <p className="font-medium">{formatDate(viewingNotice.created_at)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}