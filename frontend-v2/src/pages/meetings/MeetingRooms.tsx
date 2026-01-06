import { useState, useEffect, useCallback } from 'react';
import { meetingRoomService } from '../../services/api';
import { showAlert, getErrorMessage, showConfirmDialog } from '../../lib/sweetalert';
import {
    Card,
    CardContent,
    CardHeader,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import DataTable, { TableColumn } from 'react-data-table-component';
import {
    Plus,
    Search,
    MoreHorizontal,
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
    Wind,
} from 'lucide-react';

// UPDATED: List UI aligned with StaffList
interface MeetingRoom {
    id: number;
    name: string;
    location: string;
    capacity: number;
    equipment: string[];
    status: 'available' | 'occupied' | 'maintenance';
    created_at?: string;
}

export default function MeetingRooms() {
    const [rooms, setRooms] = useState<MeetingRoom[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);

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

    // ================= FETCH ROOMS =================
    const fetchRooms = useCallback(
        async (currentPage: number = 1) => {
            setIsLoading(true);
            try {
                const params: Record<string, unknown> = {
                    page: currentPage,
                    per_page: perPage,
                    search,
                };

                const response = await meetingRoomService.getAll(params);

                if (response.data.success) {
                    const data = response.data.data;
                    const meta = response.data.meta;

                    if (Array.isArray(data)) {
                        setRooms(data);
                        setTotalRows(meta?.total ?? data.length);
                    } else {
                        setRooms([]);
                        setTotalRows(0);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch meeting rooms:', error);
                showAlert('error', 'Error', getErrorMessage(error, 'Failed to fetch meeting rooms'));
                setRooms([]);
                setTotalRows(0);
            } finally {
                setIsLoading(false);
            }
        },
        [perPage, search]
    );

    useEffect(() => {
        fetchRooms(page);
    }, [page, fetchRooms]);

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

    // ================= DELETE =================
    const handleDelete = async (id: number) => {
        const result = await showConfirmDialog(
            'Are you sure?',
            'You want to delete this meeting room?'
        );

        if (!result.isConfirmed) return;

        try {
            await meetingRoomService.delete(id);
            showAlert('success', 'Deleted!', 'Meeting room deleted successfully', 2000);
            fetchRooms(page);
        } catch (error) {
            showAlert('error', 'Error', getErrorMessage(error, 'Failed to delete meeting room'));
        }
    };

    // ================= FORM HANDLERS =================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingRoom) {
                await meetingRoomService.update(editingRoom.id, formData);
                showAlert('success', 'Updated', 'Meeting room updated successfully');
            } else {
                await meetingRoomService.create(formData);
                showAlert('success', 'Created', 'Meeting room created successfully');
            }
            setIsDialogOpen(false);
            resetForm();
            fetchRooms(page);
        } catch (error) {
            console.error('Failed to save meeting room:', error);
            showAlert('error', 'Error', getErrorMessage(error, 'Failed to save meeting room'));
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

    // ================= HELPERS =================
    const getStatusBadge = (status: string) => {
        const variants: Record<string, { class: string; icon: any; label: string }> = {
            available: { class: 'bg-solarized-green/10 text-solarized-green', icon: CheckCircle2, label: 'Available' },
            occupied: { class: 'bg-solarized-orange/10 text-solarized-orange', icon: AlertCircle, label: 'Occupied' },
            maintenance: { class: 'bg-solarized-red/10 text-solarized-red', icon: XCircle, label: 'Maintenance' },
        };
        const config = variants[status] || variants.available;
        const Icon = config.icon;
        return (
            <Badge className={config.class}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
            </Badge>
        );
    };

    // ================= TABLE COLUMNS =================
    const columns: TableColumn<MeetingRoom>[] = [
        {
            name: 'Room Name',
            selector: (row) => row.name,
            cell: (row) => (
                <div className="py-2">
                    <p className="font-medium">{row.name}</p>
                </div>
            ),
            sortable: true,
            minWidth: '200px',
        },
        {
            name: 'Location',
            selector: (row) => row.location || '',
            cell: (row) => (
                <div className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span>{row.location || '-'}</span>
                </div>
            ),
            sortable: true,
            width: '180px',
        },
        {
            name: 'Capacity',
            selector: (row) => row.capacity,
            cell: (row) => (
                <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-solarized-blue" />
                    <span>{row.capacity} people</span>
                </div>
            ),
            width: '140px',
        },
        {
            name: 'Equipment',
            cell: (row) => (
                <div className="flex flex-wrap gap-1">
                    {row.equipment && row.equipment.length > 0 ? (
                        row.equipment.slice(0, 2).map((eqId) => {
                            const eq = availableEquipment.find(ae => ae.id === eqId);
                            if (!eq) return null;
                            const Icon = eq.icon;
                            return (
                                <Badge key={eqId} variant="outline" className="text-xs">
                                    <Icon className="h-3 w-3 mr-1" />
                                    {eq.name}
                                </Badge>
                            );
                        })
                    ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                    )}
                    {row.equipment && row.equipment.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                            +{row.equipment.length - 2}
                        </Badge>
                    )}
                </div>
            ),
            minWidth: '200px',
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
                        <DropdownMenuItem
                            onClick={() => {
                                setEditingRoom(row);
                                setFormData({
                                    name: row.name,
                                    location: row.location || '',
                                    capacity: row.capacity,
                                    equipment: row.equipment || [],
                                    status: row.status,
                                });
                                setIsDialogOpen(true);
                            }}
                        >
                            <Edit className="mr-2 h-4 w-4" /> Edit
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

    // ================= CUSTOM STYLES =================
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

    // ================= UI =================
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Meeting Rooms</h1>
                    <p className="text-muted-foreground">Manage physical and virtual meeting spaces</p>
                </div>
                <Button
                    className="bg-solarized-blue hover:bg-solarized-blue/90"
                    onClick={() => {
                        resetForm();
                        setIsDialogOpen(true);
                    }}
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Meeting Room
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <form onSubmit={handleSearchSubmit} className="flex gap-4">
                        <Input
                            placeholder="Search meeting rooms..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Button type="submit" variant="outline">
                            <Search className="mr-2 h-4 w-4" /> Search
                        </Button>
                    </form>
                </CardHeader>

                <CardContent>
                    {!isLoading && rooms.length === 0 ? (
                        <div className="text-center py-12">
                            <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p>No meeting rooms found</p>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={rooms}
                            progressPending={isLoading}
                            pagination
                            paginationServer
                            paginationTotalRows={totalRows}
                            paginationPerPage={perPage}
                            paginationDefaultPage={page}
                            onChangePage={handlePageChange}
                            onChangeRowsPerPage={handlePerRowsChange}
                            customStyles={customStyles}
                            highlightOnHover
                            responsive
                        />
                    )}
                </CardContent>
            </Card>

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
                                        );
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
