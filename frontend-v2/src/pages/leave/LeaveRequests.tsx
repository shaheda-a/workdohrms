import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { leaveService } from '../../services/api';
import { showAlert } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
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
  DialogDescription,
} from '../../components/ui/dialog';
import DataTable, { TableColumn } from 'react-data-table-component';
import {
  Plus,
  Calendar,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  User,
} from 'lucide-react';

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
  approved_at?: string;
  approved_by?: {
    name: string;
  };
  approval_remarks?: string;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  role_display: string;
  roles: string[];
  permissions: string[];
  primary_role: string;
  primary_role_icon: string;
  primary_role_hierarchy: number;
  staff_member_id: number | null;
}

export default function LeaveRequests() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);

  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<LeaveRequest | null>(null);

  // Load user data from localStorage
  useEffect(() => {
    const loadUserData = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData: UserData = JSON.parse(userStr);
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('Failed to parse user data from localStorage:', error);
      }
    };
    
    loadUserData();
  }, []);

  // ================= FETCH REQUESTS =================
  const fetchRequests = useCallback(
    async (currentPage: number = 1) => {
      setIsLoading(true);
      try {
        const params: Record<string, unknown> = {
          page: currentPage,
          per_page: perPage,
        };
        if (statusFilter !== 'all') params.status = statusFilter;

        // IMPORTANT: Use the new endpoint for "My Leave Requests"
        const response = await leaveService.getMyRequests(params);
        const { data, meta } = response.data;

        if (Array.isArray(data)) {
          setRequests(data);
          setTotalRows(meta?.total ?? 0);
        } else {
          setRequests([]);
          setTotalRows(0);
        }
      } catch (error: any) {
        console.error('Failed to fetch leave requests:', error);
        
        // If admin doesn't have a staff member record, they'll get an empty response
        if (error.response?.status === 404 && error.response?.data?.message === 'Staff member not found') {
          // This is expected for admin without staff record
          setRequests([]);
          setTotalRows(0);
          showAlert('warning', 'Information', 'You don\'t have a staff member record. Please contact administrator.');
        } else {
          showAlert('error', 'Error', 'Failed to fetch leave requests');
          setRequests([]);
          setTotalRows(0);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [perPage, statusFilter]
  );

  useEffect(() => {
    fetchRequests(page);
  }, [page, fetchRequests]);

  // ================= PAGINATION =================
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePerRowsChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setPage(1);
  };

  // ================= HANDLERS =================
  const handleView = (request: LeaveRequest) => {
    setViewingRequest(request);
    setIsViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return variants[status] || variants.pending;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ================= TABLE COLUMNS =================
  const columns: TableColumn<LeaveRequest>[] = [
    {
      name: 'Leave Type',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-800">
            {row.category?.title || 'Unknown'}
          </Badge>
        </div>
      ),
      minWidth: '120px',
    },
    {
      name: 'Start Date',
      selector: (row) => formatDate(row.start_date),
      sortable: true,
      minWidth: '120px',
    },
    {
      name: 'End Date',
      selector: (row) => formatDate(row.end_date),
      sortable: true,
      minWidth: '120px',
    },
    {
      name: 'Days',
      selector: (row) => row.total_days,
      sortable: true,
      width: '80px',
    },
    {
      name: 'Status',
      cell: (row) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(row.approval_status)}
          <Badge className={getStatusBadge(row.approval_status)}>
            {row.approval_status}
          </Badge>
        </div>
      ),
      minWidth: '120px',
    },
    {
      name: 'Applied On',
      selector: (row) => formatDate(row.created_at),
      sortable: true,
      minWidth: '120px',
    },
    {
      name: 'Actions',
      cell: (row) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleView(row)}
          title="View Details"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
      ignoreRowClick: true,
      width: '80px',
    },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">My Leave Requests</h1>
          <p className="text-solarized-base01">
            View and manage your leave requests, {currentUser?.name || 'User'}
          </p>
        </div>
        <Link to="/leave/apply">
          <Button className="bg-solarized-blue hover:bg-solarized-blue/90">
            <Plus className="mr-2 h-4 w-4" />
            Apply Leave
          </Button>
        </Link>
      </div>

      {/* STATS SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-solarized-base01">Total Requests</p>
                <p className="text-2xl font-bold">{totalRows}</p>
              </div>
              <Calendar className="h-8 w-8 text-solarized-blue" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-solarized-base01">Pending</p>
                <p className="text-2xl font-bold">
                  {requests.filter(r => r.approval_status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-solarized-yellow" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-solarized-base01">Approved</p>
                <p className="text-2xl font-bold">
                  {requests.filter(r => r.approval_status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-solarized-green" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-solarized-base01">Declined</p>
                <p className="text-2xl font-bold">
                  {requests.filter(r => r.approval_status === 'declined').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-solarized-red" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">My Leave History</CardTitle>
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Requests</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => fetchRequests(1)}
                disabled={isLoading}
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {!isLoading && requests.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-solarized-base01">No leave requests found</p>
              <p className="text-sm text-solarized-base01 mt-2">
                {currentUser?.staff_member_id 
                  ? "You haven't applied for any leave yet."
                  : "You don't have a staff member record. Please contact administrator to create one."}
              </p>
              {currentUser?.staff_member_id && (
                <Link to="/leave/apply">
                  <Button className="mt-4 bg-solarized-blue hover:bg-solarized-blue/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Apply for Leave
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={requests}
              progressPending={isLoading}
              pagination
              paginationServer
              paginationTotalRows={totalRows}
              paginationPerPage={perPage}
              paginationRowsPerPageOptions={[5, 10, 15, 20]}
              paginationDefaultPage={page}
              onChangePage={handlePageChange}
              onChangeRowsPerPage={handlePerRowsChange}
              highlightOnHover
              responsive
              noHeader
            />
          )}
        </CardContent>
      </Card>

      {/* VIEW MODAL */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
            <DialogDescription>
              Details of your leave request
            </DialogDescription>
          </DialogHeader>

          {viewingRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-solarized-base01">Leave Type</p>
                  <p className="font-medium">
                    {viewingRequest.category?.title || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-solarized-base01">Status</p>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusBadge(viewingRequest.approval_status)}>
                      {viewingRequest.approval_status}
                    </Badge>
                  </div>
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

              <div>
                <p className="text-sm text-solarized-base01">Total Days</p>
                <p className="text-lg font-semibold">{viewingRequest.total_days} day(s)</p>
              </div>

              <div>
                <p className="text-sm text-solarized-base01">Reason</p>
                <p className="mt-1 p-3 bg-solarized-base3 rounded-lg">
                  {viewingRequest.reason || 'No reason provided'}
                </p>
              </div>

              <div>
                <p className="text-sm text-solarized-base01">Applied On</p>
                <p>{formatDateTime(viewingRequest.created_at)}</p>
              </div>

              {viewingRequest.approval_status !== 'pending' && (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-solarized-base01">Approved/Rejected By</p>
                      <p className="font-medium">
                        {viewingRequest.approved_by?.name || 'System'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-solarized-base01">Decision Date</p>
                      <p>{viewingRequest.approved_at ? formatDateTime(viewingRequest.approved_at) : '-'}</p>
                    </div>
                  </div>
                  {viewingRequest.approval_remarks && (
                    <div className="mt-3">
                      <p className="text-sm text-solarized-base01">Remarks</p>
                      <p className="mt-1 p-3 bg-solarized-base3 rounded-lg">
                        {viewingRequest.approval_remarks}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {viewingRequest?.approval_status === 'pending' && (
              <Button
                variant="destructive"
                onClick={() => {
                  // Add cancel functionality here
                  setIsViewDialogOpen(false);
                }}
              >
                Cancel Request
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}