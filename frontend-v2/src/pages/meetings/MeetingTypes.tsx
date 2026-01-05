import { useState, useEffect } from 'react';
import { meetingService } from '../../services/api';
import { showAlert, getErrorMessage } from '../../lib/sweetalert';
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
    Edit,
    Trash2,
    Settings,
    Clock,
    Palette,
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
import { Textarea } from '../../components/ui/textarea';

interface MeetingType {
    id: number;
    title: string;
    description: string;
    default_duration: number;
    color: string;
    meetings_count?: number;
}

export default function MeetingTypes() {
    const [types, setTypes] = useState<MeetingType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingType, setEditingType] = useState<MeetingType | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        default_duration: 60,
        color: '#6366f1',
    });

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        setIsLoading(true);
        try {
            const response = await meetingService.getTypes();
            if (response.data.success) {
                setTypes(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch meeting types:', error);
            showAlert('error', 'Error', 'Failed to fetch meeting types');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingType) {
                await meetingService.updateType(editingType.id, formData);
                showAlert('success', 'Updated', 'Meeting type updated successfully');
            } else {
                await meetingService.createType(formData);
                showAlert('success', 'Created', 'Meeting type created successfully');
            }
            setIsDialogOpen(false);
            resetForm();
            fetchTypes();
        } catch (error) {
            console.error('Failed to save meeting type:', error);
            showAlert('error', 'Error', getErrorMessage(error, 'Failed to save meeting type'));
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this meeting type?')) return;
        try {
            await meetingService.deleteType(id);
            showAlert('success', 'Deleted', 'Meeting type deleted successfully');
            fetchTypes();
        } catch (error) {
            console.error('Failed to delete meeting type:', error);
            showAlert('error', 'Error', 'Failed to delete meeting type');
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            default_duration: 60,
            color: '#6366f1',
        });
        setEditingType(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-solarized-base02">Meeting Types</h1>
                    <p className="text-solarized-base01">Manage categories and defaults for your meetings</p>
                </div>
                <Button
                    className="bg-solarized-blue hover:bg-solarized-blue/90"
                    onClick={() => {
                        resetForm();
                        setIsDialogOpen(true);
                    }}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Meeting Type
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    [1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-48 w-full rounded-xl" />
                    ))
                ) : types.length === 0 ? (
                    <Card className="col-span-full py-12 text-center border-dashed">
                        <CardContent>
                            <div className="flex flex-col items-center gap-2">
                                <Settings className="h-12 w-12 text-solarized-base2" />
                                <p className="text-solarized-base01 font-medium">No meeting types found</p>
                                <Button variant="link" onClick={() => setIsDialogOpen(true)}>Create the first one</Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    types.map((type) => (
                        <Card key={type.id} className="group overflow-hidden border-solarized-base2 hover:border-solarized-blue/50 transition-all duration-300 shadow-sm hover:shadow-md">
                            <div
                                className="h-1.5 w-full"
                                style={{ backgroundColor: type.color }}
                            />
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg text-solarized-base02">{type.title}</CardTitle>
                                        <p className="text-xs text-solarized-base01 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {type.default_duration} mins default
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                                        {type.meetings_count || 0} Meetings
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-solarized-base01 line-clamp-2 min-h-[40px]">
                                    {type.description || 'No description provided.'}
                                </p>
                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-solarized-base3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-solarized-blue hover:text-solarized-blue hover:bg-solarized-blue/10"
                                        onClick={() => {
                                            setEditingType(type);
                                            setFormData({
                                                title: type.title,
                                                description: type.description || '',
                                                default_duration: type.default_duration,
                                                color: type.color,
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
                                        onClick={() => handleDelete(type.id)}
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
                        <DialogTitle>{editingType ? 'Edit Meeting Type' : 'Add Meeting Type'}</DialogTitle>
                        <DialogDescription>
                            Define meeting characteristics like default duration and color code.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Client Sync"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="duration" className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Duration (mins)
                                    </Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        min={15}
                                        step={15}
                                        value={formData.default_duration}
                                        onChange={(e) => setFormData({ ...formData, default_duration: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="color" className="flex items-center gap-1">
                                        <Palette className="h-3 w-3" />
                                        Display Color
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="color"
                                            type="color"
                                            className="w-12 p-1 h-9 cursor-pointer"
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        />
                                        <Input
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            className="flex-1 font-mono uppercase"
                                            maxLength={7}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe the purpose of this meeting type..."
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90">
                                {editingType ? 'Save Changes' : 'Create Type'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
