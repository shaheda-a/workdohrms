import { useState, useEffect } from 'react';
import { meetingService } from '../../services/api';
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
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

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

  useEffect(() => {
    fetchMeetings();
  }, [page]);

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
  } finally {
    setIsLoading(false);
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
        <Button className="bg-solarized-blue hover:bg-solarized-blue/90">
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
    </div>
  );
}
