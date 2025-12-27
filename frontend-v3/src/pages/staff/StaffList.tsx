import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { staffApi, settingsApi } from '../../api';
import { StaffMember, OfficeLocation, Division } from '../../types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Plus, Search, Eye, Edit, Trash2, Users } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';

export default function StaffList() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [locations, setLocations] = useState<OfficeLocation[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [divisionFilter, setDivisionFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchStaff = async () => {
    try {
      const params: Record<string, unknown> = { paginate: false };
      if (search) params.search = search;
      if (locationFilter) params.office_location_id = parseInt(locationFilter);
      if (divisionFilter) params.division_id = parseInt(divisionFilter);
      if (statusFilter) params.status = statusFilter;

      const response = await staffApi.getAll(params);
      if (response.success) {
        setStaff(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [locRes, divRes] = await Promise.all([
          settingsApi.getOfficeLocations(),
          settingsApi.getDivisions(),
        ]);
        if (locRes.success) setLocations(locRes.data);
        if (divRes.success) setDivisions(divRes.data);
      } catch (error) {
        console.error('Failed to fetch filters:', error);
      }
    };
    fetchFilters();
    fetchStaff();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchStaff();
    }, 300);
    return () => clearTimeout(debounce);
  }, [search, locationFilter, divisionFilter, statusFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await staffApi.delete(deleteId);
      setStaff(staff.filter((s) => s.id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error('Failed to delete staff:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      on_leave: 'secondary',
      suspended: 'destructive',
      terminated: 'destructive',
      resigned: 'outline',
    };
    return (
      <Badge variant={variants[status || 'active'] || 'default'}>
        {status?.replace('_', ' ') || 'Active'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Staff Members
          </h1>
          <p className="text-solarized-base01">Manage your organization's employees</p>
        </div>
        <Link to="/staff/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </Link>
      </div>

      <Card className="bg-white border-solarized-base2">
        <CardHeader>
          <CardTitle className="text-solarized-base02">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-solarized-base01" />
              <Input
                placeholder="Search by name, email, or staff code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="bg-solarized-base2 border-solarized-base2 text-solarized-base02">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent className="bg-white border-solarized-base2">
                <SelectItem value="">All Locations</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id.toString()}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={divisionFilter} onValueChange={setDivisionFilter}>
              <SelectTrigger className="bg-solarized-base2 border-solarized-base2 text-solarized-base02">
                <SelectValue placeholder="All Divisions" />
              </SelectTrigger>
              <SelectContent className="bg-white border-solarized-base2">
                <SelectItem value="">All Divisions</SelectItem>
                {divisions.map((div) => (
                  <SelectItem key={div.id} value={div.id.toString()}>
                    {div.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-solarized-base2 border-solarized-base2 text-solarized-base02">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-solarized-base2">
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
                <SelectItem value="resigned">Resigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-solarized-base2">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solarized-blue"></div>
            </div>
          ) : staff.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-solarized-base01">
              <Users className="h-12 w-12 mb-4" />
              <p>No staff members found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-solarized-base2 hover:bg-solarized-base2">
                  <TableHead className="text-solarized-base01">Employee</TableHead>
                  <TableHead className="text-solarized-base01">Staff Code</TableHead>
                  <TableHead className="text-solarized-base01">Location</TableHead>
                  <TableHead className="text-solarized-base01">Division</TableHead>
                  <TableHead className="text-solarized-base01">Job Title</TableHead>
                  <TableHead className="text-solarized-base01">Status</TableHead>
                  <TableHead className="text-solarized-base01 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id} className="border-solarized-base2 hover:bg-solarized-base2">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {getInitials(member.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-solarized-base02">{member.full_name}</p>
                          <p className="text-sm text-solarized-base01">{member.user?.email || member.personal_email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-solarized-base01">{member.staff_code}</TableCell>
                    <TableCell className="text-solarized-base01">{member.office_location?.name || '-'}</TableCell>
                    <TableCell className="text-solarized-base01">{member.division?.name || '-'}</TableCell>
                    <TableCell className="text-solarized-base01">{member.job_title?.name || '-'}</TableCell>
                    <TableCell>{getStatusBadge(member.employment_status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/staff/${member.id}`}>
                          <Button variant="ghost" size="icon" className="text-solarized-base01 hover:text-solarized-base02">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link to={`/staff/${member.id}/edit`}>
                          <Button variant="ghost" size="icon" className="text-solarized-base01 hover:text-solarized-base02">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-solarized-base01 hover:text-red-400"
                          onClick={() => setDeleteId(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white border-solarized-base2">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-solarized-base02">Deactivate Employee?</AlertDialogTitle>
            <AlertDialogDescription className="text-solarized-base01">
              This will deactivate the employee account. They will no longer be able to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-solarized-base2 text-solarized-base02 border-solarized-base2 hover:bg-solarized-base2">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
