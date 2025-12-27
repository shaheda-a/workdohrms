import { useEffect, useState } from 'react';
import { attendanceApi, staffApi } from '../../api';
import { WorkLog, StaffMember } from '../../types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Calendar, Clock, Search, FileText } from 'lucide-react';

export default function WorkLogs() {
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [staffFilter, setStaffFilter] = useState<string>('');

  const fetchWorkLogs = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (staffFilter) params.staff_member_id = parseInt(staffFilter);

      const response = await attendanceApi.getWorkLogs(params);
      if (response.success) {
        setWorkLogs(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch work logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await staffApi.getDropdown();
        if (response.success) setStaffMembers(response.data);
      } catch (error) {
        console.error('Failed to fetch staff:', error);
      }
    };
    fetchStaff();
    fetchWorkLogs();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchWorkLogs();
    }, 300);
    return () => clearTimeout(debounce);
  }, [dateFrom, dateTo, staffFilter]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      present: 'default',
      absent: 'destructive',
      late: 'secondary',
      half_day: 'outline',
      on_leave: 'secondary',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  const calculateHours = (clockIn: string | null, clockOut: string | null) => {
    if (!clockIn || !clockOut) return '-';
    const start = new Date(`2000-01-01 ${clockIn}`);
    const end = new Date(`2000-01-01 ${clockOut}`);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return `${diff.toFixed(1)} hrs`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02 flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Work Logs
          </h1>
          <p className="text-solarized-base01">View attendance records</p>
        </div>
      </div>

      <Card className="bg-white border-solarized-base2">
        <CardHeader>
          <CardTitle className="text-solarized-base02">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-solarized-base01">From Date</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-solarized-base01">To Date</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-solarized-base01">Employee</label>
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
            <div className="flex items-end">
              <Button onClick={fetchWorkLogs} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-solarized-base2">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solarized-blue"></div>
            </div>
          ) : workLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-solarized-base01">
              <Calendar className="h-12 w-12 mb-4" />
              <p>No work logs found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-solarized-base2 hover:bg-solarized-base2">
                  <TableHead className="text-solarized-base01">Date</TableHead>
                  <TableHead className="text-solarized-base01">Employee</TableHead>
                  <TableHead className="text-solarized-base01">Clock In</TableHead>
                  <TableHead className="text-solarized-base01">Clock Out</TableHead>
                  <TableHead className="text-solarized-base01">Hours</TableHead>
                  <TableHead className="text-solarized-base01">Status</TableHead>
                  <TableHead className="text-solarized-base01">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workLogs.map((log) => (
                  <TableRow key={log.id} className="border-solarized-base2 hover:bg-solarized-base2">
                    <TableCell className="text-solarized-base02 font-medium">{log.date}</TableCell>
                    <TableCell className="text-solarized-base01">{log.staff_member?.full_name || '-'}</TableCell>
                    <TableCell className="text-solarized-base01">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {log.clock_in || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-solarized-base01">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {log.clock_out || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-solarized-base01">{calculateHours(log.clock_in, log.clock_out)}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell className="text-solarized-base01 max-w-xs truncate">{log.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
