import { useState, useEffect } from 'react';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
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
import { Plus, Briefcase, Building, Edit, Trash2, MoreVertical, FileText } from 'lucide-react';
import { Textarea } from '../../components/ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { recruitmentService } from '@/services/api';

interface JobCategory {
    id: number;
    title: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    jobs_count?: number;
    jobs?: {
        id: number;
        title: string;
        description: string;
    }[];
}

export default function JobCategories() {
    const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
    });
    const [searchTerm, setSearchTerm] = useState('');

    const fetchJobCategories = async () => {
        setIsLoading(true);
        try {
            const response = await recruitmentService.getJobCategories({
                paginate: false,
                ...(searchTerm && { search: searchTerm })
            });
            console.log('Job categories response:', response.data);

            if (response.data && response.data.data) {
                setJobCategories(response.data.data);
            } else if (Array.isArray(response.data)) {
                setJobCategories(response.data);
            } else {
                console.error('Unexpected response format:', response);
                setJobCategories([]);
            }
        } catch (error) {
            console.error('Failed to fetch job categories:', error);
            showAlert('error', 'Error', 'Failed to fetch job categories');
            setJobCategories([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditMode && editingId) {
                // Update existing job category
                await recruitmentService.updateJobCategory(editingId, formData);
            } else {
                // Create new job category
                await recruitmentService.createJobCategory(formData);
            }

            showAlert(
                'success',
                'Success!',
                isEditMode ? 'Job category updated successfully' : 'Job category created successfully',
                2000
            );
            setIsDialogOpen(false);
            resetForm();
            fetchJobCategories();
        } catch (error: unknown) {
            console.error('Failed to save job category:', error);
            showAlert('error', 'Error', getErrorMessage(error, 'Failed to save job category'));
        }
    };

    const handleEdit = (category: JobCategory) => {
        setIsEditMode(true);
        setEditingId(category.id);
        setFormData({
            title: category.title,
            description: category.description || '',
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        const result = await showConfirmDialog(
            'Are you sure?',
            'You want to delete this job category? This action cannot be undone.'
        );

        if (!result.isConfirmed) return;

        try {
            await recruitmentService.deleteJobCategory(id);
            showAlert('success', 'Deleted!', 'Job category deleted successfully', 2000);
            fetchJobCategories();
        } catch (error: unknown) {
            console.error('Failed to delete job category:', error);
            showAlert('error', 'Error', getErrorMessage(error, 'Failed to delete job category'));
        }
    };

    const resetForm = () => {
        setIsEditMode(false);
        setEditingId(null);
        setFormData({
            title: '',
            description: '',
        });
    };

    useEffect(() => {
        fetchJobCategories();
    }, [searchTerm]);

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    const totalJobsCount = jobCategories.reduce((sum, category) => sum + (category.jobs_count || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-solarized-base02">Job Categories</h1>
                    <p className="text-solarized-base01">Manage job categories for recruitment</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Input
                            type="search"
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-[250px]"
                        />
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        if (!open) {
                            resetForm();
                        }
                        setIsDialogOpen(open);
                    }}>
                        <DialogTrigger asChild>
                            <Button
                                className="bg-solarized-blue hover:bg-solarized-blue/90"
                                onClick={() => {
                                    resetForm();
                                    setIsDialogOpen(true);
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Category
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>
                                    {isEditMode ? 'Edit Job Category' : 'Add Job Category'}
                                </DialogTitle>
                                <DialogDescription>
                                    {isEditMode
                                        ? 'Update the details of this job category'
                                        : 'Add a new job category to the system'}
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
                                            placeholder="e.g., Information Technology"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Optional description of this job category..."
                                            rows={4}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            resetForm();
                                            setIsDialogOpen(false);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-solarized-blue hover:bg-solarized-blue/90"
                                    >
                                        {isEditMode ? 'Update' : 'Create'} Category
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
                <Card className="border-0 shadow-md">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-solarized-green/10 flex items-center justify-center">
                                <Building className="h-6 w-6 text-solarized-green" />
                            </div>
                            <div>
                                <p className="text-sm text-solarized-base01">Total Categories</p>
                                <p className="text-2xl font-bold text-solarized-base02">
                                    {jobCategories.length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-solarized-blue/10 flex items-center justify-center">
                                <Briefcase className="h-6 w-6 text-solarized-blue" />
                            </div>
                            <div>
                                <p className="text-sm text-solarized-base01">Total Jobs</p>
                                <p className="text-2xl font-bold text-solarized-base02">{totalJobsCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-solarized-yellow/10 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-solarized-yellow" />
                            </div>
                            <div>
                                <p className="text-sm text-solarized-base01">Active Categories</p>
                                <p className="text-2xl font-bold text-solarized-base02">
                                    {jobCategories.filter(cat => cat.jobs_count && cat.jobs_count > 0).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-0 shadow-md">
                <CardHeader>
                    <CardTitle>Job Categories List</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Jobs Count</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Updated</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jobCategories.length > 0 ? (
                                    jobCategories.map((category) => (
                                        <TableRow key={category.id}>
                                            <TableCell className="font-medium">{category.title}</TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {category.description || 'No description'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        category.jobs_count && category.jobs_count > 0
                                                            ? 'bg-solarized-green/10 text-solarized-green'
                                                            : 'bg-solarized-base01/10 text-solarized-base01'
                                                    }
                                                >
                                                    {category.jobs_count || 0} jobs
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {formatDate(category.created_at)}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {formatDate(category.updated_at)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {/* <DropdownMenuLabel>Actions</DropdownMenuLabel> */}
                                                        <DropdownMenuItem onClick={() => handleEdit(category)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        {/* <DropdownMenuSeparator /> */}
                                                        <div
                                                            className="relative"
                                                            title={
                                                                (category.jobs_count ?? 0) > 0
                                                                    ? 'Cannot delete: Category has jobs assigned'
                                                                    : undefined
                                                            }
                                                        >
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    if ((category.jobs_count ?? 0) === 0) {
                                                                        handleDelete(category.id);
                                                                    }
                                                                }}
                                                                className={`text-red-600 ${(category.jobs_count ?? 0) > 0
                                                                        ? 'opacity-50 cursor-not-allowed'
                                                                        : ''
                                                                    }`}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </div>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            <div className="flex flex-col items-center justify-center">
                                                <Building className="h-12 w-12 text-solarized-base01 mb-4" />
                                                <h3 className="text-lg font-medium text-solarized-base02">
                                                    {searchTerm ? 'No matching categories found' : 'No job categories found'}
                                                </h3>
                                                <p className="text-solarized-base01 mt-1">
                                                    {searchTerm
                                                        ? 'Try a different search term'
                                                        : 'Create your first job category to get started.'}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
