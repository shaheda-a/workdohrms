import { useState, useEffect } from 'react';
import { recruitmentService } from '../../services/api';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
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
  Plus, 
  Search, 
  User, 
  Mail, 
  Phone, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  Archive,
  ArchiveRestore,
  Calendar,
  MapPin,
  Linkedin,
  FileText,
  Download
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Textarea } from '../../components/ui/textarea';

interface Candidate {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  source?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  linkedin_url?: string;
  resume_path?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  applications_count?: number;
  applications?: Application[];
}

interface Application {
  id: number;
  job_id: number;
  candidate_id: number;
  status: string;
  stage_id?: number;
  created_at: string;
  updated_at: string;
  job?: {
    id: number;
    title: string;
  };
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function Candidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [isArchivedFilter, setIsArchivedFilter] = useState<boolean | null>(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'new',
    source: 'website',
    date_of_birth: '',
    gender: '',
    address: '',
    linkedin_url: '',
    resume: null as File | null,
  });

  useEffect(() => {
    fetchCandidates();
  }, [page]);

  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = { page };
      if (search) params.search = search;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (sourceFilter && sourceFilter !== 'all') params.source = sourceFilter;
      if (isArchivedFilter !== null) params.is_archived = isArchivedFilter;

      const response = await recruitmentService.getCandidates(params);

      if (response.data && response.data.data) {
        // Paginated response
        setCandidates(response.data.data);
        setMeta(response.data.meta);
      } else if (Array.isArray(response.data)) {
        // Non-paginated response
        setCandidates(response.data);
        setMeta(null);
      } else {
        setCandidates([]);
        setMeta(null);
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
      setCandidates([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  } catch (error) {
    console.error('Failed to fetch candidates:', error);
    showAlert('error', 'Error', 'Failed to fetch candidates');
    setCandidates([]);
    setMeta(null);
  } finally {
    setIsLoading(false);
  }
};

  const handleSearch = () => {
    setPage(1);
    fetchCandidates();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCandidate) {
        // For update, use regular JSON
        await recruitmentService.updateCandidate(editingCandidate.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          status: formData.status,
        });
      } else {
        // For create, use FormData for file upload
        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('email', formData.email);
        formDataToSend.append('phone', formData.phone);
        formDataToSend.append('status', formData.status);
        formDataToSend.append('source', formData.source);
        if (formData.date_of_birth) formDataToSend.append('date_of_birth', formData.date_of_birth);
        if (formData.gender) formDataToSend.append('gender', formData.gender);
        if (formData.address) formDataToSend.append('address', formData.address);
        if (formData.linkedin_url) formDataToSend.append('linkedin_url', formData.linkedin_url);
        if (formData.resume) formDataToSend.append('resume', formData.resume);

        await recruitmentService.createCandidate(formDataToSend);
      }
      showAlert(
        'success',
        'Success!',
        editingCandidate ? 'Candidate updated successfully' : 'Candidate created successfully',
        2000
      );
      setIsDialogOpen(false);
      setEditingCandidate(null);
      resetForm();
      fetchCandidates();
    } catch (error: unknown) {
      console.error('Failed to save candidate:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to save candidate'));
    }
  };

  const handleEdit = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setFormData({
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone || '',
      status: candidate.status || 'new',
      source: candidate.source || 'website',
      date_of_birth: candidate.date_of_birth || '',
      gender: candidate.gender || '',
      address: candidate.address || '',
      linkedin_url: candidate.linkedin_url || '',
      resume: null,
    });
    setIsDialogOpen(true);
  };

  const handleView = (candidate: Candidate) => {
    setViewingCandidate(candidate);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await showConfirmDialog(
      'Are you sure?',
      'You want to delete this candidate?'
    );

    if (!result.isConfirmed) return;

    try {
      await recruitmentService.deleteCandidate(id);
      showAlert('success', 'Deleted!', 'Candidate deleted successfully', 2000);
      fetchCandidates();
    } catch (error: unknown) {
      console.error('Failed to delete candidate:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to delete candidate'));
    }
  };

  const handleArchive = async (id: number) => {
    if (!confirm('Are you sure you want to archive this candidate?')) return;
    try {
      await recruitmentService.archiveCandidate(id);
      fetchCandidates();
    } catch (error) {
      console.error('Failed to archive candidate:', error);
    }
  };

  const handleUnarchive = async (id: number) => {
    try {
      await recruitmentService.updateCandidate(id, { is_archived: false });
      fetchCandidates();
    } catch (error) {
      console.error('Failed to unarchive candidate:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      status: 'new',
      source: 'website',
      date_of_birth: '',
      gender: '',
      address: '',
      linkedin_url: '',
      resume: null,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      new: 'bg-solarized-blue/10 text-solarized-blue border-solarized-blue/20',
      screening: 'bg-solarized-yellow/10 text-solarized-yellow border-solarized-yellow/20',
      interview: 'bg-solarized-violet/10 text-solarized-violet border-solarized-violet/20',
      offered: 'bg-solarized-cyan/10 text-solarized-cyan border-solarized-cyan/20',
      hired: 'bg-solarized-green/10 text-solarized-green border-solarized-green/20',
      rejected: 'bg-solarized-red/10 text-solarized-red border-solarized-red/20',
    };
    return variants[status] || variants.new;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const downloadResume = (candidate: Candidate) => {
    if (!candidate.resume_path) {
      alert('No resume available for download');
      return;
    }
    
    // Assuming the resume is stored in the public storage
    const resumeUrl = `/storage/${candidate.resume_path}`;
    window.open(resumeUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">Candidates</h1>
          <p className="text-solarized-base01">Manage job applicants and candidates</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-solarized-blue hover:bg-solarized-blue/90"
              onClick={() => {
                setEditingCandidate(null);
                resetForm();
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Candidate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCandidate ? 'Edit Candidate' : 'Add Candidate'}</DialogTitle>
              <DialogDescription>
                {editingCandidate ? 'Update the candidate details.' : 'Add a new candidate.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4 md:grid-cols-2">
                {!editingCandidate && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="resume">Resume (PDF, DOC)</Label>
                    <Input
                      id="resume"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setFormData({ ...formData, resume: file });
                      }}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g., john@example.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g., +1 555-1234"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="screening">Screening</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="offered">Offered</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {!editingCandidate && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="source">Source</Label>
                      <Select
                        value={formData.source}
                        onValueChange={(value) => setFormData({ ...formData, source: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="referral">Referral</SelectItem>
                          <SelectItem value="job_portal">Job Portal</SelectItem>
                          <SelectItem value="social_media">Social Media</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth">Date of Birth</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => setFormData({ ...formData, gender: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                      <Input
                        id="linkedin_url"
                        value={formData.linkedin_url}
                        onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Enter full address"
                        rows={3}
                      />
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90">
                  {editingCandidate ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Candidate Profile</DialogTitle>
            </DialogHeader>
            {viewingCandidate && (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-solarized-blue/10 text-solarized-blue text-lg">
                      {getInitials(viewingCandidate.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-bold text-solarized-base02">{viewingCandidate.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusBadge(viewingCandidate.status)}>
                        {viewingCandidate.status}
                      </Badge>
                      {viewingCandidate.is_archived && (
                        <Badge variant="outline" className="border-solarized-yellow/50 text-solarized-yellow">
                          Archived
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {viewingCandidate.source || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-solarized-base01 flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Email
                    </Label>
                    <p className="font-medium">{viewingCandidate.email}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-solarized-base01 flex items-center gap-2">
                      <Phone className="h-4 w-4" /> Phone
                    </Label>
                    <p className="font-medium">{viewingCandidate.phone || '-'}</p>
                  </div>
                  
                  {viewingCandidate.date_of_birth && (
                    <div className="space-y-2">
                      <Label className="text-solarized-base01 flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Date of Birth
                      </Label>
                      <p className="font-medium">{formatDate(viewingCandidate.date_of_birth)}</p>
                    </div>
                  )}
                  
                  {viewingCandidate.gender && (
                    <div className="space-y-2">
                      <Label className="text-solarized-base01">Gender</Label>
                      <p className="font-medium">{viewingCandidate.gender}</p>
                    </div>
                  )}
                  
                  {viewingCandidate.linkedin_url && (
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-solarized-base01 flex items-center gap-2">
                        <Linkedin className="h-4 w-4" /> LinkedIn
                      </Label>
                      <a 
                        href={viewingCandidate.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-solarized-blue hover:underline font-medium"
                      >
                        {viewingCandidate.linkedin_url}
                      </a>
                    </div>
                  )}
                  
                  {viewingCandidate.address && (
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-solarized-base01 flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Address
                      </Label>
                      <p className="font-medium">{viewingCandidate.address}</p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label className="text-solarized-base01">Applications</Label>
                    <p className="font-medium">{viewingCandidate.applications_count || 0} applications</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-solarized-base01">Created</Label>
                    <p className="font-medium">{formatDate(viewingCandidate.created_at)}</p>
                  </div>
                  
                  {viewingCandidate.resume_path && (
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-solarized-base01 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Resume
                      </Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadResume(viewingCandidate)}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download Resume
                      </Button>
                    </div>
                  )}
                </div>
                
                {viewingCandidate.applications && viewingCandidate.applications.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-solarized-base02">Job Applications</h4>
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Job Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Applied Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {viewingCandidate.applications.map((app) => (
                            <TableRow key={app.id}>
                              <TableCell className="font-medium">
                                {app.job?.title || 'Unknown Job'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {app.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDate(app.created_at)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
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

      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[100px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-solarized-base01" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-4 flex-1">
              <div className="space-y-2 min-w-[50px]">
                {/* <Label htmlFor="status-filter" className="text-xs">Status</Label> */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="screening">Screening</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="offered">Offered</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 min-w-[50px]">
                {/* <Label htmlFor="source-filter" className="text-xs">Source</Label> */}
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="job_portal">Job Portal</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 min-w-[100px]">
                {/* <Label htmlFor="archive-filter" className="text-xs">Archive Status</Label> */}
                <Select 
                  value={isArchivedFilter === null ? 'all' : isArchivedFilter ? 'true' : 'false'} 
                  onValueChange={(value) => {
                    if (value === 'all') setIsArchivedFilter(null);
                    else setIsArchivedFilter(value === 'true');
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Archive Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Active</SelectItem>
                    <SelectItem value="true">Archived</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end gap-2">
                <Button 
                  onClick={handleSearch} 
                  className="bg-solarized-blue hover:bg-solarized-blue/90 h-9"
                >
                  Apply Filters
                </Button>
                <Button 
                  variant="outline" 
                  className="h-9"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setSourceFilter('all');
                    setIsArchivedFilter(false);
                    setPage(1);
                    fetchCandidates();
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-solarized-base02">No candidates found</h3>
              <p className="text-solarized-base01 mt-1">Add candidates or adjust your filters.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Applications</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[60px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.map((candidate) => (
                      <TableRow key={candidate.id} className={candidate.is_archived ? 'opacity-70' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-solarized-blue/10 text-solarized-blue">
                                {getInitials(candidate.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{candidate.name}</div>
                              {candidate.is_archived && (
                                <Badge variant="outline" className="text-xs mt-1 border-solarized-yellow/50 text-solarized-yellow">
                                  Archived
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-solarized-base01" />
                              <span className="truncate max-w-[150px]">{candidate.email}</span>
                            </div>
                            {candidate.phone && (
                              <div className="flex items-center gap-1 text-sm text-solarized-base01">
                                <Phone className="h-3 w-3" />
                                <span className="truncate max-w-[150px]">{candidate.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {candidate.source || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{candidate.applications_count || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusBadge(candidate.status)} text-xs`}>
                            {candidate.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-solarized-base01">
                            {formatDate(candidate.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(candidate)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(candidate)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              {candidate.resume_path && (
                                <DropdownMenuItem onClick={() => downloadResume(candidate)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download Resume
                                </DropdownMenuItem>
                              )}
                              {!candidate.is_archived ? (
                                <DropdownMenuItem 
                                  onClick={() => handleArchive(candidate.id)}
                                  className="text-solarized-yellow"
                                >
                                  <Archive className="mr-2 h-4 w-4" />
                                  Archive
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => handleUnarchive(candidate.id)}
                                  className="text-solarized-green"
                                >
                                  <ArchiveRestore className="mr-2 h-4 w-4" />
                                  Unarchive
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleDelete(candidate.id)} 
                                className="text-solarized-red"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {meta && meta.last_page > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                  <p className="text-sm text-solarized-base01">
                    Showing {(meta.current_page - 1) * meta.per_page + 1} to{' '}
                    {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total} candidates
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
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => {
                        let pageNum;
                        if (meta.last_page <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= meta.last_page - 2) {
                          pageNum = meta.last_page - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
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
    </div>
  );
}