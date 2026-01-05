import { useState, useEffect } from 'react';
import { meetingService } from '../../services/api';
import { showAlert, getErrorMessage } from '../../lib/sweetalert';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import {
    Plus,
    Edit,
    Trash2,
    MapPin,
    Users,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Monitor,
    Wifi,
    Cast,
    Wind
} from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';

interface MeetingRoom {
    id: number;
    name: string;
    location: string;
    capacity: number;
    equipment: string[];
    status: 'available' | 'occupied' | 'maintenance';
}

export default function MeetingRooms() {
    const [rooms, setRooms] = useState<MeetingRoom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<MeetingRoom | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        location: '',
        capacity: 10,
        equipment: [] as string[],
        status: 'available' as 'available' | 'occupied' | 'maintenance',
    });

    const availableEquipment = [
        { id: 'tv', name: 'Smart TV', icon: Monitor },
        { id: 'wifi', name: 'High-speed WiFi', icon: Wifi },
        { id: 'projector', name: 'Projector', icon: Cast },
        { id: 'ac', name: 'Air Conditioning', icon: Wind },
    ];

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        setIsLoading(true);
        try {
            const response = await meetingService.getRooms();
            if (response.data.success) {
                setRooms(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch meeting rooms:', error);
            showAlert('error', 'Error', 'Failed to fetch meeting rooms');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingRoom) {
                await meetingService.updateRoom(editingRoom.id, formData);
                showAlert('success', 'Updated', 'Meeting room updated successfully');
            } else {
                await meetingService.createRoom(formData);
                showAlert('success', 'Created', 'Meeting room created successfully');
            }
            setIsDialogOpen(false);
            resetForm();
            fetchRooms();
        } catch (error) {
            console.error('Failed to save meeting room:', error);
            showAlert('error', 'Error', getErrorMessage(error, 'Failed to save meeting room'));
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this meeting room?')) return;
        try {
            await meetingService.deleteRoom(id);
            showAlert('success', 'Deleted', 'Meeting room deleted successfully');
            fetchRooms();
        } catch (error) {
            console.error('Failed to delete meeting room:', error);
            showAlert('error', 'Error', 'Failed to delete meeting room');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            location: '',
            capacity: 10,
            equipment: [],
            status: 'available',
        });
        setEditingRoom(null);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'available':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 flex gap-1"><CheckCircle2 className="h-3 w-3" /> Available</Badge>;
            case 'occupied':
                return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 flex gap-1"><AlertCircle className="h-3 w-3" /> Occupied</Badge>;
            case 'maintenance':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 flex gap-1"><XCircle className="h-3 w-3" /> Maintenance</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-solarized-base02">Meeting Rooms</h1>
                    <p className="text-solarized-base01">Manage physically and virtual meeting spaces</p>
                </div>
                <Button
                    className="bg-solarized-blue hover:bg-solarized-blue/90"
                    onClick={() => {
                        resetForm();
                        setIsDialogOpen(true);
                    }}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Meeting Room
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    [1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-64 w-full rounded-xl" />
                    ))
                ) : rooms.length === 0 ? (
                    <Card className="col-span-full py-12 text-center border-dashed">
                        <CardContent>
                            <div className="flex flex-col items-center gap-2">
                                <MapPin className="h-12 w-12 text-solarized-base2" />
                                <p className="text-solarized-base01 font-medium">No meeting rooms found</p>
                                <Button variant="link" onClick={() => setIsDialogOpen(true)}>Create the first one</Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    rooms.map((room) => (
                        <Card key={room.id} className="group overflow-hidden border-solarized-base2 hover:border-solarized-blue/50 transition-all duration-300 shadow-sm hover:shadow-md">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg text-solarized-base02">{room.name}</CardTitle>
                                        <p className="text-xs text-solarized-base01 flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {room.location || 'No location set'}
                                        </p>
                                    </div>
                                    {getStatusBadge(room.status)}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4 text-sm text-solarized-base01">
                                    <div className="flex items-center gap-1.5 font-medium">
                                        <Users className="h-4 w-4 text-solarized-blue" />
                                        Up to {room.capacity} people
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold text-solarized-base2 tracking-wider">Equipment</Label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {room.equipment && room.equipment.length > 0 ? (
                                            room.equipment.map((eqId) => {
                                                const eq = availableEquipment.find(ae => ae.id === eqId);
                                                if (!eq) return null;
                                                const Icon = eq.icon;
                                                return (
                                                    <div key={eqId} className="px-2 py-1 bg-solarized-base3 rounded-md text-xs text-solarized-base01 flex items-center gap-1.5 border border-solarized-base2">
                                                        <Icon className="h-3 w-3" />
                                                        {eq.name}
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <span className="text-xs text-solarized-base2 italic">No specific equipment listed</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-4 border-t border-solarized-base3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-solarized-blue hover:text-solarized-blue hover:bg-solarized-blue/10"
                                        onClick={() => {
                                            setEditingRoom(room);
                                            setFormData({
                                                name: room.name,
                                                location: room.location || '',
                                                capacity: room.capacity,
                                                equipment: room.equipment || [],
                                                status: room.status,
                                            });
                                            setIsDialogOpen(true);
                                        }}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-solarized-red hover:text-solarized-red hover:bg-solarized-red/10"
                                        onClick={() => handleDelete(room.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingRoom ? 'Edit Meeting Room' : 'Add Meeting Room'}</DialogTitle>
                        <DialogDescription>
                            Provide room details to help coordinators schedule efficiently.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Room Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Boardroom A"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="e.g., 2nd Floor, West Wing"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="capacity">Capacity (people)</Label>
                                    <Input
                                        id="capacity"
                                        type="number"
                                        min={1}
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(v: any) => setFormData({ ...formData, status: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="available">Available</SelectItem>
                                            <SelectItem value="occupied">Occupied</SelectItem>
                                            <SelectItem value="maintenance">Maintenance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Available Equipment</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {availableEquipment.map((eq) => {
                                        const Icon = eq.icon;
                                        const isSelected = formData.equipment.includes(eq.id);
                                        return (
                                            <div
                                                key={eq.id}
                                                className={`flex items-center gap-3 p-2 rounded-lg border transition-all cursor-pointer ${isSelected
                                                    ? 'border-solarized-blue bg-solarized-blue/5 text-solarized-blue'
                                                    : 'border-solarized-base2 text-solarized-base01 hover:bg-solarized-base3'
                                                    }`}
                                                onClick={() => {
                                                    const newEquipment = isSelected
                                                        ? formData.equipment.filter(e => e !== eq.id)
                                                        : [...formData.equipment, eq.id];
                                                    setFormData({ ...formData, equipment: newEquipment });
                                                }}
                                            >
                                                <Icon className={`h-4 w-4 ${isSelected ? 'text-solarized-blue' : 'text-solarized-base1'}`} />
                                                <span className="text-sm font-medium">{eq.name}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90">
                                {editingRoom ? 'Save Changes' : 'Create Room'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
