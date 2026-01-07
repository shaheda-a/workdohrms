import { useState, useEffect } from 'react';
import { recruitmentService } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  MoreVertical,
  User,
  Briefcase,
  Calendar,
  Star,
  FileText,
  CheckCircle,
  XCircle,
  Award
} from 'lucide-react';
import { Textarea } from '../../components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

interface JobApplication {
  id: number;
  job_posting_id: number;
  candidate_id: number;
  job_stage_id: number | null;
  applied_date: string;
  rating: number | null;
  notes: string | null;
  custom_answers: string[] | null;
  status: 'pending' | 'shortlisted' | 'rejected' | 'hired';
  created_at: string;
  updated_at: string;
  job?: {
    id: number;
    title: string;
    category?: {
      title: string;
    };
  };
  candidate?: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  stage?: {
    id: number;
    title: string;
    color: string;
  } | null;
}

interface Job {
  id: number;
  title: string;
  status: 'draft' | 'open' | 'closed';
  applications_count: number;
}

interface Candidate {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface JobStage {
  id: number;
  title: string;
  color: string;
}

export default function JobApplications() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stages, setStages] = useState<JobStage[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [actionType, setActionType] = useState<'move' | 'rate' | 'note' | ''>('');
  const [formData, setFormData] = useState({
    job_id: '',
    candidate_id: '',
    custom_answers: '',
    job_stage_id: '',
    rating: '3',
    note: '',
  });

  useEffect(() => {
    fetchJobs();
    fetchCandidates();
    fetchStages();
    fetchApplications();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [selectedJob, selectedStage, selectedStatus]);

  const fetchJobs = async () => {
    try {
      const response = await recruitmentService.getJobs({ paginate: false });
      if (response.data && response.data.data) {
        // Filter to only show open jobs for new applications (based on your backend statuses)
        setJobs(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  const fetchCandidates = async () => {
    try {
      const response = await recruitmentService.getCandidates({ paginate: false });
      if (response.data && response.data.data) {
        setCandidates(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    }
  };

  const fetchStages = async () => {
    try {
      const response = await recruitmentService.getJobStages({ paginate: false });
      if (response.data && response.data.data) {
        setStages(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stages:', error);
    }
  };

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (selectedJob && selectedJob !== 'all') params.job_posting_id = Number(selectedJob);
      if (selectedStage && selectedStage !== 'all') params.job_stage_id = Number(selectedStage);
      if (selectedStatus && selectedStatus !== 'all') params.status = selectedStatus;
      params.paginate = false;

      const response = await recruitmentService.getJobApplications(params);
      if (response.data && response.data.data) {
        setApplications(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.job_id) {
      alert('Please select a job');
      return;
    }

    if (!formData.candidate_id) {
      alert('Please select a candidate');
      return;
    }

    try {
      await recruitmentService.createJobApplication(Number(formData.job_id), {
        candidate_id: Number(formData.candidate_id),
        custom_answers: formData.custom_answers ? JSON.parse(formData.custom_answers) : undefined,
      });
      setIsDialogOpen(false);
      resetForm();
      fetchApplications();
    } catch (error: any) {
      console.error('Failed to create application:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to create application. Please try again.');
      }
    }
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplication || !actionType) return;

    try {
      switch (actionType) {
        case 'move':
          await recruitmentService.moveJobApplicationStage(
            selectedApplication.id,
            { job_stage_id: Number(formData.job_stage_id) }
          );
          break;
        case 'rate':
          await recruitmentService.rateJobApplication(
            selectedApplication.id,
            { 
              rating: Number(formData.rating),
              notes: formData.note || selectedApplication.notes || ''
            }
          );
          break;
        case 'note':
          await recruitmentService.addJobApplicationNote(
            selectedApplication.id,
            { note: formData.note }
          );
          break;
      }
      setIsActionDialogOpen(false);
      resetForm();
      setActionType('');
      fetchApplications();
    } catch (error: any) {
      console.error('Failed to perform action:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to perform action. Please try again.');
      }
    }
  };

  const handleQuickAction = async (application: JobApplication, action: 'shortlist' | 'reject' | 'hire') => {
    try {
      switch (action) {
        case 'shortlist':
          await recruitmentService.shortlistJobApplication(application.id);
          break;
        case 'reject':
          await recruitmentService.rejectJobApplication(application.id);
          break;
        case 'hire':
          await recruitmentService.hireJobApplication(application.id);
          break;
      }
      fetchApplications();
    } catch (error: any) {
      console.error('Failed to perform quick action:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to perform action. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      job_id: '',
      candidate_id: '',
      custom_answers: '',
      job_stage_id: '',
      rating: '3',
      note: '',
    });
  };

  const handleView = (application: JobApplication) => {
    setSelectedApplication(application);
    setIsViewDialogOpen(true);
  };

  const handleActionClick = (application: JobApplication, type: 'move' | 'rate' | 'note') => {
    setSelectedApplication(application);
    setActionType(type);
    setFormData({
      ...formData,
      job_stage_id: application.job_stage_id?.toString() || '',
      rating: application.rating?.toString() || '3',
    });
    setIsActionDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'shortlisted':
        return <Badge className="bg-blue-100 text-blue-800">Shortlisted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'hired':
        return <Badge className="bg-green-100 text-green-800">Hired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-solarized-base01">Not rated</span>;
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    hired: applications.filter(a => a.status === 'hired').length,
  };

  // Get open jobs for the form (based on your backend statuses)
  const openJobs = jobs.filter(job => job.status === 'open');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">Job Applications</h1>
          <p className="text-solarized-base01">Manage and track job applications</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          setIsDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button
              className="bg-solarized-blue hover:bg-solarized-blue/90"
              onClick={resetForm}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Application
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Application</DialogTitle>
              <DialogDescription>
                Add a new job application
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="job_id">Job *</Label>
                  <Select
                    value={formData.job_id}
                    onValueChange={(value) => setFormData({ ...formData, job_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select job" />
                    </SelectTrigger>
                    <SelectContent>
                      {openJobs.map((job) => (
                        <SelectItem key={job.id} value={job.id.toString()}>
                          {job.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {openJobs.length === 0 && (
                    <p className="text-sm text-red-500">No open jobs available. Please create an open job first.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="candidate_id">Candidate *</Label>
                  <Select
                    value={formData.candidate_id}
                    onValueChange={(value) => setFormData({ ...formData, candidate_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select candidate" />
                    </SelectTrigger>
                    <SelectContent>
                      {candidates.map((candidate) => (
                        <SelectItem key={candidate.id} value={candidate.id.toString()}>
                          {candidate.name} ({candidate.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom_answers">Custom Answers (JSON)</Label>
                  <Textarea
                    id="custom_answers"
                    value={formData.custom_answers}
                    onChange={(e) => setFormData({ ...formData, custom_answers: e.target.value })}
                    placeholder='{"question": "answer", ...}'
                    rows={4}
                  />
                  <p className="text-sm text-solarized-base01">
                    Optional: JSON format for custom application questions
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-solarized-blue hover:bg-solarized-blue/90"
                  disabled={!formData.job_id || !formData.candidate_id || openJobs.length === 0}
                >
                  Create Application
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Total Applications</p>
                <p className="text-2xl font-bold text-solarized-base02">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Pending Review</p>
                <p className="text-2xl font-bold text-solarized-base02">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Shortlisted</p>
                <p className="text-2xl font-bold text-solarized-base02">{stats.shortlisted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Hired</p>
                <p className="text-2xl font-bold text-solarized-base02">{stats.hired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Filter Applications</CardTitle>
          <CardDescription>Filter by job, stage, or status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Job Posting</Label>
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger>
                  <SelectValue placeholder="All Jobs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Stage</Label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger>
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        {stage.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : applications.length > 0 ? (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Applications List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-medium">
                          {application.candidate?.name}
                        </p>
                        <p className="text-sm text-solarized-base01">
                          {application.candidate?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {application.job?.title || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {application.stage ? (
                        <Badge
                          style={{ backgroundColor: `${application.stage.color}20`, color: application.stage.color }}
                        >
                          {application.stage.title}
                        </Badge>
                      ) : (
                        <Badge variant="outline">No Stage</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(application.applied_date)}</TableCell>
                    <TableCell>{renderStars(application.rating)}</TableCell>
                    <TableCell>{getStatusBadge(application.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(application)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleActionClick(application, 'move')}>
                            <Briefcase className="mr-2 h-4 w-4" />
                            Move to Stage
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleActionClick(application, 'rate')}>
                            <Star className="mr-2 h-4 w-4" />
                            Rate Application
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleActionClick(application, 'note')}>
                            <FileText className="mr-2 h-4 w-4" />
                            Add Note
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleQuickAction(application, 'shortlist')}
                            disabled={application.status === 'shortlisted'}
                          >
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                            Shortlist
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleQuickAction(application, 'reject')}
                            disabled={application.status === 'rejected'}
                          >
                            <XCircle className="mr-2 h-4 w-4 text-red-600" />
                            Reject
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleQuickAction(application, 'hire')}
                            disabled={application.status === 'hired'}
                          >
                            <Award className="mr-2 h-4 w-4 text-purple-600" />
                            Hire
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-solarized-base02">No applications found</h3>
            <p className="text-solarized-base01 mt-1">
              {selectedJob !== 'all' || selectedStage !== 'all' || selectedStatus !== 'all'
                ? 'Try changing your filters'
                : 'Start by creating your first job application'}
            </p>
            <Button
              className="mt-4 bg-solarized-blue hover:bg-solarized-blue/90"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Application
            </Button>
          </CardContent>
        </Card>
      )}

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Complete information about this job application
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6 py-4">
              <Tabs defaultValue="details">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="candidate">Candidate</TabsTrigger>
                  <TabsTrigger value="notes">Notes & Rating</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-solarized-base01">Job Title</Label>
                      <p className="font-medium">{selectedApplication.job?.title || 'N/A'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-solarized-base01">Application Status</Label>
                      <div>{getStatusBadge(selectedApplication.status)}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-solarized-base01">Current Stage</Label>
                      {selectedApplication.stage ? (
                        <Badge
                          style={{ 
                            backgroundColor: `${selectedApplication.stage.color}20`, 
                            color: selectedApplication.stage.color 
                          }}
                        >
                          {selectedApplication.stage.title}
                        </Badge>
                      ) : (
                        <p className="font-medium">No Stage</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-solarized-base01">Applied Date</Label>
                      <p className="font-medium">{formatDate(selectedApplication.applied_date)}</p>
                    </div>
                  </div>
                  
                  {selectedApplication.custom_answers && selectedApplication.custom_answers.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-solarized-base01">Custom Answers</Label>
                      <pre className="bg-solarized-base03/10 p-4 rounded text-sm overflow-auto">
                        {JSON.stringify(selectedApplication.custom_answers, null, 2)}
                      </pre>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="candidate" className="space-y-4">
                  {selectedApplication.candidate && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-solarized-base01">Name</Label>
                        <p className="font-medium">{selectedApplication.candidate.name}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-solarized-base01">Email</Label>
                        <p className="font-medium">{selectedApplication.candidate.email}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-solarized-base01">Phone</Label>
                        <p className="font-medium">{selectedApplication.candidate.phone || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="notes" className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-solarized-base01">Rating</Label>
                    {renderStars(selectedApplication.rating)}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-solarized-base01">Notes</Label>
                    <div className="bg-solarized-base03/10 p-4 rounded">
                      {selectedApplication.notes || 'No notes added'}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'move' && 'Move to Stage'}
              {actionType === 'rate' && 'Rate Application'}
              {actionType === 'note' && 'Add Note'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'move' && 'Move this application to a different stage'}
              {actionType === 'rate' && 'Rate this application (1-5 stars)'}
              {actionType === 'note' && 'Add a note to this application'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAction}>
            <div className="grid gap-4 py-4">
              {actionType === 'move' && (
                <div className="space-y-2">
                  <Label htmlFor="job_stage_id">Select Stage *</Label>
                  <Select
                    value={formData.job_stage_id}
                    onValueChange={(value) => setFormData({ ...formData, job_stage_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id.toString()}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: stage.color }}
                            />
                            {stage.title}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {actionType === 'rate' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="rating">Rating (1-5)</Label>
                    <Select
                      value={formData.rating}
                      onValueChange={(value) => setFormData({ ...formData, rating: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select rating" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            <div className="flex items-center gap-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < num ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                              <span>({num})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note">Note</Label>
                    <Textarea
                      id="note"
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      placeholder="Enter your notes here..."
                      rows={4}
                    />
                  </div>
                </>
              )}

              {actionType === 'note' && (
                <div className="space-y-2">
                  <Label htmlFor="note">Note *</Label>
                  <Textarea
                    id="note"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Enter your notes here..."
                    rows={4}
                    required
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsActionDialogOpen(false);
                  setActionType('');
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-solarized-blue hover:bg-solarized-blue/90"
                disabled={
                  (actionType === 'move' && !formData.job_stage_id) ||
                  (actionType === 'note' && !formData.note)
                }
              >
                {actionType === 'move' && 'Move Application'}
                {actionType === 'rate' && 'Save Rating'}
                {actionType === 'note' && 'Add Note'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}