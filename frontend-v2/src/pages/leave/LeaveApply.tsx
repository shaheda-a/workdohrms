import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaveService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { ArrowLeft, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { toast } from '../../hooks/use-toast';

interface FieldErrors {
  time_off_category_id?: string;
  start_date?: string;
  end_date?: string;
  reason?: string;
}

interface LeaveCategory {
  id: number;
  name: string;
  annual_quota: number;
  is_paid: boolean;
}

export default function LeaveApply() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState<LeaveCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formData, setFormData] = useState({
    time_off_category_id: '',
    start_date: '',
    end_date: '',
    reason: '',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await leaveService.getCategories();
        // Handle both paginated and non-paginated responses
        const data = response.data.data;
        const categoriesArray = Array.isArray(data) ? data : (data?.data || []);
        setCategories(categoriesArray);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const calculateDays = () => {
    if (!formData.start_date || !formData.end_date) return 0;
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};
    
    if (!formData.time_off_category_id) {
      errors.time_off_category_id = 'Leave type is required';
    }
    
    if (!formData.start_date) {
      errors.start_date = 'Start date is required';
    }
    
    if (!formData.end_date) {
      errors.end_date = 'End date is required';
    } else if (formData.start_date && new Date(formData.end_date) < new Date(formData.start_date)) {
      errors.end_date = 'End date must be after start date';
    }
    
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      if (!user?.staff_member_id) {
        setError('Unable to submit leave request. Your account is not linked to a staff profile.');
        toast({
          variant: 'destructive',
          title: 'Submission Failed',
          description: 'Your account is not linked to a staff profile. Please contact HR.',
        });
        setIsLoading(false);
        return;
      }
      
      await leaveService.createRequest({
        ...formData,
        staff_member_id: user.staff_member_id,
        total_days: calculateDays(),
      });
      toast({
        title: 'Success',
        description: 'Leave request submitted successfully',
      });
      navigate('/leave/requests');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errorMessage = error.response?.data?.message || 'Failed to submit leave request';
      
      if (error.response?.data?.errors) {
        const apiErrors: FieldErrors = {};
        const errors = error.response.data.errors;
        if (errors.time_off_category_id) apiErrors.time_off_category_id = errors.time_off_category_id[0];
        if (errors.start_date) apiErrors.start_date = errors.start_date[0];
        if (errors.end_date) apiErrors.end_date = errors.end_date[0];
        if (errors.reason) apiErrors.reason = errors.reason[0];
        setFieldErrors(apiErrors);
      }
      
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">Apply for Leave</h1>
          <p className="text-solarized-base01">Submit a new leave request</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Leave Details</CardTitle>
              <CardDescription>Fill in the details for your leave request</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="time_off_category_id" className={fieldErrors.time_off_category_id ? 'text-red-500' : ''}>Leave Type *</Label>
                  <Select
                    value={formData.time_off_category_id}
                    onValueChange={(value) => {
                      setFormData({ ...formData, time_off_category_id: value });
                      if (fieldErrors.time_off_category_id) setFieldErrors(prev => ({ ...prev, time_off_category_id: undefined }));
                    }}
                  >
                    <SelectTrigger className={fieldErrors.time_off_category_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name} ({cat.is_paid ? 'Paid' : 'Unpaid'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.time_off_category_id && (
                    <p className="text-sm text-red-500">{fieldErrors.time_off_category_id}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start_date" className={fieldErrors.start_date ? 'text-red-500' : ''}>Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => {
                        setFormData({ ...formData, start_date: e.target.value });
                        if (fieldErrors.start_date) setFieldErrors(prev => ({ ...prev, start_date: undefined }));
                      }}
                      aria-invalid={!!fieldErrors.start_date}
                    />
                    {fieldErrors.start_date && (
                      <p className="text-sm text-red-500">{fieldErrors.start_date}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date" className={fieldErrors.end_date ? 'text-red-500' : ''}>End Date *</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => {
                        setFormData({ ...formData, end_date: e.target.value });
                        if (fieldErrors.end_date) setFieldErrors(prev => ({ ...prev, end_date: undefined }));
                      }}
                      min={formData.start_date}
                      aria-invalid={!!fieldErrors.end_date}
                    />
                    {fieldErrors.end_date && (
                      <p className="text-sm text-red-500">{fieldErrors.end_date}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Provide a reason for your leave request..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-solarized-blue hover:bg-solarized-blue/90"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Request Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-solarized-base01">Total Days</span>
                <span className="text-2xl font-bold text-solarized-blue">{calculateDays()}</span>
              </div>
              {formData.start_date && formData.end_date && (
                <div className="text-sm text-solarized-base01">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  {formData.start_date} to {formData.end_date}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Leave Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categories.slice(0, 4).map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between">
                    <span className="text-sm text-solarized-base01">{cat.name}</span>
                    <span className="font-medium">{cat.annual_quota} days</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
