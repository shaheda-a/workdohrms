import { useState, useEffect } from 'react';
import { attendanceService, staffService } from '../../services/api';
import { showAlert } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Skeleton } from '../../components/ui/skeleton';
import { Calendar, Clock, ChevronLeft, ChevronRight, Filter, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StaffMember {
  id: number;
  full_name: string;
  staff_code?: string;
  email?: string;
}

interface WorkLog {
  id: number;
  staff_member_id: number;
  staff_member?: { full_name: string; staff_code?: string };
  log_date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  late_minutes: number;
  notes: string | null;
  total_hours?: number;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
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
  org_id: number | null;
  company_id: number | null;
}

export default function WorkLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [staffMemberId, setStaffMemberId] = useState<string>('');
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);

  const safeNumberFormat = (value: any, decimals: number = 1): string => {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return '0.0';
  }
  return Number(value).toFixed(decimals);
};

  // Load user data from localStorage on mount
  useEffect(() => {
    const loadUserData = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData: UserData = JSON.parse(userStr);
          setCurrentUser(userData);
          
          // Check if user has admin role (admin, administrator, organisation, company, hr)
          const adminRoles = ['admin', 'administrator', 'organisation', 'company', 'hr'];
          const userRoles = userData.roles || [userData.role];
          const hasAdminRole = userRoles.some(role => 
            adminRoles.includes(role.toLowerCase())
          );
          setIsAdminUser(hasAdminRole);
          
          // If not admin, redirect to My Work Logs
          if (!hasAdminRole) {
            showAlert('warning', 'Access Restricted', 'You do not have permission to view all work logs. Redirecting to your work logs.');
            navigate('/my-work-logs');
            return;
          }
        } else {
          // No user data, redirect to login
          navigate('/login');
          return;
        }
      } catch (error) {
        console.error('Failed to parse user data from localStorage:', error);
        showAlert('error', 'Error', 'Failed to load user data. Please login again.');
        navigate('/login');
      }
    };
    
    loadUserData();
  }, [navigate]);

  // Fetch staff list only for admin users
  useEffect(() => {
    const fetchStaff = async () => {
      if (!isAdminUser) return;
      
      setIsLoadingStaff(true);
      try {
        const response = await staffService.getAll({ per_page: 100 });
        setStaffMembers(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch staff:', error);
        showAlert('error', 'Error', 'Failed to fetch staff list');
      } finally {
        setIsLoadingStaff(false);
      }
    };
    
    if (isAdminUser) {
      fetchStaff();
    }
  }, [isAdminUser]);

  // Fetch work logs when filters or page changes
  useEffect(() => {
    if (isAdminUser) {
      fetchLogs();
    }
  }, [page, isAdminUser]);

  const fetchLogs = async () => {
    if (!isAdminUser) return;
    
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = { page };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (staffMemberId) params.staff_member_id = staffMemberId;

      const response = await attendanceService.getWorkLogs(params);
      setLogs(response.data.data || []);
      setMeta(response.data.meta);
    } catch (error: any) {
      console.error('Failed to fetch work logs:', error);
      
      if (error.response?.status === 403) {
        showAlert('error', 'Access Denied', 'You do not have permission to view all work logs.');
        navigate('/my-work-logs');
      } else if (error.response?.status === 401) {
        showAlert('error', 'Session Expired', 'Please login again.');
        navigate('/login');
      } else {
        showAlert('error', 'Error', 'Failed to fetch work logs');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = () => {
    setPage(1);
    fetchLogs();
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStaffMemberId('');
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      present: 'bg-solarized-green/10 text-solarized-green',
      absent: 'bg-solarized-red/10 text-solarized-red',
      late: 'bg-solarized-yellow/10 text-solarized-yellow',
      half_day: 'bg-solarized-orange/10 text-solarized-orange',
      leave: 'bg-solarized-blue/10 text-solarized-blue',
    };
    return variants[status] || variants.absent;
  };

  const formatTime = (time: string | null) => {
    if (!time) return '--:--';
    return time.substring(0, 5);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate total hours for a work log
  const calculateTotalHours = (clockIn: string | null, clockOut: string | null): number => {
    if (!clockIn || !clockOut) return 0;
    
    const inTime = new Date(`1970-01-01T${clockIn}`);
    const outTime = new Date(`1970-01-01T${clockOut}`);
    const diffMs = outTime.getTime() - inTime.getTime();
    return diffMs / (1000 * 60 * 60);
  };

  // Get total hours for all displayed logs
  const getTotalHours = () => {
    return logs.reduce((total, log) => {
      return total + (log.total_hours || calculateTotalHours(log.clock_in, log.clock_out));
    }, 0);
  };

  // Get stats for current page
  const getStats = () => {
    const presentCount = logs.filter(log => log.status === 'present').length;
    const lateCount = logs.filter(log => log.status === 'late').length;
    const absentCount = logs.filter(log => log.status === 'absent').length;
    const halfDayCount = logs.filter(log => log.status === 'half_day').length;
    
    return {
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      halfDay: halfDayCount,
      total: logs.length
    };
  };

  if (!isAdminUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="border-0 shadow-md max-w-md">
          <CardContent className="pt-6 text-center">
            <ShieldAlert className="h-16 w-16 text-solarized-yellow mx-auto mb-4" />
            <h3 className="text-xl font-bold text-solarized-base02 mb-2">Access Restricted</h3>
            <p className="text-solarized-base01 mb-4">
              You do not have permission to view all work logs. This page is only accessible to administrators.
            </p>
            <Button 
              onClick={() => navigate('/my-work-logs')}
              className="bg-solarized-blue hover:bg-solarized-blue/90"
            >
              View My Work Logs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-solarized-base02">Work Logs</h1>
        <p className="text-solarized-base01">
          View attendance records for all staff members
          {currentUser && <span className="text-solarized-blue ml-2">• Admin Access</span>}
        </p>
      </div>

      {/* Stats Summary */}
      {logs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-solarized-base01">Total Records</div>
              <div className="text-2xl font-bold">{getStats().total}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-solarized-base01">Present</div>
              <div className="text-2xl font-bold text-solarized-green">{getStats().present}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-solarized-base01">Late</div>
              <div className="text-2xl font-bold text-solarized-yellow">{getStats().late}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-solarized-base01">Absent</div>
              <div className="text-2xl font-bold text-solarized-red">{getStats().absent}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-solarized-base01">Total Hours</div>
              <div className="text-2xl font-bold text-solarized-blue">{safeNumberFormat(getTotalHours(), 1)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Work Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff_member">Staff Member</Label>
              <select
                id="staff_member"
                className="w-full px-3 py-2 border border-solarized-base1 rounded-md bg-white dark:bg-solarized-base03"
                value={staffMemberId}
                onChange={(e) => setStaffMemberId(e.target.value)}
                disabled={isLoadingStaff}
              >
                <option value="">All Staff</option>
                {staffMembers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.full_name} {staff.staff_code ? `(${staff.staff_code})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2 col-span-1 md:col-span-2">
              <Button
                onClick={handleFilter}
                className="bg-solarized-blue hover:bg-solarized-blue/90 flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Apply Filter'}
              </Button>
              <Button
                onClick={clearFilters}
                variant="outline"
                disabled={isLoading || (!startDate && !endDate && !staffMemberId)}
                className="flex-1"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-solarized-base02">No work logs found</h3>
              <p className="text-solarized-base01 mt-1">
                {startDate || endDate || staffMemberId
                  ? 'Try adjusting your filter criteria.'
                  : 'No work logs available for the selected period.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Late (mins)</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const totalHours = log.total_hours || calculateTotalHours(log.clock_in, log.clock_out);
                      return (
                        <TableRow key={log.id} className="hover:bg-solarized-base3/50">
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{formatDate(log.log_date)}</span>
                              <span className="text-xs text-solarized-base01">{log.log_date}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{log.staff_member?.full_name || 'Unknown'}</div>
                            {log.staff_member?.staff_code && (
                              <div className="text-xs text-solarized-base01">
                                ID: {log.staff_member.staff_code}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-solarized-green" />
                              {formatTime(log.clock_in)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-solarized-red" />
                              {formatTime(log.clock_out)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`font-medium ${totalHours >= 8 ? 'text-solarized-green' : totalHours >= 6 ? 'text-solarized-yellow' : 'text-solarized-red'}`}>
                              {safeNumberFormat(totalHours, 1)}h
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(log.status)}>
                              {log.status?.replace('_', ' ') || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className={`font-medium ${log.late_minutes > 0 ? 'text-solarized-yellow' : 'text-solarized-green'}`}>
                              {log.late_minutes || 0}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={log.notes || ''}>
                            {log.notes || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {meta && meta.last_page > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                  <p className="text-sm text-solarized-base01">
                    Showing {(meta.current_page - 1) * meta.per_page + 1} to{' '}
                    {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total} results
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1 || isLoading}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-solarized-base01 px-3 py-1 bg-solarized-base3 rounded">
                      Page {meta.current_page} of {meta.last_page}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === meta.last_page || isLoading}
                      className="flex items-center gap-1"
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
    </div>
  );
}