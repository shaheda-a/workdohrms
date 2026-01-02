import { useState, useEffect } from 'react';
import { performanceService } from '../../services/api';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Skeleton } from '../../components/ui/skeleton';
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
import {
  Plus,
  Star,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  FileText,
  PlayCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

// ============ TYPES ============
interface StaffMember {
  id: number;
  full_name: string;
  email?: string;
  position?: string;
}

interface AppraisalCycle {
  id: number;
  title: string;
  cycle_start: string;
  cycle_end: string;
  review_deadline?: string;
  status: 'draft' | 'active' | 'closed';
  notes?: string;
  records_count?: number;
  author?: { name: string };
}

interface AppraisalRecord {
  id: number;
  staff_member?: StaffMember;
  reviewer?: { name: string; id: number };
  cycle?: AppraisalCycle;
  appraisal_cycle_id: number;
  staff_member_id: number;
  status: 'pending' | 'self_review' | 'completed';
  overall_rating?: number;
  self_assessment?: string;
  career_goals?: string;
  manager_feedback?: string;
  strengths?: string;
  improvements?: string;
  self_submitted_at?: string;
  manager_submitted_at?: string;
  created_at: string;
  updated_at: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ============ HELPER FUNCTIONS ============
const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDateForInput = (dateString: string): string => {
  if (!dateString) return '';
  if (dateString.includes('T')) {
    return dateString.split('T')[0];
  }
  return dateString;
};

const getInitials = (name?: string): string => {
  if (!name) return '??';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// ============ MAIN COMPONENT ============
export default function Appraisals() {
  const [activeTab, setActiveTab] = useState<'records' | 'cycles'>('records');
  
  // Appraisal Records State
  const [records, setRecords] = useState<AppraisalRecord[]>([]);
  const [recordsMeta, setRecordsMeta] = useState<PaginationMeta | null>(null);
  const [recordsPage, setRecordsPage] = useState(1);
  
  // Appraisal Cycles State
  const [cycles, setCycles] = useState<AppraisalCycle[]>([]);
  const [cyclesMeta, setCyclesMeta] = useState<PaginationMeta | null>(null);
  const [cyclesPage, setCyclesPage] = useState(1);
  
  // General State
  const [isLoading, setIsLoading] = useState(true);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  
  // Dialog States
  const [isCycleDialogOpen, setIsCycleDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isSelfReviewDialogOpen, setIsSelfReviewDialogOpen] = useState(false);
  const [isManagerReviewDialogOpen, setIsManagerReviewDialogOpen] = useState(false);
  
  // Selected Items
  const [selectedCycle, setSelectedCycle] = useState<AppraisalCycle | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AppraisalRecord | null>(null);
  const [editingCycle, setEditingCycle] = useState<AppraisalCycle | null>(null);
  
  // Form Data
  const [cycleForm, setCycleForm] = useState({
    title: '',
    cycle_start: '',
    cycle_end: '',
    review_deadline: '',
    notes: '',
  });
  
  const [selfReviewForm, setSelfReviewForm] = useState({
    self_assessment: '',
    career_goals: '',
  });
  
  const [managerReviewForm, setManagerReviewForm] = useState({
    manager_feedback: '',
    overall_rating: 3,
    strengths: '',
    improvements: '',
  });

  // ============ EFFECTS ============
  useEffect(() => {
    if (activeTab === 'records') {
      fetchAppraisalRecords();
    } else {
      fetchAppraisalCycles();
    }
  }, [activeTab, recordsPage, cyclesPage]);

  useEffect(() => {
    fetchStaffMembers();
  }, []);

  // ============ API FUNCTIONS ============
  const fetchAppraisalRecords = async () => {
    setIsLoading(true);
    try {
      const response = await performanceService.getAppraisals({ page: recordsPage });
      console.log('Records response:', response.data);
      
      if (response.data.success) {
        const data = response.data.data;
        if (data && Array.isArray(data.data)) {
          setRecords(data.data);
          setRecordsMeta({
            current_page: data.current_page,
            last_page: data.last_page,
            per_page: data.per_page,
            total: data.total,
          });
        } else if (Array.isArray(data)) {
          setRecords(data);
          setRecordsMeta(null);
        }
      } else {
        setRecords([]);
        setRecordsMeta(null);
      }
    } catch (error) {
      console.error('Failed to fetch appraisal records:', error);
      setRecords([]);
      setRecordsMeta(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAppraisalCycles = async () => {
    setIsLoading(true);
    try {
      const response = await performanceService.getAppraisalCycles();
      console.log('Cycles response:', response.data);
      
      if (response.data.success) {
        const data = response.data.data;
        if (data && Array.isArray(data.data)) {
          setCycles(data.data);
          setCyclesMeta({
            current_page: data.current_page,
            last_page: data.last_page,
            per_page: data.per_page,
            total: data.total,
          });
        } else if (Array.isArray(data)) {
          setCycles(data);
          setCyclesMeta(null);
        }
      } else {
        setCycles([]);
        setCyclesMeta(null);
      }
    } catch (error) {
      console.error('Failed to fetch appraisal cycles:', error);
      setCycles([]);
      setCyclesMeta(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaffMembers = async () => {
    try {
      const response = await performanceService.getStaffMembers();
      if (response.data.success) {
        setStaffMembers(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch staff members:', error);
    }
  };

  // ============ CYCLE FUNCTIONS ============
  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await performanceService.createAppraisalCycle(cycleForm);
      setIsCycleDialogOpen(false);
      resetCycleForm();
      fetchAppraisalCycles();
    } catch (error) {
      console.error('Failed to create appraisal cycle:', error);
      alert('Failed to create appraisal cycle');
    }
  };

  const handleActivateCycle = async (cycleId: number) => {
    if (!confirm('Activating this cycle will create appraisal records for all active staff members. Continue?')) return;
    
    try {
      await performanceService.activateCycle(cycleId);
      alert('Cycle activated successfully!');
      fetchAppraisalCycles();
    } catch (error) {
      console.error('Failed to activate cycle:', error);
      alert('Failed to activate cycle');
    }
  };

  const handleCloseCycle = async (cycleId: number) => {
    if (!confirm('Are you sure you want to close this cycle?')) return;
    
    try {
      await performanceService.closeCycle(cycleId);
      alert('Cycle closed successfully!');
      fetchAppraisalCycles();
    } catch (error) {
      console.error('Failed to close cycle:', error);
      alert('Failed to close cycle');
    }
  };

  const handleDeleteCycle = async (cycleId: number) => {
    if (!confirm('Are you sure you want to delete this cycle?')) return;
    
    try {
      await performanceService.deleteCycle(cycleId);
      alert('Cycle deleted successfully!');
      fetchAppraisalCycles();
    } catch (error) {
      console.error('Failed to delete cycle:', error);
      alert('Failed to delete cycle');
    }
  };

  // ============ REVIEW FUNCTIONS ============
  const handleSubmitSelfReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    
    try {
      await performanceService.submitSelfReview(selectedRecord.id, selfReviewForm);
      setIsSelfReviewDialogOpen(false);
      setSelfReviewForm({ self_assessment: '', career_goals: '' });
      fetchAppraisalRecords();
    } catch (error) {
      console.error('Failed to submit self review:', error);
      alert('Failed to submit self review');
    }
  };

  const handleSubmitManagerReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    
    try {
      // Ensure overall_rating is a number
      const data = {
        ...managerReviewForm,
        overall_rating: Number(managerReviewForm.overall_rating)
      };
      
      await performanceService.submitManagerReview(selectedRecord.id, data);
      setIsManagerReviewDialogOpen(false);
      setManagerReviewForm({
        manager_feedback: '',
        overall_rating: 3,
        strengths: '',
        improvements: '',
      });
      fetchAppraisalRecords();
    } catch (error) {
      console.error('Failed to submit manager review:', error);
      alert('Failed to submit manager review');
    }
  };

  // ============ HELPER FUNCTIONS ============
  const getCycleStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; icon: React.ReactNode }> = {
      draft: {
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        icon: <FileText className="h-3 w-3 mr-1" />
      },
      active: {
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        icon: <PlayCircle className="h-3 w-3 mr-1" />
      },
      closed: {
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      },
    };
    const variant = variants[status] || variants.draft;
    return (
      <Badge className={`flex items-center gap-1 ${variant.className}`}>
        {variant.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRecordStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; icon: React.ReactNode }> = {
      pending: {
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        icon: <Clock className="h-3 w-3 mr-1" />
      },
      self_review: {
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        icon: <FileText className="h-3 w-3 mr-1" />
      },
      completed: {
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      },
    };
    const variant = variants[status] || variants.pending;
    return (
      <Badge className={`flex items-center gap-1 ${variant.className}`}>
        {variant.icon}
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  const renderRating = (rating?: number | string) => {
    // Convert to number if it's a string
    const numericRating = typeof rating === 'string' ? parseFloat(rating) : rating;
    
    if (numericRating === undefined || numericRating === null || isNaN(numericRating)) {
      return <span className="text-gray-500 text-sm">Not rated</span>;
    }
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= Math.round(numericRating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{numericRating.toFixed(1)}</span>
      </div>
    );
  };

  const resetCycleForm = () => {
    setCycleForm({
      title: '',
      cycle_start: '',
      cycle_end: '',
      review_deadline: '',
      notes: '',
    });
    setEditingCycle(null);
  };

  // ============ STATS CALCULATION ============
  const recordsStats = {
    total: recordsMeta?.total || records.length,
    pending: records.filter(r => r.status === 'pending').length,
    selfReview: records.filter(r => r.status === 'self_review').length,
    completed: records.filter(r => r.status === 'completed').length,
    avgRating: records.length > 0 
      ? (records.reduce((sum, r) => {
          const rating = typeof r.overall_rating === 'string' 
            ? parseFloat(r.overall_rating) 
            : r.overall_rating || 0;
          return sum + rating;
        }, 0) / records.length).toFixed(1)
      : '0.0'
  };

  const cyclesStats = {
    total: cyclesMeta?.total || cycles.length,
    draft: cycles.filter(c => c.status === 'draft').length,
    active: cycles.filter(c => c.status === 'active').length,
    closed: cycles.filter(c => c.status === 'closed').length,
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Performance Appraisals
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage appraisal cycles and performance reviews
          </p>
        </div>
        
        {activeTab === 'cycles' && (
          <Dialog open={isCycleDialogOpen} onOpenChange={setIsCycleDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  setEditingCycle(null);
                  resetCycleForm();
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Cycle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingCycle ? 'Edit Cycle' : 'Create Appraisal Cycle'}</DialogTitle>
                <DialogDescription>
                  {editingCycle ? 'Update the appraisal cycle details.' : 'Create a new appraisal cycle.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCycle}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Cycle Title *</Label>
                    <Input
                      id="title"
                      value={cycleForm.title}
                      onChange={(e) => setCycleForm({ ...cycleForm, title: e.target.value })}
                      placeholder="e.g., Q1 2024 Performance Review"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cycle_start">Start Date *</Label>
                      <Input
                        id="cycle_start"
                        type="date"
                        value={cycleForm.cycle_start}
                        onChange={(e) => setCycleForm({ ...cycleForm, cycle_start: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cycle_end">End Date *</Label>
                      <Input
                        id="cycle_end"
                        type="date"
                        value={cycleForm.cycle_end}
                        onChange={(e) => setCycleForm({ ...cycleForm, cycle_end: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="review_deadline">Review Deadline</Label>
                    <Input
                      id="review_deadline"
                      type="date"
                      value={cycleForm.review_deadline}
                      onChange={(e) => setCycleForm({ ...cycleForm, review_deadline: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={cycleForm.notes}
                      onChange={(e) => setCycleForm({ ...cycleForm, notes: e.target.value })}
                      placeholder="Additional notes or instructions..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCycleDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                    {editingCycle ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="records" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Appraisal Records
          </TabsTrigger>
          <TabsTrigger value="cycles" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Appraisal Cycles
          </TabsTrigger>
        </TabsList>

        {/* ============ RECORDS TAB ============ */}
        <TabsContent value="records" className="space-y-6">
          {/* STATS */}
          <div className="grid gap-6 sm:grid-cols-4">
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Appraisals</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{recordsStats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{recordsStats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{recordsStats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{recordsStats.avgRating}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* TABLE */}
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : records.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No appraisal records found</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Create an appraisal cycle and activate it to generate records.
                  </p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Appraisal Period</TableHead>
                        <TableHead>Reviewer</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {getInitials(record.staff_member?.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                  {record.staff_member?.full_name || 'Unknown'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {record.staff_member?.position || '-'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {record.cycle?.title || '-'}
                            {record.cycle && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(record.cycle.cycle_start)} - {formatDate(record.cycle.cycle_end)}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            {record.reviewer?.name || 'Not assigned'}
                          </TableCell>
                          <TableCell>
                            {renderRating(record.overall_rating)}
                          </TableCell>
                          <TableCell>
                            {getRecordStatusBadge(record.status)}
                          </TableCell>
                          <TableCell>
                            {formatDate(record.updated_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedRecord(record);
                                  setIsViewDialogOpen(true);
                                }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                
                                {record.status === 'pending' && (
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedRecord(record);
                                    setIsSelfReviewDialogOpen(true);
                                  }}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Submit Self Review
                                  </DropdownMenuItem>
                                )}
                                
                                {(record.status === 'pending' || record.status === 'self_review') && (
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedRecord(record);
                                    setIsManagerReviewDialogOpen(true);
                                  }}>
                                    <Star className="mr-2 h-4 w-4" />
                                    Submit Manager Review
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* PAGINATION */}
                  {recordsMeta && recordsMeta.last_page > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {((recordsMeta.current_page - 1) * recordsMeta.per_page) + 1} to{' '}
                        {Math.min(recordsMeta.current_page * recordsMeta.per_page, recordsMeta.total)} of{' '}
                        {recordsMeta.total} records
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRecordsPage(recordsPage - 1)}
                          disabled={recordsPage === 1}
                          className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Page {recordsMeta.current_page} of {recordsMeta.last_page}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRecordsPage(recordsPage + 1)}
                          disabled={recordsPage === recordsMeta.last_page}
                          className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
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
        </TabsContent>

        {/* ============ CYCLES TAB ============ */}
        <TabsContent value="cycles" className="space-y-6">
          {/* STATS */}
          <div className="grid gap-6 sm:grid-cols-4">
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Cycles</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{cyclesStats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Draft</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{cyclesStats.draft}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <PlayCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{cyclesStats.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Closed</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{cyclesStats.closed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CYCLES GRID */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="border border-gray-200 dark:border-gray-700 shadow-sm">
                  <CardContent className="pt-6">
                    <Skeleton className="h-40 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : cycles.length === 0 ? (
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No appraisal cycles found</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Create an appraisal cycle to start the performance review process.
                </p>
                <Button 
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setIsCycleDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Cycle
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cycles.map((cycle) => (
                <Card key={cycle.id} className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{cycle.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {formatDate(cycle.cycle_start)} - {formatDate(cycle.cycle_end)}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedCycle(cycle);
                            setIsViewDialogOpen(true);
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          
                          {cycle.status === 'draft' && (
                            <>
                              <DropdownMenuItem onClick={() => {
                                setEditingCycle(cycle);
                                setCycleForm({
                                  title: cycle.title,
                                  cycle_start: formatDateForInput(cycle.cycle_start),
                                  cycle_end: formatDateForInput(cycle.cycle_end),
                                  review_deadline: cycle.review_deadline ? formatDateForInput(cycle.review_deadline) : '',
                                  notes: cycle.notes || '',
                                });
                                setIsCycleDialogOpen(true);
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem onClick={() => handleActivateCycle(cycle.id)}>
                                <PlayCircle className="mr-2 h-4 w-4" />
                                Activate Cycle
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          {cycle.status === 'active' && (
                            <DropdownMenuItem onClick={() => handleCloseCycle(cycle.id)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Close Cycle
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          {cycle.status === 'draft' && (
                            <DropdownMenuItem 
                              onClick={() => handleDeleteCycle(cycle.id)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      {getCycleStatusBadge(cycle.status)}
                      <Badge variant="outline" className="text-sm">
                        {cycle.records_count || 0} records
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Review Deadline</span>
                        <span className="font-medium">
                          {cycle.review_deadline ? formatDate(cycle.review_deadline) : 'Not set'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Created by</span>
                        <span className="font-medium">{cycle.author?.name || 'System'}</span>
                      </div>
                    </div>
                    
                    {cycle.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {cycle.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* CYCLES PAGINATION */}
          {cyclesMeta && cyclesMeta.last_page > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCyclesPage(cyclesPage - 1)}
                disabled={cyclesPage === 1}
                className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {cyclesMeta.current_page} of {cyclesMeta.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCyclesPage(cyclesPage + 1)}
                disabled={cyclesPage === cyclesMeta.last_page}
                className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ============ DIALOGS ============ */}
      
      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRecord ? 'Appraisal Record Details' : 'Appraisal Cycle Details'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Employee</Label>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {selectedRecord.staff_member?.full_name}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Appraisal Cycle</Label>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {selectedRecord.cycle?.title}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Status</Label>
                  <div className="mt-1">
                    {getRecordStatusBadge(selectedRecord.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Overall Rating</Label>
                  <div className="mt-1">
                    {renderRating(selectedRecord.overall_rating)}
                  </div>
                </div>
              </div>
              
              {selectedRecord.self_assessment && (
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Self Assessment</Label>
                  <p className="font-medium text-gray-900 dark:text-gray-100 mt-1 whitespace-pre-wrap">
                    {selectedRecord.self_assessment}
                  </p>
                </div>
              )}
              
              {selectedRecord.career_goals && (
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Career Goals</Label>
                  <p className="font-medium text-gray-900 dark:text-gray-100 mt-1 whitespace-pre-wrap">
                    {selectedRecord.career_goals}
                  </p>
                </div>
              )}
              
              {selectedRecord.manager_feedback && (
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Manager Feedback</Label>
                  <p className="font-medium text-gray-900 dark:text-gray-100 mt-1 whitespace-pre-wrap">
                    {selectedRecord.manager_feedback}
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Self Submitted</Label>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {selectedRecord.self_submitted_at ? formatDate(selectedRecord.self_submitted_at) : 'Not submitted'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Manager Submitted</Label>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {selectedRecord.manager_submitted_at ? formatDate(selectedRecord.manager_submitted_at) : 'Not submitted'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {selectedCycle && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Title</Label>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{selectedCycle.title}</p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Status</Label>
                  <div className="mt-1">
                    {getCycleStatusBadge(selectedCycle.status)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Start Date</Label>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(selectedCycle.cycle_start)}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">End Date</Label>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(selectedCycle.cycle_end)}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Review Deadline</Label>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {selectedCycle.review_deadline ? formatDate(selectedCycle.review_deadline) : 'Not set'}
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-gray-600 dark:text-gray-400">Notes</Label>
                <p className="font-medium text-gray-900 dark:text-gray-100 mt-1 whitespace-pre-wrap">
                  {selectedCycle.notes || 'No notes'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Appraisal Records</Label>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {selectedCycle.records_count || 0} records
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Created by</Label>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {selectedCycle.author?.name || 'System'}
                  </p>
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
      
      {/* Self Review Dialog */}
      <Dialog open={isSelfReviewDialogOpen} onOpenChange={setIsSelfReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Self Review</DialogTitle>
            <DialogDescription>
              Complete your self-assessment for this appraisal period.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitSelfReview}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="self_assessment">Self Assessment *</Label>
                <Textarea
                  id="self_assessment"
                  value={selfReviewForm.self_assessment}
                  onChange={(e) => setSelfReviewForm({ ...selfReviewForm, self_assessment: e.target.value })}
                  placeholder="Describe your achievements, challenges, and learnings..."
                  rows={4}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="career_goals">Career Goals</Label>
                <Textarea
                  id="career_goals"
                  value={selfReviewForm.career_goals}
                  onChange={(e) => setSelfReviewForm({ ...selfReviewForm, career_goals: e.target.value })}
                  placeholder="What are your career goals for the next period?"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsSelfReviewDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                Submit Self Review
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Manager Review Dialog */}
      <Dialog open={isManagerReviewDialogOpen} onOpenChange={setIsManagerReviewDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Submit Manager Review</DialogTitle>
            <DialogDescription>
              Provide feedback and rating for this employee.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitManagerReview}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="manager_feedback">Manager Feedback *</Label>
                <Textarea
                  id="manager_feedback"
                  value={managerReviewForm.manager_feedback}
                  onChange={(e) => setManagerReviewForm({ ...managerReviewForm, manager_feedback: e.target.value })}
                  placeholder="Provide constructive feedback..."
                  rows={4}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="overall_rating">Overall Rating *</Label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      type="button"
                      variant={managerReviewForm.overall_rating === rating ? "default" : "outline"}
                      className="h-10 w-10 p-0"
                      onClick={() => setManagerReviewForm({ ...managerReviewForm, overall_rating: rating })}
                    >
                      <Star className={`h-5 w-5 ${managerReviewForm.overall_rating >= rating ? 'fill-current' : ''}`} />
                    </Button>
                  ))}
                  <span className="ml-2 text-sm font-medium">
                    {managerReviewForm.overall_rating}.0
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="strengths">Strengths</Label>
                  <Textarea
                    id="strengths"
                    value={managerReviewForm.strengths}
                    onChange={(e) => setManagerReviewForm({ ...managerReviewForm, strengths: e.target.value })}
                    placeholder="Key strengths..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="improvements">Areas for Improvement</Label>
                  <Textarea
                    id="improvements"
                    value={managerReviewForm.improvements}
                    onChange={(e) => setManagerReviewForm({ ...managerReviewForm, improvements: e.target.value })}
                    placeholder="Areas for improvement..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsManagerReviewDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                Submit Manager Review
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}