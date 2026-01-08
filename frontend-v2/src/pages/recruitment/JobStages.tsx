import { useState, useEffect, useCallback } from 'react';
import { recruitmentService } from '../../services/api';
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
} from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import DataTable, { TableColumn } from 'react-data-table-component';
import { Plus, Edit, Trash2, Check, MoreHorizontal, Search, Eye } from 'lucide-react';

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

    // Pagination & Sorting State
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);
    const [sortField, setSortField] = useState<string>('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedStage, setSelectedStage] = useState<JobStage | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        color: '#6366f1',
        is_default: false,
    });

    // ================= FETCH STAGES =================
    const fetchStages = useCallback(
        async (currentPage: number = 1) => {
            setIsLoading(true);
            try {
                const params: Record<string, unknown> = {
                    page: currentPage,
                    per_page: perPage,
                    search: searchQuery,
                    paginate: true,
                };

                if (sortField) {
                    params.order_by = sortField;
                    params.order = sortDirection;
                }

                const response = await recruitmentService.getJobStages(params);
                const { data, meta } = response.data;

                if (Array.isArray(data)) {
                    setStages(data);
                    setTotalRows(meta?.total ?? 0);
                } else {
                    setStages([]);
                    setTotalRows(0);
                }
            } catch (error) {
                console.error('Failed to fetch job stages:', error);
                showAlert('error', 'Error', getErrorMessage(error, 'Failed to fetch job stages'));
                setStages([]);
                setTotalRows(0);
            } finally {
                setIsLoading(false);
            }
        },
        [perPage, searchQuery, sortField, sortDirection]
    );

    useEffect(() => {
        fetchStages(page);
    }, [page, fetchStages]);

    // ================= SEARCH =================
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(searchInput);
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

    // ================= SORTING =================
    const handleSort = (column: TableColumn<JobStage>, direction: 'asc' | 'desc') => {
        const columnId = String(column.id || '');
        if (columnId === 'title' || column.name === 'Stage Title') {
            setSortField('title');
            setSortDirection(direction);
            setPage(1);
        }
    };

    // ================= CRUD OPERATIONS =================
    const resetForm = () => {
        setIsEditMode(false);
        setSelectedStage(null);
        setFormData({
            title: '',
            color: '#6366f1',
            is_default: false,
        });
    };

    const handleAddClick = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const handleViewClick = (stage: JobStage) => {
        setSelectedStage(stage);
        setIsViewOpen(true);
    };

    const handleEditClick = (stage: JobStage) => {
        setIsEditMode(true);
        setSelectedStage(stage);
        setFormData({
            title: stage.title,
            color: stage.color,
            is_default: stage.is_default,
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title) {
            showAlert('error', 'Error', 'Please enter a stage title');
            return;
        }

        try {
            if (isEditMode && selectedStage) {
                await recruitmentService.updateJobStage(selectedStage.id, formData);
                showAlert('success', 'Success', 'Job stage updated successfully', 2000);
            } else {
                await recruitmentService.createJobStage(formData);
                showAlert('success', 'Success', 'Job stage created successfully', 2000);
            }

            setIsDialogOpen(false);
            resetForm();
            fetchStages(page);
        } catch (error) {
            console.error('Failed to save job stage:', error);
            showAlert('error', 'Error', getErrorMessage(error, 'Failed to save job stage'));
        }
    };

    const handleDelete = async (id: number) => {
        const result = await showConfirmDialog(
            'Delete Job Stage',
            'Are you sure you want to delete this stage?'
        );

        if (!result.isConfirmed) return;

        try {
            await recruitmentService.deleteJobStage(id);
            showAlert('success', 'Deleted!', 'Job stage deleted successfully', 2000);
            fetchStages(page);
        } catch (error) {
            console.error('Failed to delete job stage:', error);
            showAlert('error', 'Error', getErrorMessage(error, 'Failed to delete job stage'));
        }
    };

    // ================= HELPERS =================
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return 'Invalid Date';
        }
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
    ];

    const defaultStageCount = stages.filter((stage) => stage.is_default).length;

    // ================= TABLE COLUMNS =================
    const columns: TableColumn<JobStage>[] = [
        {
            id: 'title',
            name: 'Stage Title',
            selector: (row) => row.title,
            cell: (row) => <span className="font-medium">{row.title}</span>,
            sortable: true,
            minWidth: '180px',
        },
        {
            name: 'Color',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: row.color }}
                    />
                    <span className="text-xs font-mono text-solarized-base01">{row.color}</span>
                </div>
            ),
            width: '140px',
        },
        {
            name: 'Order',
            cell: (row) => <Badge variant="outline">{row.order}</Badge>,
            width: '90px',
        },
        {
            name: 'Default',
            cell: (row) =>
                row.is_default ? (
                    <Badge className="bg-solarized-green/10 text-solarized-green">
                        <Check className="h-3 w-3 mr-1" />
                        Default
                    </Badge>
                ) : (
                    <Badge variant="outline">No</Badge>
                ),
            width: '110px',
        },
        {
            name: 'Created',
            selector: (row) => row.created_at,
            cell: (row) => <span className="text-sm">{formatDate(row.created_at)}</span>,
            width: '120px',
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
                        <DropdownMenuItem onClick={() => handleViewClick(row)}>
                            <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClick(row)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleDelete(row.id)}
                            className="text-solarized-red"
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

    // Custom Styles for DataTable
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

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-solarized-base02">Job Stages</h1>
                    <p className="text-solarized-base01">Manage recruitment pipeline stages</p>
                </div>
                <Button className="bg-solarized-blue hover:bg-solarized-blue/90" onClick={handleAddClick}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Stage
                </Button>
            </div>

            {/* TABLE */}
            <Card className="border-0 shadow-md">
                <CardHeader>
                    <CardTitle>Recruitment Pipeline Stages</CardTitle>
                    <CardDescription>
                        Manage the stages that applications go through in your recruitment process
                    </CardDescription>
                    <form onSubmit={handleSearchSubmit} className="flex gap-4 mt-4">
                        <Input
                            placeholder="Search by title..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <Button type="submit" variant="outline">
                            <Search className="mr-2 h-4 w-4" /> Search
                        </Button>
                    </form>
                </CardHeader>
                <CardContent>
                    {!isLoading && stages.length === 0 ? (
                        <div className="text-center py-12">
                            <Plus className="mx-auto h-12 w-12 text-solarized-base01 mb-4" />
                            <h3 className="text-lg font-medium text-solarized-base02">No stages created</h3>
                            <p className="text-solarized-base01 mt-1">
                                Create your first stage to start building your recruitment pipeline.
                            </p>
                            <Button
                                className="mt-4 bg-solarized-blue hover:bg-solarized-blue/90"
                                onClick={handleAddClick}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Stage
                            </Button>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={stages}
                            progressPending={isLoading}
                            pagination
                            paginationServer
                            paginationTotalRows={totalRows}
                            paginationPerPage={perPage}
                            paginationDefaultPage={page}
                            onChangePage={handlePageChange}
                            onChangeRowsPerPage={handlePerRowsChange}
                            onSort={handleSort}
                            customStyles={customStyles}
                            sortServer
                            defaultSortFieldId="title"
                            defaultSortAsc={true}
                            highlightOnHover
                            responsive
                        />
                    )}
                </CardContent>
            </Card>

            {/* VIEW DIALOG */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Job Stage Details</DialogTitle>
                        <DialogDescription>View the details of this job stage</DialogDescription>
                    </DialogHeader>

                    {selectedStage && (
                        <div className="space-y-4 py-4">
                            <div>
                                <Label className="text-solarized-base01">Title</Label>
                                <p className="font-medium text-lg">{selectedStage.title}</p>
                            </div>

                            <div>
                                <Label className="text-solarized-base01">Color</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <div
                                        className="w-6 h-6 rounded-full border"
                                        style={{ backgroundColor: selectedStage.color }}
                                    />
                                    <span className="font-mono">{selectedStage.color}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-solarized-base01">Order</Label>
                                    <div className="mt-1">
                                        <Badge variant="outline">{selectedStage.order}</Badge>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-solarized-base01">Default</Label>
                                    <div className="mt-1">
                                        {selectedStage.is_default ? (
                                            <Badge className="bg-solarized-green/10 text-solarized-green">
                                                <Check className="h-3 w-3 mr-1" />
                                                Default
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">No</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <div>
                                    <Label className="text-xs text-solarized-base01">Created At</Label>
                                    <p className="text-sm">{formatDate(selectedStage.created_at)}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-solarized-base01">Updated At</Label>
                                    <p className="text-sm">{formatDate(selectedStage.updated_at)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                            Close
                        </Button>
                        <Button
                            className="bg-solarized-blue hover:bg-solarized-blue/90"
                            onClick={() => {
                                if (selectedStage) {
                                    handleEditClick(selectedStage);
                                    setIsViewOpen(false);
                                }
                            }}
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ADD/EDIT DIALOG */}
            <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                    if (!open) resetForm();
                    setIsDialogOpen(open);
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? 'Edit Job Stage' : 'Add Job Stage'}</DialogTitle>
                        <DialogDescription>
                            {isEditMode
                                ? 'Update stage details'
                                : 'Create a new stage for your recruitment pipeline'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Stage Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Phone Screen, Technical Interview"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Color</Label>
                                <div className="grid grid-cols-5 gap-2">
                                    {colorOptions.map((color) => (
                                        <button
                                            key={color.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color: color.value })}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.color === color.value
                                                    ? 'ring-2 ring-offset-2 ring-solarized-blue'
                                                    : ''
                                                }`}
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
                                        onChange={(e) =>
                                            setFormData({ ...formData, is_default: e.target.checked })
                                        }
                                        className="rounded border-solarized-base01"
                                    />
                                    Set as default stage for new applications
                                </Label>
                                <p className="text-sm text-solarized-base01">
                                    {defaultStageCount > 0 && !formData.is_default ? (
                                        <span className="text-solarized-yellow">
                                            Note: There's already a default stage.
                                        </span>
                                    ) : (
                                        'New applications will start in this stage'
                                    )}
                                </p>
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
                            <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90">
                                {isEditMode ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}