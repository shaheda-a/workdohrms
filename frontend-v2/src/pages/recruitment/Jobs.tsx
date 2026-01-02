// Jobs.tsx
import { useState, useEffect } from 'react';
import { recruitmentService, settingsService } from '../../services/api'; // Only import the service
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
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
  Plus, Briefcase, MapPin, Users, ChevronLeft,
  ChevronRight, MoreHorizontal, Eye, Edit, Trash2,
  Calendar, DollarSign, Award, Target
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

// ==================== LOCAL TYPE DEFINITIONS ====================
interface Job {
  id: number;
  title: string;
  job_category_id?: number;
  office_location_id?: number;
  division_id?: number;
  positions?: number;
  description?: string;
  requirements?: string;
  skills?: string;
  experience_required?: string;
  salary_from?: number;
  salary_to?: number;
  status: string;
  start_date?: string;
  end_date?: string;
  category?: { 
    id: number; 
    title: string;  // Changed from 'name' to 'title'
    description?: string;
    created_at?: string;
    updated_at?: string;
  };
  office_location?: {  // Changed from 'officeLocation' to match API
    id: number; 
    title: string;  // Changed from 'name' to 'title'
    address?: string;
    contact_phone?: string;
    contact_email?: string;
    is_active?: boolean;
  };
  division?: { 
    id: number; 
    title: string;  // Changed from 'name' to 'title'
    office_location_id?: number;
    notes?: string;
    is_active?: boolean;
  };
  applications_count: number;
  created_at: string;
}

interface DropdownOption {
  id: number;
  name: string;
  originalData?: any; // For debugging
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface FormData {
  title: string;
  job_category_id: string | null;
  office_location_id: string | null;
  division_id: string | null;
  positions: string;
  description: string;
  requirements: string;
  skills: string;
  experience_required: string;
  salary_from: string;
  salary_to: string;
  status: string;
  start_date: string;
  end_date: string;
}
// ==================== END LOCAL TYPE DEFINITIONS ====================

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const [dropdowns, setDropdowns] = useState({
    categories: [] as DropdownOption[],
    locations: [] as DropdownOption[],
    divisions: [] as DropdownOption[],
  });

  const [formData, setFormData] = useState<FormData>({
    title: '',
    job_category_id: null,
    office_location_id: null,
    division_id: null,
    positions: '',
    description: '',
    requirements: '',
    skills: '',
    experience_required: '',
    salary_from: '',
    salary_to: '',
    status: 'draft',
    start_date: '',
    end_date: '',
  });

  // Fetch all data
  useEffect(() => {
    fetchJobs();
    fetchDropdownData();
  }, [page, statusFilter, search]);

  // Fetch jobs with filters
const fetchJobs = async () => {
  setIsLoading(true);
  try {
    const params: any = {
      page,
      per_page: 10
    };

    if (statusFilter && statusFilter !== 'all') {
      params.status = statusFilter;
    }

    if (search) {
      params.search = search;
    }

    const response = await recruitmentService.getJobs(params);

    if (response.data.success) {
      const jobsData = response.data.data.data || [];
      
      // Map API data to match our Job interface
      const mappedJobs = jobsData.map((job: any) => ({
        ...job,
        category: job.category ? {
          id: job.category.id,
          title: job.category.title,
          description: job.category.description
        } : undefined,
        office_location: job.office_location ? {  // Use the correct field name from API
          id: job.office_location.id,
          title: job.office_location.title,
          address: job.office_location.address,
          contact_phone: job.office_location.contact_phone,
          contact_email: job.office_location.contact_email,
          is_active: job.office_location.is_active
        } : undefined,
        division: job.division ? {
          id: job.division.id,
          title: job.division.title,
          office_location_id: job.division.office_location_id,
          notes: job.division.notes,
          is_active: job.division.is_active
        } : undefined
      }));

      setJobs(mappedJobs);
      setMeta(response.data.data.meta);
    }
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    showAlert('error', 'Error', 'Failed to fetch jobs');
  } finally {
    setIsLoading(false);
  }
};

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    try {
      const [categoriesRes, locationsRes, divisionsRes] = await Promise.all([
        recruitmentService.getJobCategories(),
        recruitmentService.getOfficeLocations(),
        recruitmentService.getDivisions(),
      ]);

      console.log('Raw categories:', categoriesRes.data);
      console.log('Raw locations:', locationsRes.data);
      console.log('Raw divisions:', divisionsRes.data);

      // Helper function to safely extract and map data
      const processDropdownData = (response: any, isNested: boolean = false): DropdownOption[] => {
        try {
          // Try different response structures
          let dataArray: any[] = [];

          // Check for categories structure (nested data.data.data)
          if (isNested && response?.data?.data?.data) {
            dataArray = response.data.data.data;
          }
          // Check for standard structure (data.data)
          else if (response?.data?.data) {
            dataArray = response.data.data;
          }
          // Check for direct array
          else if (Array.isArray(response?.data)) {
            dataArray = response.data;
          }
          // Fallback
          else if (Array.isArray(response)) {
            dataArray = response;
          }

          // Map to DropdownOption format
          return dataArray.map((item: any) => ({
            id: item.id,
            name: item.title || item.name || item.label || `Item ${item.id}`,
            // Include the original data for debugging
            originalData: item
          }));
        } catch (error) {
          console.error('Error processing dropdown data:', error);
          return [];
        }
      };

      setDropdowns({
        categories: processDropdownData(categoriesRes, true), // Categories have nested structure
        locations: processDropdownData(locationsRes, false), // Locations have standard structure
        divisions: processDropdownData(divisionsRes, false), // Divisions have standard structure
      });

      console.log('Processed categories:', dropdowns.categories);
      console.log('Processed locations:', dropdowns.locations);
      console.log('Processed divisions:', dropdowns.divisions);

    } catch (error) {
      console.error('Failed to fetch dropdown data:', error);
      showAlert('error', 'Error', 'Failed to fetch dropdown data');
      setDropdowns({
        categories: [],
        locations: [],
        divisions: [],
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Prepare API data - convert empty strings to undefined/null
      const apiData: any = {
        title: formData.title,
        status: formData.status,
      };

      // Only include fields that have values
      if (formData.description) apiData.description = formData.description;
      if (formData.requirements) apiData.requirements = formData.requirements;
      if (formData.skills) apiData.skills = formData.skills;
      if (formData.experience_required) apiData.experience_required = formData.experience_required;

      // Handle numeric fields
      if (formData.positions) apiData.positions = parseInt(formData.positions);
      if (formData.salary_from) apiData.salary_from = parseFloat(formData.salary_from);
      if (formData.salary_to) apiData.salary_to = parseFloat(formData.salary_to);

      // Handle ID fields - convert to null if "null" string or null
      apiData.job_category_id = formData.job_category_id && formData.job_category_id !== "null"
        ? parseInt(formData.job_category_id)
        : null;
      apiData.office_location_id = formData.office_location_id && formData.office_location_id !== "null"
        ? parseInt(formData.office_location_id)
        : null;
      apiData.division_id = formData.division_id && formData.division_id !== "null"
        ? parseInt(formData.division_id)
        : null;

      // Date fields
      if (formData.start_date) apiData.start_date = formData.start_date;
      if (formData.end_date) apiData.end_date = formData.end_date;

      let response;
      if (editingJob) {
        response = await recruitmentService.updateJob(editingJob.id, apiData);
      } else {
        response = await recruitmentService.createJob(apiData);
      }

      if (response.data.success) {
        showAlert(
          'success',
          'Success!',
          editingJob ? 'Job updated successfully' : 'Job created successfully',
          2000
        );
        setIsDialogOpen(false);
        setEditingJob(null);
        resetForm();
        fetchJobs();
      }
    } catch (error: unknown) {
      console.error('Failed to save job:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to save job'));
    }
  };

  // Handle edit job
  const handleEdit = async (job: Job) => {
    setEditingJob(job);
    setFormData({
      title: job.title || '',
      job_category_id: job.job_category_id?.toString() || null,
      office_location_id: job.office_location_id?.toString() || null,
      division_id: job.division_id?.toString() || null,
      positions: job.positions?.toString() || '',
      description: job.description || '',
      requirements: job.requirements || '',
      skills: job.skills || '',
      experience_required: job.experience_required || '',
      salary_from: job.salary_from?.toString() || '',
      salary_to: job.salary_to?.toString() || '',
      status: job.status || 'draft',
      start_date: job.start_date || '',
      end_date: job.end_date || '',
    });
    setIsDialogOpen(true);
  };

  // Handle view job
// Handle view job with dedicated endpoint
const handleView = async (job: Job) => {
  try {
    const response = await recruitmentService.getJobById(job.id);
    
    if (response.data.success) {
      const jobData = response.data.data; // Adjust based on your API response structure
      
      const mappedJob: Job = {
        ...jobData,
        category: jobData.category ? {
          id: jobData.category.id,
          title: jobData.category.title,
          description: jobData.category.description
        } : undefined,
        office_location: jobData.office_location ? {
          id: jobData.office_location.id,
          title: jobData.office_location.title,
          address: jobData.office_location.address,
          contact_phone: jobData.office_location.contact_phone,
          contact_email: jobData.office_location.contact_email,
          is_active: jobData.office_location.is_active
        } : undefined,
        division: jobData.division ? {
          id: jobData.division.id,
          title: jobData.division.title,
          office_location_id: jobData.division.office_location_id,
          notes: jobData.division.notes,
          is_active: jobData.division.is_active
        } : undefined
      };
      
      setViewingJob(mappedJob);
      setIsViewDialogOpen(true);
    }
  } catch (error) {
    console.error('Failed to fetch job details:', error);
    showAlert('error', 'Error', 'Failed to fetch job details');
  }
};

  // Handle delete job
  const handleDelete = async (id: number) => {
    const result = await showConfirmDialog(
      'Are you sure?',
      'You want to delete this job posting?'
    );

    if (!result.isConfirmed) return;

    try {
      const response = await recruitmentService.deleteJob(id);
      if (response.data.success) {
        showAlert('success', 'Deleted!', 'Job deleted successfully', 2000);
        fetchJobs();
      }
    } catch (error: unknown) {
      console.error('Failed to delete job:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to delete job'));
    }
  };

  // Handle publish job
  const handlePublish = async (id: number) => {
    try {
      const response = await recruitmentService.publishJob(id);
      if (response.data.success) {
        showAlert('success', 'Success!', 'Job published successfully', 2000);
        fetchJobs();
      }
    } catch (error: unknown) {
      console.error('Failed to publish job:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to publish job'));
    }
  };

  // Handle close job
  const handleClose = async (id: number) => {
    try {
      const response = await recruitmentService.closeJob(id);
      if (response.data.success) {
        showAlert('success', 'Success!', 'Job closed successfully', 2000);
        fetchJobs();
      }
    } catch (error: unknown) {
      console.error('Failed to close job:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to close job'));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      job_category_id: null,
      office_location_id: null,
      division_id: null,
      positions: '',
      description: '',
      requirements: '',
      skills: '',
      experience_required: '',
      salary_from: '',
      salary_to: '',
      status: 'draft',
      start_date: '',
      end_date: '',
    });
  };

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      open: 'bg-green-100 text-green-800 hover:bg-green-200',
      closed: 'bg-red-100 text-red-800 hover:bg-red-200',
      draft: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      on_hold: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    };
    return variants[status] || variants.draft;
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle search with debounce
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSearch = (value: string) => {
    setSearch(value);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      // Reset to first page when searching
      setPage(1);
    }, 500);

    setSearchTimeout(timeout);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Postings</h1>
          <p className="text-gray-600">Manage job openings and recruitment</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Search Input */}
          <div className="relative">
            <Input
              type="search"
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full sm:w-64"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          {/* Create Job Button */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setEditingJob(null);
                  resetForm();
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Post New Job
              </Button>
            </DialogTrigger>

            {/* Job Form Dialog */}
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingJob ? 'Edit Job Posting' : 'Post New Job'}</DialogTitle>
                <DialogDescription>
                  {editingJob ? 'Update the job posting details.' : 'Create a new job posting.'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Software Engineer"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="job_category_id">Category</Label>
                      <Select
                        value={formData.job_category_id || "null"}
                        onValueChange={(value) => setFormData({ ...formData, job_category_id: value === "null" ? null : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">None</SelectItem>
                          {dropdowns.categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name || `Category ${cat.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="office_location_id">Location</Label>
                      <Select
                        value={formData.office_location_id || "null"}
                        onValueChange={(value) => setFormData({ ...formData, office_location_id: value === "null" ? null : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">None</SelectItem>
                          {dropdowns.locations.map((loc) => (
                            <SelectItem key={loc.id} value={loc.id.toString()}>
                              {loc.name || `Location ${loc.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="division_id">Division</Label>
                      <Select
                        value={formData.division_id || "null"}
                        onValueChange={(value) => setFormData({ ...formData, division_id: value === "null" ? null : value })}
                        disabled={!formData.office_location_id || formData.office_location_id === "null"}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              !formData.office_location_id || formData.office_location_id === "null"
                                ? "Select location first"
                                : "Select division"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">None</SelectItem>
                          {dropdowns.divisions
                            .filter(div => {
                              // If a location is selected, filter divisions by location
                              if (formData.office_location_id && formData.office_location_id !== "null") {
                                const selectedLocation = dropdowns.locations.find(
                                  loc => loc.id.toString() === formData.office_location_id
                                );
                                // Check if this division belongs to the selected location
                                return selectedLocation?.originalData?.divisions?.some(
                                  (locDiv: any) => locDiv.id === div.id
                                );
                              }
                              return true; // Show all divisions if no location selected
                            })
                            .map((div) => (
                              <SelectItem key={div.id} value={div.id.toString()}>
                                {div.name || `Division ${div.id}`}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Job Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Job Details</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="positions">Number of Positions</Label>
                      <Input
                        id="positions"
                        type="number"
                        min="1"
                        value={formData.positions}
                        onChange={(e) => setFormData({ ...formData, positions: e.target.value })}
                        placeholder="e.g., 2"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience_required">Experience Required</Label>
                      <Input
                        id="experience_required"
                        value={formData.experience_required}
                        onChange={(e) => setFormData({ ...formData, experience_required: e.target.value })}
                        placeholder="e.g., 3-5 years"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="salary_from">Salary From</Label>
                      <Input
                        id="salary_from"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.salary_from}
                        onChange={(e) => setFormData({ ...formData, salary_from: e.target.value })}
                        placeholder="e.g., 50000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salary_to">Salary To</Label>
                      <Input
                        id="salary_to"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.salary_to}
                        onChange={(e) => setFormData({ ...formData, salary_to: e.target.value })}
                        placeholder="e.g., 80000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Job Description */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Job Description</h3>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Detailed job description..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requirements">Requirements</Label>
                    <Textarea
                      id="requirements"
                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                      placeholder="Job requirements..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skills">Required Skills</Label>
                    <Textarea
                      id="skills"
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      placeholder="e.g., JavaScript, React, Node.js"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Status */}
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
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {editingJob ? 'Update Job' : 'Create Job'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Open Positions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobs.reduce((sum, job) => sum + (job.positions || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobs.reduce((sum, job) => sum + (job.applications_count || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Recruiting</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobs.filter(job => job.status === 'open').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card className="border shadow-sm">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No job postings found</h3>
              <p className="text-gray-600 mt-1">
                {search || (statusFilter && statusFilter !== 'all')
                  ? "Try adjusting your search or filter criteria"
                  : "Create your first job posting to start recruiting."}
              </p>
              <Button
                className="mt-4 bg-blue-600 hover:bg-blue-700"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Post New Job
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Positions</TableHead>
                      <TableHead>Salary Range</TableHead>
                      <TableHead>Applications</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Posted Date</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold text-gray-900">{job.title}</div>
                            {job.experience_required && (
                              <div className="text-sm text-gray-500">
                                {job.experience_required}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gray-50">
                            {job.category?.title || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{job.office_location?.title || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span>{job.positions || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            <span>
                              {formatCurrency(job.salary_from)} - {formatCurrency(job.salary_to)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{job.applications_count || 0}</span>
                            <span className="text-gray-500 text-sm">applications</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(job.status)}>
                            {job.status?.charAt(0).toUpperCase() + job.status?.slice(1).replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>{formatDate(job.created_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(job)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(job)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              {job.status === 'draft' && (
                                <DropdownMenuItem onClick={() => handlePublish(job.id)}>
                                  <Target className="mr-2 h-4 w-4" />
                                  Publish
                                </DropdownMenuItem>
                              )}
                              {job.status === 'open' && (
                                <DropdownMenuItem onClick={() => handleClose(job.id)}>
                                  <Briefcase className="mr-2 h-4 w-4" />
                                  Close Job
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDelete(job.id)}
                                className="text-red-600"
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

              {/* Pagination */}
              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-medium">{((meta.current_page - 1) * meta.per_page) + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(meta.current_page * meta.per_page, meta.total)}
                    </span> of{' '}
                    <span className="font-medium">{meta.total}</span> results
                  </div>
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
                        const pageNumber = i + 1;
                        return (
                          <Button
                            key={pageNumber}
                            variant={page === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNumber)}
                            className="w-8 h-8"
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                      {meta.last_page > 5 && (
                        <>
                          <span className="px-2">...</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(meta.last_page)}
                            className="w-8 h-8"
                          >
                            {meta.last_page}
                          </Button>
                        </>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === meta.last_page}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Job Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>

          {viewingJob && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{viewingJob.title}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge className={getStatusBadge(viewingJob.status)}>
                      {viewingJob.status?.charAt(0).toUpperCase() + viewingJob.status?.slice(1).replace('_', ' ')}
                    </Badge>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Posted {formatDate(viewingJob.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatCurrency(viewingJob.salary_from)} - {formatCurrency(viewingJob.salary_to)}
                  </div>
                  <div className="text-sm text-gray-600">per year</div>
                </div>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-500">Category</Label>
                  <p className="font-medium">{viewingJob.category?.title || '-'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Location</Label>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{viewingJob.office_location?.title || '-'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Division</Label>
                  <p className="font-medium">{viewingJob.division?.title || '-'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Positions Available</Label>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{viewingJob.positions || 0}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Experience Required</Label>
                  <p className="font-medium">{viewingJob.experience_required || '-'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Total Applications</Label>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">{viewingJob.applications_count || 0}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {viewingJob.description && (
                <div className="space-y-2">
                  <Label className="text-gray-500">Description</Label>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap text-gray-700">{viewingJob.description}</p>
                  </div>
                </div>
              )}

              {/* Requirements */}
              {viewingJob.requirements && (
                <div className="space-y-2">
                  <Label className="text-gray-500">Requirements</Label>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap text-gray-700">{viewingJob.requirements}</p>
                  </div>
                </div>
              )}

              {/* Skills */}
              {viewingJob.skills && (
                <div className="space-y-2">
                  <Label className="text-gray-500">Required Skills</Label>
                  <div className="flex flex-wrap gap-2">
                    {viewingJob.skills.split(',').map((skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700">
                        {skill.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {(viewingJob.start_date || viewingJob.end_date) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-500">Start Date</Label>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{formatDate(viewingJob.start_date)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-500">End Date</Label>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{formatDate(viewingJob.end_date)}</span>
                    </div>
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
  );
}
