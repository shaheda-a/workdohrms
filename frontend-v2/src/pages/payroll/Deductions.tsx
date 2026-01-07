import { useState, useEffect } from 'react';
import { payrollService, staffService } from '../../services/api';
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
import { Plus, Minus, User, Calendar, Type, Eye, Edit, Trash2, MoreVertical, Shield } from 'lucide-react';
import { Textarea } from '../../components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

interface StaffMember {
  id: number;
  full_name: string;
}

interface Deduction {
  id: number;
  staff_member_id: number;
  withholding_type_id: number;
  description: string;
  calculation_type: 'fixed' | 'percentage';
  amount: number;
  effective_from: string | null;
  effective_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  staff_member?: {
    id: number;
    full_name: string;
  };
  withholding_type?: {
    id: number;
    title: string;
    notes?: string;
    is_statutory: boolean;
    is_active: boolean;
  };
  author?: {
    id: number;
    name: string;
  };
}

interface WithholdingType {
  id: number;
  title: string;
  notes?: string;
  is_statutory: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function Deductions() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [withholdingTypes, setWithholdingTypes] = useState<WithholdingType[]>([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [selectedDeduction, setSelectedDeduction] = useState<Deduction | null>(null);
  const [formData, setFormData] = useState({
    withholding_type_id: '',
    description: '',
    calculation_type: 'fixed' as 'fixed' | 'percentage',
    amount: '',
    effective_from: '',
    effective_until: '',
    is_active: 'true',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if a valid withholding type is selected
    if (formData.withholding_type_id === "no-withholding-types" || !formData.withholding_type_id) {
      showAlert('warning', 'Validation Error', 'Please select a valid deduction type');
      return;
    }
    
    try {
      const payload: any = {
        staff_member_id: Number(selectedStaff),
        withholding_type_id: Number(formData.withholding_type_id),
        description: formData.description,
        calculation_type: formData.calculation_type,
        amount: Number(formData.amount),
        is_active: formData.is_active === 'true',
      };

      // Only include date fields if they have values
      if (formData.effective_from) {
        payload.effective_from = formData.effective_from;
      }
      if (formData.effective_until) {
        payload.effective_until = formData.effective_until;
      }

      console.log('Submitting deduction:', payload);
      
      await payrollService.createDeduction(payload);
      showAlert('success', 'Success!', 'Deduction created successfully', 2000);
      setIsDialogOpen(false);
      resetForm();
      if (selectedStaff) {
        fetchDeductions();
      }
    } catch (error: unknown) {
      console.error('Failed to create deduction:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to create deduction'));
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDeduction) return;
    
    try {
      const payload: any = {
        withholding_type_id: Number(formData.withholding_type_id),
        description: formData.description,
        calculation_type: formData.calculation_type,
        amount: Number(formData.amount),
        is_active: formData.is_active === 'true',
      };

      // Only include date fields if they have values
      if (formData.effective_from) {
        payload.effective_from = formData.effective_from;
      }
      if (formData.effective_until) {
        payload.effective_until = formData.effective_until;
      }

      console.log('Updating deduction:', payload);
      
      await payrollService.updateDeduction(selectedDeduction.id, payload);
      showAlert('success', 'Success!', 'Deduction updated successfully', 2000);
      setIsEditDialogOpen(false);
      resetForm();
      setSelectedDeduction(null);
      if (selectedStaff) {
        fetchDeductions();
      }
    } catch (error: unknown) {
      console.error('Failed to update deduction:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to update deduction'));
    }
  };

  const handleView = (deduction: Deduction) => {
    setSelectedDeduction(deduction);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (deduction: Deduction) => {
    setSelectedDeduction(deduction);
    
    // Format dates from ISO to YYYY-MM-DD for date inputs
    const formatDateForInput = (dateString: string | null) => {
      if (!dateString) return '';
      try {
        return new Date(dateString).toISOString().split('T')[0];
      } catch (error) {
        return '';
      }
    };

    setFormData({
      withholding_type_id: deduction.withholding_type_id.toString(),
      description: deduction.description,
      calculation_type: deduction.calculation_type,
      amount: deduction.amount.toString(),
      effective_from: formatDateForInput(deduction.effective_from),
      effective_until: formatDateForInput(deduction.effective_until),
      is_active: deduction.is_active ? 'true' : 'false',
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (deduction: Deduction) => {
    const result = await showConfirmDialog(
      'Are you sure?',
      `You want to delete this deduction: "${deduction.description}"?`
    );

    if (!result.isConfirmed) return;

    try {
      await payrollService.deleteDeduction(deduction.id);
      showAlert('success', 'Deleted!', 'Deduction deleted successfully', 2000);
      if (selectedStaff) {
        fetchDeductions();
      }
    } catch (error: unknown) {
      console.error('Failed to delete deduction:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to delete deduction'));
    }
  };

  const resetForm = () => {
    setFormData({
      withholding_type_id: '',
      description: '',
      calculation_type: 'fixed',
      amount: '',
      effective_from: '',
      effective_until: '',
      is_active: 'true',
    });
  };

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await staffService.getAll({ per_page: 100 });
        setStaff(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch staff:', error);
      }
    };

    fetchStaff();
  }, []);

  useEffect(() => {
    const fetchWithholdingTypes = async () => {
      setIsLoadingTypes(true);
      try {
        const response = await payrollService.getWithholdingTypes?.({
          paginate: false,
          active: true
        }) || { data: { success: true, data: [] } };
        
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
        // Fallback to some common deduction types
        setWithholdingTypes([
          { id: 1, title: 'Income Tax', is_statutory: true, is_active: true },
          { id: 2, title: 'Provident Fund', is_statutory: true, is_active: true },
          { id: 3, title: 'Health Insurance', is_statutory: false, is_active: true },
          { id: 4, title: 'Loan Repayment', is_statutory: false, is_active: true },
          { id: 5, title: 'Advance Salary', is_statutory: false, is_active: true },
        ]);
      } finally {
        setIsLoadingTypes(false);
      }
    };

    fetchWithholdingTypes();
  }, []);

  useEffect(() => {
    if (selectedStaff) {
      fetchDeductions();
    } else {
      setDeductions([]);
    }
  }, [selectedStaff]);

  const fetchDeductions = async () => {
    setIsLoading(true);
    try {
      const response = await payrollService.getDeductions({ 
        staff_member_id: Number(selectedStaff),
        paginate: false
      });
      console.log('Deductions response:', response.data);

      // The response should have a data property with an array
      if (response.data && response.data.data) {
        setDeductions(response.data.data);
      } else if (Array.isArray(response.data)) {
        setDeductions(response.data);
      } else {
        setDeductions([]);
      }
    } catch (error) {
      console.error('Failed to fetch deductions:', error);
      setDeductions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
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

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const totalFixedDeductions = deductions
    .filter(d => d.calculation_type === 'fixed')
    .reduce((sum, d) => sum + d.amount, 0);

  const totalPercentageDeductions = deductions
    .filter(d => d.calculation_type === 'percentage')
    .reduce((sum, d) => sum + d.amount, 0);

  const activeDeductionsCount = deductions.filter(d => d.is_active).length;
  const statutoryDeductionsCount = deductions.filter(d => d.withholding_type?.is_statutory).length;

  // Filter active withholding types
  const activeWithholdingTypes = withholdingTypes.filter(type => type.is_active);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">Recurring Deductions</h1>
          <p className="text-solarized-base01">Manage employee recurring deductions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-solarized-blue hover:bg-solarized-blue/90"
              onClick={() => resetForm()}
              disabled={!selectedStaff}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Deduction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Deduction</DialogTitle>
              <DialogDescription>
                Add a new recurring deduction for {staff.find(s => s.id.toString() === selectedStaff)?.full_name || 'selected employee'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="withholding_type_id">Deduction Type *</Label>
                  {isLoadingTypes ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={formData.withholding_type_id}
                      onValueChange={(value) => setFormData({ ...formData, withholding_type_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select deduction type" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeWithholdingTypes.length > 0 ? (
                          activeWithholdingTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.title}
                              {type.is_statutory && ' (Statutory)'}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-withholding-types" disabled>
                            No deduction types available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe this deduction..."
                    required
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calculation_type">Calculation Type *</Label>
                    <Select
                      value={formData.calculation_type}
                      onValueChange={(value) => setFormData({ ...formData, calculation_type: value as 'fixed' | 'percentage' })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <div className="relative">
                      {formData.calculation_type === 'percentage' ? (
                        <div className="flex items-center">
                          <Input
                            id="amount"
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="e.g., 10"
                            min="0"
                            max="100"
                            step="0.01"
                            required
                            className="pr-10"
                          />
                          <span className="absolute right-3 top-2.5 text-solarized-base01">%</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="absolute left-3 top-2.5 text-solarized-base01">$</span>
                          <Input
                            id="amount"
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="e.g., 100"
                            min="0"
                            step="0.01"
                            required
                            className="pl-7"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="effective_from">Effective From</Label>
                    <Input
                      id="effective_from"
                      type="date"
                      value={formData.effective_from}
                      onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="effective_until">Effective Until</Label>
                    <Input
                      id="effective_until"
                      type="date"
                      value={formData.effective_until}
                      onChange={(e) => setFormData({ ...formData, effective_until: e.target.value })}
                      min={formData.effective_from}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="is_active">Status</Label>
                  <Select
                    value={formData.is_active}
                    onValueChange={(value) => setFormData({ ...formData, is_active: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-solarized-blue hover:bg-solarized-blue/90"
                  disabled={!formData.withholding_type_id || !formData.description || !formData.amount}
                >
                  Create Deduction
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Select Employee</CardTitle>
          <CardDescription>Choose an employee to view and manage their deductions</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedStaff} onValueChange={setSelectedStaff}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {staff.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  {s.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : selectedStaff && deductions.length > 0 ? (
        <>
          <div className="grid gap-6 sm:grid-cols-4">
            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-solarized-red/10 flex items-center justify-center">
                    <Minus className="h-6 w-6 text-solarized-red" />
                  </div>
                  <div>
                    <p className="text-sm text-solarized-base01">Total Deductions</p>
                    <p className="text-2xl font-bold text-solarized-base02">{deductions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-solarized-green/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-solarized-green" />
                  </div>
                  <div>
                    <p className="text-sm text-solarized-base01">Statutory Deductions</p>
                    <p className="text-2xl font-bold text-solarized-base02">{statutoryDeductionsCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-solarized-yellow/10 flex items-center justify-center">
                    <Type className="h-6 w-6 text-solarized-yellow" />
                  </div>
                  <div>
                    <p className="text-sm text-solarized-base01">Active Deductions</p>
                    <p className="text-2xl font-bold text-solarized-base02">{activeDeductionsCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-solarized-blue/10 flex items-center justify-center">
                    <Minus className="h-6 w-6 text-solarized-blue" />
                  </div>
                  <div>
                    <p className="text-sm text-solarized-base01">Fixed Deductions Total</p>
                    <p className="text-2xl font-bold text-solarized-base02">
                      {formatCurrency(totalFixedDeductions)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Deductions List</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deduction Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Calculation</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Statutory</TableHead>
                    <TableHead>Effective Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deductions.map((deduction) => (
                    <TableRow key={deduction.id}>
                      <TableCell className="font-medium">
                        {deduction.withholding_type?.title || 'N/A'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={deduction.description}>
                        {deduction.description}
                      </TableCell>
                      <TableCell className="capitalize">
                        <Badge
                          className={
                            deduction.calculation_type === 'fixed'
                              ? 'bg-solarized-green/10 text-solarized-green'
                              : 'bg-solarized-blue/10 text-solarized-blue'
                          }
                        >
                          {deduction.calculation_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {deduction.calculation_type === 'percentage'
                          ? `${deduction.amount}%`
                          : formatCurrency(deduction.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            deduction.withholding_type?.is_statutory
                              ? 'bg-solarized-yellow/10 text-solarized-yellow'
                              : 'bg-solarized-green/10 text-solarized-green'
                          }
                        >
                          {deduction.withholding_type?.is_statutory ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-col">
                          <span>From: {formatDate(deduction.effective_from)}</span>
                          <span>To: {formatDate(deduction.effective_until)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            deduction.is_active
                              ? 'bg-solarized-green/10 text-solarized-green'
                              : 'bg-solarized-red/10 text-solarized-red'
                          }
                        >
                          {deduction.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* <DropdownMenuLabel>Actions</DropdownMenuLabel> */}
                            <DropdownMenuItem onClick={() => handleView(deduction)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(deduction)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {/* <DropdownMenuSeparator /> */}
                            <DropdownMenuItem 
                              onClick={() => handleDelete(deduction)}
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
            </CardContent>
          </Card>
        </>
      ) : selectedStaff ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <Minus className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-solarized-base02">No deductions configured</h3>
            <p className="text-solarized-base01 mt-1">
              This employee doesn't have any deductions assigned yet.
            </p>
            <Button
              className="mt-4 bg-solarized-blue hover:bg-solarized-blue/90"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Deduction
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-solarized-base02">Select an Employee</h3>
            <p className="text-solarized-base01 mt-1">
              Choose an employee from the dropdown to view and manage their deductions.
            </p>
          </CardContent>
        </Card>
      )}

      {/* View Deduction Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Deduction Details</DialogTitle>
            <DialogDescription>
              View detailed information about this deduction
            </DialogDescription>
          </DialogHeader>
          {selectedDeduction && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-solarized-base01">Deduction Type</Label>
                  <p className="text-sm font-medium">{selectedDeduction.withholding_type?.title || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-solarized-base01">Employee</Label>
                  <p className="text-sm font-medium">{selectedDeduction.staff_member?.full_name || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-solarized-base01">Description</Label>
                  <p className="text-sm font-medium">{selectedDeduction.description}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-solarized-base01">Calculation Type</Label>
                  <Badge className="capitalize">
                    {selectedDeduction.calculation_type}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-solarized-base01">Amount</Label>
                  <p className="text-sm font-medium">
                    {selectedDeduction.calculation_type === 'percentage'
                      ? `${selectedDeduction.amount}%`
                      : formatCurrency(selectedDeduction.amount)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-solarized-base01">Statutory</Label>
                  <Badge
                    className={
                      selectedDeduction.withholding_type?.is_statutory
                        ? 'bg-solarized-yellow/10 text-solarized-yellow'
                        : 'bg-solarized-green/10 text-solarized-green'
                    }
                  >
                    {selectedDeduction.withholding_type?.is_statutory ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-solarized-base01">Effective From</Label>
                  <p className="text-sm font-medium">{formatDate(selectedDeduction.effective_from)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-solarized-base01">Effective Until</Label>
                  <p className="text-sm font-medium">{formatDate(selectedDeduction.effective_until)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-solarized-base01">Status</Label>
                  <Badge
                    className={
                      selectedDeduction.is_active
                        ? 'bg-solarized-green/10 text-solarized-green'
                        : 'bg-solarized-red/10 text-solarized-red'
                    }
                  >
                    {selectedDeduction.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-solarized-base01">Created By</Label>
                  <p className="text-sm font-medium">{selectedDeduction.author?.name || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-solarized-base01">Created At</Label>
                  <p className="text-sm font-medium">{formatDateTime(selectedDeduction.created_at)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-solarized-base01">Last Updated</Label>
                  <p className="text-sm font-medium">{formatDateTime(selectedDeduction.updated_at)}</p>
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

      {/* Edit Deduction Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setSelectedDeduction(null);
          resetForm();
        }
        setIsEditDialogOpen(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Deduction</DialogTitle>
            <DialogDescription>
              Update deduction details for {selectedDeduction?.staff_member?.full_name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_withholding_type_id">Deduction Type *</Label>
                {isLoadingTypes ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={formData.withholding_type_id}
                    onValueChange={(value) => setFormData({ ...formData, withholding_type_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select deduction type" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeWithholdingTypes.length > 0 ? (
                        activeWithholdingTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.title}
                            {type.is_statutory && ' (Statutory)'}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-withholding-types" disabled>
                          No deduction types available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_description">Description *</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this deduction..."
                  required
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_calculation_type">Calculation Type *</Label>
                  <Select
                    value={formData.calculation_type}
                    onValueChange={(value) => setFormData({ ...formData, calculation_type: value as 'fixed' | 'percentage' })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_amount">Amount *</Label>
                  <div className="relative">
                    {formData.calculation_type === 'percentage' ? (
                      <div className="flex items-center">
                        <Input
                          id="edit_amount"
                          type="number"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          placeholder="e.g., 10"
                          min="0"
                          max="100"
                          step="0.01"
                          required
                          className="pr-10"
                        />
                        <span className="absolute right-3 top-2.5 text-solarized-base01">%</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="absolute left-3 top-2.5 text-solarized-base01">$</span>
                        <Input
                          id="edit_amount"
                          type="number"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          placeholder="e.g., 100"
                          min="0"
                          step="0.01"
                          required
                          className="pl-7"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_effective_from">Effective From</Label>
                  <Input
                    id="edit_effective_from"
                    type="date"
                    value={formData.effective_from}
                    onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_effective_until">Effective Until</Label>
                  <Input
                    id="edit_effective_until"
                    type="date"
                    value={formData.effective_until}
                    onChange={(e) => setFormData({ ...formData, effective_until: e.target.value })}
                    min={formData.effective_from}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_is_active">Status</Label>
                <Select
                  value={formData.is_active}
                  onValueChange={(value) => setFormData({ ...formData, is_active: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setSelectedDeduction(null);
                  resetForm();
                  setIsEditDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-solarized-blue hover:bg-solarized-blue/90"
                disabled={!formData.withholding_type_id || !formData.description || !formData.amount}
              >
                Update Deduction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
