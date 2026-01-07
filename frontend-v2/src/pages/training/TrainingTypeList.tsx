import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
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
    Edit,
    Trash2,
    BookOpen,
    MoreHorizontal,
    Plus,
    Search,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import { trainingService } from '../../services/api';
import DataTable, { TableColumn } from 'react-data-table-component';



interface TrainingType {
    id: number;
    title: string;
    description: string | null;
    default_duration: string | null;
    created_at: string;
}

export default function TrainingTypeList() {
    const [types, setTypes] = useState<TrainingType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingType, setEditingType] = useState<TrainingType | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        default_duration: '',
    });

    const fetchTypes = useCallback(
        async (currentPage: number = 1) => {
            setIsLoading(true);
            try {
                const params: Record<string, unknown> = {
                    page: currentPage,
                    per_page: perPage,
                    search,
                };

                const response = await trainingService.getTypes(params);
                const payload = response.data.data;

                if (Array.isArray(payload)) {
                    setTypes(payload);
                    setTotalRows(response.data.meta?.total ?? payload.length);
                } else if (payload && Array.isArray(payload.data)) {
                    setTypes(payload.data);
                    setTotalRows(payload.total);
                } else {
                    setTypes([]);
                    setTotalRows(0);
                }
            } catch (error) {
                console.error('Failed to fetch training types:', error);
                setTypes([]);
                setTotalRows(0);
            } finally {
                setIsLoading(false);
            }
        },
        [perPage, search]
    );

    useEffect(() => {
        fetchTypes(page);
    }, [page, fetchTypes]);



    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            default_duration: '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                title: formData.title,
                description: formData.description || null,
                default_duration: formData.default_duration || null,
            };

            if (editingType) {
                await trainingService.updateType(editingType.id, data);
            } else {
                await trainingService.createType(data);
            }

            setIsDialogOpen(false);
            setEditingType(null);
            resetForm();
            fetchTypes(page);
            showAlert('success', 'Success', editingType ? 'Training type updated successfully' : 'Training type created successfully', 2000);
        } catch (error) {
            console.error('Failed to save training type:', error);
        }
    };

    const handleEdit = (type: TrainingType) => {
        setEditingType(type);
        setFormData({
            title: type.title,
            description: type.description || '',
            default_duration: type.default_duration || '',
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        const result = await showConfirmDialog(
            'Are you sure?',
            'You want to delete this training type?'
        );

        if (!result.isConfirmed) return;

        try {
            await trainingService.deleteType(id);
            showAlert('success', 'Deleted!', 'Training type deleted successfully', 2000);
            fetchTypes(page);
        } catch (error) {
            console.error('Failed to delete training type:', error);
            showAlert('error', 'Error', getErrorMessage(error, 'Failed to delete training type'));
        }
    };

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

    // ================= TABLE COLUMNS =================
    const columns: TableColumn<TrainingType>[] = [
        {
            name: 'Title',
            selector: (row) => row.title,
            sortable: true,
            minWidth: '200px',
        },
        {
            name: 'Description',
            selector: (row) => row.description || '',
            cell: (row) => (
                <p className="truncate max-w-[300px]" title={row.description || ''}>
                    {row.description || '-'}
                </p>
            ),
            sortable: true,
        },
        {
            name: 'Default Duration',
            selector: (row) => row.default_duration || '',
            sortable: true,
            width: '150px',
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
                        <DropdownMenuItem onClick={() => handleEdit(row)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(row.id)}
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-solarized-base02">Training Types</h1>
                    <p className="text-solarized-base01">Manage training categories and types</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            className="bg-solarized-blue hover:bg-solarized-blue/90"
                            onClick={() => {
                                setEditingType(null);
                                resetForm();
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Training Type
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{editingType ? 'Edit Training Type' : 'Add Training Type'}</DialogTitle>
                            <DialogDescription>
                                {editingType ? 'Update training type details.' : 'Create a new training type.'}
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
                                        placeholder="e.g., Leadership Training"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brief description..."
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="default_duration">Default Duration</Label>
                                    <Input
                                        id="default_duration"
                                        value={formData.default_duration}
                                        onChange={(e) => setFormData({ ...formData, default_duration: e.target.value })}
                                        placeholder="e.g., 3 days, 2 weeks"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90">
                                    {editingType ? 'Update' : 'Create'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <form onSubmit={handleSearchSubmit} className="flex gap-4">
                        <Input
                            placeholder="Search training types..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Button type="submit" variant="outline">
                            <Search className="mr-2 h-4 w-4" /> Search
                        </Button>
                    </form>
                </CardHeader>

                <CardContent>
                    {!isLoading && types.length === 0 ? (
                        <div className="text-center py-12">
                            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p>No training types found</p>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={types}
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
        </div>
    );
}
