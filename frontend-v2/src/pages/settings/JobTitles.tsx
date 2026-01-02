import { useState, useEffect } from 'react';
import { settingsService } from '../../services/api';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
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
import { Skeleton } from '../../components/ui/skeleton';
import { Plus, Briefcase, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

interface Division {
  id: number;
  title: string;
}

interface JobTitle {
  id: number;
  title: string;
  notes: string;
  division?: { title: string };
  division_id: number;
  is_active: boolean;
}

export default function JobTitles() {
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJobTitle, setEditingJobTitle] = useState<JobTitle | null>(null);
    const [formData, setFormData] = useState({
      title: '',
      notes: '',
      division_id: '',
    });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [jobRes, divRes] = await Promise.all([
        settingsService.getJobTitles(),
        settingsService.getDivisions(),
      ]);
      setJobTitles(jobRes.data.data || []);
      setDivisions(divRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showAlert('error', 'Error', 'Failed to fetch job titles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingJobTitle) {
        await settingsService.updateJobTitle(editingJobTitle.id, formData);
      } else {
        await settingsService.createJobTitle(formData);
      }
      showAlert(
        'success',
        'Success!',
        editingJobTitle ? 'Job title updated successfully' : 'Job title created successfully',
        2000
      );
      setIsDialogOpen(false);
      setEditingJobTitle(null);
      resetForm();
      fetchData();
    } catch (error: unknown) {
      console.error('Failed to save job title:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to save job title'));
    }
  };

    const handleEdit = (jobTitle: JobTitle) => {
      setEditingJobTitle(jobTitle);
      setFormData({
        title: jobTitle.title,
        notes: jobTitle.notes || '',
        division_id: jobTitle.division_id?.toString() || '',
      });
      setIsDialogOpen(true);
    };

  const handleDelete = async (id: number) => {
    const result = await showConfirmDialog(
      'Are you sure?',
      'You want to delete this job title?'
    );

    if (!result.isConfirmed) return;

    try {
      await settingsService.deleteJobTitle(id);
      showAlert('success', 'Deleted!', 'Job title deleted successfully', 2000);
      fetchData();
    } catch (error: unknown) {
      console.error('Failed to delete job title:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to delete job title'));
    }
  };

    const resetForm = () => {
      setFormData({ title: '', notes: '', division_id: '' });
    };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">Job Titles</h1>
          <p className="text-solarized-base01">Manage job titles and designations</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-solarized-blue hover:bg-solarized-blue/90"
              onClick={() => {
                setEditingJobTitle(null);
                resetForm();
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Job Title
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingJobTitle ? 'Edit Job Title' : 'Add New Job Title'}</DialogTitle>
              <DialogDescription>
                {editingJobTitle ? 'Update the job title details.' : 'Add a new job title.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="title">Job Title</Label>
                                  <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Software Engineer"
                                    required
                                  />
                                </div>
                <div className="space-y-2">
                  <Label htmlFor="division_id">Division</Label>
                  <Select
                    value={formData.division_id}
                    onValueChange={(value) => setFormData({ ...formData, division_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select division" />
                    </SelectTrigger>
                                        <SelectContent>
                                          {divisions.map((div) => (
                                            <SelectItem key={div.id} value={div.id.toString()}>
                                              {div.title}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                  </Select>
                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="notes">Notes</Label>
                                  <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Job title notes"
                                    rows={3}
                                  />
                                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90">
                  {editingJobTitle ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : jobTitles.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-solarized-base02">No job titles configured</h3>
              <p className="text-solarized-base01 mt-1">Add your first job title.</p>
            </div>
          ) : (
            <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Division</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                              </TableRow>
                            </TableHeader>
              <TableBody>
                                {jobTitles.map((jobTitle) => (
                                  <TableRow key={jobTitle.id}>
                                    <TableCell className="font-medium">{jobTitle.title}</TableCell>
                                    <TableCell>{jobTitle.division?.title || '-'}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">{jobTitle.notes || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          jobTitle.is_active
                            ? 'bg-solarized-green/10 text-solarized-green'
                            : 'bg-solarized-base01/10 text-solarized-base01'
                        }
                      >
                        {jobTitle.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(jobTitle)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(jobTitle.id)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
