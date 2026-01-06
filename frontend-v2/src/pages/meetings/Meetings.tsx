import { useState, useEffect, useCallback } from 'react';
import { meetingService } from '../../services/api';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import {
  Card,
  CardContent,
  CardHeader,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Plus,
  Calendar,
  Clock,
  Users,
  Video,
  MapPin,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import DataTable, { TableColumn } from 'react-data-table-component';

/* =========================
   TYPES (MATCH API)
========================= */
interface Meeting {
  id: number;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  meeting_link?: string;

  meeting_type?: {
    id: number;
    title: string;
  };

  meeting_room?: {
    name: string;
    location: string;
  };

}

/* =========================
   COMPONENT
========================= */
export default function Meetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Creation State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [meetingTypes, setMeetingTypes] = useState<{ id: number; title: string }[]>([]);
  const [rooms, setRooms] = useState<{ id: number; name: string }[]>([]);


  const [formData, setFormData] = useState({
    title: '',
    meeting_type_id: '',
    meeting_room_id: '',
    date: '',
    start_time: '',
    end_time: '',
    description: '',
    meeting_link: '',
    attendee_ids: [] as number[],
  });

  // ================= FETCH FUNCTIONS =================
  const fetchMeetingData = useCallback(async () => {
    try {
      const [typesRes, roomsRes] = await Promise.all([
        meetingService.getTypes(),
        meetingService.getAvailableRooms(),
      ]);

      if (typesRes.data.success) setMeetingTypes(typesRes.data.data || []);
      if (roomsRes.data.success) setRooms(roomsRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch meeting metadata:', error);
    }
  }, []);

  const fetchMeetings = useCallback(
    async (currentPage: number = 1) => {
      setIsLoading(true);
      try {
        const params: Record<string, unknown> = {
          page: currentPage,
          per_page: perPage,
          search,
        };

        if (sortField) {
          params.order_by = sortField;
          params.order = sortDirection;
        }

        const response = await meetingService.getAll(params);
        const payload = response.data.data;

        if (Array.isArray(payload)) {
          setMeetings(payload);
          setTotalRows(response.data.meta?.total ?? payload.length);
        } else if (payload && Array.isArray(payload.data)) {
          setMeetings(payload.data);
          setTotalRows(payload.total);
        } else {
          setMeetings([]);
          setTotalRows(0);
        }
      } catch (error) {
        console.error('Failed to fetch meetings:', error);
        showAlert('error', 'Error', 'Failed to fetch meetings');
        setMeetings([]);
        setTotalRows(0);
      } finally {
        setIsLoading(false);
      }
    },
    [perPage, search, sortField, sortDirection]
  );

  useEffect(() => {
    fetchMeetings(page);
  }, [page, fetchMeetings]);

  useEffect(() => {
    fetchMeetingData();
  }, [fetchMeetingData]);



  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        meeting_type_id: formData.meeting_type_id ? Number(formData.meeting_type_id) : null,
        meeting_room_id: formData.meeting_room_id ? Number(formData.meeting_room_id) : null,
      };

      await meetingService.createMeeting(payload);
      showAlert('success', 'Success', 'Meeting scheduled successfully');
      setIsCreateDialogOpen(false);
      setFormData({
        title: '',
        meeting_type_id: '',
        meeting_room_id: '',
        date: '',
        start_time: '',
        end_time: '',
        description: '',
        meeting_link: '',
        attendee_ids: [],
      });
      fetchMeetings(page);
    } catch (error) {
      console.error('Failed to create meeting:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to create meeting'));
    }
  };


  /* =========================
     HELPERS
  ========================= */
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      scheduled: 'bg-solarized-blue/10 text-solarized-blue',
      in_progress: 'bg-solarized-green/10 text-solarized-green',
      completed: 'bg-solarized-base01/10 text-solarized-base01',
      cancelled: 'bg-solarized-red/10 text-solarized-red',
    };
    return variants[status] || variants.scheduled;
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString();

  // ================= SEARCH =================
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  // ================= PAGINATION =================
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePerRowsChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setPage(1);
  };

  // ================= SORTING =================
  const handleSort = (column: any, sortDirection: 'asc' | 'desc') => {
    const fieldMap: Record<string, string> = {
      'Title': 'title',
      'Date': 'date',
    };
    const field = fieldMap[column.name] || column.name;
    setSortField(field);
    setSortDirection(sortDirection);
    setPage(1);
  };

  // ================= DELETE =================
  const handleDelete = async (id: number) => {
    const result = await showConfirmDialog(
      'Are you sure?',
      'You want to cancel this meeting?'
    );

    if (!result.isConfirmed) return;

    try {
      await meetingService.deleteMeeting(id);
      showAlert('success', 'Cancelled!', 'Meeting cancelled successfully', 2000);
      fetchMeetings(page);
    } catch (error) {
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to cancel meeting'));
    }
  };

  // ================= TABLE COLUMNS =================
  const columns: TableColumn<Meeting>[] = [
    {
      name: 'Meeting Title',
      selector: (row) => row.title,
      cell: (row) => (
        <div className="py-2">
          <p className="font-medium">{row.title}</p>
        </div>
      ),
      sortable: true,
      minWidth: '200px',
    },
    {
      name: 'Meeting Type',
      selector: (row) => row.meeting_type?.title || '',
      cell: (row) => (
        <span className="text-sm">
          {row.meeting_type?.title || '-'}
        </span>
      ),
      sortable: true,
      width: '160px',
    },
    {
      name: 'Date & Time',
      selector: (row) => row.date,
      cell: (row) => (
        <div className="text-sm">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            {formatDate(row.date)}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            {row.start_time} - {row.end_time}
          </div>
        </div>
      ),
      sortable: true,
      width: '180px',
    },
    {
      name: 'Meeting Room',
      selector: (row) => row.meeting_room?.name || '',
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-sm">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="truncate">{row.meeting_room?.name || 'N/A'}</span>
        </div>
      ),
      sortable: true,
      width: '160px',
    },
    {
      name: 'Status',
      cell: (row) => (
        <Badge className={getStatusBadge(row.status)}>
          {row.status.replace('_', ' ')}
        </Badge>
      ),
      width: '120px',
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
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" /> View
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(row.id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Cancel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      ignoreRowClick: true,
      width: '80px',
    },
  ];

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#f9fafb',
        borderBottomWidth: '1px',
        borderBottomColor: '#e5e7eb',
        borderBottomStyle: 'solid' as const,
        minHeight: '56px',
      },
    },
    headCells: {
      style: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
  };
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">Meetings</h1>
          <p className="text-solarized-base01">Schedule and manage meetings</p>
        </div>
        <Button
          className="bg-solarized-blue hover:bg-solarized-blue/90"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Schedule Meeting
        </Button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid gap-6 sm:grid-cols-3">
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-solarized-blue" />
              <div>
                <p className="text-sm">Total Meetings</p>
                <p className="text-xl font-bold">{totalRows}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Clock className="h-5 w-5 text-solarized-yellow" />
              <div>
                <p className="text-sm">In Progress</p>
                <p className="text-xl font-bold">
                  {meetings.filter(m => m.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Users className="h-5 w-5 text-solarized-green" />
              <div>
                <p className="text-sm">Completed</p>
                <p className="text-xl font-bold">
                  {meetings.filter(m => m.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* UPDATED: List UI aligned with StaffList */}
      <Card>
        <CardHeader>
          <form onSubmit={handleSearchSubmit} className="flex gap-4">
            <Input
              placeholder="Search meetings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit" variant="outline">
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
          </form>
        </CardHeader>

        <CardContent>
          {!isLoading && meetings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p>No meetings found</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={meetings}
              progressPending={isLoading}
              pagination
              paginationServer
              paginationTotalRows={totalRows}
              paginationPerPage={perPage}
              paginationDefaultPage={page}
              onChangePage={handlePageChange}
              onChangeRowsPerPage={handlePerRowsChange}
              onSort={handleSort}
              customStyles={customStyles}
              sortServer
              highlightOnHover
              responsive
            />
          )}
        </CardContent>
      </Card>

      {/* CREATE MEETING DIALOG */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule New Meeting</DialogTitle>
            <DialogDescription>
              Enter the meeting details and invite attendees.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateMeeting}>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Meeting Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Weekly Sync"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meeting_type">Meeting Type</Label>
                  <Select
                    value={formData.meeting_type_id}
                    onValueChange={(v) => setFormData({ ...formData, meeting_type_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {meetingTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meeting_room">Meeting Room</Label>
                  <Select
                    value={formData.meeting_room_id}
                    onValueChange={(v) => setFormData({ ...formData, meeting_room_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id.toString()}>
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time *</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting_link">Meeting Link (Virtual)</Label>
                <Input
                  id="meeting_link"
                  value={formData.meeting_link}
                  onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                  placeholder="https://zoom.us/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Agenda and notes..."
                  rows={3}
                />
              </div>


            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90">
                Create Meeting
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
