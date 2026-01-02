import { useState, useEffect } from 'react';
import { performanceService } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
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
import { Plus, Target, ChevronLeft, ChevronRight, MoreHorizontal, Eye, Edit, Trash2, TrendingUp, Star } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

interface Goal {
  id: number;
  title: string;
  description: string;
  staff_member?: { full_name: string };
  staff_member_id: number;
  objective_type: 'kpi' | 'goal' | 'okr';
  measurement_unit: string | null;
  target_value: number | null;
  current_value: number | null;
  weight_percentage: number | null;
  start_date: string;
  due_date: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  rating: 'exceeds' | 'meets' | 'below' | 'needs_improvement' | null;
  manager_notes: string | null;
  author_id: number;
  completion_percentage?: number;
  is_overdue?: boolean;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface StaffMember {
  id: number;
  full_name: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    data?: Goal[];
    meta?: PaginationMeta;
  } | Goal[];
  message?: string;
}

// Helper function to format ISO date to yyyy-MM-dd for date inputs
const formatDateForInput = (isoDate: string): string => {
  if (!isoDate) return '';
  
  // If it's already in yyyy-MM-dd format, return as is
  if (isoDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return isoDate;
  }
  
  // If it's in ISO format (2026-01-01T00:00:00.000000Z), extract just the date part
  if (isoDate.includes('T')) {
    return isoDate.split('T')[0];
  }
  
  // Try to parse the date and format it
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

// Helper function to format date for display
const formatDateForDisplay = (isoDate: string): string => {
  if (!isoDate) return '-';
  
  const datePart = formatDateForInput(isoDate);
  if (!datePart) return '-';
  
  // Convert from yyyy-MM-dd to a more readable format like Jan 1, 2026
  try {
    const [year, month, day] = datePart.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return datePart; // Fall back to yyyy-MM-dd format
  }
};

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  
  // Dialog states
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [viewingGoal, setViewingGoal] = useState<Goal | null>(null);
  const [updatingGoal, setUpdatingGoal] = useState<Goal | null>(null);
  const [ratingGoal, setRatingGoal] = useState<Goal | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    staff_member_id: '',
    objective_type: 'goal' as 'kpi' | 'goal' | 'okr',
    measurement_unit: '',
    target_value: '',
    weight_percentage: '',
    start_date: '',
    due_date: '',
  });
  
  const [progressData, setProgressData] = useState({
    current_value: '',
    notes: '',
  });
  
  const [ratingData, setRatingData] = useState({
    rating: 'meets' as 'exceeds' | 'meets' | 'below' | 'needs_improvement',
    manager_notes: '',
  });

  useEffect(() => {
    fetchGoals();
  }, [page]);

  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const response = await performanceService.getGoals({ page });
      
      // Handle different response structures
      if (response.data.success === false) {
        console.error('API Error:', response.data.message);
        setGoals([]);
        setMeta(null);
        return;
      }
      
      // Check if response.data is an array or has a data property
      const responseData = response.data;
      
      if (Array.isArray(responseData)) {
        // Direct array response
        setGoals(responseData);
        setMeta(null);
      } else if (responseData.data && Array.isArray(responseData.data)) {
        // Nested data property
        setGoals(responseData.data);
        setMeta(responseData.meta || null);
      } else if (responseData.success && responseData.data) {
        // Success wrapper with data
        const apiData = responseData.data;
        if (Array.isArray(apiData)) {
          setGoals(apiData);
          setMeta(null);
        } else if (apiData.data && Array.isArray(apiData.data)) {
          setGoals(apiData.data);
          setMeta(apiData.meta || null);
        } else {
          setGoals([]);
          setMeta(null);
        }
      } else {
        setGoals([]);
        setMeta(null);
      }
    } catch (error) {
      console.error('Failed to fetch goals:', error);
      setGoals([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaffMembers = async () => {
    try {
      // Extract unique staff members from goals
      const uniqueStaffMembers: StaffMember[] = [];
      const seenIds = new Set<number>();
      
      goals.forEach(goal => {
        if (goal.staff_member && goal.staff_member_id && !seenIds.has(goal.staff_member_id)) {
          uniqueStaffMembers.push({
            id: goal.staff_member_id,
            full_name: goal.staff_member.full_name
          });
          seenIds.add(goal.staff_member_id);
        }
      });
      
      setStaffMembers(uniqueStaffMembers);
    } catch (error) {
      console.error('Failed to extract staff members:', error);
    }
  };

  useEffect(() => {
    if (goals.length > 0) {
      fetchStaffMembers();
    }
  }, [goals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        objective_type: formData.objective_type,
        start_date: formData.start_date, // Already in yyyy-MM-dd format
        due_date: formData.due_date, // Already in yyyy-MM-dd format
      };

      // Add optional fields if they have values
      if (formData.staff_member_id) {
        data.staff_member_id = parseInt(formData.staff_member_id);
      }
      if (formData.measurement_unit) {
        data.measurement_unit = formData.measurement_unit;
      }
      if (formData.target_value) {
        data.target_value = parseFloat(formData.target_value);
      }
      if (formData.weight_percentage) {
        data.weight_percentage = parseInt(formData.weight_percentage);
      }

      if (editingGoal) {
        await performanceService.updateGoal(editingGoal.id, data);
      } else {
        await performanceService.createGoal(data);
      }
      setIsGoalDialogOpen(false);
      setEditingGoal(null);
      resetForm();
      fetchGoals();
    } catch (error) {
      console.error('Failed to save goal:', error);
      alert('Failed to save objective. Please check the form and try again.');
    }
  };

  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingGoal) return;
    
    try {
      const data = {
        current_value: parseFloat(progressData.current_value),
        notes: progressData.notes,
      };
      
      await performanceService.updateProgress(updatingGoal.id, data);
      setIsProgressDialogOpen(false);
      setUpdatingGoal(null);
      setProgressData({ current_value: '', notes: '' });
      fetchGoals();
    } catch (error) {
      console.error('Failed to update progress:', error);
      alert('Failed to update progress. Please try again.');
    }
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingGoal) return;
    
    try {
      await performanceService.rateGoal(ratingGoal.id, ratingData);
      setIsRatingDialogOpen(false);
      setRatingGoal(null);
      setRatingData({ 
        rating: 'meets', 
        manager_notes: '' 
      });
      fetchGoals();
    } catch (error) {
      console.error('Failed to rate goal:', error);
      alert('Failed to submit rating. Please try again.');
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      staff_member_id: goal.staff_member_id?.toString() || '',
      objective_type: goal.objective_type,
      measurement_unit: goal.measurement_unit || '',
      target_value: goal.target_value?.toString() || '',
      weight_percentage: goal.weight_percentage?.toString() || '',
      start_date: formatDateForInput(goal.start_date), // Format the date here
      due_date: formatDateForInput(goal.due_date), // Format the date here
    });
    setIsGoalDialogOpen(true);
  };

  const handleView = (goal: Goal) => {
    setViewingGoal(goal);
    setIsViewDialogOpen(true);
  };

  const handleUpdateProgress = (goal: Goal) => {
    setUpdatingGoal(goal);
    setProgressData({
      current_value: goal.current_value?.toString() || '0',
      notes: '',
    });
    setIsProgressDialogOpen(true);
  };

  const handleRate = (goal: Goal) => {
    setRatingGoal(goal);
    setRatingData({
      rating: goal.rating || 'meets',
      manager_notes: goal.manager_notes || '',
    });
    setIsRatingDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this objective?')) return;
    try {
      await performanceService.deleteGoal(id);
      fetchGoals();
    } catch (error) {
      console.error('Failed to delete goal:', error);
      alert('Failed to delete objective. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      staff_member_id: '',
      objective_type: 'goal',
      measurement_unit: '',
      target_value: '',
      weight_percentage: '',
      start_date: '',
      due_date: '',
    });
  };

  const getStatusBadge = (status: string, isOverdue?: boolean) => {
    if (isOverdue && status !== 'completed') {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    }
    
    const variants: Record<string, string> = {
      not_started: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return variants[status] || variants.not_started;
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      kpi: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      goal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      okr: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    };
    return variants[type] || variants.goal;
  };

  const getRatingBadge = (rating: string | null) => {
    const variants: Record<string, string> = {
      exceeds: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      meets: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      below: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      needs_improvement: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return variants[rating || 'meets'] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const calculateProgress = (goal: Goal) => {
    // Use completion_percentage if available
    if (goal.completion_percentage !== undefined) {
      return goal.completion_percentage;
    }
    
    // Calculate from current/target values
    if (goal.target_value && goal.target_value > 0 && goal.current_value !== null) {
      return Math.min(100, (goal.current_value / goal.target_value) * 100);
    }
    
    // Fallback based on status
    if (goal.status === 'completed') return 100;
    if (goal.status === 'in_progress') return 50;
    return 0;
  };

  // Safe array methods
  const inProgressCount = Array.isArray(goals) ? goals.filter((g) => g.status === 'in_progress').length : 0;
  const completedCount = Array.isArray(goals) ? goals.filter((g) => g.status === 'completed').length : 0;
  const ratedCount = Array.isArray(goals) ? goals.filter((g) => g.rating !== null).length : 0;
  const totalCount = meta?.total || (Array.isArray(goals) ? goals.length : 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Performance Objectives</h1>
          <p className="text-gray-600 dark:text-gray-400">Set and track performance objectives</p>
        </div>
        
        {/* Create/Edit Goal Dialog */}
        <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                setEditingGoal(null);
                resetForm();
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Objective
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Edit Objective' : 'Create Objective'}</DialogTitle>
              <DialogDescription>
                {editingGoal ? 'Update the objective details.' : 'Create a new performance objective.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Objective title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff_member_id">Staff Member *</Label>
                    <Select
                      value={formData.staff_member_id}
                      onValueChange={(value) => setFormData({ ...formData, staff_member_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffMembers.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id.toString()}>
                            {staff.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Objective description..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="objective_type">Type *</Label>
                    <Select
                      value={formData.objective_type}
                      onValueChange={(value: 'kpi' | 'goal' | 'okr') => setFormData({ ...formData, objective_type: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kpi">KPI</SelectItem>
                        <SelectItem value="goal">Goal</SelectItem>
                        <SelectItem value="okr">OKR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="measurement_unit">Measurement Unit</Label>
                    <Input
                      id="measurement_unit"
                      value={formData.measurement_unit}
                      onChange={(e) => setFormData({ ...formData, measurement_unit: e.target.value })}
                      placeholder="e.g., %, units, hours"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight_percentage">Weight %</Label>
                    <Input
                      id="weight_percentage"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.weight_percentage}
                      onChange={(e) => setFormData({ ...formData, weight_percentage: e.target.value })}
                      placeholder="1-100"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target_value">Target Value</Label>
                    <Input
                      id="target_value"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.target_value}
                      onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                      placeholder="Target value"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date *</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsGoalDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  {editingGoal ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Goal Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Objective Details</DialogTitle>
            </DialogHeader>
            {viewingGoal && (
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Title</Label>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{viewingGoal.title}</p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Description</Label>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{viewingGoal.description || '-'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600 dark:text-gray-400">Staff Member</Label>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{viewingGoal.staff_member?.full_name || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600 dark:text-gray-400">Type</Label>
                    <Badge className={getTypeBadge(viewingGoal.objective_type)}>
                      {viewingGoal.objective_type.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-600 dark:text-gray-400">Target Value</Label>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {viewingGoal.current_value !== null ? viewingGoal.current_value : 0}
                      {viewingGoal.target_value !== null ? ` / ${viewingGoal.target_value}` : ''}
                      {viewingGoal.measurement_unit ? ` ${viewingGoal.measurement_unit}` : ''}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600 dark:text-gray-400">Weight</Label>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{viewingGoal.weight_percentage ? `${viewingGoal.weight_percentage}%` : '-'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600 dark:text-gray-400">Progress</Label>
                    <div className="flex items-center gap-2">
                      <Progress value={calculateProgress(viewingGoal)} className="h-2 flex-1" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">{Math.round(calculateProgress(viewingGoal))}%</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600 dark:text-gray-400">Dates</Label>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatDateForDisplay(viewingGoal.start_date)} to {formatDateForDisplay(viewingGoal.due_date)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600 dark:text-gray-400">Status</Label>
                    <div className="flex gap-2">
                      <Badge className={getStatusBadge(viewingGoal.status, viewingGoal.is_overdue)}>
                        {viewingGoal.status.replace('_', ' ')}
                        {viewingGoal.is_overdue && ' (Overdue)'}
                      </Badge>
                      {viewingGoal.rating && (
                        <Badge className={getRatingBadge(viewingGoal.rating)}>
                          {viewingGoal.rating.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {viewingGoal.manager_notes && (
                  <div>
                    <Label className="text-gray-600 dark:text-gray-400">Manager Notes</Label>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{viewingGoal.manager_notes}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Progress Dialog */}
        <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Progress</DialogTitle>
              <DialogDescription>
                Update the current value for this objective.
              </DialogDescription>
            </DialogHeader>
            {updatingGoal && (
              <form onSubmit={handleProgressSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_value">Current Value *</Label>
                    <Input
                      id="current_value"
                      type="number"
                      min="0"
                      step="0.01"
                      value={progressData.current_value}
                      onChange={(e) => setProgressData({ ...progressData, current_value: e.target.value })}
                      required
                    />
                    {updatingGoal.target_value && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Target: {updatingGoal.target_value} {updatingGoal.measurement_unit || ''}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={progressData.notes}
                      onChange={(e) => setProgressData({ ...progressData, notes: e.target.value })}
                      placeholder="Progress update notes..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsProgressDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Update Progress
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Rate Goal Dialog */}
        <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rate Objective</DialogTitle>
              <DialogDescription>
                Provide rating and feedback for this objective.
              </DialogDescription>
            </DialogHeader>
            {ratingGoal && (
              <form onSubmit={handleRatingSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="rating">Rating *</Label>
                    <Select
                      value={ratingData.rating}
                      onValueChange={(value: 'exceeds' | 'meets' | 'below' | 'needs_improvement') => 
                        setRatingData({ ...ratingData, rating: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exceeds">Exceeds Expectations</SelectItem>
                        <SelectItem value="meets">Meets Expectations</SelectItem>
                        <SelectItem value="below">Below Expectations</SelectItem>
                        <SelectItem value="needs_improvement">Needs Improvement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manager_notes">Manager Notes</Label>
                    <Textarea
                      id="manager_notes"
                      value={ratingData.manager_notes}
                      onChange={(e) => setRatingData({ ...ratingData, manager_notes: e.target.value })}
                      placeholder="Additional feedback..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsRatingDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                    Submit Rating
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 sm:grid-cols-4">
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Objectives</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{inProgressCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <Star className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rated</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{ratedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardContent className="pt-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !Array.isArray(goals) || goals.length === 0 ? (
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No objectives found</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Create performance objectives to track employee performance.</p>
            <Button 
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setIsGoalDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Objective
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => {
              const progress = calculateProgress(goal);
              return (
                <Card key={goal.id} className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg text-gray-900 dark:text-gray-100">{goal.title}</CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                          {goal.staff_member?.full_name || 'Unassigned'}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(goal)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(goal)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateProgress(goal)}>
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Update Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRate(goal)}>
                            <Star className="mr-2 h-4 w-4" />
                            Rate
                          </DropdownMenuItem>
                          {/* <DropdownMenuSeparator /> */}
                          <DropdownMenuItem 
                            onClick={() => handleDelete(goal.id)} 
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge className={getTypeBadge(goal.objective_type)}>
                        {goal.objective_type.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusBadge(goal.status, goal.is_overdue)}>
                        {goal.status.replace('_', ' ')}
                        {goal.is_overdue && ' (Overdue)'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{goal.description || 'No description'}</p>
                    
                    {goal.target_value !== null && goal.target_value > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Progress</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {goal.current_value !== null ? goal.current_value : 0}
                            {goal.measurement_unit ? ` ${goal.measurement_unit}` : ''}
                            {` (${Math.round(progress)}%)`}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Target</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {goal.target_value || '-'}
                          {goal.measurement_unit ? ` ${goal.measurement_unit}` : ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Weight</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{goal.weight_percentage ? `${goal.weight_percentage}%` : '-'}</p>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Due: {formatDateForDisplay(goal.due_date)}
                    </p>
                    
                    {goal.rating && (
                      <Badge className={getRatingBadge(goal.rating)}>
                        Rating: {goal.rating.replace('_', ' ')}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {meta.current_page} of {meta.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === meta.last_page}
                className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}