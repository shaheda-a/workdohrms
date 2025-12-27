import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { ScrollArea } from '../components/ui/scroll-area';
import { cn } from '../lib/utils';
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  DollarSign,
  Briefcase,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Menu,
  FileText,
  BarChart3,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  children?: { title: string; href: string }[];
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Staff', href: '/staff', icon: Users },
  {
    title: 'Attendance',
    href: '/attendance',
    icon: Clock,
    children: [
      { title: 'Clock In/Out', href: '/attendance/clock' },
      { title: 'Work Logs', href: '/attendance/logs' },
      { title: 'Regularization', href: '/attendance/regularization' },
    ],
  },
  {
    title: 'Leave',
    href: '/leave',
    icon: Calendar,
    children: [
      { title: 'Requests', href: '/leave/requests' },
      { title: 'Categories', href: '/leave/categories' },
      { title: 'Approvals', href: '/leave/approvals' },
    ],
  },
  {
    title: 'Payroll',
    href: '/payroll',
    icon: DollarSign,
    children: [
      { title: 'Salary Slips', href: '/payroll/slips' },
      { title: 'Generate', href: '/payroll/generate' },
      { title: 'Tax Slabs', href: '/payroll/tax' },
    ],
  },
  {
    title: 'Recruitment',
    href: '/recruitment',
    icon: Briefcase,
    children: [
      { title: 'Jobs', href: '/recruitment/jobs' },
      { title: 'Candidates', href: '/recruitment/candidates' },
      { title: 'Applications', href: '/recruitment/applications' },
    ],
  },
  { title: 'Reports', href: '/reports', icon: BarChart3 },
  { title: 'Documents', href: '/documents', icon: FileText },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    children: [
      { title: 'Office Locations', href: '/settings/locations' },
      { title: 'Divisions', href: '/settings/divisions' },
      { title: 'Job Titles', href: '/settings/job-titles' },
      { title: 'Holidays', href: '/settings/holidays' },
      { title: 'Shifts', href: '/settings/shifts' },
    ],
  },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center h-16 px-4 border-b border-solarized-base2">
        <div className="w-8 h-8 bg-solarized-blue rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">HR</span>
        </div>
        {!collapsed && (
          <span className="ml-3 text-lg font-semibold text-solarized-base02">WorkDo HRMS</span>
        )}
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="px-2 space-y-1">
          {navItems.map((item) => (
            <div key={item.title}>
              {item.children ? (
                <>
                  <button
                    onClick={() => toggleExpanded(item.title)}
                    className={cn(
                      'w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive(item.href)
                        ? 'bg-solarized-blue/10 text-solarized-blue'
                        : 'text-solarized-base01 hover:bg-solarized-base2 hover:text-solarized-base02'
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="ml-3 flex-1 text-left">{item.title}</span>
                        <ChevronRight
                          className={cn(
                            'h-4 w-4 transition-transform',
                            expandedItems.includes(item.title) && 'rotate-90'
                          )}
                        />
                      </>
                    )}
                  </button>
                  {!collapsed && expandedItems.includes(item.title) && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          to={child.href}
                          className={cn(
                            'block px-3 py-2 rounded-lg text-sm transition-colors',
                            isActive(child.href)
                              ? 'bg-solarized-blue/10 text-solarized-blue'
                              : 'text-solarized-base01 hover:bg-solarized-base2 hover:text-solarized-base02'
                          )}
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-solarized-blue/10 text-solarized-blue'
                      : 'text-solarized-base01 hover:bg-solarized-base2 hover:text-solarized-base02'
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="ml-3">{item.title}</span>}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-solarized-base2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-solarized-base01 hover:text-solarized-base02 hover:bg-solarized-base2"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-solarized-base3">
      {/* Mobile sidebar backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-white border-r border-solarized-base2 transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div
        className={cn(
          'transition-all duration-300',
          collapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-solarized-base2">
          <div className="flex items-center justify-between h-full px-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-solarized-base01 hover:text-solarized-base02"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-solarized-base01 hover:text-solarized-base02">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-solarized-cyan text-white">
                      {user?.name ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">{user?.name || 'User'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.name}</span>
                    <span className="text-xs text-solarized-base01">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-solarized-red focus:text-solarized-red"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
