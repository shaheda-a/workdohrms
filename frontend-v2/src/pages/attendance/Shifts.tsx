import { useState, useEffect } from 'react';
import { attendanceService } from '../../services/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Skeleton } from '../../components/ui/skeleton';
import { Plus, Edit, Trash2, Clock, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

/* =========================
   TYPES (MATCH API)
========================= */
interface Shift {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  break_duration_minutes: number;
}

/* =========================
   COMPONENT
========================= */
export default function Shifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    start_time: '',
    end_time: '',
    break_duration_minutes: '60',
  });

  /* =========================
     FETCH SHIFTS
  ========================= */
  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    setIsLoading(true);
    try {
      const response = await attendanceService.getShifts();
      setShifts(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      start_time: formData.start_time,
      end_time: formData.end_time,
      break_duration_minutes: Number(formData.break_duration_minutes),
    };

    try {
      if (editingShift) {
        await attendanceService.updateShift(editingShift.id, payload);
      } else {
        await attendanceService.createShift(payload);
      }

      setIsDialogOpen(false);
      setEditingShift(null);
      setFormData({
        name: '',
        start_time: '',
        end_time: '',
        break_duration_minutes: '60',
      });

      fetchShifts();
    } catch (error) {
      console.error('Failed to save shift:', error);
    }
  };

  /* =========================
     EDIT
  ========================= */
  const handleEdit = (shift: Shift) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name,
      start_time: shift.start_time.slice(0, 5),
      end_time: shift.end_time.slice(0, 5),
      break_duration_minutes: shift.break_duration_minutes.toString(),
    });
    setIsDialogOpen(true);
  };

  /* =========================
     DELETE
  ========================= */
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this shift?')) return;

    try {
      await attendanceService.deleteShift(id);
      fetchShifts();
    } catch (error) {
      console.error('Failed to delete shift:', error);
    }
  };

  /* =========================
     TIME FORMAT
  ========================= */
  const formatTime = (time: string) => {
    if (!time) return '--:--';
    const [h, m] = time.split(':');
    const hour = Number(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Shifts</h1>
          <p className="text-muted-foreground">Manage work shifts</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingShift(null);
                setFormData({
                  name: '',
                  start_time: '',
                  end_time: '',
                  break_duration_minutes: '60',
                });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Shift
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingShift ? 'Edit Shift' : 'Add Shift'}
              </DialogTitle>
              <DialogDescription>
                {editingShift
                  ? 'Update shift details'
                  : 'Create a new shift'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div>
                  <Label>Shift Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          start_time: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          end_time: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Break Duration (minutes)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.break_duration_minutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        break_duration_minutes: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingShift ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* TABLE */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : shifts.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
              <p>No shifts found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Break</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>

              <TableBody>
                {shifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell>{shift.name}</TableCell>
                    <TableCell>{formatTime(shift.start_time)}</TableCell>
                    <TableCell>{formatTime(shift.end_time)}</TableCell>
                    <TableCell>
                      {shift.break_duration_minutes} mins
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEdit(shift)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(shift.id)}
                            className="text-red-600"
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
