import { useState, useEffect } from 'react';
import { trainingService } from '../../services/api';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
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
import { Plus, GraduationCap, Users, Calendar, ChevronLeft, ChevronRight, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

interface TrainingType {
  id: number;
  title: string;
}

interface Program {
  id: number;
  title: string;
  description: string;
  training_type_id: number;
  training_type?: TrainingType;
  duration: string | null;
  cost: number | null;
  trainer_name: string | null;
  trainer_type: string | null;
  start_date: string;
  end_date: string;
  max_participants: number;
  enrolled_count: number;
  status: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function Programs() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [trainingTypes, setTrainingTypes] = useState<TrainingType[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [viewingProgram, setViewingProgram] = useState<Program | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    training_type_id: '',
    description: '',
    duration: '',
    cost: '',
    trainer_name: '',
    trainer_type: 'internal',
    status: 'active',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        training_type_id: Number(formData.training_type_id),
        description: formData.description || null,
        duration: formData.duration || null,
        cost: formData.cost ? Number(formData.cost) : null,
        trainer_name: formData.trainer_name || null,
        trainer_type: formData.trainer_type || null,
        status: formData.status,
      };

      if (editingProgram) {
        await trainingService.updateProgram(editingProgram.id, payload);
      } else {
        await trainingService.createProgram(payload);
      }
      setIsDialogOpen(false);
      setEditingProgram(null);
      resetForm();
      fetchPrograms();
      showAlert('success', 'Success', editingProgram ? 'Program updated successfully' : 'Program created successfully', 2000);
    } catch (error) {
      console.error('Failed to save program:', error);
      const errorMessage = getErrorMessage(error, 'Failed to save program');
      showAlert('error', 'Error', errorMessage);
    }
  };

  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    setFormData({
      title: program.title,
      training_type_id: String(program.training_type_id),
      description: program.description || '',
      duration: program.duration || '',
      cost: program.cost ? String(program.cost) : '',
      trainer_name: program.trainer_name || '',
      trainer_type: program.trainer_type || 'internal',
      status: program.status,
    });
    setIsDialogOpen(true);
  };

  const handleView = (program: Program) => {
    setViewingProgram(program);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await showConfirmDialog('Delete Program', 'Are you sure you want to delete this program?');
    if (!result.isConfirmed) return;
    try {
      await trainingService.deleteProgram(id);
      fetchPrograms();
      showAlert('success', 'Deleted!', 'Program deleted successfully', 2000);
    } catch (error) {
      console.error('Failed to delete program:', error);
      const errorMessage = getErrorMessage(error, 'Failed to delete program');
      showAlert('error', 'Error', errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      training_type_id: '',
      description: '',
      duration: '',
      cost: '',
      trainer_name: '',
      trainer_type: 'internal',
      status: 'active',
    });
  };

  useEffect(() => {
    fetchPrograms();
    fetchTrainingTypes();
  }, [page]);

  const fetchTrainingTypes = async () => {
    try {
      const response = await trainingService.getTypes();
      const data = response.data.data || response.data;
      setTrainingTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch training types:', error);
    }
  };

  const fetchPrograms = async () => {
    setIsLoading(true);
    try {
      const response = await trainingService.getPrograms({ page });
      // Handle both paginated and non-paginated responses
      const data = response.data.data;
      if (Array.isArray(data)) {
        setPrograms(data);
        setMeta(response.data.meta || null);
      } else if (data && Array.isArray(data.data)) {
        // Paginated response where data.data contains the array
        setPrograms(data.data);
        setMeta({
          current_page: data.current_page,
          last_page: data.last_page,
          per_page: data.per_page,
          total: data.total,
        });
      } else {
        setPrograms([]);
        setMeta(null);
      }
    } catch (error) {
      console.error('Failed to fetch programs:', error);
      setPrograms([]);
      showAlert('error', 'Error', 'Failed to fetch programs');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      upcoming: 'bg-solarized-blue/10 text-solarized-blue',
      ongoing: 'bg-solarized-green/10 text-solarized-green',
      completed: 'bg-solarized-base01/10 text-solarized-base01',
      cancelled: 'bg-solarized-red/10 text-solarized-red',
    };
    return variants[status] || variants.upcoming;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">Training Programs</h1>
          <p className="text-solarized-base01">Manage employee training and development</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-solarized-blue hover:bg-solarized-blue/90"
              onClick={() => { setEditingProgram(null); resetForm(); }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Program
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingProgram ? 'Edit Program' : 'Create Program'}</DialogTitle>
              <DialogDescription>
                {editingProgram ? 'Update training program details.' : 'Create a new training program.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4 max-h-[500px] overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="title">Program Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Leadership Training"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="training_type_id">Training Type *</Label>
                  <Select
                    value={formData.training_type_id}
                    onValueChange={(value) => setFormData({ ...formData, training_type_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select training type" />
                    </SelectTrigger>
                    <SelectContent>
                      {trainingTypes.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          {type.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Program description..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Input
                      id="duration"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="e.g., 3 days"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost</Label>
                    <Input
                      id="cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      placeholder="e.g., 1000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trainer_name">Trainer Name</Label>
                  <Input
                    id="trainer_name"
                    value={formData.trainer_name}
                    onChange={(e) => setFormData({ ...formData, trainer_name: e.target.value })}
                    placeholder="e.g., John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trainer_type">Trainer Type</Label>
                  <Select
                    value={formData.trainer_type}
                    onValueChange={(value) => setFormData({ ...formData, trainer_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select trainer type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="external">External</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editingProgram && (
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
                        <SelectItem value="active">Active</SelectItem>
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
                  {editingProgram ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Program Details</DialogTitle>
          </DialogHeader>
          {viewingProgram && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-solarized-base01">Program Title</p>
                <p className="font-medium">{viewingProgram.title}</p>
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Training Type</p>
                <p>{viewingProgram.training_type?.title || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Description</p>
                <p>{viewingProgram.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-solarized-base01">Duration</p>
                  <p>{viewingProgram.duration || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-solarized-base01">Cost</p>
                  <p>{viewingProgram.cost ? `$${viewingProgram.cost}` : '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-solarized-base01">Trainer Name</p>
                  <p>{viewingProgram.trainer_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-solarized-base01">Trainer Type</p>
                  <p className="capitalize">{viewingProgram.trainer_type || '-'}</p>
                </div>
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

      <div className="grid gap-6 sm:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-blue/10 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-solarized-blue" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Total Programs</p>
                <p className="text-xl font-bold text-solarized-base02">{meta?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-green/10 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-solarized-green" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Ongoing</p>
                <p className="text-xl font-bold text-solarized-base02">
                  {programs.filter((p) => p.status === 'ongoing').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-cyan/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-solarized-cyan" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Upcoming</p>
                <p className="text-xl font-bold text-solarized-base02">
                  {programs.filter((p) => p.status === 'upcoming').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-violet/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-solarized-violet" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Total Enrolled</p>
                <p className="text-xl font-bold text-solarized-base02">
                  {programs.reduce((sum, p) => sum + (p.enrolled_count || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {
        isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <Skeleton className="h-40 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : programs.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center">
              <GraduationCap className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-solarized-base02">No training programs</h3>
              <p className="text-solarized-base01 mt-1">Create training programs for employees.</p>
              <Button className="mt-4 bg-solarized-blue hover:bg-solarized-blue/90">
                <Plus className="mr-2 h-4 w-4" />
                Create Program
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {programs.map((program) => (
                <Card key={program.id} className="border-0 shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{program.title}</CardTitle>
                        <CardDescription>{program.training_type?.title || 'Unknown Type'}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(program)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(program)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-solarized-red" onClick={() => handleDelete(program.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-solarized-base01 line-clamp-2">{program.description}</p>
                    <div className="flex items-center gap-4 text-sm text-solarized-base01">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {program.start_date}
                      </div>
                      <span>-</span>
                      <span>{program.end_date}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-solarized-base01">Enrollment</span>
                        <span className="font-medium">
                          {program.enrolled_count || 0} / {program.max_participants}
                        </span>
                      </div>
                      <Progress
                        value={((program.enrolled_count || 0) / program.max_participants) * 100}
                        className="h-2"
                      />
                    </div>
                    <Badge className={getStatusBadge(program.status)}>
                      {program.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-center gap-2">
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
        )
      }
    </div >
  );
}
