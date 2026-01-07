import { useState, useEffect } from 'react';
import { attendanceService } from '../../services/api';
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
import { Calendar, Clock, ChevronLeft, ChevronRight, Filter, User, TrendingUp, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WorkLog {
  id: number;
  staff_member_id: number;
  staff_member?: { full_name: string };
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

interface WorkLogSummary {
  start_date?: string;
  end_date?: string;
  total_days?: number;
  present_days?: number;
  late_days?: number;
  half_days?: number;
  total_hours?: number;
  average_hours_per_day?: number;
  [key: string]: any; // Allow additional properties
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

export default function MyWorkLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [summary, setSummary] = useState<WorkLogSummary | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Load user data from localStorage on mount
  useEffect(() => {
    const loadUserData = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData: UserData = JSON.parse(userStr);
          setCurrentUser(userData);
          
          // Check if user has staff member ID
          if (!userData.staff_member_id) {
            showAlert('warning', 'No Staff Record', 'You do not have a staff member record. Please contact administrator.');
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

  // Fetch logs when page changes
  useEffect(() => {
    if (currentUser?.staff_member_id) {
      fetchLogs();
    }
  }, [page, currentUser]);

  // Fetch summary when date range changes
  useEffect(() => {
    if (currentUser?.staff_member_id) {
      fetchSummary();
    }
  }, [startDate, endDate, currentUser]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = { page };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await attendanceService.getMyWorkLogs(params);
      console.log('Work logs response:', response.data); // Debug log
      setLogs(response.data.data || []);
      setMeta(response.data.meta);
    } catch (error: any) {
      console.error('Failed to fetch work logs:', error);
      
      if (error.response?.status === 401) {
        showAlert('error', 'Session Expired', 'Please login again.');
        navigate('/login');
      } else {
        showAlert('error', 'Error', 'Failed to fetch work logs');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = async () => {
    setIsSummaryLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await attendanceService.getMySummary(params);
      console.log('Summary response:', response.data); // Debug log
      setSummary(response.data || {});
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      setSummary({}); // Set empty object instead of null
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleFilter = () => {
    setPage(1);
    fetchLogs();
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      // This would need an export endpoint in your backend
      showAlert('warning', 'Export', 'Export feature will be implemented soon.');
      // const response = await attendanceService.exportMyWorkLogs(params);
    } catch (error) {
      console.error('Failed to export:', error);
      showAlert('error', 'Error', 'Failed to export work logs');
    } finally {
      setExportLoading(false);
    }
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
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return original if invalid
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString; // Return original if parsing fails
    }
  };

  const calculateTotalHours = (clockIn: string | null, clockOut: string | null): number => {
    if (!clockIn || !clockOut) return 0;
    
    try {
      const inTime = new Date(`1970-01-01T${clockIn}`);
      const outTime = new Date(`1970-01-01T${clockOut}`);
      const diffMs = outTime.getTime() - inTime.getTime();
      return diffMs / (1000 * 60 * 60);
    } catch (error) {
      console.error('Error calculating hours:', error);
      return 0;
    }
  };

  // Safe number formatting
  const safeNumberFormat = (value: any, decimals: number = 1): string => {
    if (value === undefined || value === null || isNaN(Number(value))) {
      return '0.0';
    }
    return Number(value).toFixed(decimals);
  };

  // Calculate overall stats
  const getOverallStats = () => {
    const presentCount = logs.filter(log => log.status === 'present').length;
    const lateCount = logs.filter(log => log.status === 'late').length;
    const absentCount = logs.filter(log => log.status === 'absent').length;
    const totalHours = logs.reduce((total, log) => {
      const hours = log.total_hours || calculateTotalHours(log.clock_in, log.clock_out);
      return total + (hours || 0);
    }, 0);
    
    return {
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      totalHours: totalHours,
      averageHours: logs.length > 0 ? totalHours / logs.length : 0
    };
  };

  // Get summary with safe defaults
  const getSafeSummary = () => {
    return {
      start_date: summary?.start_date || startDate,
      end_date: summary?.end_date || endDate,
      total_days: summary?.total_days || 0,
      present_days: summary?.present_days || 0,
      late_days: summary?.late_days || 0,
      half_days: summary?.half_days || 0,
      total_hours: summary?.total_hours || 0,
      average_hours_per_day: summary?.average_hours_per_day || 0
    };
  };

  const safeSummary = getSafeSummary();
  const overallStats = getOverallStats();

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 ml-4">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">My Work Logs</h1>
          <p className="text-solarized-base01">View your attendance records and work history</p>
        </div>
        {/* <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportLoading || logs.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {exportLoading ? 'Exporting...' : 'Export'}
          </Button>
        </div> */}
      </div>

      {/* User Info Card */}
      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-solarized-blue/10 flex items-center justify-center">
                <User className="h-6 w-6 text-solarized-blue" />
              </div>
              <div>
                <p className="font-medium text-lg">{currentUser.name}</p>
                <div className="flex items-center gap-4 text-sm text-solarized-base01">
                  <span>{currentUser.email}</span>
                  {/* <span>•</span>
                  <span>Staff ID: {currentUser.staff_member_id || 'N/A'}</span> */}
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-solarized-blue border-solarized-blue">
              {currentUser.role_display || currentUser.primary_role}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      {/* <Card className="border-0 shadow-md bg-gradient-to-r from-solarized-blue/10 to-solarized-cyan/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-solarized-blue" />
              <h3 className="text-lg font-semibold text-solarized-base02">Work Summary</h3>
            </div>
            <div className="text-sm text-solarized-base01">
              {safeSummary.start_date} to {safeSummary.end_date}
            </div>
          </div>
          
          {isSummaryLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-white/50 border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="text-sm text-solarized-base01">Present Days</div>
                  <div className="text-2xl font-bold text-solarized-green">
                    {safeSummary.present_days || 0}
                  </div>
                  <div className="text-xs text-solarized-base01">
                    out of {safeSummary.total_days || 0} days
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/50 border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="text-sm text-solarized-base01">Total Hours</div>
                  <div className="text-2xl font-bold text-solarized-blue">
                    {safeNumberFormat(safeSummary.total_hours)}
                  </div>
                  <div className="text-xs text-solarized-base01">
                    Avg: {safeNumberFormat(safeSummary.average_hours_per_day)}/day
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/50 border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="text-sm text-solarized-base01">Late Days</div>
                  <div className="text-2xl font-bold text-solarized-yellow">
                    {safeSummary.late_days || 0}
                  </div>
                  <div className="text-xs text-solarized-base01">Attendance</div>
                </CardContent>
              </Card>
              <Card className="bg-white/50 border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="text-sm text-solarized-base01">Half Days</div>
                  <div className="text-2xl font-bold text-solarized-orange">
                    {safeSummary.half_days || 0}
                  </div>
                  <div className="text-xs text-solarized-base01">Attendance</div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card> */}

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Work Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button 
                onClick={handleFilter} 
                className="bg-solarized-blue hover:bg-solarized-blue/90"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Apply Filter'}
              </Button>
              {/* <Button
                onClick={() => {
                  const today = new Date();
                  const lastMonth = new Date();
                  lastMonth.setDate(today.getDate() - 30);
                  setStartDate(lastMonth.toISOString().split('T')[0]);
                  setEndDate(today.toISOString().split('T')[0]);
                }}
                variant="outline"
              >
                Last 30 Days
              </Button> */}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Page Stats */}
      {logs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-solarized-base01">Present (This Page)</div>
              <div className="text-2xl font-bold text-solarized-green">
                {overallStats.present}
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-solarized-base01">Late (This Page)</div>
              <div className="text-2xl font-bold text-solarized-yellow">
                {overallStats.late}
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-solarized-base01">Total Hours</div>
              <div className="text-2xl font-bold text-solarized-blue">
                {safeNumberFormat(overallStats.totalHours)}
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-solarized-base01">Avg Hours/Day</div>
              <div className="text-2xl font-bold text-solarized-cyan">
                {safeNumberFormat(overallStats.averageHours)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                {currentUser.staff_member_id
                  ? 'Try adjusting your filter criteria.'
                  : 'You do not have a staff member record. Please contact administrator.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Total Hours</TableHead>
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
                              {safeNumberFormat(totalHours)} hours
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
                          <TableCell className="max-w-[200px]" title={log.notes || ''}>
                            <div className="truncate">{log.notes || '-'}</div>
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