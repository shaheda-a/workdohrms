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
} from '../../components/ui/dialog';
import DataTable, { TableColumn } from 'react-data-table-component';
import {
  Plus,
  Calendar,
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

/* =========================
   COMPONENT
========================= */
export default function LeaveRequests() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');

  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<LeaveRequest | null>(null);

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

        const response = await leaveService.getRequests(params);
        const { data, meta } = response.data;

        if (Array.isArray(data)) {
          setRequests(data);
          setTotalRows(meta?.total ?? 0);
        } else {
          setRequests([]);
          setTotalRows(0);
        }
      } catch (error) {
        console.error('Failed to fetch leave requests:', error);
        showAlert('error', 'Error', 'Failed to fetch leave requests');
        setRequests([]);
        setTotalRows(0);
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
    setPage(1); // Reset to first page when changing rows per page
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

  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  // ================= TABLE COLUMNS =================
  const columns: TableColumn<LeaveRequest>[] = [
    {
      name: 'Employee',
      selector: (row) => row.staff_member?.full_name || 'Unknown',
      sortable: true,
      minWidth: '150px',
    },
    {
      name: 'Leave Type',
      cell: (row) => (
        <Badge className="bg-blue-100 text-blue-800">
          {row.category?.title || 'Unknown'}
        </Badge>
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
        <Badge className={getStatusBadge(row.approval_status)}>
          {row.approval_status}
        </Badge>
      ),
      minWidth: '100px',
    },
    {
      name: 'Actions',
      cell: (row) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleView(row)}
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
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between">
            <CardTitle className="text-lg">Leave Requests</CardTitle>
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
          {!isLoading && requests.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p>No leave requests found</p>
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
            />
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
