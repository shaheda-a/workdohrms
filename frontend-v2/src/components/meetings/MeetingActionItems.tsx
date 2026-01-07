import { useState, useEffect, useCallback } from 'react';
import { meetingActionItemService, meetingService, staffService } from '../../services/api';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    CheckSquare,
    AlertCircle,
    TrendingUp,
    Eye,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import DataTable, { TableColumn } from 'react-data-table-component';

interface MeetingActionItem {
    id: number;
    meeting_id: number;
    title: string;
    assigned_to: number | null;
    due_date: string | null;
    status: 'pending' | 'in_progress' | 'completed';
    meeting?: {
        id: number;
        title: string;
    };
    assigned_employee?: {
        id: number;
        full_name: string;
        last_name: string;
    };
}

export default function MeetingActionItems() {
    const [actionItems, setActionItems] = useState<MeetingActionItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);

    // Modal State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MeetingActionItem | null>(null);
    const [meetings, setMeetings] = useState<{ id: number; title: string }[]>([]);
    const [employees, setEmployees] = useState<{ id: number; full_name: string; last_name: string }[]>([]);

    // View Modal State
    const [viewingItem, setViewingItem] = useState<MeetingActionItem | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

    const [formData, setFormData] = useState({
        meeting_id: '',
        title: '',
        assigned_to: '',
        due_date: '',
        status: 'pending',
    });

    const fetchMetadata = useCallback(async () => {
        try {
            const [meetingsRes, staffRes] = await Promise.all([
                meetingService.getAll({ per_page: 100 }),
                staffService.getAll({ per_page: 100 }),
            ]);
            if (meetingsRes.data.success) {
                setMeetings(meetingsRes.data.data.data || meetingsRes.data.data || []);
            }
            if (staffRes.data.success) {
                setEmployees(staffRes.data.data.data || staffRes.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch metadata:', error);
        }
    }, []);

    const fetchActionItems = useCallback(async (currentPage: number = 1) => {
        setIsLoading(true);
        try {
            const response = await meetingActionItemService.getAll({
                page: currentPage,
                per_page: perPage,
                search,
            });
            const resData = response.data.data;
            if (Array.isArray(resData)) {
                setActionItems(resData);
                setTotalRows(response.data.meta?.total || resData.length);
            } else {
                setActionItems(resData.data || []);
                setTotalRows(resData.total || 0);
            }
        } catch (error) {
            console.error('Failed to fetch action items:', error);
            showAlert('error', 'Error', 'Failed to fetch meeting action items');
        } finally {
            setIsLoading(false);
        }
    }, [perPage, search]);

    useEffect(() => {
        fetchActionItems(page);
    }, [page, fetchActionItems]);

    useEffect(() => {
        fetchMetadata();
    }, [fetchMetadata]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                meeting_id: Number(formData.meeting_id),
                assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
            };

            if (editingItem) {
                await meetingActionItemService.update(editingItem.id, payload);
                showAlert('success', 'Updated', 'Action item updated successfully');
            } else {
                await meetingActionItemService.create(payload);
                showAlert('success', 'Success', 'Action item created successfully');
            }

            setIsDialogOpen(false);
            resetForm();
            fetchActionItems(page);
        } catch (error) {
            console.error('Failed to save action item:', error);
            showAlert('error', 'Error', getErrorMessage(error, 'Failed to save action item'));
        }
    };

    const resetForm = () => {
        setFormData({
            meeting_id: '',
            title: '',
            assigned_to: '',
            due_date: '',
            status: 'pending',
        });
        setEditingItem(null);
    };

    const handleEdit = (item: MeetingActionItem) => {
        setEditingItem(item);
        setFormData({
            meeting_id: item.meeting_id.toString(),
            title: item.title,
            assigned_to: item.assigned_to?.toString() || '',
            due_date: item.due_date || '',
            status: item.status,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        const result = await showConfirmDialog(
            'Are you sure?',
            'You want to delete this action item?'
        );
        if (result.isConfirmed) {
            try {
                await meetingActionItemService.delete(id);
                showAlert('success', 'Deleted', 'Action item deleted successfully');
                fetchActionItems(page);
            } catch (error) {
                showAlert('error', 'Error', getErrorMessage(error, 'Failed to delete action item'));
            }
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            completed: 'bg-green-100 text-green-700 border-green-200',
            in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
            pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        };
        return (
            <Badge variant="outline" className={`${variants[status] || 'bg-gray-100 text-gray-700'}`}>
                {status.replace('_', ' ').toUpperCase()}
            </Badge>
        );
    };

    const isOverdue = (dueDate: string | null, status: string) => {
        if (!dueDate || status === 'completed') return false;
        return new Date(dueDate) < new Date();
    };

    const columns: TableColumn<MeetingActionItem>[] = [
        {
            name: 'Action Item',
            selector: (row) => row.title,
            cell: (row) => (
                <div className="py-2">
                    <p className="font-medium">{row.title}</p>
                    <p className="text-xs text-muted-foreground">{row.meeting?.title || 'N/A'}</p>
                </div>
            ),
            sortable: true,
        },
        {
            name: 'Assigned To',
            selector: (row) => `${row.assigned_employee?.full_name} ${row.assigned_employee?.last_name}`,
            cell: (row) => (
                <span>
                    {row.assigned_employee ? `${row.assigned_employee.full_name} ${row.assigned_employee.last_name}` : 'Unassigned'}
                </span>
            ),
            sortable: true,
        },
        {
            name: 'Due Date',
            selector: (row) => row.due_date || '-',
            cell: (row) => (
                <div>
                    <p className={isOverdue(row.due_date, row.status) ? 'text-red-600 font-medium' : ''}>
                        {row.due_date ? new Date(row.due_date).toLocaleDateString() : '-'}
                    </p>
                    {isOverdue(row.due_date, row.status) && (
                        <span className="text-[10px] text-red-500 uppercase font-bold">Overdue</span>
                    )}
                </div>
            ),
            sortable: true,
            width: '130px',
        },
        {
            name: 'Status',
            cell: (row) => getStatusBadge(row.status),
            width: '150px',
        },
        {
            name: 'Action',
            cell: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                            setViewingItem(row);
                            setIsViewDialogOpen(true);
                        }}>
                            <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(row)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleDelete(row.id)}
                            className="text-red-600"
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            width: '80px',
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-solarized-base02">Action Items</h1>
                    <p className="text-solarized-base01">Track and manage tasks assigned during meetings</p>
                </div>
                <Button
                    className="bg-solarized-blue hover:bg-solarized-blue/90"
                    onClick={() => {
                        resetForm();
                        setIsDialogOpen(true);
                    }}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Action Item
                </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <CheckSquare className="h-5 w-5 text-solarized-blue" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Tasks</p>
                                <p className="text-xl font-bold text-solarized-base02">{totalRows}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-red-50 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Overdue</p>
                                <p className="text-xl font-bold text-solarized-base02">
                                    {actionItems.filter(i => isOverdue(i.due_date, i.status)).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Completion Rate</p>
                                <p className="text-xl font-bold text-solarized-base02">
                                    {totalRows > 0 ? Math.round((actionItems.filter(i => i.status === 'completed').length / totalRows) * 100) : 0}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold">Task Tracking</CardTitle>
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Search action items..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-64"
                            />
                            <Button variant="outline" size="icon">
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={actionItems}
                        progressPending={isLoading}
                        pagination
                        paginationServer
                        paginationTotalRows={totalRows}
                        paginationPerPage={perPage}
                        paginationDefaultPage={page}
                        onChangePage={(p) => setPage(p)}
                        onChangeRowsPerPage={(pp) => setPerPage(pp)}
                        highlightOnHover
                        responsive
                        noDataComponent={
                            <div className="p-8 text-center text-muted-foreground">
                                No action items found.
                            </div>
                        }
                    />
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Edit Action Item' : 'New Action Item'}</DialogTitle>
                        <DialogDescription>
                            Assign a new task related to the selected meeting.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="meeting_id">Meeting *</Label>
                                <Select
                                    value={formData.meeting_id}
                                    onValueChange={(v) => setFormData({ ...formData, meeting_id: v })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select meeting" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {meetings.map((m) => (
                                            <SelectItem key={m.id} value={m.id.toString()}>
                                                {m.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="title">Action Item Title *</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., Finalize Q3 Roadmap"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="assigned_to">Assign To *</Label>
                                    <Select
                                        value={formData.assigned_to}
                                        onValueChange={(v) => setFormData({ ...formData, assigned_to: v })}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select employee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employees.map((e) => (
                                                <SelectItem key={e.id} value={e.id.toString()}>
                                                    {e.full_name} {e.last_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="due_date">Due Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.due_date}
                                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status *</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(v) => setFormData({ ...formData, status: v as any })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90">
                                {editingItem ? 'Save Changes' : 'Create Action Item'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Action Item Details</DialogTitle>
                        <DialogDescription>
                            Full details of the assigned task.
                        </DialogDescription>
                    </DialogHeader>
                    {viewingItem && (
                        <div className="grid gap-4 py-4">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Action Item</Label>
                                <p className="font-medium text-lg">{viewingItem.title}</p>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Meeting</Label>
                                <p className="font-medium">{viewingItem.meeting?.title || 'N/A'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Assigned To</Label>
                                    <p className="font-medium">
                                        {viewingItem.assigned_employee
                                            ? `${viewingItem.assigned_employee.full_name} ${viewingItem.assigned_employee.last_name}`
                                            : 'Unassigned'}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Due Date</Label>
                                    <p className={isOverdue(viewingItem.due_date, viewingItem.status) ? 'font-medium text-red-600' : 'font-medium'}>
                                        {viewingItem.due_date ? new Date(viewingItem.due_date).toLocaleDateString() : '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <div className="mt-1">{getStatusBadge(viewingItem.status)}</div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="button" onClick={() => setIsViewDialogOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
