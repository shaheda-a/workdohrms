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
import { Plus, Building2, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

interface Location {
  id: number;
  title: string;
}

interface Division {
  id: number;
  title: string;
  notes: string;
  office_location?: { title: string };
  office_location_id: number;
  is_active: boolean;
}

export default function Divisions() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);
    const [formData, setFormData] = useState({
      title: '',
      notes: '',
      office_location_id: '',
    });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [divRes, locRes] = await Promise.all([
        settingsService.getDivisions(),
        settingsService.getOfficeLocations(),
      ]);
      setDivisions(divRes.data.data || []);
      setLocations(locRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showAlert('error', 'Error', 'Failed to fetch divisions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDivision) {
        await settingsService.updateDivision(editingDivision.id, formData);
      } else {
        await settingsService.createDivision(formData);
      }
      showAlert(
        'success',
        'Success!',
        editingDivision ? 'Division updated successfully' : 'Division created successfully',
        2000
      );
      setIsDialogOpen(false);
      setEditingDivision(null);
      resetForm();
      fetchData();
    } catch (error: unknown) {
      console.error('Failed to save division:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to save division'));
    }
  };

    const handleEdit = (division: Division) => {
      setEditingDivision(division);
      setFormData({
        title: division.title,
        notes: division.notes || '',
        office_location_id: division.office_location_id?.toString() || '',
      });
      setIsDialogOpen(true);
    };

  const handleDelete = async (id: number) => {
    const result = await showConfirmDialog(
      'Are you sure?',
      'You want to delete this division?'
    );

    if (!result.isConfirmed) return;

    try {
      await settingsService.deleteDivision(id);
      showAlert('success', 'Deleted!', 'Division deleted successfully', 2000);
      fetchData();
    } catch (error: unknown) {
      console.error('Failed to delete division:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to delete division'));
    }
  };

    const resetForm = () => {
      setFormData({ title: '', notes: '', office_location_id: '' });
    };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">Divisions</h1>
          <p className="text-solarized-base01">Manage company divisions and departments</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-solarized-blue hover:bg-solarized-blue/90"
              onClick={() => {
                setEditingDivision(null);
                resetForm();
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Division
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDivision ? 'Edit Division' : 'Add New Division'}</DialogTitle>
              <DialogDescription>
                {editingDivision ? 'Update the division details.' : 'Add a new division.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="title">Division Name</Label>
                                  <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Engineering"
                                    required
                                  />
                                </div>
                <div className="space-y-2">
                  <Label htmlFor="office_location_id">Office Location</Label>
                  <Select
                    value={formData.office_location_id}
                    onValueChange={(value) => setFormData({ ...formData, office_location_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                                        <SelectContent>
                                          {locations.map((loc) => (
                                            <SelectItem key={loc.id} value={loc.id.toString()}>
                                              {loc.title}
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
                                    placeholder="Division notes"
                                    rows={3}
                                  />
                                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90">
                  {editingDivision ? 'Update' : 'Create'}
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
          ) : divisions.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-solarized-base02">No divisions configured</h3>
              <p className="text-solarized-base01 mt-1">Add your first division.</p>
            </div>
          ) : (
            <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Office Location</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                              </TableRow>
                            </TableHeader>
              <TableBody>
                                {divisions.map((division) => (
                                  <TableRow key={division.id}>
                                    <TableCell className="font-medium">{division.title}</TableCell>
                                    <TableCell>{division.office_location?.title || '-'}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">{division.notes || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          division.is_active
                            ? 'bg-solarized-green/10 text-solarized-green'
                            : 'bg-solarized-base01/10 text-solarized-base01'
                        }
                      >
                        {division.is_active ? 'Active' : 'Inactive'}
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
                          <DropdownMenuItem onClick={() => handleEdit(division)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(division.id)}
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
