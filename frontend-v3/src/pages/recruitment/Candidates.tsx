import { useEffect, useState } from 'react';
import { recruitmentApi } from '../../api';
import { Candidate } from '../../types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Plus, Edit, Trash2, Users, Loader2, Search, UserPlus, Archive } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';

export default function Candidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    source: '',
    notes: '',
  });

  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const response = await recruitmentApi.getCandidates(params);
      if (response.success) {
        setCandidates(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchCandidates();
    }, 300);
    return () => clearTimeout(debounce);
  }, [search, statusFilter]);

  const handleOpenDialog = (candidate?: Candidate) => {
    if (candidate) {
      setEditingId(candidate.id);
      setFormData({
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        email: candidate.email,
        phone: candidate.phone || '',
        source: candidate.source || '',
        notes: candidate.notes || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        source: '',
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editingId) {
        await recruitmentApi.updateCandidate(editingId, formData);
      } else {
        await recruitmentApi.createCandidate(formData);
      }
      await fetchCandidates();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save candidate:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await recruitmentApi.deleteCandidate(deleteId);
      setCandidates(candidates.filter((c) => c.id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error('Failed to delete candidate:', error);
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await recruitmentApi.archiveCandidate(id);
      fetchCandidates();
    } catch (error) {
      console.error('Failed to archive candidate:', error);
    }
  };

  const handleConvertToEmployee = async (id: number) => {
    try {
      await recruitmentApi.convertToEmployee(id);
      fetchCandidates();
    } catch (error) {
      console.error('Failed to convert candidate:', error);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      hired: 'default',
      archived: 'secondary',
      rejected: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Candidates
          </h1>
          <p className="text-solarized-base01">Manage candidate pool</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Candidate
        </Button>
      </div>

      <Card className="bg-white border-solarized-base2">
        <CardHeader>
          <CardTitle className="text-solarized-base02">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-solarized-base01" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-solarized-base2 border-solarized-base2 text-solarized-base02">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-solarized-base2">
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
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
          ) : candidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-solarized-base01">
              <Users className="h-12 w-12 mb-4" />
              <p>No candidates found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-solarized-base2 hover:bg-solarized-base2">
                  <TableHead className="text-solarized-base01">Candidate</TableHead>
                  <TableHead className="text-solarized-base01">Email</TableHead>
                  <TableHead className="text-solarized-base01">Phone</TableHead>
                  <TableHead className="text-solarized-base01">Source</TableHead>
                  <TableHead className="text-solarized-base01">Status</TableHead>
                  <TableHead className="text-solarized-base01 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate) => (
                  <TableRow key={candidate.id} className="border-solarized-base2 hover:bg-solarized-base2">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {getInitials(candidate.first_name, candidate.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-solarized-base02">{candidate.first_name} {candidate.last_name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-solarized-base01">{candidate.email}</TableCell>
                    <TableCell className="text-solarized-base01">{candidate.phone || '-'}</TableCell>
                    <TableCell className="text-solarized-base01">{candidate.source || '-'}</TableCell>
                    <TableCell>{getStatusBadge(candidate.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(candidate)} className="text-solarized-base01 hover:text-solarized-base02">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {candidate.status === 'active' && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleConvertToEmployee(candidate.id)} className="text-green-400 hover:text-green-300" title="Convert to Employee">
                              <UserPlus className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleArchive(candidate.id)} className="text-yellow-400 hover:text-yellow-300" title="Archive">
                              <Archive className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(candidate.id)} className="text-solarized-base01 hover:text-red-400">
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
        <DialogContent className="bg-white border-solarized-base2">
          <DialogHeader>
            <DialogTitle className="text-solarized-base02">{editingId ? 'Edit Candidate' : 'Add Candidate'}</DialogTitle>
            <DialogDescription className="text-solarized-base01">
              {editingId ? 'Update candidate details' : 'Add a new candidate to the pool'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-solarized-base01">First Name *</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-solarized-base01">Last Name *</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-solarized-base01">Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-solarized-base01">Source</Label>
                <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
                  <SelectTrigger className="bg-solarized-base2 border-solarized-base2 text-solarized-base02">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-solarized-base2">
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="indeed">Indeed</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="website">Company Website</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
                placeholder="Any additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-solarized-base2 text-solarized-base01 hover:bg-solarized-base2">Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.first_name || !formData.last_name || !formData.email}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white border-solarized-base2">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-solarized-base02">Delete Candidate?</AlertDialogTitle>
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
