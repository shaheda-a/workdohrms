import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { dashboardApi } from '../../api';
import { DashboardData } from '../../types';
import { Users, UserCheck, UserX, Clock, Calendar, DollarSign, TrendingUp, Briefcase } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

// Solarized-inspired colors for charts
const COLORS = ['#268bd2', '#859900', '#b58900', '#dc322f', '#6c71c4', '#d33682'];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [employeeGrowth, setEmployeeGrowth] = useState<{ month: string; count: number }[]>([]);
  const [departmentDist, setDepartmentDist] = useState<{ name: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, growthRes, deptRes] = await Promise.all([
          dashboardApi.getDashboard(),
          dashboardApi.getEmployeeGrowth(),
          dashboardApi.getDepartmentDistribution(),
        ]);

        if (dashboardRes.success) setData(dashboardRes.data);
        if (growthRes.success) setEmployeeGrowth(growthRes.data);
        if (deptRes.success) setDepartmentDist(deptRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      title: 'Total Employees',
      value: data?.employees.total || 0,
      icon: Users,
      color: 'text-solarized-blue',
      bgColor: 'bg-solarized-blue/10',
    },
    {
      title: 'Active Employees',
      value: data?.employees.active || 0,
      icon: UserCheck,
      color: 'text-solarized-green',
      bgColor: 'bg-solarized-green/10',
    },
    {
      title: 'On Leave Today',
      value: data?.attendance.on_leave_today || 0,
      icon: Calendar,
      color: 'text-solarized-yellow',
      bgColor: 'bg-solarized-yellow/10',
    },
    {
      title: 'Present Today',
      value: data?.attendance.present_today || 0,
      icon: Clock,
      color: 'text-solarized-violet',
      bgColor: 'bg-solarized-violet/10',
    },
    {
      title: 'Pending Leave Requests',
      value: data?.leave.pending_requests || 0,
      icon: UserX,
      color: 'text-solarized-red',
      bgColor: 'bg-solarized-red/10',
    },
    {
      title: 'New This Month',
      value: data?.employees.new_this_month || 0,
      icon: TrendingUp,
      color: 'text-solarized-cyan',
      bgColor: 'bg-solarized-cyan/10',
    },
  ];

  const attendanceData = [
    { name: 'Present', value: data?.attendance.present_today || 0 },
    { name: 'Absent', value: data?.attendance.absent_today || 0 },
    { name: 'Late', value: data?.attendance.late_today || 0 },
    { name: 'On Leave', value: data?.attendance.on_leave_today || 0 },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solarized-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-solarized-base02">Dashboard</h1>
        <p className="text-solarized-base01">Welcome to WorkDo HRMS</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-white border-solarized-base2 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-solarized-base02">{stat.value}</p>
                  <p className="text-xs text-solarized-base01">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Growth Chart */}
        <Card className="bg-white border-solarized-base2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-solarized-base02 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-solarized-blue" />
              Employee Growth
            </CardTitle>
            <CardDescription className="text-solarized-base01">
              Monthly employee count trend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={employeeGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee8d5" />
                  <XAxis dataKey="month" stroke="#586e75" fontSize={12} />
                  <YAxis stroke="#586e75" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fdf6e3',
                      border: '1px solid #eee8d5',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#073642' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#268bd2"
                    strokeWidth={2}
                    dot={{ fill: '#268bd2' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Today's Attendance Chart */}
        <Card className="bg-white border-solarized-base2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-solarized-base02 flex items-center gap-2">
              <Clock className="h-5 w-5 text-solarized-blue" />
              Today's Attendance
            </CardTitle>
            <CardDescription className="text-solarized-base01">
              Attendance breakdown for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {attendanceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fdf6e3',
                      border: '1px solid #eee8d5',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Distribution */}
      <Card className="bg-white border-solarized-base2 shadow-sm">
        <CardHeader>
          <CardTitle className="text-solarized-base02 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-solarized-blue" />
            Department Distribution
          </CardTitle>
          <CardDescription className="text-solarized-base01">
            Employee count by department
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee8d5" />
                <XAxis dataKey="name" stroke="#586e75" fontSize={12} />
                <YAxis stroke="#586e75" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fdf6e3',
                    border: '1px solid #eee8d5',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#073642' }}
                />
                <Bar dataKey="count" fill="#268bd2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-solarized-base2 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-solarized-blue/10">
              <Users className="h-6 w-6 text-solarized-blue" />
            </div>
            <div>
              <p className="font-medium text-solarized-base02">Add Employee</p>
              <p className="text-sm text-solarized-base01">Create new staff member</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-solarized-base2 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-solarized-green/10">
              <Clock className="h-6 w-6 text-solarized-green" />
            </div>
            <div>
              <p className="font-medium text-solarized-base02">Clock In/Out</p>
              <p className="text-sm text-solarized-base01">Record attendance</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-solarized-base2 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-solarized-yellow/10">
              <Calendar className="h-6 w-6 text-solarized-yellow" />
            </div>
            <div>
              <p className="font-medium text-solarized-base02">Apply Leave</p>
              <p className="text-sm text-solarized-base01">Submit leave request</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-solarized-base2 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-solarized-violet/10">
              <DollarSign className="h-6 w-6 text-solarized-violet" />
            </div>
            <div>
              <p className="font-medium text-solarized-base02">View Payslip</p>
              <p className="text-sm text-solarized-base01">Check salary details</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
