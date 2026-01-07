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
  CheckCircle2,
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
  meeting_type_id?: number;
  meeting_room_id?: number;

  meeting_type?: {
    id: number;
    title: string;
  };

  meeting_room?: {
    id: number;
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

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [viewingMeeting, setViewingMeeting] = useState<Meeting | null>(null);

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
    status: 'scheduled',
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



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        meeting_type_id: formData.meeting_type_id ? Number(formData.meeting_type_id) : null,
        meeting_room_id: formData.meeting_room_id ? Number(formData.meeting_room_id) : null,
      };

      if (editingMeeting) {
        await meetingService.updateMeeting(editingMeeting.id, payload);
        showAlert('success', 'Updated', 'Meeting updated successfully');
      } else {
        await meetingService.createMeeting(payload);
        showAlert('success', 'Success', 'Meeting scheduled successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchMeetings(page);
    } catch (error) {
      console.error('Failed to save meeting:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to save meeting'));
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      meeting_type_id: '',
      meeting_room_id: '',
      date: '',
      start_time: '',
      end_time: '',
      description: '',
      meeting_link: '',
      status: 'scheduled',
      attendee_ids: [],
    });
    setEditingMeeting(null);
  };

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setFormData({
      title: meeting.title || '',
      meeting_type_id: meeting.meeting_type?.id?.toString() || meeting.meeting_type_id?.toString() || '',
      meeting_room_id: meeting.meeting_room?.id?.toString() || meeting.meeting_room_id?.toString() || '',
      date: meeting.date ? new Date(meeting.date).toISOString().split('T')[0] : '',
      start_time: meeting.start_time || '',
      end_time: meeting.end_time || '',
      description: meeting.description || '',
      meeting_link: meeting.meeting_link || '',
      status: meeting.status || 'scheduled',
      attendee_ids: [],
    });
    setIsDialogOpen(true);
  };

  const handleView = (meeting: Meeting) => {
    setViewingMeeting(meeting);
    setIsViewDialogOpen(true);
  };


  /* =========================
     HELPERS
  ========================= */
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      scheduled: 'bg-solarized-blue/10 text-solarized-blue',
      in_progress: 'bg-solarized-orange/10 text-solarized-orange',
      completed: 'bg-solarized-green/10 text-solarized-green',
      cancelled: 'bg-solarized-red/10 text-solarized-red',
    };
    return (
      <Badge className={`${variants[status] || variants.scheduled} border-none shadow-none`}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
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
          {/* <div className="flex items-center gap-1.5 mt-0.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            {row.start_time} - {row.end_time}
          </div> */}
        </div>
      ),
      sortable: true,
      width: '180px',
    },
{

   name: 'Time',
      selector: (row) => row.date,
      cell: (row) => (
    <div className="flex items-center gap-1.5 mt-0.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            {row.start_time} - {row.end_time}
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
      cell: (row) => getStatusBadge(row.status),
      width: '140px',
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
            <DropdownMenuItem onClick={() => handleView(row)}>
              <Eye className="mr-2 h-4 w-4" /> View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(row)}>
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
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
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
              <CheckCircle2 className="h-5 w-5 text-solarized-green" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-xl font-bold text-solarized-base02">
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

      {/* CREATE / EDIT MEETING DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}</DialogTitle>
            {/* <DialogDescription>
              {editingMeeting
                ? 'Update the meeting details and save changes.'
                : 'Enter the meeting details and invite attendees.'}
            </DialogDescription> */}
          </DialogHeader>
          <form onSubmit={handleSubmit}>
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
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="meeting_link">Meeting Link (Virtual)</Label>
                  <Input
                    id="meeting_link"
                    value={formData.meeting_link}
                    onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                    placeholder="https://zoom.us/..."
                  />
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
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90">
                {editingMeeting ? 'Save Changes' : 'Create Meeting'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* VIEW MEETING DIALOG */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Meeting Details</DialogTitle>
            <DialogDescription>
              Check the meeting status, timing, and agenda.
            </DialogDescription>
          </DialogHeader>
          {viewingMeeting && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Meeting Title</Label>
                  <p className="font-medium text-lg">{viewingMeeting.title}</p>
                </div>
                <div className="text-right">
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(viewingMeeting.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Date
                  </Label>
                  <p className="font-medium">{formatDate(viewingMeeting.date)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Time
                  </Label>
                  <p className="font-medium">{viewingMeeting.start_time} - {viewingMeeting.end_time}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Meeting Room
                  </Label>
                  <p>{viewingMeeting.meeting_room?.name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <Video className="h-3 w-3" /> Meeting Link
                  </Label>
                  {viewingMeeting.meeting_link ? (
                    <a
                      href={viewingMeeting.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-solarized-blue hover:underline block truncate max-w-[200px]"
                    >
                      {viewingMeeting.meeting_link}
                    </a>
                  ) : (
                    <p>N/A</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Meeting Type</Label>
                <p>{viewingMeeting.meeting_type?.title || 'N/A'}</p>
              </div>

              {viewingMeeting.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <Card className="mt-1 bg-muted/30 border-none shadow-none">
                    <CardContent className="p-3 text-sm text-solarized-base01 whitespace-pre-wrap">
                      {viewingMeeting.description}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {viewingMeeting && (
              <Button
                className="bg-solarized-blue hover:bg-solarized-blue/90"
                onClick={() => {
                  setIsViewDialogOpen(false);
                  handleEdit(viewingMeeting);
                }}
              >
                <Edit className="mr-2 h-4 w-4" /> Edit Meeting
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
