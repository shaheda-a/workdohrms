import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { leaveService } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';

/* =========================
   TYPES (MATCH API)
========================= */
interface LeaveRequest {
  id: number;
  staff_member?: {
    full_name: string;
  };
  category?: {
    id: number;
    title: string;
  };
  start_date: string;
  end_date: string;
  total_days: string | number;
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

/* =========================
   COMPONENT
========================= */
export default function LeaveRequests() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');

  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<LeaveRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = { page };
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await leaveService.getRequests(params);
      setRequests(response.data.data || []);
      setMeta(response.data.meta);
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (request: LeaveRequest) => {
    setViewingRequest(request);
    setIsViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-solarized-yellow/10 text-solarized-yellow',
      approved: 'bg-solarized-green/10 text-solarized-green',
      declined: 'bg-solarized-red/10 text-solarized-red',
      cancelled: 'bg-solarized-base01/10 text-solarized-base01',
    };
    return variants[status] || variants.pending;
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString();

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">Leave Requests</h1>
          <p className="text-solarized-base01">View and manage your leave requests</p>
        </div>
        <Link to="/leave/apply">
          <Button className="bg-solarized-blue hover:bg-solarized-blue/90">
            <Plus className="mr-2 h-4 w-4" />
            Apply Leave
          </Button>
        </Link>
      </div>

      {/* TABLE */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex justify-between">
            <CardTitle className="text-lg">My Requests</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-solarized-base02">
                No leave requests
              </h3>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.category?.title || 'Unknown'}
                    </TableCell>
                    <TableCell>{formatDate(request.start_date)}</TableCell>
                    <TableCell>{formatDate(request.end_date)}</TableCell>
                    <TableCell>{request.total_days}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(request.approval_status)}>
                        {request.approval_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(request)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {meta && meta.last_page > 1 && (
            <div className="flex justify-between mt-6">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page === meta.last_page}
                onClick={() => setPage(page + 1)}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* =========================
         VIEW MODAL (ASSETS STYLE)
      ========================= */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
          </DialogHeader>

          {viewingRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-solarized-base01">Employee</p>
                  <p className="font-medium">
                    {viewingRequest.staff_member?.full_name || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-solarized-base01">Leave Type</p>
                  <p className="font-medium">
                    {viewingRequest.category?.title || '-'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-solarized-base01">Start Date</p>
                  <p>{formatDate(viewingRequest.start_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-solarized-base01">End Date</p>
                  <p>{formatDate(viewingRequest.end_date)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-solarized-base01">Total Days</p>
                  <p>{viewingRequest.total_days}</p>
                </div>
                <div>
                  <p className="text-sm text-solarized-base01">Status</p>
                  <Badge className={getStatusBadge(viewingRequest.approval_status)}>
                    {viewingRequest.approval_status}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-solarized-base01">Reason</p>
                <p>{viewingRequest.reason || '-'}</p>
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
    </div>
  );
}
