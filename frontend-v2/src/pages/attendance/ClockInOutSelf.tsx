import { useState, useEffect } from 'react';
import { attendanceService } from '../../services/api';
import { showAlert, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Clock, LogIn, LogOut, CheckCircle, AlertCircle, Calendar, User } from 'lucide-react';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  staff_member_id: number | null;
}

interface CurrentStatus {
  status: string;
  clock_in: string | null;
  clock_out: string | null;
  total_hours: number | null;
}

export default function ClockInOutSelf() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [ipAddress, setIpAddress] = useState<string>('');
  const [location, setLocation] = useState<string>('');

  // Load user data from localStorage
  useEffect(() => {
    const loadUserData = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData: UserData = JSON.parse(userStr);
          setCurrentUser(userData);
          
          if (!userData.staff_member_id) {
            showAlert('error', 'Error', 'You are not linked to a staff member');
          }
        }
      } catch (error) {
        console.error('Failed to parse user data:', error);
        showAlert('error', 'Error', 'Failed to load user data');
      }
    };
    
    loadUserData();
    
    // Get IP address
    fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => setIpAddress(data.ip))
      .catch(() => setIpAddress('Unknown'));
  }, []);

  // Fetch current status
  useEffect(() => {
    const fetchCurrentStatus = async () => {
      if (!currentUser?.staff_member_id) return;
      
      setIsLoadingStatus(true);
      try {
        const response = await attendanceService.getCurrentStatusSelf();
        setCurrentStatus(response.data.data);
      } catch (error) {
        console.error('Failed to fetch current status:', error);
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
  }, [currentUser]);

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
      const data = {
        ip_address: ipAddress,
        location: location || 'Office',
      };
      
      const response = await attendanceService.clockInSelf(data);
      setCurrentStatus(response.data.data);
      setMessage({ type: 'success', text: 'Successfully clocked in!' });
      showAlert('success', 'Success!', 'Successfully clocked in!', 2000);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to clock in');
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
      const data = {
        ip_address: ipAddress,
        location: location || 'Office',
      };
      
      const response = await attendanceService.clockOutSelf(data);
      setCurrentStatus(response.data.data);
      setMessage({ type: 'success', text: 'Successfully clocked out!' });
      showAlert('success', 'Success!', 'Successfully clocked out!', 2000);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to clock out');
      setMessage({ type: 'error', text: errorMessage });
      showAlert('error', 'Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser?.staff_member_id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="h-16 w-16 text-solarized-red mb-4" />
        <h2 className="text-2xl font-bold text-solarized-base02 mb-2">Staff Member Not Found</h2>
        <p className="text-solarized-base01 text-center max-w-md">
          You are not linked to a staff member. Please contact your administrator to link your account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-solarized-base02">My Attendance</h1>
        <p className="text-solarized-base01">Record your attendance for today</p>
      </div>

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
            <CardTitle className="text-lg">Your Status</CardTitle>
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
              <p className="text-solarized-base01">Loading status...</p>
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
            Use the buttons below to record your attendance for today.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleClockIn}
              disabled={isLoading || (currentStatus?.status === 'clocked_in')}
              className="flex-1 h-16 text-lg bg-solarized-green hover:bg-solarized-green/90"
            >
              <LogIn className="mr-2 h-6 w-6" />
              Clock In
            </Button>
            <Button
              onClick={handleClockOut}
              disabled={isLoading || (currentStatus?.status !== 'clocked_in')}
              variant="outline"
              className="flex-1 h-16 text-lg border-solarized-red text-solarized-red hover:bg-solarized-red/10"
            >
              <LogOut className="mr-2 h-6 w-6" />
              Clock Out
            </Button>
          </div>
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