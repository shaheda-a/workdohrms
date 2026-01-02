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
  children?: { name: string; href: string }[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    name: 'Staff',
    href: '/staff',
    icon: Users,
    children: [
      { name: 'All Staff', href: '/staff' },
      { name: 'Add Staff', href: '/staff/create' },
      { name: 'Departments', href: '/staff/departments' },
    ]
  },
  {
    name: 'Documents',
    href: '/documents',
    icon: FileText,
    children: [
      { name: 'Document Types', href: '/documents/types' },
      { name: 'Document Locations', href: '/documents/locations' },
      { name: 'All Documents', href: '/documents' },
    ]
  },
  {
    name: 'Organizations',
    href: '/organizations',
    icon: Building2,
  },
  {
    name: 'Companies',
    href: '/companies',
    icon: Building2, // Reusing Building2 for now, or find another icon like Briefcase if imported
  },
  {
    name: 'Attendance',
    href: '/attendance',
    icon: Clock,
    children: [
      { name: 'Clock In/Out', href: '/attendance/clock' },
      { name: 'Work Logs', href: '/attendance/logs' },
      { name: 'Summary', href: '/attendance/summary' },
      { name: 'Shifts', href: '/attendance/shifts' },
    ]
  },
  {
    name: 'Leave',
    href: '/leave',
    icon: Calendar,
    children: [
      { name: 'My Requests', href: '/leave/requests' },
      { name: 'Apply Leave', href: '/leave/apply' },
      { name: 'Approvals', href: '/leave/approvals' },
      { name: 'Balances', href: '/leave/balances' },
      { name: 'Categories', href: '/leave/categories' },
    ]
  },
  {
    name: 'Payroll',
    href: '/payroll',
    icon: DollarSign,
    children: [
      { name: 'Salary Slips', href: '/payroll/slips' },
      { name: 'Generate Payroll', href: '/payroll/generate' },
      { name: 'Benefit Types', href: '/payroll/benefits/types' },
      { name: 'Benefits', href: '/payroll/benefits' },
      { name: 'Deduction Types', href: '/payroll/deductions/types' },
      { name: 'Deductions', href: '/payroll/deductions' },
      { name: 'Tax Slabs', href: '/payroll/tax' },
    ]
  },
  {
    name: 'Recruitment',
    href: '/recruitment',
    icon: Briefcase,
    children: [
      { name: 'Job Categories', href: '/recruitment/job/categories' },
      { name: 'Jobs', href: '/recruitment/jobs' },
      { name: 'Candidates', href: '/recruitment/candidates' },
      { name: 'Job Stages', href: '/recruitment/job/stages' },
      { name: 'Applications', href: '/recruitment/applications' },
      { name: 'Interviews', href: '/recruitment/interviews' },
    ]
  },
  {
    name: 'Performance',
    href: '/performance',
    icon: Target,
    children: [
      { name: 'Goals', href: '/performance/goals' },
      // { name: 'KPIs', href: '/performance/kpis' },
      { name: 'Appraisals', href: '/performance/appraisals' },
      { name: 'Competencies', href: '/performance/competencies' },
    ]
  },
  {
    name: 'Assets',
    href: '/assets',
    icon: Package,
    children: [
      { name: 'All Assets', href: '/assets' },
      { name: 'Asset Types', href: '/assets/types' },
      { name: 'Assignments', href: '/assets/assignments' },
    ]
  },
  {
    name: 'Training',
    href: '/training',
    icon: GraduationCap,
    children: [
      { name: 'Programs', href: '/training/programs' },
      { name: 'Enrollments', href: '/training/enrollments' },
    ]
  },
  {
    name: 'Contracts',
    href: '/contracts',
    icon: FileText,
  },
  {
    name: 'Meetings',
    href: '/meetings',
    icon: Video,
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
    children: [
      { name: 'Attendance Report', href: '/reports/attendance' },
      { name: 'Leave Report', href: '/reports/leave' },
      { name: 'Payroll Report', href: '/reports/payroll' },
      { name: 'Headcount', href: '/reports/headcount' },
      { name: 'Turnover', href: '/reports/turnover' },
    ]
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    children: [
      { name: 'Office Locations', href: '/settings/locations' },
      { name: 'Divisions', href: '/settings/divisions' },
      { name: 'Job Titles', href: '/settings/job-titles' },
      { name: 'Holidays', href: '/settings/holidays' },
      { name: 'File Categories', href: '/settings/file-categories' },
      { name: 'Notices', href: '/settings/notices' },
      { name: 'Document Configuration', href: '/settings/document-config' },
    ]
  },
  {
    name: 'Admin',
    href: '/admin',
    icon: Shield,
    children: [
      { name: 'Users', href: '/admin/users' },
      { name: 'Roles', href: '/admin/roles' },
      { name: 'Permissions', href: '/admin/permissions' },
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
  const { user, logout } = useAuth();
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
              if (item.name === 'Organizations' || item.name === 'Companies') {
                return user?.role === 'administrator' || user?.role === 'Administrator'; // Checking both just in case, though usually lowercase in backend
              }
              return true;
            }).map((item) => (
              <NavItemComponent key={item.href} item={item} isCollapsed={sidebarCollapsed} />
            ))}
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
