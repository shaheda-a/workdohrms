import { useState, useEffect, useCallback } from 'react';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
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
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import DataTable, { TableColumn } from 'react-data-table-component';
import { Plus, Briefcase, Building, Edit, Trash2, MoreVertical, FileText, Search } from 'lucide-react';
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
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);
    const [searchInput, setSearchInput] = useState(''); // What user types
    const [search, setSearch] = useState(''); // What's sent to API

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
    });

    // ================= FETCH JOB CATEGORIES =================
    const fetchJobCategories = useCallback(
        async (currentPage: number = 1) => {
            setIsLoading(true);
            try {
                const response = await recruitmentService.getJobCategories({
                    page: currentPage,
                    per_page: perPage,
                    ...(search && { search })
                });

                const { data, meta } = response.data;

                if (Array.isArray(data)) {
                    setJobCategories(data);
                    setTotalRows(meta?.total ?? 0);
                } else {
                    setJobCategories([]);
                    setTotalRows(0);
                }
            } catch (error) {
                console.error('Failed to fetch job categories:', error);
                showAlert('error', 'Error', 'Failed to fetch job categories');
                setJobCategories([]);
                setTotalRows(0);
            } finally {
                setIsLoading(false);
            }
        },
        [perPage, search]
    );

    useEffect(() => {
        fetchJobCategories(page);
    }, [page, fetchJobCategories]);

    // ================= SEARCH =================
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput); // Update search state with current input
        setPage(1);
    };

    // ================= PAGINATION =================
    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handlePerRowsChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setPage(1); // Reset to first page when changing rows per page
    };

    // ================= FORM HANDLERS =================
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
            fetchJobCategories(page);
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
            fetchJobCategories(page);
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

    // ================= TABLE COLUMNS =================
    const columns: TableColumn<JobCategory>[] = [
        {
            name: 'Title',
            selector: (row) => row.title,
            sortable: true,
            minWidth: '180px',
        },
        {
            name: 'Description',
            selector: (row) => row.description || 'No description',
            sortable: true,
            grow: 2,
        },
        {
            name: 'Jobs Count',
            cell: (row) => (
                <Badge
                    className={
                        row.jobs_count && row.jobs_count > 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                    }
                >
                    {row.jobs_count || 0} jobs
                </Badge>
            ),
            minWidth: '120px',
        },
        {
            name: 'Created',
            selector: (row) => formatDate(row.created_at),
            sortable: true,
            minWidth: '120px',
        },
        {
            name: 'Updated',
            selector: (row) => formatDate(row.updated_at),
            sortable: true,
            minWidth: '120px',
        },
        {
            name: 'Actions',
            cell: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(row)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <div
                            title={
                                (row.jobs_count ?? 0) > 0
                                    ? 'Cannot delete: Category has jobs assigned'
                                    : undefined
                            }
                        >
                            <DropdownMenuItem
                                onClick={() => {
                                    if ((row.jobs_count ?? 0) === 0) {
                                        handleDelete(row.id);
                                    }
                                }}
                                className={`text-red-600 ${(row.jobs_count ?? 0) > 0 ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            ignoreRowClick: true,
            width: '80px',
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-solarized-base02">Job Categories</h1>
                    <p className="text-solarized-base01">Manage job categories for recruitment</p>
                </div>
                <div className="flex items-center gap-4">
                    <form onSubmit={handleSearchSubmit} className="flex gap-2">
                        <Input
                            type="search"
                            placeholder="Search categories..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-[250px]"
                        />
                        <Button type="submit" variant="outline" size="icon">
                            <Search className="h-4 w-4" />
                        </Button>
                    </form>
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

            <Card>
                <CardHeader>
                    <CardTitle>Job Categories List</CardTitle>
                </CardHeader>
                <CardContent>
                    {!isLoading && jobCategories.length === 0 ? (
                        <div className="text-center py-12">
                            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium">
                                {search ? 'No matching categories found' : 'No job categories found'}
                            </h3>
                            <p className="text-muted-foreground mt-1">
                                {search
                                    ? 'Try a different search term'
                                    : 'Create your first job category to get started.'}
                            </p>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={jobCategories}
                            progressPending={isLoading}
                            pagination
                            paginationServer
                            paginationTotalRows={totalRows}
                            paginationPerPage={perPage}
                            paginationRowsPerPageOptions={[5, 10, 15, 20]}
                            paginationDefaultPage={page}
                            onChangePage={handlePageChange}
                            onChangeRowsPerPage={handlePerRowsChange}
                            highlightOnHover
                            responsive
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
