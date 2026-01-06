import { useState, useEffect } from 'react';
import { trainingService, staffService } from '../../services/api';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
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
import { Plus, Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { useAuth } from '../../context/AuthContext';

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

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export default function Sessions() {
    const { hasPermission } = useAuth();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
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

    const fetchSessions = async () => {
        setIsLoading(true);
        try {
            const response = await trainingService.getSessions({ page });
            const data = response.data.data;
            if (Array.isArray(data)) {
                setSessions(data);
                setMeta(response.data.meta || null);
            } else if (data && Array.isArray(data.data)) {
                setSessions(data.data);
                setMeta({
                    current_page: data.current_page,
                    last_page: data.last_page,
                    per_page: data.per_page,
                    total: data.total,
                });
            } else {
                setSessions([]);
                setMeta(null);
            }
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
            showAlert('error', 'Error', 'Failed to fetch training sessions');
        } finally {
            setIsLoading(false);
        }
    };

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
        fetchSessions();
        fetchPrograms();
        fetchStaff();
    }, [page]);

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
            fetchSessions();
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
            fetchSessions();
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
            scheduled: 'bg-solarized-blue/10 text-solarized-blue',
            in_progress: 'bg-solarized-green/10 text-solarized-green',
            completed: 'bg-solarized-base01/10 text-solarized-base01',
            cancelled: 'bg-solarized-red/10 text-solarized-red',
        };
        return variants[status] || variants.scheduled;
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
                                    {/* <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
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
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="max_participants">Max Participants</Label>
                                            <Input
                                                id="max_participants"
                                                type="number"
                                                min="1"
                                                value={formData.max_participants}
                                                onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                                            />
                                        </div>
                                    </div> */}
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

            {isLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="border-0 shadow-md">
                            <CardContent className="pt-6">
                                <Skeleton className="h-40 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : sessions.length === 0 ? (
                <Card className="border-0 shadow-md">
                    <CardContent className="py-12 text-center">
                        <Calendar className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-solarized-base02">No training sessions</h3>
                        <p className="text-solarized-base01 mt-1">Schedule training sessions for your programs.</p>
                        {canManage && (
                            <Button className="mt-4 bg-solarized-blue hover:bg-solarized-blue/90" onClick={() => setIsDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Session
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {sessions.map((session) => (
                            <Card key={session.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-lg line-clamp-1">{session.session_name}</CardTitle>
                                            <CardDescription className="line-clamp-1">{session.program?.title || 'Unknown Program'}</CardDescription>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleView(session)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View
                                                </DropdownMenuItem>
                                                {canManage && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => handleEdit(session)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-solarized-red" onClick={() => handleDelete(session.id)}>
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2 text-sm text-solarized-base01">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            <span>{session.date} {session.time ? `@ ${session.time}` : ''}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            <span>{session.trainer ? `${session.trainer.first_name} ${session.trainer.last_name}` : 'TBD'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            <span className="truncate">{session.location || 'No location set'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <Badge className={getStatusBadge(session.status)}>
                                            {session.status.replace('_', ' ')}
                                        </Badge>
                                        <span className="text-xs text-solarized-base01 font-medium">
                                            {session.participants_count || 0} / {session.max_participants} Enrolled
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {meta && meta.last_page > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(page - 1)}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <span className="text-sm text-solarized-base01">
                                Page {meta.current_page} of {meta.last_page}
                            </span>
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
                    )}
                </>
            )}
        </div>
    );
}
