import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { trainingService, staffService } from '../../services/api';
import { showAlert, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Checkbox } from '../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

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

export default function ParticipantForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
    // ADDED: training_program_id support
    const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>([]);

    // ADDED: training_program_id support
    const [formData, setFormData] = useState({
        training_session_id: '',
        staff_member_id: '',
        training_program_id: '',
        status: 'enrolled',
        attendance_status: 'pending',
        score: '',
        feedback: '',
        certificate_issued: false,
    });

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // ADDED: training_program_id support
                await Promise.all([fetchSessions(), fetchStaff(), fetchTrainingPrograms()]);
                if (isEditMode) {
                    await fetchParticipant();
                }
            } catch (error) {
                console.error("Error loading data", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [id]);

    const fetchSessions = async () => {
        try {
            const response = await trainingService.getSessions({ paginate: 'false' } as any);
            const data = response.data.data || response.data;
            setSessions(Array.isArray(data) ? data : (data.data || []));
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        }
    };

    const fetchStaff = async () => {
        try {
            const response = await staffService.getAll({ paginate: 'false' } as any);
            const data = response.data.data || response.data;
            setStaffMembers(Array.isArray(data) ? data : (data.data || []));
        } catch (error) {
            console.error('Failed to fetch staff:', error);
        }
    };

    // ADDED: training_program_id support
    const fetchTrainingPrograms = async () => {
        try {
            const response = await trainingService.getPrograms({ paginate: 'false' } as any);
            const data = response.data.data || response.data;
            setTrainingPrograms(Array.isArray(data) ? data : (data.data || []));
        } catch (error) {
            console.error('Failed to fetch training programs:', error);
        }
    };

    const fetchParticipant = async () => {
        try {
            const response = await trainingService.getParticipants({ paginate: 'false' });
            const all = response.data.data || response.data;
            const participant = Array.isArray(all) ? all.find((p: any) => p.id === Number(id)) : null;

            if (participant) {
                // ADDED: training_program_id support
                setFormData({
                    training_session_id: String(participant.training_session_id),
                    staff_member_id: String(participant.staff_member_id),
                    training_program_id: participant.training_program_id ? String(participant.training_program_id) : '',
                    status: participant.status,
                    attendance_status: participant.attendance_status || 'pending',
                    score: participant.score || '',
                    feedback: participant.feedback || '',
                    certificate_issued: participant.certificate_issued,
                });
            } else {
                showAlert('error', 'Error', 'Participant not found');
                navigate('/training/participants');
            }
        } catch (error) {
            console.error('Failed to fetch participant:', error);
            showAlert('error', 'Error', 'Failed to fetch details');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // ADDED: training_program_id support
            const payload = {
                ...formData,
                training_program_id: formData.training_program_id ? Number(formData.training_program_id) : null,
                score: formData.score ? Number(formData.score) : null,
            };

            if (isEditMode) {
                await trainingService.updateParticipant(id!, payload);
                showAlert('success', 'Updated', 'Participant updated successfully', 2000);
            } else {
                // ADDED: training_program_id support
                await trainingService.enrollInSession(Number(formData.training_session_id), {
                    staff_member_id: Number(formData.staff_member_id),
                    training_program_id: payload.training_program_id,
                    status: formData.status,
                    attendance_status: formData.attendance_status,
                    score: payload.score,
                    feedback: formData.feedback,
                    certificate_issued: formData.certificate_issued
                });
                showAlert('success', 'Success', 'Participant enrolled successfully', 2000);
            }
            navigate('/training/participants');
        } catch (error) {
            console.error('Failed to save:', error);
            const msg = getErrorMessage(error, 'Failed to save participant');
            showAlert('error', 'Error', msg);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/training/participants')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-solarized-base02">
                        {isEditMode ? 'Edit Participant' : 'Enroll Participant'}
                    </h1>
                    <p className="text-solarized-base01">
                        {isEditMode ? 'Update participant progress and results' : 'Register a new employee for a training session'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Enrollment Details Section */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold text-solarized-base02">Enrollment Details</CardTitle>
                        <CardDescription>Select the session and the employee to enroll.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-3">
                        {/* ADDED: training_program_id support - moved before session */}
                        <div className="space-y-2">
                            <Label htmlFor="training_program">Training Program (Optional)</Label>
                            <Select
                                value={formData.training_program_id}
                                onValueChange={(val) => setFormData({ ...formData, training_program_id: val })}
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Select program (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {trainingPrograms.map((program) => (
                                        <SelectItem key={program.id} value={String(program.id)}>
                                            {program.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="session">Session *</Label>
                            <Select
                                value={formData.training_session_id}
                                onValueChange={(val) => setFormData({ ...formData, training_session_id: val })}
                                disabled={isEditMode}
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Select session" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sessions.map((session) => (
                                        <SelectItem key={session.id} value={String(session.id)}>
                                            {session.session_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="employee">Employee *</Label>
                            <Select
                                value={formData.staff_member_id}
                                onValueChange={(val) => setFormData({ ...formData, staff_member_id: val })}
                                disabled={isEditMode}
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Select employee" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]" position="popper">
                                    {staffMembers.map((staff) => (
                                        <SelectItem key={staff.id} value={String(staff.id)}>
                                            {staff.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Progress & Results Section */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold text-solarized-base02">Progress & Results</CardTitle>
                        <CardDescription>Track the participant's status and performance.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(val) => setFormData({ ...formData, status: val })}
                            >
                                <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="enrolled">Enrolled</SelectItem>
                                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Attendance Status</Label>
                            <Select
                                value={formData.attendance_status}
                                onValueChange={(val) => setFormData({ ...formData, attendance_status: val })}
                            >
                                <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="present">Present</SelectItem>
                                    <SelectItem value="absent">Absent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Score (0-100)</Label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={formData.score}
                                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                                className="bg-white"
                                placeholder="0.00"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Feedback & Certification Section */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold text-solarized-base02">Feedback & Certification</CardTitle>
                        <CardDescription>Provide feedback and manage certification status.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Feedback</Label>
                            <Textarea
                                value={formData.feedback}
                                onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                                placeholder="Enter instructor feedback regarding the participant's performance..."
                                rows={4}
                                className="bg-white"
                            />
                        </div>

                        <div className="flex items-center space-x-2 p-4 border rounded-lg bg-white">
                            <Checkbox
                                id="cert"
                                checked={formData.certificate_issued}
                                onCheckedChange={(checked) => setFormData({ ...formData, certificate_issued: !!checked })}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="cert" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Issue Certificate
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Check this box if the participant has successfully completed the training and earned a certificate.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/training/participants')}>
                        Cancel
                    </Button>
                    <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90 min-w-[120px]" disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {isEditMode ? 'Update Participant' : 'Enroll Participant'}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
