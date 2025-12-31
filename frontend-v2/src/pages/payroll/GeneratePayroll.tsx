import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { payrollService, staffService } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Skeleton } from '../../components/ui/skeleton';
import { DollarSign, Loader2, AlertCircle, CheckCircle, Users } from 'lucide-react';

interface StaffMember {
  id: number;
  full_name: string;
  base_salary: number;
  job_title?: { name: string };
}

export default function GeneratePayroll() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<number[]>([]);
  const [salaryPeriod, setSalaryPeriod] = useState('');
  const [month, setMonth] = useState<number>(0);
  const [year, setYear] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await staffService.getAll({ per_page: 100 });
        setStaff(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch staff:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStaff();

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    setMonth(currentMonth);
    setYear(currentYear);
    setSalaryPeriod(`${currentYear}-${String(currentMonth).padStart(2, '0')}`);
  }, []);

  const handleSalaryPeriodChange = (period: string) => {
    setSalaryPeriod(period);
    if (period) {
      const [yearStr, monthStr] = period.split('-');
      setYear(parseInt(yearStr, 10));
      setMonth(parseInt(monthStr, 10));
    }
  };

  const handleSelectAll = () => {
    if (selectedStaff.length === staff.length) {
      setSelectedStaff([]);
    } else {
      setSelectedStaff(staff.map((s) => s.id));
    }
  };

  const handleSelectStaff = (id: number) => {
    if (selectedStaff.includes(id)) {
      setSelectedStaff(selectedStaff.filter((s) => s !== id));
    } else {
      setSelectedStaff([...selectedStaff, id]);
    }
  };

  const handleGenerate = async () => {
    if (selectedStaff.length === 0) {
      setError('Please select at least one employee');
      return;
    }

    if (!month || !year) {
      setError('Please select a valid salary period');
      return;
    }

    setError('');
    setSuccess('');
    setIsGenerating(true);

    try {
      const payload = {
        employee_ids: selectedStaff,
        month: month,
        year: year,
      };

      console.log('Sending payload:', payload); // For debugging

      const response = await payrollService.bulkGenerate(payload);
      
      setSuccess(`Successfully generated payroll for ${selectedStaff.length} employees`);
      
      // Navigate to payroll slips after successful generation
      setTimeout(() => navigate('/payroll/slips'), 2000);
    } catch (err: unknown) {
      console.error('Generation error:', err);
      
      // Handle validation errors from backend
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as any;
        if (axiosError.response?.data?.errors) {
          // Format validation errors
          const validationErrors = axiosError.response.data.errors;
          const errorMessages = Object.entries(validationErrors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          setError(`Validation failed: ${errorMessages}`);
        } else if (axiosError.response?.data?.message) {
          setError(axiosError.response.data.message);
        } else {
          setError('Failed to generate payroll. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-solarized-base02">Generate Payroll</h1>
        <p className="text-solarized-base01">Generate salary slips for employees</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4 text-solarized-green" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Select Employees</CardTitle>
                  <CardDescription>Choose employees to generate payroll for</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedStaff.length === staff.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : staff.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-solarized-base02">No employees found</h3>
                  <p className="text-solarized-base01 mt-1">Add employees to generate payroll.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {staff.map((member) => (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedStaff.includes(member.id)
                          ? 'border-solarized-blue bg-solarized-blue/5'
                          : 'border-solarized-base2 hover:border-solarized-base1'
                      }`}
                      onClick={() => handleSelectStaff(member.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedStaff.includes(member.id)}
                          onCheckedChange={() => handleSelectStaff(member.id)}
                        />
                        <div>
                          <p className="font-medium">{member.full_name}</p>
                          <p className="text-sm text-solarized-base01">
                            {member.job_title?.name || 'No job title'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(member.base_salary)}</p>
                        <p className="text-xs text-solarized-base01">Base Salary</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Payroll Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="salary_period">Salary Period</Label>
                <Input
                  id="salary_period"
                  type="month"
                  value={salaryPeriod}
                  onChange={(e) => handleSalaryPeriodChange(e.target.value)}
                  required
                />
                {salaryPeriod && (
                  <p className="text-sm text-solarized-base01">
                    Generating for: {month}/{year}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-solarized-base01">Selected Employees</span>
                <span className="text-2xl font-bold text-solarized-blue">
                  {selectedStaff.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-solarized-base01">Total Base Salary</span>
                <span className="font-semibold">
                  {formatCurrency(
                    staff
                      .filter((s) => selectedStaff.includes(s.id))
                      .reduce((sum, s) => sum + (s.base_salary || 0), 0)
                  )}
                </span>
              </div>
              <div className="pt-4">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || selectedStaff.length === 0 || !salaryPeriod}
                  className="w-full bg-solarized-green hover:bg-solarized-green/90"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Generate Payroll
                    </>
                  )}
                </Button>
                {!salaryPeriod && (
                  <p className="text-sm text-red-500 mt-2 text-center">
                    Please select a salary period
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}