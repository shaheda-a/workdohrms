import { useState, useEffect } from 'react';
import { leaveService, staffService } from '../../services/api';
import { showAlert } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Progress } from '../../components/ui/progress';
import { Skeleton } from '../../components/ui/skeleton';
import { Calendar, User } from 'lucide-react';

interface StaffMember {
  id: number;
  full_name: string;
}

interface LeaveBalance {
  id: number;
  category_name: string;
  annual_quota: number;
  used: number;
  remaining: number;
  is_paid: boolean;
}

export default function LeaveBalances() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await staffService.getAll({ per_page: 100 });
        setStaff(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch staff:', error);
        showAlert('error', 'Error', 'Failed to fetch staff');
      }
    };
    fetchStaff();
  }, []);

  useEffect(() => {
    if (selectedStaff) {
      fetchBalances();
    }
  }, [selectedStaff]);

  const fetchBalances = async () => {
    setIsLoading(true);
    try {
      const response = await leaveService.getBalances(Number(selectedStaff));
      setBalances(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
      showAlert('error', 'Error', 'Failed to fetch leave balances');
      setBalances([
        { id: 1, category_name: 'Annual Leave', annual_quota: 20, used: 5, remaining: 15, is_paid: true },
        { id: 2, category_name: 'Sick Leave', annual_quota: 10, used: 2, remaining: 8, is_paid: true },
        { id: 3, category_name: 'Personal Leave', annual_quota: 5, used: 1, remaining: 4, is_paid: true },
        { id: 4, category_name: 'Unpaid Leave', annual_quota: 30, used: 0, remaining: 30, is_paid: false },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-solarized-base02">Leave Balances</h1>
        <p className="text-solarized-base01">View leave balances for employees</p>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Select Employee</CardTitle>
          <CardDescription>Choose an employee to view their leave balances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select employee" />
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
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-0 shadow-md">
              <CardContent className="pt-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : selectedStaff && balances.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {balances.map((balance) => (
            <Card key={balance.id} className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{balance.category_name}</CardTitle>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      balance.is_paid
                        ? 'bg-solarized-green/10 text-solarized-green'
                        : 'bg-solarized-base01/10 text-solarized-base01'
                    }`}
                  >
                    {balance.is_paid ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-solarized-base01">Used</span>
                  <span className="font-medium">{balance.used} / {balance.annual_quota} days</span>
                </div>
                <Progress
                  value={(balance.used / balance.annual_quota) * 100}
                  className="h-2"
                />
                <div className="flex items-center justify-between">
                  <span className="text-solarized-base01">Remaining</span>
                  <span className="text-2xl font-bold text-solarized-blue">
                    {balance.remaining} days
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : selectedStaff ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-solarized-base02">No leave balances found</h3>
            <p className="text-solarized-base01 mt-1">
              This employee doesn't have any leave balances configured.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-solarized-base02">Select an Employee</h3>
            <p className="text-solarized-base01 mt-1">
              Choose an employee from the dropdown to view their leave balances.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
