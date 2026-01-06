import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { trainingService, staffService } from '../../services/api';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Checkbox } from '../../components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../../components/ui/dialog';

import { Plus, User, GraduationCap, Calendar, ChevronLeft, ChevronRight, MoreHorizontal, Eye, Edit, Trash2, Trophy, ClipboardCheck } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { useAuth } from '../../context/AuthContext';

interface Session {
    id: number;
    session_name: string;
}

interface Staff {
    id: number;
    full_name: string;
    staff_code?: string;
}

interface Participant {
    id: number;
    training_session_id: number;
    staff_member_id: number;
    status: string;
    attendance_status: string | null;
    score: string | null;
    feedback: string | null;
    certificate_issued: boolean;
    certificate_issued_at: string | null;
    session?: Session;
    staff_member?: Staff;
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export default function Participants() {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [viewingParticipant, setViewingParticipant] = useState<Participant | null>(null);

    const canManage = hasPermission('manage_staff_training');

    const fetchParticipants = async () => {
        setIsLoading(true);
        try {
            const response = await trainingService.getParticipants({ page });
            const data = response.data.data;
            if (Array.isArray(data)) {
                setParticipants(data);
                setMeta(response.data.meta || null);
            } else if (data && Array.isArray(data.data)) {
                setParticipants(data.data);
                setMeta({
                    current_page: data.current_page,
                    last_page: data.last_page,
                    per_page: data.per_page,
                    total: data.total,
                });
            } else {
                setParticipants([]);
                setMeta(null);
            }
        } catch (error) {
            console.error('Failed to fetch participants:', error);
            showAlert('error', 'Error', 'Failed to fetch participants');
        } finally {
            setIsLoading(false);
        }
    };



    useEffect(() => {
        fetchParticipants();
        fetchParticipants();
    }, [page]);





    const handleView = (participant: Participant) => {
        setViewingParticipant(participant);
        setIsViewDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        const result = await showConfirmDialog('Remove Participant', 'Are you sure you want to remove this participant from the session?');
        if (!result.isConfirmed) return;
        try {
            await trainingService.deleteParticipant(id);
            fetchParticipants();
            showAlert('success', 'Removed!', 'Participant removed successfully', 2000);
        } catch (error) {
            console.error('Failed to remove participant:', error);
            const errorMessage = getErrorMessage(error, 'Failed to remove participant');
            showAlert('error', 'Error', errorMessage);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            enrolled: 'bg-solarized-blue/10 text-solarized-blue',
            completed: 'bg-solarized-green/10 text-solarized-green',
            failed: 'bg-solarized-red/10 text-solarized-red',
            withdrawn: 'bg-solarized-base01/10 text-solarized-base01',
        };
        return variants[status] || variants.enrolled;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-solarized-base02">Training Participants</h1>
                    <p className="text-solarized-base01">Manage participant progress and certifications</p>
                </div>
                {canManage && (
                    <Link to="/training/participants/create">
                        <Button className="bg-solarized-blue hover:bg-solarized-blue/90">
                            <Plus className="mr-2 h-4 w-4" />
                            Enroll Employee
                        </Button>
                    </Link>
                )}
            </div>



            {/* View Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Participant Details</DialogTitle>
                    </DialogHeader>
                    {viewingParticipant && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-solarized-blue/10 flex items-center justify-center">
                                    <User className="h-6 w-6 text-solarized-blue" />
                                </div>
                                <div>
                                    <p className="font-bold text-lg">{viewingParticipant.staff_member?.full_name}</p>
                                    <p className="text-sm text-solarized-base01">Employee ID: {viewingParticipant.staff_member_id}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-solarized-base01">Session</p>
                                <p className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-solarized-cyan" /> {viewingParticipant.session?.session_name}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-solarized-base01">Status</p>
                                    <Badge className={getStatusBadge(viewingParticipant.status)}>{viewingParticipant.status}</Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-solarized-base01">Attendance</p>
                                    <p className="capitalize">{viewingParticipant.attendance_status || '-'}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-solarized-base01">Score</p>
                                <p className="flex items-center gap-2 font-bold text-xl">
                                    <Trophy className={`h-5 w-5 ${Number(viewingParticipant.score) >= 70 ? 'text-yellow-500' : 'text-solarized-base01'}`} />
                                    {viewingParticipant.score || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-solarized-base01">Feedback</p>
                                <p className="text-sm italic text-solarized-base02 bg-solarized-base3/30 p-3 rounded-lg">
                                    "{viewingParticipant.feedback || 'No feedback provided.'}"
                                </p>
                            </div>
                            {viewingParticipant.certificate_issued && (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-solarized-green font-medium">
                                        <ClipboardCheck className="h-5 w-5" />
                                        Certificate has been issued
                                    </div>
                                    {viewingParticipant.certificate_issued_at && (
                                        <p className="text-xs text-solarized-base01 ml-7">
                                            Issued on: {new Date(viewingParticipant.certificate_issued_at).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {isLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="border-0 shadow-md"><CardContent className="pt-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
                    ))}
                </div>
            ) : participants.length === 0 ? (
                <Card className="border-0 shadow-md text-center py-12">
                    <CardContent>
                        <User className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No participants found</h3>
                        <p className="text-solarized-base01 mt-1">Enroll employees in training sessions to track their progress.</p>
                        {canManage && (
                            <Link to="/training/participants/create">
                                <Button className="mt-4 bg-solarized-blue hover:bg-solarized-blue/90">
                                    <Plus className="mr-2 h-4 w-4" /> Enroll Employee
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {participants.map((p) => (
                            <Card key={p.id} className="border-0 shadow-md hover:shadow-lg transition-all">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-solarized-blue/10 flex items-center justify-center font-bold text-solarized-blue">
                                                {p.staff_member?.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">{p.staff_member?.full_name}</CardTitle>
                                                <CardDescription className="text-xs">{p.session?.session_name}</CardDescription>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleView(p)}><Eye className="mr-2 h-4 w-4" /> View</DropdownMenuItem>
                                                {canManage && (
                                                    <>
                                                        <Link to={`/training/participants/${p.id}/edit`}>
                                                            <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Update</DropdownMenuItem>
                                                        </Link>
                                                        <DropdownMenuItem className="text-solarized-red" onClick={() => handleDelete(p.id)}><Trash2 className="mr-2 h-4 w-4" /> Remove</DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Badge className={getStatusBadge(p.status)}>{p.status}</Badge>
                                        {p.score && <span className="text-sm font-bold text-solarized-base02">Score: {p.score}</span>}
                                    </div>
                                    <div className="text-xs text-solarized-base01 flex gap-4">
                                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date().toLocaleDateString()}</span>
                                        {p.certificate_issued && <span className="text-solarized-green font-medium flex items-center gap-1"><ClipboardCheck className="h-3 w-3" /> Certified</span>}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    {meta && meta.last_page > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}><ChevronLeft className="h-4 w-4" /> Previous</Button>
                            <span className="text-sm text-solarized-base01">Page {meta.current_page} of {meta.last_page}</span>
                            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === meta.last_page}>Next <ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
