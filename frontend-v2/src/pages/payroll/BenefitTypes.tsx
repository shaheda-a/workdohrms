import { useState, useEffect } from 'react';
import { payrollService } from '../../services/api';
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
import { Plus, Pencil, Trash2, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';

interface BenefitType {
  id: number;
  title: string;
  notes: string | null;
  is_taxable: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  staffBenefits?: {
    id: number;
    description: string;
  }[];
}

export default function BenefitTypes() {
  const [benefitTypes, setBenefitTypes] = useState<BenefitType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    is_taxable: false,
    is_active: true,
  });

  const fetchBenefitTypes = async () => {
    setIsLoading(true);
    try {
      const response = await payrollService.getBenefitTypes({ 
        paginate: false 
      });
      console.log('Benefit types response:', response.data);
      
      if (response.data && response.data.data) {
        setBenefitTypes(response.data.data);
      } else if (Array.isArray(response.data)) {
        setBenefitTypes(response.data);
      } else {
        console.error('Unexpected response format:', response);
        setBenefitTypes([]);
      }
    } catch (error) {
      console.error('Failed to fetch benefit types:', error);
      setBenefitTypes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode && editingId) {
        await payrollService.updateBenefitType(editingId, formData);
      } else {
        // Create new benefit type
        await payrollService.createBenefitType(formData);
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchBenefitTypes();
    } catch (error) {
      console.error('Failed to save benefit type:', error);
      alert('Failed to save benefit type. Please check the form and try again.');
    }
  };

  const handleEdit = (benefitType: BenefitType) => {
    setIsEditMode(true);
    setEditingId(benefitType.id);
    setFormData({
      title: benefitType.title,
      notes: benefitType.notes || '',
      is_taxable: benefitType.is_taxable,
      is_active: benefitType.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this benefit type? This action cannot be undone.')) {
      return;
    }

    try {
      await payrollService.deleteBenefitType(id);
      fetchBenefitTypes();
    } catch (error: any) {
      console.error('Failed to delete benefit type:', error);
      if (error.response?.data?.message) {
        alert(`Failed to delete: ${error.response.data.message}`);
      } else {
        alert('Failed to delete benefit type. It may be in use.');
      }
    }
  };

  const resetForm = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      title: '',
      notes: '',
      is_taxable: false,
      is_active: true,
    });
  };

  useEffect(() => {
    fetchBenefitTypes();
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

  const activeCount = benefitTypes.filter(type => type.is_active).length;
  const taxableCount = benefitTypes.filter(type => type.is_taxable).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">Benefit Types</h1>
          <p className="text-solarized-base01">Manage benefit types for payroll system</p>
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
              Add Benefit Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? 'Edit Benefit Type' : 'Add Benefit Type'}
              </DialogTitle>
              <DialogDescription>
                {isEditMode 
                  ? 'Update the details of this benefit type' 
                  : 'Add a new benefit type to the system'}
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
                    placeholder="e.g., Housing Allowance"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional notes about this benefit type..."
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_taxable">Taxable</Label>
                    <p className="text-sm text-solarized-base01">
                      Whether this benefit type is subject to taxation
                    </p>
                  </div>
                  <Switch
                    id="is_taxable"
                    checked={formData.is_taxable}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_taxable: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_active">Active</Label>
                    <p className="text-sm text-solarized-base01">
                      Whether this benefit type is currently active
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
                  {isEditMode ? 'Update' : 'Create'} Benefit Type
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
                  {benefitTypes.length}
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
                <DollarSign className="h-6 w-6 text-solarized-yellow" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Taxable Types</p>
                <p className="text-2xl font-bold text-solarized-base02">
                  {taxableCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Benefit Types List</CardTitle>
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
                  <TableHead>Taxable</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {benefitTypes.length > 0 ? (
                  benefitTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.title}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {type.notes || 'No notes'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            type.is_taxable
                              ? 'bg-solarized-yellow/10 text-solarized-yellow'
                              : 'bg-solarized-green/10 text-solarized-green'
                          }
                        >
                          {type.is_taxable ? 'Yes' : 'No'}
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
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(type.id)}
                            disabled={type.staffBenefits && type.staffBenefits.length > 0}
                            title={
                              type.staffBenefits && type.staffBenefits.length > 0
                                ? 'Cannot delete: Benefit type is in use'
                                : 'Delete benefit type'
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
                        <DollarSign className="h-12 w-12 text-solarized-base01 mb-4" />
                        <h3 className="text-lg font-medium text-solarized-base02">
                          No benefit types found
                        </h3>
                        <p className="text-solarized-base01 mt-1">
                          Create your first benefit type to get started.
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