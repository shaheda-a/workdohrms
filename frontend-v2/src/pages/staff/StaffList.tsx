import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { staffService } from '../../services/api';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';

interface StaffMember {
  id: number;
  full_name: string;
  personal_email: string;
  work_email: string;
  phone_number: string;
job_title: { title: string } | null;
  division: { title: string } | null;
  office_location: { title: string } | null;
  employment_status: string;
  hire_date: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function StaffList() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchStaff();
  }, [page, search]);

    const fetchStaff = async () => {
      setIsLoading(true);
      try {
        const response = await staffService.getAll({ page, per_page: 10, search });
        // Handle paginated response: response.data.data is the paginator object
        // The actual array is in response.data.data.data for paginated responses
        const payload = response.data.data;
        if (Array.isArray(payload)) {
          // Non-paginated response
          setStaff(payload);
          setMeta(null);
        } else if (payload && Array.isArray(payload.data)) {
          // Paginated response - extract the array and meta from paginator
          setStaff(payload.data);
          setMeta({
            current_page: payload.current_page,
            last_page: payload.last_page,
            per_page: payload.per_page,
            total: payload.total,
          });
        } else {
          // Fallback to empty array if response is unexpected
          setStaff([]);
          setMeta(null);
        }
      } catch (error) {
        console.error('Failed to fetch staff:', error);
        showAlert('error', 'Error', 'Failed to fetch staff members');
        setStaff([]);
      } finally {
        setIsLoading(false);
      }
    };

  const handleDelete = async (id: number) => {
    const result = await showConfirmDialog(
      'Are you sure?',
      'You want to delete this staff member?'
    );

    if (!result.isConfirmed) return;

    try {
      await staffService.delete(id);
      showAlert('success', 'Deleted!', 'Staff member deleted successfully', 2000);
      fetchStaff();
    } catch (error: unknown) {
      console.error('Failed to delete staff:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to delete staff member'));
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-solarized-green/10 text-solarized-green',
      inactive: 'bg-solarized-base01/10 text-solarized-base01',
      terminated: 'bg-solarized-red/10 text-solarized-red',
      on_leave: 'bg-solarized-yellow/10 text-solarized-yellow',
    };
    return variants[status] || variants.inactive;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">Staff Members</h1>
          <p className="text-solarized-base01">Manage your organization's employees</p>
        </div>
        <Link to="/staff/create">
          <Button className="bg-solarized-blue hover:bg-solarized-blue/90">
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </Link>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-solarized-base01" />
              <Input
                placeholder="Search staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-solarized-base02">No staff members found</h3>
              <p className="text-solarized-base01 mt-1">Get started by adding your first employee.</p>
              <Link to="/staff/create">
                <Button className="mt-4 bg-solarized-blue hover:bg-solarized-blue/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Staff
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-solarized-blue/10 text-solarized-blue">
                                {getInitials(member.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-solarized-base02">{member.full_name}</p>
                              <p className="text-sm text-solarized-base01">
                                {member.work_email || member.personal_email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{member.job_title?.title || '-'}</TableCell>
                        <TableCell>{member.division?.title || '-'}</TableCell>
                        <TableCell>{member.office_location?.title || '-'}</TableCell>

                        <TableCell>
                          <Badge className={getStatusBadge(member.employment_status)}>
                            {member.employment_status?.replace('_', ' ') || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/staff/${member.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/staff/${member.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(member.id)}
                                className="text-solarized-red"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-solarized-base01">
                    Showing {(meta.current_page - 1) * meta.per_page + 1} to{' '}
                    {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total} results
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-solarized-base01">
                      Page {meta.current_page} of {meta.last_page}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === meta.last_page}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
