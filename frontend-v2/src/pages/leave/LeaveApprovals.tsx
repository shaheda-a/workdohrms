import { useState, useEffect } from 'react';
import { leaveService } from '../../services/api';
import { showAlert, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
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
} from '../../components/ui/dialog';
import { Skeleton } from '../../components/ui/skeleton';
import { CheckCircle, XCircle, Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface LeaveRequest {
  id: number;
  staff_member?: { full_name: string };
  time_off_category?: { name: string };
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  approval_status: string;
  created_at: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function LeaveApprovals() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [action, setAction] = useState<'approve' | 'decline' | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [page]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await leaveService.getRequests({ status: 'pending', page });
      setRequests(response.data.data || []);
      setMeta(response.data.meta);
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
      showAlert('error', 'Error', 'Failed to fetch leave requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!selectedRequest || !action) return;
    
    setIsProcessing(true);
    try {
      await leaveService.processRequest(selectedRequest.id, { action, remarks });
      showAlert(
        'success',
        'Success!',
        action === 'approve' ? 'Leave request approved successfully' : 'Leave request declined successfully',
        2000
      );
      setSelectedRequest(null);
      setAction(null);
      setRemarks('');
      fetchRequests();
    } catch (error: unknown) {
      console.error('Failed to process request:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to process leave request'));
    } finally {
      setIsProcessing(false);
    }
  };

  const openDialog = (request: LeaveRequest, actionType: 'approve' | 'decline') => {
    setSelectedRequest(request);
    setAction(actionType);
    setRemarks('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-solarized-base02">Leave Approvals</h1>
        <p className="text-solarized-base01">Review and process pending leave requests</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-solarized-yellow/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-solarized-yellow" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Pending</p>
                <p className="text-2xl font-bold text-solarized-base02">{meta?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-solarized-green/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-solarized-green" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Approved Today</p>
                <p className="text-2xl font-bold text-solarized-base02">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-solarized-red/10 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-solarized-red" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Declined Today</p>
                <p className="text-2xl font-bold text-solarized-base02">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-solarized-base02">No pending requests</h3>
              <p className="text-solarized-base01 mt-1">All leave requests have been processed.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.staff_member?.full_name || 'Unknown'}
                        </TableCell>
                        <TableCell>{request.time_off_category?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          {request.start_date} - {request.end_date}
                        </TableCell>
                        <TableCell>{request.total_days}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {request.reason || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-solarized-green hover:bg-solarized-green/90"
                              onClick={() => openDialog(request, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-solarized-red text-solarized-red hover:bg-solarized-red/10"
                              onClick={() => openDialog(request, 'decline')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-solarized-base01">
                    Page {meta.current_page} of {meta.last_page}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === meta.last_page}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? 'Approve' : 'Decline'} Leave Request
            </DialogTitle>
            <DialogDescription>
              {action === 'approve'
                ? 'Are you sure you want to approve this leave request?'
                : 'Are you sure you want to decline this leave request?'}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-solarized-base3 p-4 rounded-lg space-y-2">
                <p><strong>Employee:</strong> {selectedRequest.staff_member?.full_name}</p>
                <p><strong>Type:</strong> {selectedRequest.time_off_category?.name}</p>
                <p><strong>Dates:</strong> {selectedRequest.start_date} to {selectedRequest.end_date}</p>
                <p><strong>Days:</strong> {selectedRequest.total_days}</p>
                {selectedRequest.reason && <p><strong>Reason:</strong> {selectedRequest.reason}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Remarks (optional)</label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add any remarks..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleProcess}
              disabled={isProcessing}
              className={
                action === 'approve'
                  ? 'bg-solarized-green hover:bg-solarized-green/90'
                  : 'bg-solarized-red hover:bg-solarized-red/90'
              }
            >
              {isProcessing ? 'Processing...' : action === 'approve' ? 'Approve' : 'Decline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
