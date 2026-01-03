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
import { Button } from '@/components/ui/button';

interface StaffMember {
  id: number;
  full_name: string;
}

interface LeaveBalance {
  category_id: number;
  category_name: string;
  allocated: number;
  used: number;
  remaining: number;
}

export default function LeaveBalances() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
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
    fetchStaff();
  }, []);

  useEffect(() => {
    if (selectedStaff) {
      fetchBalances();
    } else {
      // Clear balances when no staff is selected
      setBalances([]);
    }
  }, [selectedStaff]);

  const fetchBalances = async () => {
    if (!selectedStaff) return;
    
    setIsLoading(true);
    try {
      const response = await leaveService.getBalances(Number(selectedStaff));
      
      // Log the response to debug
      console.log('Balance API Response:', response.data);
      
      // Check if response has data property
      if (response.data.success && response.data.data) {
        setBalances(response.data.data);
      } else {
        // Handle case where response format is different
        setBalances(response.data.data || response.data || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch balances:', error);
      
      // More detailed error message
      if (error.response?.data?.message) {
        showAlert('error', 'Error', error.response.data.message);
      } else {
        showAlert('error', 'Error', 'Failed to fetch leave balances');
      }
      
      // Set empty balances on error
      setBalances([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffChange = (value: string) => {
    setSelectedStaff(value);
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
            <Select 
              value={selectedStaff} 
              onValueChange={handleStaffChange}
              disabled={isLoadingStaff}
            >
              <SelectTrigger className="w-[300px]">
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
            
            {selectedStaff && (
              <Button 
                variant="outline" 
                onClick={fetchBalances}
                disabled={isLoading}
              >
                {isLoading ? "Refreshing..." : "Refresh"}
              </Button>
            )}
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
            <Card key={balance.category_id} className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{balance.category_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-solarized-base01">Used</span>
                  <span className="font-medium">
                    {balance.used} / {balance.allocated} days
                  </span>
                </div>
                <Progress
                  value={(balance.used / balance.allocated) * 100}
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