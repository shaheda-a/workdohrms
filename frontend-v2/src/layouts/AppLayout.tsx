import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  DollarSign,
  Briefcase,
  Target,
  Package,
  GraduationCap,
  FileText,
  Video,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  User,
  Building2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
  children?: { name: string; href: string; permission?: string }[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    name: 'Staff',
    href: '/staff',
    icon: Users,
    permission: 'view_staff',
    children: [
      { name: 'All Staff', href: '/staff', permission: 'view_staff' },
      { name: 'Add Staff', href: '/staff/create', permission: 'create_staff' },
      { name: 'Departments', href: '/staff/departments', permission: 'view_settings' },
    ]
  },
  {
    name: 'Documents',
    href: '/documents',
    icon: FileText,
    children: [
      { name: 'Document Types', href: '/documents/types' },
      // { name: 'Document Locations', href: '/documents/locations' },
      // { name: 'All Documents', href: '/documents' },
    ]
  },
  {
    name: 'Organizations',
    href: '/organizations',
    icon: Building2,
    permission: 'manage_settings',
  },
  {
    name: 'Companies',
    href: '/companies',
    icon: Building2,
    permission: 'manage_settings',
  },
  {
    name: 'Attendance',
    href: '/attendance',
    icon: Clock,
    permission: 'view_attendance',
    children: [
      { name: 'Clock In/Out', href: '/attendance/clock' },
      { name: 'Work Logs', href: '/attendance/logs', permission: 'view_attendance' },
      { name: 'Summary', href: '/attendance/summary', permission: 'view_attendance' },
      { name: 'Shifts', href: '/attendance/shifts', permission: 'edit_attendance' },
    ]
  },
  {
    name: 'Leave',
    href: '/leave',
    icon: Calendar,
    permission: 'view_time_off',
    children: [
      { name: 'My Requests', href: '/leave/requests' },
      { name: 'Apply Leave', href: '/leave/apply', permission: 'create_time_off' },
      { name: 'Approvals', href: '/leave/approvals', permission: 'approve_time_off' },
      { name: 'Balances', href: '/leave/balances', permission: 'view_time_off' },
      { name: 'Categories', href: '/leave/categories', permission: 'edit_time_off' },
    ]
  },
  {
    name: 'Payroll',
    href: '/payroll',
    icon: DollarSign,
    permission: 'view_payslips',
    children: [
      { name: 'Salary Slips', href: '/payroll/slips', permission: 'view_payslips' },
      { name: 'Generate Payroll', href: '/payroll/generate', permission: 'generate_payslips' },
      { name: 'Benefit Types', href: '/payroll/benefits/types', permission: 'edit_payslips' },
      { name: 'Benefits', href: '/payroll/benefits', permission: 'edit_payslips' },
      { name: 'Deduction Types', href: '/payroll/deductions/types', permission: 'edit_payslips' },
      { name: 'Deductions', href: '/payroll/deductions', permission: 'edit_payslips' },
      { name: 'Tax Slabs', href: '/payroll/tax', permission: 'edit_payslips' },
    ]
  },
  {
    name: 'Recruitment',
    href: '/recruitment',
    icon: Briefcase,
    permission: 'view_recruitment',
    children: [
      { name: 'Job Categories', href: '/recruitment/job/categories', permission: 'view_recruitment' },
      { name: 'Jobs', href: '/recruitment/jobs', permission: 'view_recruitment' },
      { name: 'Candidates', href: '/recruitment/candidates', permission: 'view_recruitment' },
      { name: 'Job Stages', href: '/recruitment/job/stages', permission: 'view_recruitment' },
      { name: 'Applications', href: '/recruitment/applications', permission: 'view_recruitment' },
      { name: 'Interviews', href: '/recruitment/interviews', permission: 'view_recruitment' },
    ]
  },
  {
    name: 'Performance',
    href: '/performance',
    icon: Target,
    permission: 'view_staff_performance',
    children: [
      { name: 'Goals', href: '/performance/goals', permission: 'view_staff_performance' },
      // { name: 'KPIs', href: '/performance/kpis', permission: 'view_staff_performance' },
      { name: 'Appraisals', href: '/performance/appraisals', permission: 'view_staff_performance' },
      { name: 'Competencies', href: '/performance/competencies', permission: 'view_staff_performance' },
    ]
  },
  {
    name: 'Assets',
    href: '/assets',
    icon: Package,
    permission: 'view_staff_assets',
    children: [
      { name: 'All Assets', href: '/assets', permission: 'view_staff_assets' },
      { name: 'Asset Types', href: '/assets/types', permission: 'manage_staff_assets' },
      { name: 'Assignments', href: '/assets/assignments', permission: 'manage_staff_assets' },
    ]
  },
  {
    name: 'Training',
    href: '/training',
    icon: GraduationCap,
    permission: 'view_staff_training',
    children: [
      { name: 'Programs', href: '/training/programs', permission: 'view_staff_training' },
      { name: 'Training Types', href: '/training/types', permission: 'view_staff_training' },
      { name: 'Enrollments', href: '/training/enrollments', permission: 'manage_staff_training' },
    ]
  },
  {
    name: 'Contracts',
    href: '/contracts',
    icon: FileText,
    permission: 'view_staff_contracts',
  },
  {
    name: 'Meetings',
    href: '/meetings',
    icon: Video,
    children: [
      { name: 'All Meetings', href: '/meetings' },
      { name: 'Meeting Types', href: '/meetings/types' },
      { name: 'Meeting Rooms', href: '/meetings/rooms' },
    ]
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
    permission: 'view_reports',
    children: [
      { name: 'Attendance Report', href: '/reports/attendance', permission: 'view_reports' },
      { name: 'Leave Report', href: '/reports/leave', permission: 'view_reports' },
      { name: 'Payroll Report', href: '/reports/payroll', permission: 'view_reports' },
      { name: 'Headcount', href: '/reports/headcount', permission: 'view_reports' },
      { name: 'Turnover', href: '/reports/turnover', permission: 'view_reports' },
    ]
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    permission: 'view_settings',
    children: [
      { name: 'Office Locations', href: '/settings/locations', permission: 'view_settings' },
      { name: 'Divisions', href: '/settings/divisions', permission: 'view_settings' },
      { name: 'Job Titles', href: '/settings/job-titles', permission: 'view_settings' },
      { name: 'Holidays', href: '/settings/holidays', permission: 'view_settings' },
      { name: 'File Categories', href: '/settings/file-categories', permission: 'view_settings' },
      { name: 'Notices', href: '/settings/notices', permission: 'view_settings' },
      { name: 'Document Configuration', href: '/settings/document-config', permission: 'view_settings' },
    ]
  },
  {
    name: 'Admin',
    href: '/admin',
    icon: Shield,
    permission: 'view_roles',
    children: [
      { name: 'Users', href: '/admin/users', permission: 'view_roles' },
      { name: 'Roles', href: '/admin/roles', permission: 'view_roles' },
      { name: 'Permissions', href: '/admin/permissions', permission: 'view_roles' },
    ]
  },
];

function NavItemComponent({ item, isCollapsed }: { item: NavItem; isCollapsed: boolean }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
  const Icon = item.icon;

  if (item.children && !isCollapsed) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive
            ? 'bg-solarized-blue/10 text-solarized-blue'
            : 'text-solarized-base01 hover:bg-solarized-base2 hover:text-solarized-base02'
            }`}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5" />
            <span>{item.name}</span>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="ml-8 space-y-1">
            {item.children.map((child) => (
              <Link
                key={child.href}
                to={child.href}
                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${location.pathname === child.href
                  ? 'bg-solarized-blue/10 text-solarized-blue'
                  : 'text-solarized-base01 hover:bg-solarized-base2 hover:text-solarized-base02'
                  }`}
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.href}
      className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive
        ? 'bg-solarized-blue/10 text-solarized-blue'
        : 'text-solarized-base01 hover:bg-solarized-base2 hover:text-solarized-base02'
        }`}
      title={isCollapsed ? item.name : undefined}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {!isCollapsed && <span>{item.name}</span>}
    </Link>
  );
}

export default function AppLayout() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-solarized-base3">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-white border-r border-solarized-base2 transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-solarized-base2">
            {!sidebarCollapsed && (
              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-solarized-blue rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">HR</span>
                </div>
                <span className="font-semibold text-solarized-base02">WorkDo HRMS</span>
              </Link>
            )}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-solarized-base2"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:block p-2 rounded-lg hover:bg-solarized-base2"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navigation.filter(item => {
              // Filter based on permission requirements
              if (item.permission && !hasPermission(item.permission)) {
                return false;
              }
              return true;
            }).map((item) => {
              // Also filter children based on permissions
              const filteredItem = item.children ? {
                ...item,
                children: item.children.filter(child => 
                  !child.permission || hasPermission(child.permission)
                )
              } : item;
              // Only show parent if it has visible children or no children
              if (filteredItem.children && filteredItem.children.length === 0) {
                return null;
              }
              return <NavItemComponent key={item.href} item={filteredItem} isCollapsed={sidebarCollapsed} />;
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-solarized-base2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-solarized-red hover:bg-solarized-red/10 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-solarized-base2">
          <div className="flex items-center justify-between h-full px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-solarized-base2"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-solarized-base01" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-solarized-red rounded-full" />
              </Button>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-solarized-cyan rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-solarized-base02">
                      {user?.name}
                    </span>
                    <ChevronDown className="h-4 w-4 text-solarized-base01" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-solarized-base01">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-solarized-red">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
