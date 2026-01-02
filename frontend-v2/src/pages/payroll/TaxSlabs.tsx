import { useState, useEffect } from 'react';
import { payrollService } from '../../services/api';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
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
import { Skeleton } from '../../components/ui/skeleton';
import { 
  Plus, 
  Calculator, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  Filter
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';

interface TaxSlab {
  id: number;
  title: string;
  income_from: number;
  income_to: number;
  fixed_amount: number;
  percentage: number;
  is_active: boolean;
  author?: {
    id: number;
    name: string;
    email: string;
  };
}

interface CalculatedTax {
  income: number;
  tax: number;
  slab: TaxSlab | null;
}

export default function TaxSlabs() {
  const [slabs, setSlabs] = useState<TaxSlab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [annualIncome, setAnnualIncome] = useState('');
  const [calculatedTax, setCalculatedTax] = useState<CalculatedTax | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [editingSlab, setEditingSlab] = useState<TaxSlab | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    income_from: '',
    income_to: '',
    fixed_amount: '',
    percentage: '',
    is_active: true,
  });

  // Fetch tax slabs
  const fetchSlabs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await payrollService.getTaxSlabs();
      setSlabs(response.data.data || []);
    } catch (error: unknown) {
      console.error('Failed to fetch tax slabs:', error);
      const errorMessage = getErrorMessage(error, 'Failed to load tax slabs');
      setError(errorMessage);
      showAlert('error', 'Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSlabs();
  }, [showActiveOnly]);

  // Handle form submission for create/update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const data = {
        title: formData.title,
        income_from: Number(formData.income_from),
        income_to: Number(formData.income_to),
        fixed_amount: formData.fixed_amount ? Number(formData.fixed_amount) : null,
        percentage: formData.percentage ? Number(formData.percentage) : null,
        is_active: formData.is_active,
      };

      if (editingSlab) {
        await payrollService.updateTaxSlab(editingSlab.id, data);
      } else {
        await payrollService.createTaxSlab(data);
      }
      
      showAlert(
        'success',
        'Success!',
        editingSlab ? 'Tax slab updated successfully' : 'Tax slab created successfully',
        2000
      );
      setIsDialogOpen(false);
      resetForm();
      fetchSlabs();
    } catch (error: unknown) {
      console.error('Failed to save tax slab:', error);
      const errorMessage = getErrorMessage(error, 'Failed to save tax slab');
      setError(errorMessage);
      showAlert('error', 'Error', errorMessage);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    const result = await showConfirmDialog(
      'Are you sure?',
      'You want to delete this tax slab?'
    );

    if (!result.isConfirmed) return;
    
    try {
      await payrollService.deleteTaxSlab(id);
      showAlert('success', 'Deleted!', 'Tax slab deleted successfully', 2000);
      fetchSlabs();
    } catch (error: unknown) {
      console.error('Failed to delete tax slab:', error);
      const errorMessage = getErrorMessage(error, 'Failed to delete tax slab');
      setError(errorMessage);
      showAlert('error', 'Error', errorMessage);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      income_from: '',
      income_to: '',
      fixed_amount: '',
      percentage: '',
      is_active: true,
    });
    setEditingSlab(null);
  };

  // Open edit dialog
  const openEditDialog = (slab: TaxSlab) => {
    setEditingSlab(slab);
    setFormData({
      title: slab.title,
      income_from: slab.income_from.toString(),
      income_to: slab.income_to.toString(),
      fixed_amount: slab.fixed_amount.toString(),
      percentage: slab.percentage.toString(),
      is_active: slab.is_active,
    });
    setIsDialogOpen(true);
  };

  // Calculate tax
  const handleCalculateTax = async () => {
    if (!annualIncome) return;
    
    setIsCalculating(true);
    setError(null);
    try {
      const response = await payrollService.calculateTax({ 
        income: Number(annualIncome) 
      });
      setCalculatedTax(response.data.data);
    } catch (error: any) {
      console.error('Failed to calculate tax:', error);
      setError(error.response?.data?.message || 'Failed to calculate tax');
      // Fallback calculation
      const income = Number(annualIncome);
      let tax = 0;
      let foundSlab = null;
      
      for (const slab of slabs) {
        if (slab.is_active && income >= slab.income_from && income <= slab.income_to) {
          foundSlab = slab;
          // Calculate tax based on slab rules
          let calculated = slab.fixed_amount;
          if (slab.percentage > 0) {
            calculated += (income - slab.income_from) * (slab.percentage / 100);
          }
          tax = calculated;
          break;
        }
      }
      
      setCalculatedTax({
        income,
        tax,
        slab: foundSlab
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (percentage: number) => {
    return `${percentage}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">Tax Slabs</h1>
          <p className="text-solarized-base01">Configure income tax brackets and rates</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Filter toggle */}
          {/* <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-solarized-base01" />
            <Label htmlFor="active-filter" className="text-sm">Active Only</Label>
            <Switch
              id="active-filter"
              checked={showActiveOnly}
              onCheckedChange={setShowActiveOnly}
            />
          </div> */}
          
          {/* Add button */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-solarized-blue hover:bg-solarized-blue/90"
                onClick={() => {
                  resetForm();
                  setError(null);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Tax Slab
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingSlab ? 'Edit Tax Slab' : 'Add Tax Slab'}
                </DialogTitle>
                <DialogDescription>
                  {editingSlab 
                    ? 'Update the income tax bracket details.' 
                    : 'Add a new income tax bracket.'
                  }
                </DialogDescription>
              </DialogHeader>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Basic Rate"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="income_from">Income From *</Label>
                    <Input
                      id="income_from"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.income_from}
                      onChange={(e) => setFormData({ ...formData, income_from: e.target.value })}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="income_to">Income To *</Label>
                    <Input
                      id="income_to"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.income_to}
                      onChange={(e) => setFormData({ ...formData, income_to: e.target.value })}
                      placeholder="10000"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fixed_amount">Fixed Amount</Label>
                    <Input
                      id="fixed_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.fixed_amount}
                      onChange={(e) => setFormData({ ...formData, fixed_amount: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="percentage">Tax Rate (%)</Label>
                    <Input
                      id="percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.percentage}
                      onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Active Status
                  </Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-solarized-blue hover:bg-solarized-blue/90"
                  >
                    {editingSlab ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error Alert */}
      {error && !isDialogOpen && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tax Slabs Table */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Tax Brackets</CardTitle>
              {/* <CardDescription>
                Current income tax slab configuration
                {showActiveOnly && ' (Active only)'}
              </CardDescription> */}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : slabs.length === 0 ? (
                <div className="text-center py-12">
                  <Calculator className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-solarized-base02">
                    No tax slabs found
                  </h3>
                  <p className="text-solarized-base01 mt-1">
                    {showActiveOnly 
                      ? 'No active tax slabs configured.' 
                      : 'No tax slabs configured.'
                    }
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Income Range</TableHead>
                      <TableHead>Fixed Amount</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slabs.map((slab) => (
                      <TableRow key={slab.id}>
                        <TableCell className="font-medium">{slab.title}</TableCell>
                        <TableCell>
                          {formatCurrency(slab.income_from)} - {formatCurrency(slab.income_to)}
                        </TableCell>
                        <TableCell>
                          {slab.fixed_amount > 0 ? formatCurrency(slab.fixed_amount) : '-'}
                        </TableCell>
                        <TableCell>
                          {slab.percentage > 0 ? formatPercentage(slab.percentage) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={slab.is_active ? "default" : "secondary"}
                            className={slab.is_active 
                              ? "bg-green-100 text-green-800 hover:bg-green-100" 
                              : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                            }
                          >
                            {slab.is_active ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(slab)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(slab.id)}
                            >
                              <Trash2 className="h-3 w-3" />
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
        </div>

        {/* Tax Calculator */}
        <div>
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Tax Calculator
              </CardTitle>
              <CardDescription>Calculate tax based on annual income</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="income">Annual Income</Label>
                <Input
                  id="income"
                  type="number"
                  min="0"
                  step="1"
                  value={annualIncome}
                  onChange={(e) => {
                    setAnnualIncome(e.target.value);
                    setCalculatedTax(null);
                  }}
                  placeholder="Enter annual income"
                />
              </div>
              
              <Button
                onClick={handleCalculateTax}
                disabled={!annualIncome || isCalculating}
                className="w-full bg-solarized-blue hover:bg-solarized-blue/90"
              >
                {isCalculating ? 'Calculating...' : 'Calculate Tax'}
              </Button>
              
              {calculatedTax && (
                <div className="space-y-4 mt-4">
                  <div className="p-4 bg-solarized-base3 rounded-lg text-center">
                    <p className="text-sm text-solarized-base01">Estimated Tax</p>
                    <p className="text-3xl font-bold text-solarized-red">
                      {formatCurrency(calculatedTax.tax)}
                    </p>
                    <p className="text-xs text-solarized-base01 mt-2">
                      Effective Rate: {calculatedTax.income > 0 
                        ? ((calculatedTax.tax / calculatedTax.income) * 100).toFixed(2)
                        : '0.00'}%
                    </p>
                  </div>
                  
                  {calculatedTax.slab && (
                    <div className="p-4 bg-solarized-base2 rounded-lg">
                      <p className="text-sm font-medium text-solarized-base01 mb-2">
                        Applied Tax Slab:
                      </p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-solarized-base01">Title:</span>
                          <span className="font-medium">{calculatedTax.slab.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-solarized-base01">Range:</span>
                          <span className="font-medium">
                            {formatCurrency(calculatedTax.slab.income_from)} - {formatCurrency(calculatedTax.slab.income_to)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-solarized-base01">Fixed Amount:</span>
                          <span className="font-medium">
                            {calculatedTax.slab.fixed_amount > 0 
                              ? formatCurrency(calculatedTax.slab.fixed_amount) 
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-solarized-base01">Rate:</span>
                          <span className="font-medium">
                            {calculatedTax.slab.percentage > 0 
                              ? formatPercentage(calculatedTax.slab.percentage) 
                              : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!calculatedTax.slab && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 text-center">
                        No tax slab found for the specified income range.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
