import { useState, useEffect } from 'react';
import { attendanceService, staffService } from '../../services/api';
import { showAlert } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Clock, UserCheck, UserX, AlertTriangle } from 'lucide-react';

interface StaffMember {
  id: number;
  full_name: string;
}

interface SummaryData {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  half_days: number;
  total_hours: number;
  average_hours_per_day: number;
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

export default function AttendanceSummary() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  // Load user data from localStorage on component mount
  useEffect(() => {
    const loadUserData = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData: UserData = JSON.parse(userStr);
          setCurrentUser(userData);
          
          // Check if user has admin role (admin, administrator, org, organisation, company, hr)
          const adminRoles = ['admin', 'administrator', 'org', 'organisation', 'company', 'hr'];
          const userRoles = userData.roles || [userData.role];
          const hasAdminRole = userRoles.some(role => 
            adminRoles.includes(role.toLowerCase())
          );
          setIsAdminUser(hasAdminRole);
          
          // If it's a staff user (non-admin), set their staff ID
          if (!hasAdminRole && userData.staff_member_id) {
            setSelectedStaff(userData.staff_member_id.toString());
          }
        }
      } catch (error) {
        console.error('Failed to parse user data from localStorage:', error);
      }
    };
    
    loadUserData();
  }, []);

  // Fetch staff list only for admin users
  useEffect(() => {
    const fetchStaff = async () => {
      if (!isAdminUser) {
        return;
      }
      
      setIsLoadingStaff(true);
      try {
        const response = await staffService.getAll({ per_page: 100 });
        setStaff(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch staff:', error);
        showAlert('error', 'Error', 'Failed to fetch staff');
      } finally {
        setIsLoadingStaff(false);
      }
    };
    
    if (isAdminUser) {
      fetchStaff();
    }
  }, [isAdminUser]);

  // Set default date range
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  const fetchSummary = async () => {
    if (!selectedStaff || !startDate || !endDate) return;
    
    setIsLoading(true);
    try {
      // Prepare params based on user role
      const params: Record<string, unknown> = {
        start_date: startDate,
        end_date: endDate,
      };
      
      // Only include staff_member_id for admin users
      if (isAdminUser && selectedStaff) {
        params.staff_member_id = Number(selectedStaff);
      }
      
      // For non-admin users, the backend will use their own staff_member_id automatically
      
      const response = await attendanceService.getSummary(params);
      setSummary(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch summary:', error);
      
      // Show appropriate error message
      if (error.response?.data?.message) {
        showAlert('error', 'Error', error.response.data.message);
      } else {
        showAlert('error', 'Error', 'Failed to fetch attendance summary');
      }
      
      // Set default data for demo (only in development)
      if (process.env.NODE_ENV === 'development') {
        setSummary({
          total_days: 22,
          present_days: 18,
          absent_days: 2,
          late_days: 3,
          half_days: 1,
          total_hours: 144,
          average_hours_per_day: 8.0,
        });
      } else {
        setSummary(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch summary when selectedStaff changes for non-admin users
  useEffect(() => {
    if (!isAdminUser && selectedStaff && startDate && endDate) {
      fetchSummary();
    }
  }, [selectedStaff, startDate, endDate, isAdminUser]);

  const chartData = summary ? [
    { name: 'Present', value: summary.present_days, fill: '#859900' },
    { name: 'Absent', value: summary.absent_days, fill: '#dc322f' },
    { name: 'Late', value: summary.late_days, fill: '#b58900' },
    { name: 'Half Day', value: summary.half_days, fill: '#268bd2' },
  ] : [];

  // Get current staff member name
  const getCurrentStaffName = () => {
    if (!currentUser || !selectedStaff) return '';
    
    // For non-admin users, show their own name
    if (!isAdminUser) {
      return currentUser.name;
    }
    
    // For admin users, find the selected staff from the list
    const staffMember = staff.find(s => s.id.toString() === selectedStaff);
    return staffMember?.full_name || '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-solarized-base02">
          {isAdminUser ? 'Attendance Summary' : 'My Attendance Summary'}
        </h1>
        <p className="text-solarized-base01">
          {isAdminUser 
            ? 'View attendance statistics and reports' 
            : 'View your attendance statistics and summary'}
        </p>
      </div>

      {isAdminUser ? (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Generate Summary</CardTitle>
            <CardDescription>Select an employee and date range to view their attendance summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="staff">Employee</Label>
                <Select 
                  value={selectedStaff} 
                  onValueChange={setSelectedStaff}
                  disabled={isLoadingStaff}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      isLoadingStaff ? "Loading employees..." : "Select employee"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={fetchSummary}
                  disabled={!selectedStaff || !startDate || !endDate || isLoading}
                  className="w-full bg-solarized-blue hover:bg-solarized-blue/90"
                >
                  {isLoading ? "Generating..." : "Generate"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Your Attendance Summary</CardTitle>
            <CardDescription>
              Viewing attendance summary for {currentUser?.name || 'you'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={fetchSummary}
                  disabled={!startDate || !endDate || isLoading}
                  className="w-full bg-solarized-blue hover:bg-solarized-blue/90"
                >
                  {isLoading ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* {isAdminUser && selectedStaff && (
        <div className="p-4 bg-solarized-base3 rounded-lg">
          <p className="text-sm text-solarized-base01">Viewing summary for:</p>
          <p className="font-medium text-lg">{getCurrentStaffName()}</p>
        </div>
      )} */}

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-0 shadow-md">
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : summary ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-solarized-green/10 flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-solarized-green" />
                  </div>
                  <div>
                    <p className="text-sm text-solarized-base01">Present Days</p>
                    <p className="text-2xl font-bold text-solarized-base02">{summary.present_days}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-solarized-red/10 flex items-center justify-center">
                    <UserX className="h-6 w-6 text-solarized-red" />
                  </div>
                  <div>
                    <p className="text-sm text-solarized-base01">Absent Days</p>
                    <p className="text-2xl font-bold text-solarized-base02">{summary.absent_days}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-solarized-yellow/10 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-solarized-yellow" />
                  </div>
                  <div>
                    <p className="text-sm text-solarized-base01">Late Days</p>
                    <p className="text-2xl font-bold text-solarized-base02">{summary.late_days}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-solarized-blue/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-solarized-blue" />
                  </div>
                  <div>
                    <p className="text-sm text-solarized-base01">Total Hours</p>
                    <p className="text-2xl font-bold text-solarized-base02">{summary.total_hours}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {summary.half_days > 0 && (
            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-solarized-orange/10 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-solarized-orange" />
                  </div>
                  <div>
                    <p className="text-sm text-solarized-base01">Half Days</p>
                    <p className="text-2xl font-bold text-solarized-base02">{summary.half_days}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Attendance Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee8d5" />
                    <XAxis dataKey="name" stroke="#657b83" />
                    <YAxis stroke="#657b83" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fdf6e3',
                        border: '1px solid #eee8d5',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      ) : isAdminUser ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-solarized-base02">No Summary Generated</h3>
            <p className="text-solarized-base01 mt-1">
              {isAdminUser && !selectedStaff 
                ? 'Select an employee and date range to generate an attendance summary.'
                : 'Select a date range and click generate to view attendance summary.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-solarized-base02">No Summary Available</h3>
            <p className="text-solarized-base01 mt-1">
              Select a date range and click refresh to view your attendance summary.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
