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
import { Plus, Search, User, Mail, Phone, ChevronLeft, ChevronRight, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

interface Candidate {
  id: number;
  name: string;
  email: string;
  phone: string;
  job?: { title: string };
  status: string;
  applied_date: string;
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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'new',
  });

  useEffect(() => {
    fetchCandidates();
  }, [page]);

const fetchCandidates = async () => {
  setIsLoading(true);
  try {
    const params: Record<string, unknown> = { page };
    if (search) params.search = search;
    
    const response = await recruitmentService.getCandidates(params);
    
    // Handle different response structures
    if (Array.isArray(response.data)) {
      // When paginate=false, response.data is the array directly
      setCandidates(response.data);
      setMeta(null);
    } else if (response.data.data) {
      // When paginating, response.data has data and meta properties
      setCandidates(response.data.data || []);
      setMeta(response.data.meta);
    } else {
      // Fallback
      setCandidates([]);
      setMeta(null);
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
        await recruitmentService.updateCandidate(editingCandidate.id, formData);
      } else {
        await recruitmentService.createCandidate(formData);
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

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      status: 'new',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      new: 'bg-solarized-blue/10 text-solarized-blue',
      screening: 'bg-solarized-yellow/10 text-solarized-yellow',
      interview: 'bg-solarized-violet/10 text-solarized-violet',
      offer: 'bg-solarized-cyan/10 text-solarized-cyan',
      hired: 'bg-solarized-green/10 text-solarized-green',
      rejected: 'bg-solarized-red/10 text-solarized-red',
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCandidate ? 'Edit Candidate' : 'Add Candidate'}</DialogTitle>
              <DialogDescription>
                {editingCandidate ? 'Update the candidate details.' : 'Add a new candidate.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
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
                      <SelectItem value="offer">Offer</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Candidate Profile</DialogTitle>
            </DialogHeader>
            {viewingCandidate && (
              <div className="space-y-4">
                <div>
                  <Label className="text-solarized-base01">Name</Label>
                  <p className="font-medium">{viewingCandidate.name}</p>
                </div>
                <div>
                  <Label className="text-solarized-base01">Email</Label>
                  <p className="font-medium">{viewingCandidate.email}</p>
                </div>
                <div>
                  <Label className="text-solarized-base01">Phone</Label>
                  <p className="font-medium">{viewingCandidate.phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-solarized-base01">Applied For</Label>
                  <p className="font-medium">{viewingCandidate.job?.title || '-'}</p>
                </div>
                <div>
                  <Label className="text-solarized-base01">Applied Date</Label>
                  <p className="font-medium">{viewingCandidate.applied_date}</p>
                </div>
                <div>
                  <Label className="text-solarized-base01">Status</Label>
                  <Badge className={getStatusBadge(viewingCandidate.status)}>
                    {viewingCandidate.status}
                  </Badge>
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
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-solarized-base01" />
              <Input
                placeholder="Search candidates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-solarized-blue hover:bg-solarized-blue/90">
              Search
            </Button>
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
              <p className="text-solarized-base01 mt-1">Add candidates or wait for applications.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Applied For</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-solarized-blue/10 text-solarized-blue">
                                {getInitials(candidate.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{candidate.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-solarized-base01" />
                              {candidate.email}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-solarized-base01">
                              <Phone className="h-3 w-3" />
                              {candidate.phone || '-'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{candidate.job?.title || '-'}</TableCell>
                        <TableCell>{candidate.applied_date}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(candidate.status)}>
                            {candidate.status}
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
                              <DropdownMenuItem onClick={() => handleView(candidate)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(candidate)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(candidate.id)} className="text-solarized-red">
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
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-solarized-base01">
                    Showing {(meta.current_page - 1) * meta.per_page + 1} to{' '}
                    {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total}
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
