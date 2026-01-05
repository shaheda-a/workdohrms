import { useState, useEffect } from 'react';
import { meetingService } from '../../services/api';
import { showAlert } from '../../lib/sweetalert';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Plus,
  Calendar,
  Clock,
  Users,
  Video,
  MapPin,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  X,
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
import { performanceService } from '../../services/api';
import { getErrorMessage } from '../../lib/sweetalert';

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

  attendees?: {
    staff_member?: {
      full_name: string;
    };
  }[];
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/* =========================
   COMPONENT
========================= */
export default function Meetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Creation State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [meetingTypes, setMeetingTypes] = useState<{ id: number; title: string }[]>([]);
  const [rooms, setRooms] = useState<{ id: number; name: string }[]>([]);
  const [staffMembers, setStaffMembers] = useState<{ id: number; full_name: string }[]>([]);

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

  useEffect(() => {
    fetchMeetings();
  }, [page]);

  useEffect(() => {
    fetchMeetingData();
  }, []);

  const fetchMeetingData = async () => {
    try {
      const [typesRes, roomsRes, staffRes] = await Promise.all([
        meetingService.getTypes(),
        meetingService.getAvailableRooms(),
        performanceService.getStaffMembers(),
      ]);

      if (typesRes.data.success) setMeetingTypes(typesRes.data.data || []);
      if (roomsRes.data.success) setRooms(roomsRes.data.data || []);
      if (staffRes.data.success) setStaffMembers(staffRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch meeting metadata:', error);
    }
  };

  /* =========================
     FETCH MEETINGS (FIXED)
  ========================= */
  const fetchMeetings = async () => {
    setIsLoading(true);
    try {
      const response = await meetingService.getAll({ page });

      const payload = response.data.data;

      // ✅ CASE 1: data is DIRECT ARRAY (your current API)
      if (Array.isArray(payload)) {
        setMeetings(payload);
        setMeta(response.data.meta || null);
      }

      // ✅ CASE 2: data is PAGINATED OBJECT
      else if (payload && Array.isArray(payload.data)) {
        setMeetings(payload.data);
        setMeta({
          current_page: payload.current_page,
          last_page: payload.last_page,
          per_page: payload.per_page,
          total: payload.total,
        });
      }

      // ❌ Fallback
      else {
        setMeetings([]);
        setMeta(null);
      }
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
      setMeetings([]);
      setMeta(null);
      showAlert('error', 'Error', 'Failed to fetch meetings');
    } finally {
      setIsLoading(false);
    }
  };

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
      fetchMeetings();
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

  const getTypeIcon = (type?: string) =>
    type?.toLowerCase().includes('virtual') ? (
      <Video className="h-4 w-4 text-solarized-blue" />
    ) : (
      <MapPin className="h-4 w-4 text-solarized-green" />
    );

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString();

  /* =========================
     RENDER
  ========================= */
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
      <div className="grid gap-6 sm:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-solarized-blue" />
              <div>
                <p className="text-sm">Total Meetings</p>
                <p className="text-xl font-bold">{meta?.total || 0}</p>
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

      {/* MEETING CARDS */}
      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : meetings.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-solarized-base01" />
            <h3 className="text-lg font-medium">No meetings scheduled</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {meetings.map(meeting => (
            <Card key={meeting.id} className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div>
                    <CardTitle>{meeting.title}</CardTitle>
                    <CardDescription>
                      {meeting.meeting_type?.title || 'Meeting'}
                    </CardDescription>
                  </div>
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
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" /> Cancel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-sm text-solarized-base01 line-clamp-2">
                  {meeting.description}
                </p>

                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(meeting.date)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {meeting.start_time} - {meeting.end_time}
                  </div>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(meeting.meeting_type?.title)}
                    {meeting.meeting_room?.name}
                  </div>
                </div>

                <Badge className={getStatusBadge(meeting.status)}>
                  {meeting.status.replace('_', ' ')}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* PAGINATION */}
      {meta && meta.last_page > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm">
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
      )}

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

              <div className="space-y-3">
                <Label>Select Attendees</Label>
                <div className="space-y-2">
                  <Select
                    onValueChange={(v) => {
                      const id = Number(v);
                      if (!formData.attendee_ids.includes(id)) {
                        setFormData({ ...formData, attendee_ids: [...formData.attendee_ids, id] });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add an attendee..." />
                    </SelectTrigger>
                    <SelectContent>
                      {staffMembers
                        .filter(s => !formData.attendee_ids.includes(s.id))
                        .map((staff) => (
                          <SelectItem key={staff.id} value={staff.id.toString()}>
                            {staff.full_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {formData.attendee_ids.map((id) => {
                      const staff = staffMembers.find(s => s.id === id);
                      if (!staff) return null;
                      return (
                        <Badge
                          key={id}
                          variant="secondary"
                          className="pl-2 pr-1 py-1 flex items-center gap-1 bg-solarized-base3 text-solarized-base01 border-solarized-base2"
                        >
                          {staff.full_name}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 rounded-full p-0 hover:bg-solarized-base2"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                attendee_ids: formData.attendee_ids.filter(aid => aid !== id)
                              });
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      );
                    })}
                    {formData.attendee_ids.length === 0 && (
                      <p className="text-xs text-solarized-base2 italic">No attendees selected yet.</p>
                    )}
                  </div>
                </div>
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
