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
import { Textarea } from '../../components/ui/textarea';
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
    Eye,
    X,
} from 'lucide-react';

// UPDATED: List UI aligned with StaffList
interface MeetingRoom {
    id: number;
    name: string;
    location: string;
    capacity: number;
    description: string | null;
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
        description: '',
        equipment: [] as string[],
        status: 'available' as 'available' | 'occupied' | 'maintenance',
    });

    const [viewingRoom, setViewingRoom] = useState<MeetingRoom | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [newEquipment, setNewEquipment] = useState('');

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
            // Include any pending equipment that hasn't been "added" yet
            let finalEquipment = [...formData.equipment];
            const trimmedNew = newEquipment.trim();
            if (trimmedNew && !finalEquipment.includes(trimmedNew)) {
                finalEquipment.push(trimmedNew);
            }

            const submissionData = {
                ...formData,
                equipment: finalEquipment,
            };

            if (editingRoom) {
                await meetingRoomService.update(editingRoom.id, submissionData);
                showAlert('success', 'Updated', 'Meeting room updated successfully');
            } else {
                await meetingRoomService.create(submissionData);
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
            description: '',
            equipment: [],
            status: 'available',
        });
        setEditingRoom(null);
        setNewEquipment('');
    };

    // UPDATED: manual equipment input handlers
    const addEquipment = () => {
        const trimmed = newEquipment.trim();
        if (!trimmed) return;

        setFormData(prev => {
            if (prev.equipment.includes(trimmed)) return prev;
            return {
                ...prev,
                equipment: [...prev.equipment, trimmed]
            };
        });
        setNewEquipment('');
    };

    const removeEquipment = (item: string) => {
        setFormData(prev => ({
            ...prev,
            equipment: prev.equipment.filter(e => e !== item)
        }));
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
            name: 'Description',
            selector: (row) => row.description || '',
            cell: (row) => (
                <p className="text-sm text-muted-foreground line-clamp-2 py-2">
                    {row.description || '-'}
                </p>
            ),
            sortable: true,
            minWidth: '200px',
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
                        row.equipment.slice(0, 2).map((eq, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                                {eq}
                            </Badge>
                        ))
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
                                setViewingRoom(row);
                                setIsViewDialogOpen(true);
                            }}
                        >
                             <Eye className="mr-2 h-4 w-4" />  View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => {
                                setEditingRoom(row);
                                setFormData({
                                    name: row.name,
                                    location: row.location || '',
                                    capacity: row.capacity,
                                    description: row.description || '',
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
                                    placeholder="e.g., Webinar Room"
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

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of the room..."
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-3">
                                <Label>Equipment</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={newEquipment}
                                        onChange={(e) => setNewEquipment(e.target.value)}
                                        placeholder="Add equipment (e.g., Wifi, TV)"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addEquipment();
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.equipment.map((item, index) => (
                                        <Badge key={index} variant="secondary" className="flex items-center gap-1 pr-1">
                                            {item}
                                            <button
                                                type="button"
                                                onClick={() => removeEquipment(item)}
                                                className="hover:bg-muted rounded-full p-0.5"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
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

            {/* VIEW MEETING ROOM DIALOG */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Meeting Room Details</DialogTitle>
                        <DialogDescription>
                            Detailed information about the selected meeting space.
                        </DialogDescription>
                    </DialogHeader>
                    {viewingRoom && (
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Room Name</Label>
                                    <p className="font-medium text-lg">{viewingRoom.name}</p>
                                </div>
                                <div className="text-right">
                                    <Label className="text-muted-foreground">Status</Label>
                                    <div className="mt-1">{getStatusBadge(viewingRoom.status)}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3 w-3" /> Location
                                    </Label>
                                    <p>{viewingRoom.location || 'N/A'}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground flex items-center gap-1">
                                        <Users className="h-3 w-3" /> Capacity
                                    </Label>
                                    <p>{viewingRoom.capacity} people</p>
                                </div>
                            </div>

                            {viewingRoom.description && (
                                <div>
                                    <Label className="text-muted-foreground">Description</Label>
                                    <p className="text-sm mt-1 whitespace-pre-wrap text-solarized-base01">
                                        {viewingRoom.description}
                                    </p>
                                </div>
                            )}

                            <div>
                                <Label className="text-muted-foreground">Available Equipment</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {viewingRoom.equipment && viewingRoom.equipment.length > 0 ? (
                                        viewingRoom.equipment.map((item, idx) => (
                                            <Badge key={idx} variant="outline" className="bg-solarized-base3">
                                                {item}
                                            </Badge>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">No equipment listed</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="button" onClick={() => setIsViewDialogOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
