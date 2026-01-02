import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { staffService } from '../../services/api';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';

import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

import DataTable, { TableColumn } from 'react-data-table-component';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
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

export default function StaffList() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  // ================= FETCH STAFF =================
  const fetchStaff = useCallback(
    async (currentPage: number = 1) => {
      setIsLoading(true);
      try {
        const response = await staffService.getAll({
          page: currentPage,
          per_page: perPage,
          search,
        });

        const { data, meta } = response.data;

        if (Array.isArray(data)) {
          setStaff(data);
          setTotalRows(meta?.total ?? 0);
        } else {
          setStaff([]);
          setTotalRows(0);
        }
      } catch (error) {
        console.error('Failed to fetch staff:', error);
        showAlert('error', 'Error', getErrorMessage(error, 'Failed to fetch staff'));
        setStaff([]);
        setTotalRows(0);
      } finally {
        setIsLoading(false);
      }
    },
    [perPage, search]
  );

  useEffect(() => {
    fetchStaff(page);
  }, [page, fetchStaff]);

  // ================= SEARCH =================
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  // ================= PAGINATION =================
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // ================= DELETE =================
  const handleDelete = async (id: number) => {
    const result = await showConfirmDialog(
      'Are you sure?',
      'You want to delete this staff member?'
    );

    if (!result.isConfirmed) return;

    try {
      await staffService.delete(id);
      showAlert('success', 'Deleted!', 'Staff member deleted successfully', 2000);
      fetchStaff(page);
    } catch (error) {
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to delete staff'));
    }
  };

  // ================= HELPERS ============
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-solarized-green/10 text-solarized-green',
      inactive: 'bg-solarized-base01/10 text-solarized-base01',
      terminated: 'bg-solarized-red/10 text-solarized-red',
      on_leave: 'bg-solarized-yellow/10 text-solarized-yellow',
      resigned: 'bg-solarized-orange/10 text-solarized-orange',
    };
    return variants[status] || variants.inactive;
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  // ================= TABLE COLUMNS ====
  const columns: TableColumn<StaffMember>[] = [
    {
      name: 'Employee',
      cell: (row) => (
        <div className="flex items-center gap-3 py-2">
          <Avatar>
            <AvatarFallback className="bg-solarized-blue/10 text-solarized-blue">
              {getInitials(row.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.full_name}</p>
            <p className="text-sm text-muted-foreground">
              {row.work_email || row.personal_email || '-'}
            </p>
          </div>
        </div>
      ),
      sortable: true,
      minWidth: '250px',
    },
    {
      name: 'Job Title',
      selector: (row) => row.job_title?.title || '-',
      sortable: true,
    },
    {
      name: 'Department',
      selector: (row) => row.division?.title || '-',
      sortable: true,
    },
    {
      name: 'Location',
      selector: (row) => row.office_location?.title || '-',
      sortable: true,
    },
    {
      name: 'Status',
      cell: (row) => (
        <Badge className={getStatusBadge(row.employment_status)}>
          {row.employment_status?.replace('_', ' ') || 'Unknown'}
        </Badge>
      ),
      sortable: true,
    },
    {
      name: 'Actions',
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/staff/${row.id}`}>
                <Eye className="mr-2 h-4 w-4" /> View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/staff/${row.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(row.id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      ignoreRowClick: true,
      width: '80px',
    },
  ];

  // ================= UI =================
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Staff Members</h1>
          <p className="text-muted-foreground">Manage your organization employees</p>
        </div>
        <Link to="/staff/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Staff
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <form onSubmit={handleSearchSubmit} className="flex gap-4">
            <Input
              placeholder="Search staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit" variant="outline">
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
          </form>
        </CardHeader>

        <CardContent>
          {!isLoading && staff.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p>No staff members found</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={staff}
              progressPending={isLoading}
              pagination
              paginationServer
              paginationTotalRows={totalRows}
              paginationPerPage={perPage}
              paginationDefaultPage={page}
              onChangePage={handlePageChange}
              highlightOnHover
              responsive
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
