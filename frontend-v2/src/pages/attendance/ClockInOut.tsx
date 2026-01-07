import { useState, useEffect } from 'react';
import { attendanceService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { showAlert, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Clock, LogIn, LogOut, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

export default function ClockInOut() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleClockIn = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      await attendanceService.clockIn();
      setClockedIn(true);
      setClockInTime(formatTime(new Date()));
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
      await attendanceService.clockOut();
      setClockedIn(false);
      setClockInTime(null);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-solarized-base02">Clock In / Out</h1>
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
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">Your Status</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex justify-center">
              <Badge
                className={`text-lg px-4 py-2 ${
                  clockedIn
                    ? 'bg-solarized-green/10 text-solarized-green'
                    : 'bg-solarized-base01/10 text-solarized-base01'
                }`}
              >
                {clockedIn ? 'Clocked In' : 'Not Clocked In'}
              </Badge>
            </div>
            {clockInTime && (
              <p className="text-solarized-base01">
                Clocked in at: <strong>{clockInTime}</strong>
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
            Hello, {user?.name}! Use the buttons below to record your attendance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleClockIn}
              disabled={isLoading || clockedIn}
              className="flex-1 h-16 text-lg bg-solarized-green hover:bg-solarized-green/90"
            >
              <LogIn className="mr-2 h-6 w-6" />
              Clock In
            </Button>
            <Button
              onClick={handleClockOut}
              disabled={isLoading || !clockedIn}
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
              <p className="font-semibold">{clockInTime || '--:--'}</p>
            </div>
            <div className="text-center p-4 bg-solarized-base3 rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-solarized-red" />
              <p className="text-sm text-solarized-base01">Clock Out</p>
              <p className="font-semibold">--:--</p>
            </div>
            <div className="text-center p-4 bg-solarized-base3 rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-solarized-green" />
              <p className="text-sm text-solarized-base01">Total Hours</p>
              <p className="font-semibold">0h 0m</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
