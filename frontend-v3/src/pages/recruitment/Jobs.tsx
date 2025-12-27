import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { recruitmentApi, settingsApi } from '../../api';
import { Job, Division } from '../../types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Plus, Edit, Trash2, Briefcase, Loader2, Users } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    division_id: '',
    description: '',
    requirements: '',
    employment_type: 'full_time',
    experience_level: 'mid',
    salary_min: '',
    salary_max: '',
    positions: '1',
  });

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (statusFilter) params.status = statusFilter;

      const response = await recruitmentApi.getJobs(params);
      if (response.success) {
        setJobs(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        const response = await settingsApi.getDivisions();
        if (response.success) setDivisions(response.data);
      } catch (error) {
        console.error('Failed to fetch divisions:', error);
      }
    };
    fetchDivisions();
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const handleOpenDialog = (job?: Job) => {
    if (job) {
      setEditingId(job.id);
      setFormData({
        title: job.title,
        division_id: job.division_id?.toString() || '',
        description: job.description || '',
        requirements: job.requirements || '',
        employment_type: job.employment_type || 'full_time',
        experience_level: job.experience_level || 'mid',
        salary_min: job.salary_min?.toString() || '',
        salary_max: job.salary_max?.toString() || '',
        positions: job.positions?.toString() || '1',
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        division_id: '',
        description: '',
        requirements: '',
        employment_type: 'full_time',
        experience_level: 'mid',
        salary_min: '',
        salary_max: '',
        positions: '1',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data = {
        title: formData.title,
        division_id: formData.division_id ? parseInt(formData.division_id) : null,
        description: formData.description || null,
        requirements: formData.requirements || null,
        employment_type: formData.employment_type,
        experience_level: formData.experience_level,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
        positions: parseInt(formData.positions) || 1,
      };
      if (editingId) {
        await recruitmentApi.updateJob(editingId, data);
      } else {
        await recruitmentApi.createJob(data);
      }
      await fetchJobs();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save job:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await recruitmentApi.deleteJob(deleteId);
      setJobs(jobs.filter((j) => j.id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await recruitmentApi.publishJob(id);
      fetchJobs();
    } catch (error) {
      console.error('Failed to publish job:', error);
    }
  };

  const handleClose = async (id: number) => {
    try {
      await recruitmentApi.closeJob(id);
      fetchJobs();
    } catch (error) {
      console.error('Failed to close job:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'secondary',
      published: 'default',
      closed: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return '-';
    const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    return `Up to ${fmt(max!)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02 flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Job Postings
          </h1>
          <p className="text-solarized-base01">Manage job openings</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Create Job
        </Button>
      </div>

      <Card className="bg-white border-solarized-base2">
        <CardHeader>
          <CardTitle className="text-solarized-base02">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-solarized-base2 border-solarized-base2 text-solarized-base02">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-solarized-base2">
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-solarized-base2">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solarized-blue"></div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-solarized-base01">
              <Briefcase className="h-12 w-12 mb-4" />
              <p>No job postings found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-solarized-base2 hover:bg-solarized-base2">
                  <TableHead className="text-solarized-base01">Title</TableHead>
                  <TableHead className="text-solarized-base01">Division</TableHead>
                  <TableHead className="text-solarized-base01">Type</TableHead>
                  <TableHead className="text-solarized-base01">Salary Range</TableHead>
                  <TableHead className="text-solarized-base01">Positions</TableHead>
                  <TableHead className="text-solarized-base01">Status</TableHead>
                  <TableHead className="text-solarized-base01 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id} className="border-solarized-base2 hover:bg-solarized-base2">
                    <TableCell className="font-medium text-solarized-base02">{job.title}</TableCell>
                    <TableCell className="text-solarized-base01">{job.division?.name || '-'}</TableCell>
                    <TableCell className="text-solarized-base01">{job.employment_type?.replace('_', ' ') || '-'}</TableCell>
                    <TableCell className="text-solarized-base01">{formatSalary(job.salary_min, job.salary_max)}</TableCell>
                    <TableCell className="text-solarized-base01">{job.positions || 1}</TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/recruitment/jobs/${job.id}/applications`}>
                          <Button variant="ghost" size="icon" className="text-solarized-base01 hover:text-solarized-base02">
                            <Users className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(job)} className="text-solarized-base01 hover:text-solarized-base02">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {job.status === 'draft' && (
                          <Button variant="ghost" size="sm" onClick={() => handlePublish(job.id)} className="text-green-400 hover:text-green-300">
                            Publish
                          </Button>
                        )}
                        {job.status === 'published' && (
                          <Button variant="ghost" size="sm" onClick={() => handleClose(job.id)} className="text-yellow-400 hover:text-yellow-300">
                            Close
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(job.id)} className="text-solarized-base01 hover:text-red-400">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white border-solarized-base2 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-solarized-base02">{editingId ? 'Edit Job' : 'Create Job'}</DialogTitle>
            <DialogDescription className="text-solarized-base01">
              {editingId ? 'Update the job posting details' : 'Create a new job posting'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              <Label className="text-solarized-base01">Job Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-solarized-base01">Division</Label>
                <Select value={formData.division_id} onValueChange={(v) => setFormData({ ...formData, division_id: v })}>
                  <SelectTrigger className="bg-solarized-base2 border-solarized-base2 text-solarized-base02">
                    <SelectValue placeholder="Select division" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-solarized-base2">
                    <SelectItem value="">None</SelectItem>
                    {divisions.map((div) => (
                      <SelectItem key={div.id} value={div.id.toString()}>{div.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-solarized-base01">Employment Type</Label>
                <Select value={formData.employment_type} onValueChange={(v) => setFormData({ ...formData, employment_type: v })}>
                  <SelectTrigger className="bg-solarized-base2 border-solarized-base2 text-solarized-base02">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-solarized-base2">
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-solarized-base01">Experience Level</Label>
                <Select value={formData.experience_level} onValueChange={(v) => setFormData({ ...formData, experience_level: v })}>
                  <SelectTrigger className="bg-solarized-base2 border-solarized-base2 text-solarized-base02">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-solarized-base2">
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-solarized-base01">Min Salary</Label>
                <Input
                  type="number"
                  value={formData.salary_min}
                  onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                  className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-solarized-base01">Max Salary</Label>
                <Input
                  type="number"
                  value={formData.salary_max}
                  onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                  className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Positions</Label>
              <Input
                type="number"
                value={formData.positions}
                onChange={(e) => setFormData({ ...formData, positions: e.target.value })}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Requirements</Label>
              <Textarea
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-solarized-base2 text-solarized-base01 hover:bg-solarized-base2">Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.title}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white border-solarized-base2">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-solarized-base02">Delete Job Posting?</AlertDialogTitle>
            <AlertDialogDescription className="text-solarized-base01">This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-solarized-base2 text-solarized-base02 border-solarized-base2 hover:bg-solarized-base2">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
