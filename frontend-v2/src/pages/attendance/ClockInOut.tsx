import { useState, useEffect, useCallback } from 'react';
import { attendanceService, staffService } from '../../services/api';
import { showAlert, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Clock, LogIn, LogOut, CheckCircle, AlertCircle, Calendar, User, Users } from 'lucide-react';

interface StaffMember {
  id: number;
  full_name: string;
  staff_code: string;
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

interface CurrentStatus {
  status: string;
  clock_in: string | null;
  clock_out: string | null;
  total_hours: number | null;
}

export default function ClockInOut() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [ipAddress, setIpAddress] = useState<string>('');
  const [location, setLocation] = useState<string>('');

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
          
          // If it's a staff user (non-admin), set their staff ID as selected
          if (!hasAdminRole && userData.staff_member_id) {
            setSelectedStaff(userData.staff_member_id.toString());
          }
        }
      } catch (error) {
        console.error('Failed to parse user data from localStorage:', error);
      }
    };
    
    loadUserData();
    
    // Get client IP address (simplified - in real app, you'd get this from backend)
    fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => setIpAddress(data.ip))
      .catch(() => setIpAddress('Unknown'));
  }, []);

  // Fetch staff list for admin users
  useEffect(() => {
    const fetchStaffMembers = async () => {
      if (!isAdminUser) return;
      
      setIsLoadingStaff(true);
      try {
        const response = await staffService.getAll({ per_page: 100 });
        setStaffMembers(response.data.data || []);
        
        // Auto-select first staff member if none selected
        if (response.data.data?.length > 0 && !selectedStaff) {
          setSelectedStaff(response.data.data[0].id.toString());
        }
      } catch (error) {
        console.error('Failed to fetch staff members:', error);
        showAlert('error', 'Error', 'Failed to load staff members');
      } finally {
        setIsLoadingStaff(false);
      }
    };
    
    if (isAdminUser) {
      fetchStaffMembers();
    }
  }, [isAdminUser]);

  const fetchCurrentStatus = useCallback(async () => {
  if (!selectedStaff) return;
  
  setIsLoadingStatus(true);
  try {
    const params: Record<string, unknown> = {};
    
    if (isAdminUser && selectedStaff) {
      params.staff_member_id = Number(selectedStaff);
    } else if (!isAdminUser && currentUser?.staff_member_id) {
      params.staff_member_id = currentUser.staff_member_id;
    }
    
    console.log('Refreshing status with params:', params);
    
    const response = await attendanceService.getCurrentStatus(params);
    console.log('Refresh response:', response.data);
    
    setCurrentStatus(response.data.data);
  } catch (error) {
    console.error('Failed to refresh status:', error);
    setCurrentStatus({
      status: 'not_clocked_in',
      clock_in: null,
      clock_out: null,
      total_hours: null,
    });
  } finally {
    setIsLoadingStatus(false);
  }
}, [selectedStaff, isAdminUser, currentUser]);

// Fetch current status
useEffect(() => {
  const fetchCurrentStatus = async () => {
    // For admin users, wait until staff members are loaded
    if (isAdminUser && staffMembers.length === 0) return;
    
    // For non-admin users, wait until we have current user data
    if (!isAdminUser && !currentUser?.staff_member_id) return;
    
    if (!selectedStaff) return;
    
    setIsLoadingStatus(true);
    try {
      // Prepare params - always include staff_member_id
      const params: Record<string, unknown> = {};
      
      // For admin users, use selected staff member
      if (isAdminUser && selectedStaff) {
        params.staff_member_id = Number(selectedStaff);
      }
      // For non-admin users, use their own staff_member_id
      else if (!isAdminUser && currentUser?.staff_member_id) {
        params.staff_member_id = currentUser.staff_member_id;
      }
      
      console.log('Fetching status with params:', params); // Debug
      
      const response = await attendanceService.getCurrentStatus(params);
      console.log('Status response:', response.data); // Debug
      
      setCurrentStatus(response.data.data);
    } catch (error) {
      console.error('Failed to fetch current status:', error);
      // Set default status
      setCurrentStatus({
        status: 'not_clocked_in',
        clock_in: null,
        clock_out: null,
        total_hours: null,
      });
    } finally {
      setIsLoadingStatus(false);
    }
  };
  
  fetchCurrentStatus();
}, [selectedStaff, isAdminUser, currentUser, staffMembers.length]); // Added staffMembers.length dependency

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

const formatTimeString = (timeString: string | null | undefined) => {
  if (!timeString) return '--:--';
  
  try {
    // Check if it's already a valid ISO date string
    if (timeString.includes('T')) {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }
    
    // Handle time-only strings (e.g., "06:12:36")
    // Split the time string
    const timeParts = timeString.split(':');
    
    if (timeParts.length >= 2) {
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      
      // Create a date object with today's date and the parsed time
      const today = new Date();
      today.setHours(hours, minutes, 0, 0);
      
      return today.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }
    
    // If we can't parse it, return the original string
    return timeString;
  } catch (error) {
    console.error('Error formatting time:', error, timeString);
    return timeString;
  }
};

const handleClockIn = async () => {
  setIsLoading(true);
  setMessage(null);
  try {
    const data: Record<string, unknown> = {
      ip_address: ipAddress,
      location: location || 'Office',
    };
    
    // For admin users, include staff_member_id if selected
    if (isAdminUser && selectedStaff) {
      data.staff_member_id = Number(selectedStaff);
    }
    
    console.log('Clock In Data:', data); // Debug
    
    const response = await attendanceService.clockIn(data);
    console.log('Clock In Response:', response.data); // Debug
    
    // Immediately update the status
    setCurrentStatus(response.data.data);
    setMessage({ type: 'success', text: 'Successfully clocked in!' });
    showAlert('success', 'Success!', 'Successfully clocked in!', 2000);
    
    // Optionally refetch status after a short delay
    setTimeout(() => {
      fetchCurrentStatus();
    }, 500);
    
  } catch (err: unknown) {
    const errorMessage = getErrorMessage(err, 'Failed to clock in');
    console.error('Clock In Error:', err); // Debug
    setMessage({ type: 'error', text: errorMessage });
    showAlert('error', 'Error', errorMessage);
  } finally {
    setIsLoading(false);
  }
};

const handleClockOut = async () => {
  setIsLoading(true);
  setMessage(null);
  try {
    const data: Record<string, unknown> = {
      ip_address: ipAddress,
      location: location || 'Office',
    };
    
    // For admin users, include staff_member_id if selected
    if (isAdminUser && selectedStaff) {
      data.staff_member_id = Number(selectedStaff);
    }
    
    console.log('Clock Out Data:', data); // Debug
    
    const response = await attendanceService.clockOut(data);
    console.log('Clock Out Response:', response.data); // Debug
    
    // Immediately update the status
    setCurrentStatus(response.data.data);
    setMessage({ type: 'success', text: 'Successfully clocked out!' });
    showAlert('success', 'Success!', 'Successfully clocked out!', 2000);
    
    // Optionally refetch status after a short delay
    setTimeout(() => {
      fetchCurrentStatus();
    }, 500);
    
  } catch (err: unknown) {
    const errorMessage = getErrorMessage(err, 'Failed to clock out');
    console.error('Clock Out Error:', err); // Debug
    setMessage({ type: 'error', text: errorMessage });
    showAlert('error', 'Error', errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  // Get current staff member name
  const getCurrentStaffName = () => {
    if (!selectedStaff) return '';
    
    // For non-admin users, show their own name
    if (!isAdminUser) {
      return currentUser?.name || 'You';
    }
    
    // For admin users, find the selected staff from the list
    const staffMember = staffMembers.find(s => s.id.toString() === selectedStaff);
    return staffMember?.full_name || 'Selected Staff';
  };

  // Get current staff member code
  const getCurrentStaffCode = () => {
    if (!selectedStaff) return '';
    
    if (!isAdminUser) {
      return currentUser?.staff_member_id ? `ID: ${currentUser.staff_member_id}` : '';
    }
    
    const staffMember = staffMembers.find(s => s.id.toString() === selectedStaff);
    return staffMember?.staff_code ? `Code: ${staffMember.staff_code}` : '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-solarized-base02">Clock In / Out</h1>
        <p className="text-solarized-base01">
          {isAdminUser 
            ? 'Record attendance for staff members' 
            : 'Record your attendance for today'}
        </p>
      </div>

      {/* Staff Selection for Admin Users */}
      {isAdminUser && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Staff Member
            </CardTitle>
            <CardDescription>
              Choose a staff member to clock in/out for them
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="staff_member">Employee</Label>
                <Select 
                  value={selectedStaff} 
                  onValueChange={setSelectedStaff}
                  disabled={isLoadingStaff}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      isLoadingStaff ? "Loading staff members..." : "Select employee"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id.toString()}>
                        {staff.full_name} {staff.staff_code ? `(${staff.staff_code})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  placeholder="e.g., Main Office, Home Office"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
            {/* {selectedStaff && (
              <div className="mt-4 p-3 bg-solarized-base3 rounded-lg">
                <p className="text-sm text-solarized-base01">Selected Staff:</p>
                <p className="font-medium text-lg">{getCurrentStaffName()}</p>
                {getCurrentStaffCode() && (
                  <p className="text-sm text-solarized-base01">{getCurrentStaffCode()}</p>
                )}
              </div>
            )} */}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-md">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">Current Time</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-5xl font-bold text-solarized-blue mb-2">
              {formatTime(currentTime)}
            </div>
            <div className="flex items-center justify-center gap-2 text-solarized-base01">
              <Calendar className="h-4 w-4" />
              {formatDate(currentTime)}
            </div>
            {ipAddress && (
              <div className="mt-2 text-sm text-solarized-base01">
                IP Address: {ipAddress}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">
              {isAdminUser ? 'Staff Status' : 'Your Status'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {isLoadingStatus ? (
              <div className="animate-pulse">
                <div className="h-8 bg-solarized-base01/10 rounded w-32 mx-auto mb-2"></div>
                <div className="h-4 bg-solarized-base01/10 rounded w-48 mx-auto"></div>
              </div>
            ) : currentStatus ? (
              <>
                <div className="flex justify-center">
                  <Badge
                    className={`text-lg px-4 py-2 ${
                      currentStatus.status === 'clocked_in'
                        ? 'bg-solarized-green/10 text-solarized-green'
                        : currentStatus.status === 'clocked_out'
                        ? 'bg-solarized-blue/10 text-solarized-blue'
                        : 'bg-solarized-base01/10 text-solarized-base01'
                    }`}
                  >
                    {currentStatus.status === 'clocked_in' && 'Clocked In'}
                    {currentStatus.status === 'clocked_out' && 'Clocked Out'}
                    {currentStatus.status === 'not_clocked_in' && 'Not Clocked In'}
                  </Badge>
                </div>
                {/* {currentStatus.clock_in && (
                  <p className="text-solarized-base01">
                    Clocked in at: <strong>{formatTimeString(currentStatus.clock_in)}</strong>
                  </p>
                )}
                {currentStatus.clock_out && (
                  <p className="text-solarized-base01">
                    Clocked out at: <strong>{formatTimeString(currentStatus.clock_out)}</strong>
                  </p>
                )}
                {currentStatus.total_hours !== null && currentStatus.total_hours > 0 && (
                  <p className="text-solarized-base01">
                    Total hours today: <strong>{currentStatus.total_hours.toFixed(2)}h</strong>
                  </p>
                )} */}
              </>
            ) : (
              <p className="text-solarized-base01">
                {isAdminUser ? 'Select a staff member to view status' : 'Loading status...'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            {isAdminUser 
              ? `Clock in/out for ${getCurrentStaffName() || 'selected staff member'}`
              : 'Use the buttons below to record your attendance for today.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleClockIn}
              disabled={isLoading || !selectedStaff || (currentStatus?.status === 'clocked_in')}
              className="flex-1 h-16 text-lg bg-solarized-green hover:bg-solarized-green/90"
            >
              <LogIn className="mr-2 h-6 w-6" />
              {isAdminUser ? 'Clock In Staff' : 'Clock In'}
            </Button>
            <Button
              onClick={handleClockOut}
              disabled={isLoading || !selectedStaff || (currentStatus?.status !== 'clocked_in')}
              variant="outline"
              className="flex-1 h-16 text-lg border-solarized-red text-solarized-red hover:bg-solarized-red/10"
            >
              <LogOut className="mr-2 h-6 w-6" />
              {isAdminUser ? 'Clock Out Staff' : 'Clock Out'}
            </Button>
          </div>
          {!selectedStaff && isAdminUser && (
            <p className="text-sm text-solarized-red mt-2">
              Please select a staff member to enable clock in/out
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Today's Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center p-4 bg-solarized-base3 rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-solarized-blue" />
              <p className="text-sm text-solarized-base01">Clock In</p>
              <p className="font-semibold">{formatTimeString(currentStatus?.clock_in) || '--:--'}</p>
            </div>
            <div className="text-center p-4 bg-solarized-base3 rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-solarized-red" />
              <p className="text-sm text-solarized-base01">Clock Out</p>
              <p className="font-semibold">{formatTimeString(currentStatus?.clock_out) || '--:--'}</p>
            </div>
            <div className="text-center p-4 bg-solarized-base3 rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-solarized-green" />
              <p className="text-sm text-solarized-base01">Total Hours</p>
              <p className="font-semibold">{currentStatus?.total_hours?.toFixed(2) || '0.00'}h</p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
