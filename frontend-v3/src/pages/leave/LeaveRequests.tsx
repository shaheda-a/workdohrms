import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { leaveApi, staffApi } from '../../api';
import { TimeOffRequest, StaffMember, TimeOffCategory } from '../../types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Plus, Calendar, Check, X, Eye, Loader2 } from 'lucide-react';

export default function LeaveRequests() {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [categories, setCategories] = useState<TimeOffCategory[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [staffFilter, setStaffFilter] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequest | null>(null);
  const [processAction, setProcessAction] = useState<'approve' | 'decline' | null>(null);
  const [processNotes, setProcessNotes] = useState('');
  const [createForm, setCreateForm] = useState({
    time_off_category_id: '',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (statusFilter) params.status = statusFilter;
      if (staffFilter) params.staff_member_id = parseInt(staffFilter);

      const response = await leaveApi.getRequests(params);
      if (response.success) {
        setRequests(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, staffRes] = await Promise.all([
          leaveApi.getCategories(),
          staffApi.getDropdown(),
        ]);
        if (catRes.success) setCategories(catRes.data);
        if (staffRes.success) setStaffMembers(staffRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
    fetchRequests();
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, staffFilter]);

  const handleCreate = async () => {
    setIsProcessing(true);
    try {
      const response = await leaveApi.createRequest({
        time_off_category_id: parseInt(createForm.time_off_category_id),
        start_date: createForm.start_date,
        end_date: createForm.end_date,
        reason: createForm.reason,
      });
      if (response.success) {
        setIsCreateOpen(false);
        setCreateForm({ time_off_category_id: '', start_date: '', end_date: '', reason: '' });
        fetchRequests();
      }
    } catch (error) {
      console.error('Failed to create request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcess = async () => {
    if (!selectedRequest || !processAction) return;
    setIsProcessing(true);
    try {
      await leaveApi.processRequest(selectedRequest.id, {
        status: processAction === 'approve' ? 'approved' : 'declined',
        reviewer_notes: processNotes,
      });
      setSelectedRequest(null);
      setProcessAction(null);
      setProcessNotes('');
      fetchRequests();
    } catch (error) {
      console.error('Failed to process request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      approved: 'default',
      declined: 'destructive',
      cancelled: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${diff} day${diff > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02 flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Leave Requests
          </h1>
          <p className="text-solarized-base01">Manage time off requests</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Apply Leave
        </Button>
      </div>

      <Card className="bg-white border-solarized-base2">
        <CardHeader>
          <CardTitle className="text-solarized-base02">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-solarized-base2 border-solarized-base2 text-solarized-base02">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-solarized-base2">
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={staffFilter} onValueChange={setStaffFilter}>
              <SelectTrigger className="bg-solarized-base2 border-solarized-base2 text-solarized-base02">
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent className="bg-white border-solarized-base2">
                <SelectItem value="">All Employees</SelectItem>
                {staffMembers.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id.toString()}>
                    {staff.full_name}
                  </SelectItem>
                ))}
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
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-solarized-base01">
              <Calendar className="h-12 w-12 mb-4" />
              <p>No leave requests found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-solarized-base2 hover:bg-solarized-base2">
                  <TableHead className="text-solarized-base01">Employee</TableHead>
                  <TableHead className="text-solarized-base01">Category</TableHead>
                  <TableHead className="text-solarized-base01">From</TableHead>
                  <TableHead className="text-solarized-base01">To</TableHead>
                  <TableHead className="text-solarized-base01">Duration</TableHead>
                  <TableHead className="text-solarized-base01">Status</TableHead>
                  <TableHead className="text-solarized-base01 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id} className="border-solarized-base2 hover:bg-solarized-base2">
                    <TableCell className="font-medium text-solarized-base02">{request.staff_member?.full_name || '-'}</TableCell>
                    <TableCell className="text-solarized-base01">{request.time_off_category?.name || '-'}</TableCell>
                    <TableCell className="text-solarized-base01">{request.start_date}</TableCell>
                    <TableCell className="text-solarized-base01">{request.end_date}</TableCell>
                    <TableCell className="text-solarized-base01">{calculateDays(request.start_date, request.end_date)}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/leave/requests/${request.id}`}>
                          <Button variant="ghost" size="icon" className="text-solarized-base01 hover:text-solarized-base02">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {request.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-400 hover:text-green-300"
                              onClick={() => { setSelectedRequest(request); setProcessAction('approve'); }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-400 hover:text-red-300"
                              onClick={() => { setSelectedRequest(request); setProcessAction('decline'); }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-white border-solarized-base2">
          <DialogHeader>
            <DialogTitle className="text-solarized-base02">Apply for Leave</DialogTitle>
            <DialogDescription className="text-solarized-base01">Submit a new leave request</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-solarized-base01">Leave Type *</Label>
              <Select value={createForm.time_off_category_id} onValueChange={(v) => setCreateForm({ ...createForm, time_off_category_id: v })}>
                <SelectTrigger className="bg-solarized-base2 border-solarized-base2 text-solarized-base02">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-white border-solarized-base2">
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-solarized-base01">Start Date *</Label>
                <Input
                  type="date"
                  value={createForm.start_date}
                  onChange={(e) => setCreateForm({ ...createForm, start_date: e.target.value })}
                  className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-solarized-base01">End Date *</Label>
                <Input
                  type="date"
                  value={createForm.end_date}
                  onChange={(e) => setCreateForm({ ...createForm, end_date: e.target.value })}
                  className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Reason</Label>
              <Textarea
                value={createForm.reason}
                onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
                placeholder="Optional reason for leave"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="border-solarized-base2 text-solarized-base01 hover:bg-solarized-base2">Cancel</Button>
            <Button onClick={handleCreate} disabled={isProcessing || !createForm.time_off_category_id || !createForm.start_date || !createForm.end_date}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!processAction} onOpenChange={() => { setProcessAction(null); setSelectedRequest(null); }}>
        <DialogContent className="bg-white border-solarized-base2">
          <DialogHeader>
            <DialogTitle className="text-solarized-base02">{processAction === 'approve' ? 'Approve' : 'Decline'} Leave Request</DialogTitle>
            <DialogDescription className="text-solarized-base01">
              {processAction === 'approve' ? 'Approve this leave request?' : 'Decline this leave request?'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-solarized-base01">Notes (Optional)</Label>
              <Textarea
                value={processNotes}
                onChange={(e) => setProcessNotes(e.target.value)}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
                placeholder="Add any notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setProcessAction(null); setSelectedRequest(null); }} className="border-solarized-base2 text-solarized-base01 hover:bg-solarized-base2">Cancel</Button>
            <Button onClick={handleProcess} disabled={isProcessing} className={processAction === 'decline' ? 'bg-red-600 hover:bg-red-700' : ''}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : processAction === 'approve' ? 'Approve' : 'Decline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
