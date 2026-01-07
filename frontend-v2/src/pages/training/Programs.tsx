import { useState, useEffect, useCallback } from 'react';
import { trainingService } from '../../services/api';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
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
import {
  Plus,
  GraduationCap,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import DataTable, { TableColumn } from 'react-data-table-component';

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

export default function Programs() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [trainingTypes, setTrainingTypes] = useState<TrainingType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

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
      fetchPrograms(page);
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
      fetchPrograms(page);
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

  const fetchPrograms = useCallback(
    async (currentPage: number = 1) => {
      setIsLoading(true);
      try {
        const params: Record<string, unknown> = {
          page: currentPage,
          per_page: perPage,
          search,
        };

        const response = await trainingService.getPrograms(params);
        const payload = response.data.data;

        if (Array.isArray(payload)) {
          setPrograms(payload);
          setTotalRows(response.data.meta?.total ?? payload.length);
        } else if (payload && Array.isArray(payload.data)) {
          setPrograms(payload.data);
          setTotalRows(payload.total);
        } else {
          setPrograms([]);
          setTotalRows(0);
        }
      } catch (error) {
        console.error('Failed to fetch programs:', error);
        setPrograms([]);
        setTotalRows(0);
        showAlert('error', 'Error', 'Failed to fetch programs');
      } finally {
        setIsLoading(false);
      }
    },
    [perPage, search]
  );

  const fetchTrainingTypes = async () => {
    try {
      const response = await trainingService.getTypes();
      const data = response.data.data || response.data;
      setTrainingTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch training types:', error);
    }
  };

  useEffect(() => {
    fetchPrograms(page);
    fetchTrainingTypes();
  }, [page, fetchPrograms]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-green-100 text-green-700 hover:bg-green-100',
      completed: 'bg-solarized-base01/10 text-solarized-base01',
      cancelled: 'bg-solarized-red/10 text-solarized-red',
    };
    return variants[status] || 'bg-blue-100 text-blue-700';
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
  const columns: TableColumn<Program>[] = [
    {
      name: 'Program Title',
      selector: (row) => row.title,
      cell: (row) => (
        <div className="py-2">
          <p className="font-medium">{row.title}</p>
        </div>
      ),
      sortable: true,
      minWidth: '200px',
    },
    {
      name: 'Training Type',
      selector: (row) => row.training_type?.title || '',
      cell: (row) => (
        <span className="text-sm">
          {row.training_type?.title || '-'}
        </span>
      ),
      sortable: true,
      width: '180px',
    },
    {
      name: 'Duration',
      selector: (row) => row.duration || '',
      width: '120px',
    },
    {
      name: 'Cost',
      selector: (row) => row.cost || 0,
      cell: (row) => row.cost ? `$${row.cost}` : '-',
      width: '100px',
    },
    {
      name: 'Trainer',
      selector: (row) => row.trainer_name || '',
      cell: (row) => (
        <div className="text-sm">
          <p>{row.trainer_name || '-'}</p>
          <p className="text-[10px] uppercase font-bold text-muted-foreground">{row.trainer_type}</p>
        </div>
      ),
      width: '150px',
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
              <Eye className="mr-2 h-4 w-4" /> View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(row)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(row.id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
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

      {/* <div className="grid gap-6 sm:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-blue/10 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-solarized-blue" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Total Programs</p>
                <p className="text-xl font-bold text-solarized-base02">{totalRows}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div> */}

      <Card>
        <CardHeader>
          <form onSubmit={handleSearchSubmit} className="flex gap-4">
            <Input
              placeholder="Search programs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit" variant="outline">
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
          </form>
        </CardHeader>

        <CardContent>
          {!isLoading && programs.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p>No training programs found</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={programs}
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
    </div >
  );
}
