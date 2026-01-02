import { useState, useEffect } from 'react';
import { recruitmentService } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../../components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Plus, Edit, Trash2, Check, MoreHorizontal, MoreVertical } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

interface JobStage {
    id: number;
    title: string;
    color: string;
    order: number;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export default function JobStages() {
    const [stages, setStages] = useState<JobStage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedStage, setSelectedStage] = useState<JobStage | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        color: '#6366f1',
        is_default: false,
    });

    useEffect(() => {
        fetchStages();
    }, []);

    const fetchStages = async () => {
        setIsLoading(true);
        try {
            const response = await recruitmentService.getJobStages({ paginate: false });
            if (response.data && response.data.data) {
                setStages(response.data.data.sort((a: JobStage, b: JobStage) => a.order - b.order));
            }
        } catch (error) {
            console.error('Failed to fetch job stages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await recruitmentService.createJobStage(formData);
            setIsDialogOpen(false);
            resetForm();
            fetchStages();
        } catch (error) {
            console.error('Failed to create job stage:', error);
            alert('Failed to create job stage. Please try again.');
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStage) return;

        try {
            await recruitmentService.updateJobStage(selectedStage.id, formData);
            setIsEditDialogOpen(false);
            resetForm();
            setSelectedStage(null);
            fetchStages();
        } catch (error) {
            console.error('Failed to update job stage:', error);
            alert('Failed to update job stage. Please try again.');
        }
    };

    const handleDelete = async (stage: JobStage) => {
        if (!confirm(`Are you sure you want to delete the stage: "${stage.title}"?`)) {
            return;
        }

        try {
            await recruitmentService.deleteJobStage(stage.id);
            fetchStages();
        } catch (error) {
            console.error('Failed to delete job stage:', error);
            alert('Failed to delete job stage. Please try again.');
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            color: '#6366f1',
            is_default: false,
        });
    };

    const handleEdit = (stage: JobStage) => {
        setSelectedStage(stage);
        setFormData({
            title: stage.title,
            color: stage.color,
            is_default: stage.is_default,
        });
        setIsEditDialogOpen(true);
    };

    const colorOptions = [
        { value: '#6366f1', label: 'Indigo' },
        { value: '#10b981', label: 'Green' },
        { value: '#f59e0b', label: 'Amber' },
        { value: '#ef4444', label: 'Red' },
        { value: '#8b5cf6', label: 'Violet' },
        { value: '#0ea5e9', label: 'Sky' },
        { value: '#84cc16', label: 'Lime' },
        { value: '#f97316', label: 'Orange' },
        { value: '#06b6d4', label: 'Cyan' },
        { value: '#8b5cf6', label: 'Purple' },
    ];

    const defaultStageCount = stages.filter(stage => stage.is_default).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-solarized-base02">Job Stages</h1>
                    <p className="text-solarized-base01">Manage recruitment pipeline stages</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            className="bg-solarized-blue hover:bg-solarized-blue/90"
                            onClick={resetForm}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Stage
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add Job Stage</DialogTitle>
                            <DialogDescription>
                                Create a new stage for your recruitment pipeline
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Stage Title *</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g., Phone Screen, Technical Interview"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="color">Color</Label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {colorOptions.map((color) => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, color: color.value })}
                                                className={`
                          w-8 h-8 rounded-full flex items-center justify-center
                          ${formData.color === color.value
                                                        ? 'ring-2 ring-offset-2 ring-solarized-blue'
                                                        : ''
                                                    }
                        `}
                                                style={{ backgroundColor: color.value }}
                                                title={color.label}
                                            >
                                                {formData.color === color.value && (
                                                    <Check className="h-4 w-4 text-white" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div
                                            className="w-6 h-6 rounded-full border"
                                            style={{ backgroundColor: formData.color }}
                                        />
                                        <Input
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            className="w-32"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="is_default" className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="is_default"
                                            checked={formData.is_default}
                                            onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                                            className="rounded border-solarized-base01"
                                        />
                                        Set as default stage for new applications
                                    </Label>
                                    <p className="text-sm text-solarized-base01">
                                        {defaultStageCount > 0 ? (
                                            <span className="text-solarized-yellow">
                                                Note: There's already a default stage. Checking this will update the default.
                                            </span>
                                        ) : (
                                            'New applications will start in this stage'
                                        )}
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-solarized-blue hover:bg-solarized-blue/90"
                                    disabled={!formData.title}
                                >
                                    Create Stage
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-0 shadow-md">
                <CardHeader>
                    <CardTitle>Recruitment Pipeline Stages</CardTitle>
                    <CardDescription>
                        Manage the stages that applications go through in your recruitment process
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : stages.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Stage Title</TableHead>
                                    <TableHead>Color</TableHead>
                                    <TableHead>Order</TableHead>
                                    <TableHead>Default</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stages.map((stage) => (
                                    <TableRow key={stage.id}>
                                        <TableCell className="font-medium">{stage.title}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-4 h-4 rounded-full border"
                                                    style={{ backgroundColor: stage.color }}
                                                />
                                                <span className="text-xs font-mono hidden sm:inline">
                                                    {stage.color}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{stage.order}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {stage.is_default ? (
                                                <Badge className="bg-solarized-green/10 text-solarized-green">
                                                    <Check className="h-3 w-3 mr-1" />
                                                    Default
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">No</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(stage)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(stage)}
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
                    ) : (
                        <div className="py-12 text-center">
                            <Plus className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-solarized-base02">No stages created</h3>
                            <p className="text-solarized-base01 mt-1">
                                Create your first stage to start building your recruitment pipeline.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    setSelectedStage(null);
                    resetForm();
                }
                setIsEditDialogOpen(open);
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Job Stage</DialogTitle>
                        <DialogDescription>
                            Update stage details
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit_title">Stage Title *</Label>
                                <Input
                                    id="edit_title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Phone Screen, Technical Interview"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit_color">Color</Label>
                                <div className="grid grid-cols-5 gap-2">
                                    {colorOptions.map((color) => (
                                        <button
                                            key={color.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color: color.value })}
                                            className={`
                        w-8 h-8 rounded-full flex items-center justify-center
                        ${formData.color === color.value
                                                    ? 'ring-2 ring-offset-2 ring-solarized-blue'
                                                    : ''
                                                }
                      `}
                                            style={{ backgroundColor: color.value }}
                                            title={color.label}
                                        >
                                            {formData.color === color.value && (
                                                <Check className="h-4 w-4 text-white" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <div
                                        className="w-6 h-6 rounded-full border"
                                        style={{ backgroundColor: formData.color }}
                                    />
                                    <Input
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="w-32"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit_is_default" className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="edit_is_default"
                                        checked={formData.is_default}
                                        onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                                        className="rounded border-solarized-base01"
                                    />
                                    Set as default stage for new applications
                                </Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setSelectedStage(null);
                                    resetForm();
                                    setIsEditDialogOpen(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-solarized-blue hover:bg-solarized-blue/90"
                                disabled={!formData.title}
                            >
                                Update Stage
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}