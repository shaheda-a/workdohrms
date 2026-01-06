import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { trainingService } from '../../services/api';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../../components/ui/dialog';

import {
    Plus,
    User,
    GraduationCap,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    Trophy,
    ClipboardCheck,
    Search,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { useAuth } from '../../context/AuthContext';
import DataTable, { TableColumn } from 'react-data-table-component';

interface Session {
    id: number;
    session_name: string;
}

interface Staff {
    id: number;
    full_name: string;
    staff_code?: string;
}

// ADDED: training_program_id support
interface TrainingProgram {
    id: number;
    title: string;
}

interface Participant {
    id: number;
    training_session_id: number;
    staff_member_id: number;
    training_program_id?: number | null;
    status: string;
    attendance_status: string | null;
    score: string | null;
    feedback: string | null;
    certificate_issued: boolean;
    certificate_issued_at: string | null;
    session?: Session;
    staff_member?: Staff;
    training_program?: TrainingProgram;
}

export default function Participants() {
    const { hasPermission } = useAuth();
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [viewingParticipant, setViewingParticipant] = useState<Participant | null>(null);

    const canManage = hasPermission('manage_staff_training');

    const fetchParticipants = useCallback(
        async (currentPage: number = 1) => {
            setIsLoading(true);
            try {
                const params: Record<string, unknown> = {
                    page: currentPage,
                    per_page: perPage,
                    search,
                };

                const response = await trainingService.getParticipants(params);
                const payload = response.data.data;

                if (Array.isArray(payload)) {
                    setParticipants(payload);
                    setTotalRows(response.data.meta?.total ?? payload.length);
                } else if (payload && Array.isArray(payload.data)) {
                    setParticipants(payload.data);
                    setTotalRows(payload.total);
                } else {
                    setParticipants([]);
                    setTotalRows(0);
                }
            } catch (error) {
                console.error('Failed to fetch participants:', error);
                showAlert('error', 'Error', 'Failed to fetch participants');
                setParticipants([]);
                setTotalRows(0);
            } finally {
                setIsLoading(false);
            }
        },
        [perPage, search]
    );

    useEffect(() => {
        fetchParticipants(page);
    }, [page, fetchParticipants]);





    const handleView = (participant: Participant) => {
        setViewingParticipant(participant);
        setIsViewDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        const result = await showConfirmDialog('Remove Participant', 'Are you sure you want to remove this participant from the session?');
        if (!result.isConfirmed) return;
        try {
            await trainingService.deleteParticipant(id);
            fetchParticipants(page);
            showAlert('success', 'Removed!', 'Participant removed successfully', 2000);
        } catch (error) {
            console.error('Failed to remove participant:', error);
            const errorMessage = getErrorMessage(error, 'Failed to remove participant');
            showAlert('error', 'Error', errorMessage);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            enrolled: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
            completed: 'bg-green-100 text-green-700 hover:bg-green-100',
            failed: 'bg-red-100 text-red-700 hover:bg-red-100',
            withdrawn: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
        };
        return variants[status] || variants.enrolled;
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
    const columns: TableColumn<Participant>[] = [
        {
            name: 'Employee',
            selector: (row) => row.staff_member?.full_name || '',
            cell: (row) => (
                <div className="flex items-center gap-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xs text-center shrink-0">
                        {row.staff_member?.full_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                        <p className="font-medium truncate">{row.staff_member?.full_name}</p>
                        {/* <p className="text-xs text-muted-foreground">ID: {row.staff_member_id}</p> */}
                    </div>
                </div>
            ),
            sortable: true,
            minWidth: '200px',
        },
        {
            name: 'Training Program',
            selector: (row) => row.training_program?.title || '',
            cell: (row) => (
                <span className="text-sm font-medium">
                    {row.training_program?.title || '-'}
                </span>
            ),
            sortable: true,
            minWidth: '180px',
        },
        {
            name: 'Session',
            selector: (row) => row.session?.session_name || '',
            cell: (row) => (
                <span className="text-sm">
                    {row.session?.session_name || '-'}
                </span>
            ),
            sortable: true,
            minWidth: '180px',
        },
        {
            name: 'Status',
            cell: (row) => (
                <Badge className={getStatusBadge(row.status)}>
                    {row.status}
                </Badge>
            ),
            width: '120px',
        },
        {
            name: 'Score',
            selector: (row) => row.score || '',
            cell: (row) => (
                <div className="flex items-center gap-1 font-medium">
                    {row.score ? (
                        <>
                            <Trophy className={`h-3 w-3 ${Number(row.score) >= 70 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                            {row.score}
                        </>
                    ) : '-'}
                </div>
            ),
            width: '100px',
        },
        {
            name: 'Certificate',
            cell: (row) => (
                row.certificate_issued ? (
                    <div className="flex items-center gap-1 text-green-600">
                        <ClipboardCheck className="h-4 w-4" />
                        <span className="text-xs font-medium">Issued</span>
                    </div>
                ) : '-'
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
                            <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        {canManage && (
                            <>
                                <Link to={`/training/participants/${row.id}/edit`}>
                                    <DropdownMenuItem>
                                        <Edit className="mr-2 h-4 w-4" /> Update
                                    </DropdownMenuItem>
                                </Link>
                                <DropdownMenuItem
                                    onClick={() => handleDelete(row.id)}
                                    className="text-red-600"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Remove
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
                            {/* ADDED: training_program_id support */}
                            {viewingParticipant.training_program && (
                                <div>
                                    <p className="text-sm text-solarized-base01">Training Program</p>
                                    <p className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-solarized-blue" /> {viewingParticipant.training_program.title}</p>
                                </div>
                            )}
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

            <Card>
                <CardHeader>
                    <form onSubmit={handleSearchSubmit} className="flex gap-4">
                        <Input
                            placeholder="Search participants..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Button type="submit" variant="outline">
                            <Search className="mr-2 h-4 w-4" /> Search
                        </Button>
                    </form>
                </CardHeader>

                <CardContent>
                    {!isLoading && participants.length === 0 ? (
                        <div className="text-center py-12">
                            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p>No participants found</p>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={participants}
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
