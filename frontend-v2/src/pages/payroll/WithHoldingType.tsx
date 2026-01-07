import { useState, useEffect } from 'react';
import { payrollService } from '../../services/api';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
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
import { Plus, Shield, CheckCircle, XCircle, Eye, Edit, Trash2, MoreVertical } from 'lucide-react';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';

interface WithholdingType {
  id: number;
  title: string;
  notes: string | null;
  is_statutory: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  recurringDeductions?: {
    id: number;
    description: string;
  }[];
}

export default function WithholdingTypes() {
  const [withholdingTypes, setWithholdingTypes] = useState<WithholdingType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    is_statutory: false,
    is_active: true,
  });

  const fetchWithholdingTypes = async () => {
    setIsLoading(true);
    try {
      const response = await payrollService.getWithholdingTypes({ 
        paginate: false 
      });
      console.log('Withholding types response:', response.data);
      
      if (response.data && response.data.data) {
        setWithholdingTypes(response.data.data);
      } else if (Array.isArray(response.data)) {
        setWithholdingTypes(response.data);
      } else {
        console.error('Unexpected response format:', response);
        setWithholdingTypes([]);
      }
    } catch (error) {
      console.error('Failed to fetch withholding types:', error);
      showAlert('error', 'Error', 'Failed to fetch withholding types');
      setWithholdingTypes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode && editingId) {
        // Update existing withholding type
        await payrollService.updateWithholdingType(editingId, formData);
      } else {
        // Create new withholding type
        await payrollService.createWithholdingType(formData);
      }
      
      showAlert(
        'success',
        'Success!',
        isEditMode ? 'Withholding type updated successfully' : 'Withholding type created successfully',
        2000
      );
      setIsDialogOpen(false);
      resetForm();
      fetchWithholdingTypes();
    } catch (error: unknown) {
      console.error('Failed to save withholding type:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to save withholding type'));
    }
  };

  const handleEdit = (withholdingType: WithholdingType) => {
    setIsEditMode(true);
    setEditingId(withholdingType.id);
    setFormData({
      title: withholdingType.title,
      notes: withholdingType.notes || '',
      is_statutory: withholdingType.is_statutory,
      is_active: withholdingType.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await showConfirmDialog(
      'Are you sure?',
      'You want to delete this withholding type? This action cannot be undone.'
    );

    if (!result.isConfirmed) return;

    try {
      await payrollService.deleteWithholdingType(id);
      showAlert('success', 'Deleted!', 'Withholding type deleted successfully', 2000);
      fetchWithholdingTypes();
    } catch (error: unknown) {
      console.error('Failed to delete withholding type:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to delete withholding type'));
    }
  };

  const resetForm = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      title: '',
      notes: '',
      is_statutory: false,
      is_active: true,
    });
  };

  useEffect(() => {
    fetchWithholdingTypes();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const activeCount = withholdingTypes.filter(type => type.is_active).length;
  const statutoryCount = withholdingTypes.filter(type => type.is_statutory).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">Withholding Types</h1>
          <p className="text-solarized-base01">Manage deduction types for payroll system</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) {
            resetForm();
          }
          setIsDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button
              className="bg-solarized-blue hover:bg-solarized-blue/90"
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Withholding Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? 'Edit Withholding Type' : 'Add Withholding Type'}
              </DialogTitle>
              <DialogDescription>
                {isEditMode 
                  ? 'Update the details of this withholding type' 
                  : 'Add a new withholding type to the system'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Income Tax"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional notes about this withholding type..."
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_statutory">Statutory</Label>
                    <p className="text-sm text-solarized-base01">
                      Whether this is a statutory deduction (required by law)
                    </p>
                  </div>
                  <Switch
                    id="is_statutory"
                    checked={formData.is_statutory}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_statutory: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_active">Active</Label>
                    <p className="text-sm text-solarized-base01">
                      Whether this withholding type is currently active
                    </p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-solarized-blue hover:bg-solarized-blue/90"
                >
                  {isEditMode ? 'Update' : 'Create'} Withholding Type
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-solarized-green/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-solarized-green" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Total Types</p>
                <p className="text-2xl font-bold text-solarized-base02">
                  {withholdingTypes.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-solarized-blue/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-solarized-blue" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Active Types</p>
                <p className="text-2xl font-bold text-solarized-base02">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-solarized-yellow/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-solarized-yellow" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Statutory Types</p>
                <p className="text-2xl font-bold text-solarized-base02">
                  {statutoryCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Withholding Types List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Statutory</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withholdingTypes.length > 0 ? (
                  withholdingTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.title}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {type.notes || 'No notes'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            type.is_statutory
                              ? 'bg-solarized-yellow/10 text-solarized-yellow'
                              : 'bg-solarized-green/10 text-solarized-green'
                          }
                        >
                          {type.is_statutory ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            type.is_active
                              ? 'bg-solarized-green/10 text-solarized-green'
                              : 'bg-solarized-red/10 text-solarized-red'
                          }
                        >
                          {type.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(type.created_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(type.updated_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(type)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(type.id)}
                            disabled={type.recurringDeductions && type.recurringDeductions.length > 0}
                            title={
                              type.recurringDeductions && type.recurringDeductions.length > 0
                                ? 'Cannot delete: Withholding type is in use'
                                : 'Delete withholding type'
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <Shield className="h-12 w-12 text-solarized-base01 mb-4" />
                        <h3 className="text-lg font-medium text-solarized-base02">
                          No withholding types found
                        </h3>
                        <p className="text-solarized-base01 mt-1">
                          Create your first withholding type to get started.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
