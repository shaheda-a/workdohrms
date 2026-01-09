import { useState, useEffect, useCallback } from 'react';
import { trainingService, staffService } from '../../services/api';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
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
import {
    Plus,
    Calendar,
    Clock,
    MapPin,
    User,
    Search,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { useAuth } from '../../context/AuthContext';
import DataTable, { TableColumn } from 'react-data-table-component';

interface Program {
    id: number;
    title: string;
}

interface Staff {
    id: number;
    first_name: string;
    last_name: string;
}

interface Session {
    id: number;
    training_program_id: number;
    session_name: string;
    date: string;
    time: string | null;
    location: string | null;
    trainer_id: number | null;
    max_participants: number;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    participants_count?: number;
    program?: Program;
    trainer?: Staff;
}

export default function Sessions() {
    const { hasPermission } = useAuth();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [editingSession, setEditingSession] = useState<Session | null>(null);
    const [viewingSession, setViewingSession] = useState<Session | null>(null);
    const [formData, setFormData] = useState({
        training_program_id: '',
        session_name: '',
        date: '',
        time: '',
        location: '',
        trainer_id: '',
        max_participants: '20',
        status: 'scheduled',
    });

    const canManage = hasPermission('manage_staff_training');

    const fetchSessions = useCallback(
        async (currentPage: number = 1) => {
            setIsLoading(true);
            try {
                const params: Record<string, unknown> = {
                    page: currentPage,
                    per_page: perPage,
                    search,
                };

                const response = await trainingService.getSessions(params);
                const payload = response.data.data;

                if (Array.isArray(payload)) {
                    setSessions(payload);
                    setTotalRows(response.data.meta?.total ?? payload.length);
                } else if (payload && Array.isArray(payload.data)) {
                    setSessions(payload.data);
                    setTotalRows(payload.total);
                } else {
                    setSessions([]);
                    setTotalRows(0);
                }
            } catch (error) {
                console.error('Failed to fetch sessions:', error);
                showAlert('error', 'Error', 'Failed to fetch training sessions');
                setSessions([]);
                setTotalRows(0);
            } finally {
                setIsLoading(false);
            }
        },
        [perPage, search]
    );

    const fetchPrograms = async () => {
        try {
            const response = await trainingService.getPrograms({ paginate: 'false' } as any);
            const data = response.data.data || response.data;
            setPrograms(Array.isArray(data) ? data : (data.data || []));
        } catch (error) {
            console.error('Failed to fetch programs:', error);
        }
    };

    const fetchStaff = async () => {
        try {
            const response = await staffService.getAll({ paginate: 'false' } as any);
            const data = response.data.data || response.data;
            setStaffMembers(Array.isArray(data) ? data : (data.data || []));
        } catch (error) {
            console.error('Failed to fetch staff members:', error);
        }
    };

    useEffect(() => {
        fetchSessions(page);
    }, [page, fetchSessions]);

    useEffect(() => {
        fetchPrograms();
        fetchStaff();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                training_program_id: Number(formData.training_program_id),
                session_name: formData.session_name,
                date: formData.date,
                time: formData.time || null,
                location: formData.location || null,
                trainer_id: formData.trainer_id ? Number(formData.trainer_id) : null,
                max_participants: Number(formData.max_participants),
                status: formData.status,
            };

            if (editingSession) {
                await trainingService.updateSession(editingSession.id, payload);
            } else {
                await trainingService.createSession(payload);
            }
            setIsDialogOpen(false);
            setEditingSession(null);
            resetForm();
            fetchSessions(page);
            showAlert('success', 'Success', editingSession ? 'Session updated successfully' : 'Session created successfully', 2000);
        } catch (error) {
            console.error('Failed to save session:', error);
            const errorMessage = getErrorMessage(error, 'Failed to save session');
            showAlert('error', 'Error', errorMessage);
        }
    };

    const handleEdit = (session: Session) => {
        setEditingSession(session);
        setFormData({
            training_program_id: String(session.training_program_id),
            session_name: session.session_name,
            date: session.date,
            time: session.time || '',
            location: session.location || '',
            trainer_id: session.trainer_id ? String(session.trainer_id) : '',
            max_participants: String(session.max_participants),
            status: session.status,
        });
        setIsDialogOpen(true);
    };

    const handleView = (session: Session) => {
        setViewingSession(session);
        setIsViewDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        const result = await showConfirmDialog('Delete Session', 'Are you sure you want to delete this session?');
        if (!result.isConfirmed) return;
        try {
            await trainingService.deleteSession(id);
            fetchSessions(page);
            showAlert('success', 'Deleted!', 'Session deleted successfully', 2000);
        } catch (error) {
            console.error('Failed to delete session:', error);
            const errorMessage = getErrorMessage(error, 'Failed to delete session');
            showAlert('error', 'Error', errorMessage);
        }
    };

    const resetForm = () => {
        setFormData({
            training_program_id: '',
            session_name: '',
            date: '',
            time: '',
            location: '',
            trainer_id: '',
            max_participants: '',
            status: '',
        });
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            scheduled: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
            in_progress: 'bg-green-100 text-green-700 hover:bg-green-100',
            completed: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
            cancelled: 'bg-red-100 text-red-700 hover:bg-red-100',
        };
        return variants[status] || variants.scheduled;
    };

    // ================= SEARCH =================
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
    };

    // ================= PAGINATION =================
    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handlePerRowsChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setPage(1);
    };

    // ================= TABLE COLUMNS =================
    const columns: TableColumn<Session>[] = [
        {
            name: 'Session Name',
            selector: (row) => row.session_name,
            cell: (row) => (
                <div className="py-2">
                    <p className="font-medium">{row.session_name}</p>
                </div>
            ),
            sortable: true,
            minWidth: '200px',
        },
        {
            name: 'Training Program',
            selector: (row) => row.program?.title || '',
            cell: (row) => (
                <span className="text-sm">
                    {row.program?.title || '-'}
                </span>
            ),
            sortable: true,
            width: '200px',
        },
        {
            name: 'Date',
            selector: (row) => row.date,
            cell: (row) => (
                <div className="text-sm">
                    <p className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {row.date}
                    </p>
                    {/* {row.time && (
                        <p className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" /> {row.time}
                        </p>
                    )} */}
                </div>
            ),
            width: '150px',
        },

         {
            name: 'Time',
            selector: (row) => row.date,
            cell: (row) => (
                <div className="text-sm">
                    {/* <p className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {row.date}
                    </p> */}
                    {row.time && (
                        <p className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" /> {row.time}
                        </p>
                    )}
                </div>
            ),
            width: '150px',
        },
        {
            name: 'Location',
            selector: (row) => row.location || '',
            cell: (row) => (
                <p className="truncate text-sm">
                    {row.location || '-'}
                </p>
            ),
            width: '150px',
        },
        {
            name: 'Max Participants',
            selector: (row) => row.max_participants|| '',
            cell: (row) => (
                <p className="text-sm">
                    {row.max_participants ? `${row.max_participants}` : 'TBD'}
                </p>
            ),
            width: '150px',
        },
        {
            name: 'Status',
            cell: (row) => (
                <Badge className={getStatusBadge(row.status)}>
                    {row.status.replace('_', ' ')}
                </Badge>
            ),
            width: '120px',
        },
        {
            name: 'Actions',
            cell: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(row)}>
                            <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                        {canManage && (
                            <>
                                <DropdownMenuItem onClick={() => handleEdit(row)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleDelete(row.id)}
                                    className="text-red-600"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            ignoreRowClick: true,
            width: '80px',
        },
    ];

    const customStyles = {
        headRow: {
            style: {
                backgroundColor: '#f9fafb',
                borderBottomWidth: '1px',
                borderBottomColor: '#e5e7eb',
                borderBottomStyle: 'solid' as const,
                minHeight: '56px',
            },
        },
        headCells: {
            style: {
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                paddingLeft: '16px',
                paddingRight: '16px',
            },
        },
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-solarized-base02">Training Sessions</h1>
                    <p className="text-solarized-base01">Manage specific training events and trainer assignments</p>
                </div>
                {canManage && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="bg-solarized-blue hover:bg-solarized-blue/90"
                                onClick={() => { setEditingSession(null); resetForm(); }}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Session
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>{editingSession ? 'Edit Session' : 'Add Session'}</DialogTitle>
                                <DialogDescription>
                                    {editingSession ? 'Update training session details.' : 'Schedule a new training session.'}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit}>
                                <div className="grid gap-4 py-4 max-h-[500px] overflow-y-auto">
                                    <div className="space-y-2">
                                        <Label htmlFor="training_program_id">Training Program *</Label>
                                        <Select
                                            value={formData.training_program_id}
                                            onValueChange={(value) => setFormData({ ...formData, training_program_id: value })}
                                            disabled={!!editingSession}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select training program" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {programs.map((program) => (
                                                    <SelectItem key={program.id} value={String(program.id)}>
                                                        {program.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="session_name">Session Name *</Label>
                                        <Input
                                            id="session_name"
                                            value={formData.session_name}
                                            onChange={(e) => setFormData({ ...formData, session_name: e.target.value })}
                                            placeholder="e.g., Q1 Ethics Seminar"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="date">Date *</Label>
                                            <Input
                                                id="date"
                                                type="date"
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="time">Time</Label>
                                            <Input
                                                id="time"
                                                type="time"
                                                value={formData.time}
                                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="location">Location</Label>
                                        <Input
                                            id="location"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            placeholder="e.g., Conference Room B or Zoom Link"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* <div className="space-y-2">
                                            <Label htmlFor="trainer_id">Trainer</Label>
                                            <Select
                                                value={formData.trainer_id}
                                                onValueChange={(value) => setFormData({ ...formData, trainer_id: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select trainer" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {staffMembers.map((staff) => (
                                                        <SelectItem key={staff.id} value={String(staff.id)}>
                                                            {staff.first_name} {staff.last_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div> */}
                                        <div className="space-y-2">
                                            <Label htmlFor="max_participants">Max Participants *</Label>
                                            <Input
                                                id="max_participants"
                                                type="number"
                                                min="1"
                                                value={formData.max_participants}
                                                onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                                                required
                                            />
                                        </div>

                                 <div className="space-y-2">
                                            <Label htmlFor="status">Status</Label>
                                            <Select
                                                value={formData.status}
                                                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                                    <SelectItem value="completed">Completed</SelectItem>
                                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {editingSession && (
                                        <div className="space-y-2">
                                            <Label htmlFor="status">Status</Label>
                                            <Select
                                                value={formData.status}
                                                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                                    <SelectItem value="completed">Completed</SelectItem>
                                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90">
                                        {editingSession ? 'Update' : 'Create'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* View Details Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Session Details</DialogTitle>
                    </DialogHeader>
                    {viewingSession && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-solarized-base01">Session Name</p>
                                <p className="font-medium text-lg">{viewingSession.session_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-solarized-base01">Program</p>
                                <p>{viewingSession.program?.title || 'Unknown Program'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-solarized-base01">Date & Time</p>
                                    <p className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4 text-solarized-blue" />
                                        {viewingSession.date}
                                    </p>
                                    <p className="flex items-center gap-1 mt-1">
                                        <Clock className="h-4 w-4 text-solarized-blue" />
                                        {viewingSession.time || 'TBD'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-solarized-base01">Trainer</p>
                                    <p className="flex items-center gap-1">
                                        <User className="h-4 w-4 text-solarized-green" />
                                        {viewingSession.trainer ? `${viewingSession.trainer.first_name} ${viewingSession.trainer.last_name}` : 'No trainer assigned'}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-solarized-base01">Location</p>
                                <p className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4 text-solarized-red" />
                                    {viewingSession.location || 'No location set'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-solarized-base01">Status</p>
                                <Badge className={getStatusBadge(viewingSession.status)}>
                                    {viewingSession.status.replace('_', ' ')}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm text-solarized-base01">Participants</p>
                                <p>{viewingSession.participants_count || 0} / {viewingSession.max_participants} enrolled</p>
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

            <Card>
                <CardHeader>
                    <form onSubmit={handleSearchSubmit} className="flex gap-4">
                        <Input
                            placeholder="Search sessions..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Button type="submit" variant="outline">
                            <Search className="mr-2 h-4 w-4" /> Search
                        </Button>
                    </form>
                </CardHeader>

                <CardContent>
                    {!isLoading && sessions.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p>No training sessions found</p>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={sessions}
                            progressPending={isLoading}
                            pagination
                            paginationServer
                            paginationTotalRows={totalRows}
                            paginationPerPage={perPage}
                            paginationDefaultPage={page}
                            onChangePage={handlePageChange}
                            onChangeRowsPerPage={handlePerRowsChange}
                            customStyles={customStyles}
                            highlightOnHover
                            responsive
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
