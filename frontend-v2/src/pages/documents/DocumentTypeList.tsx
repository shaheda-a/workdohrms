import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentTypeService } from '../../services/api';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Badge } from '../../components/ui/badge';
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    FileText,
    Eye,
} from 'lucide-react';
import DataTable, { TableColumn } from 'react-data-table-component';

interface DocumentType {
    id: number;
    title: string;
    notes: string;
    owner_type: string;
    is_active: boolean;
}

const OWNER_TYPES = [
    { value: 'employee', label: 'Employee' },
    { value: 'company', label: 'Company' },
    { value: 'accountant', label: 'Accountant' },
];

export default function DocumentTypeList() {
    const navigate = useNavigate();
    const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Pagination & Sorting State
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);
    const [sortField, setSortField] = useState<string>('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDocumentType, setEditingDocumentType] = useState<DocumentType | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        notes: '',
        owner_type: '',
        is_active: true,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch document types with pagination
    const fetchDocumentTypes = useCallback(
        async (currentPage: number = 1) => {
            setIsLoading(true);
            try {
                const params: Record<string, unknown> = {
                    page: currentPage,
                    per_page: perPage,
                    search: searchQuery,
                };

                if (sortField) {
                    params.order_by = sortField;
                    params.order = sortDirection;
                }

                const response = await documentTypeService.getAll(params);
                const { data, meta } = response.data;

                if (Array.isArray(data)) {
                    setDocumentTypes(data);
                    setTotalRows(meta?.total ?? 0);
                } else {
                    setDocumentTypes([]);
                    setTotalRows(0);
                }
            } catch (error) {
                console.error('Failed to fetch document types:', error);
                showAlert('error', 'Error', getErrorMessage(error, 'Failed to fetch document types'));
                setDocumentTypes([]);
                setTotalRows(0);
            } finally {
                setIsLoading(false);
            }
        },
        [perPage, searchQuery, sortField, sortDirection]
    );

    useEffect(() => {
        fetchDocumentTypes(page);
    }, [page, fetchDocumentTypes]);

    // Search Handler
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(searchInput);
        setPage(1);
    };

    // Pagination Handlers
    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handlePerRowsChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setPage(1);
    };

    // Sorting Handler - Only Title column is sortable
    const handleSort = (column: TableColumn<DocumentType>, sortDirection: 'asc' | 'desc') => {
        if (column.name === 'Title') {
            setSortField('title');
            setSortDirection(sortDirection);
            setPage(1);
        }
    };

    const handleEdit = (documentType: DocumentType) => {
        setEditingDocumentType(documentType);
        setFormData({
            title: documentType.title,
            notes: documentType.notes || '',
            owner_type: documentType.owner_type,
            is_active: documentType.is_active,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        const result = await showConfirmDialog('Delete Document Type', 'Are you sure you want to delete this document type?');
        if (!result.isConfirmed) return;
        try {
            await documentTypeService.delete(id);
            showAlert('success', 'Deleted!', 'Document type deleted successfully', 2000);
            fetchDocumentTypes(page);
        } catch (error) {
            console.error('Failed to delete document type:', error);
            const errorMessage = getErrorMessage(error, 'Failed to delete document type');
            showAlert('error', 'Error', errorMessage);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            notes: '',
            owner_type: '',
            is_active: true,
        });
        setEditingDocumentType(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingDocumentType) {
                await documentTypeService.update(editingDocumentType.id, formData);
                showAlert('success', 'Success', 'Document type updated successfully', 2000);
            } else {
                await documentTypeService.create(formData);
                showAlert('success', 'Success', 'Document type created successfully', 2000);
            }
            setIsDialogOpen(false);
            resetForm();
            fetchDocumentTypes(page);
        } catch (error) {
            console.error('Failed to save document type:', error);
            const errorMessage = getErrorMessage(error, 'Failed to save document type');
            showAlert('error', 'Error', errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Table Columns
    const columns: TableColumn<DocumentType>[] = [
        {
            name: 'Title',
            selector: (row) => row.title,
            cell: (row) => <span className="font-medium text-solarized-base02">{row.title}</span>,
            sortable: true,
            minWidth: '200px',
        },
        {
            name: 'Notes',
            selector: (row) => row.notes || '-',
            cell: (row) => (
                <span className="max-w-[250px] truncate">{row.notes || '-'}</span>
            ),
        },
        {
            name: 'Status',
            cell: (row) => (
                <Badge
                    className={
                        row.is_active
                            ? 'bg-solarized-green/10 text-solarized-green'
                            : 'bg-solarized-base01/10 text-solarized-base01'
                    }
                >
                    {row.is_active ? 'Active' : 'Inactive'}
                </Badge>
            ),
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
                                            <DropdownMenuItem onClick={() => navigate(`/documents/types/${row.id}`)}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                View
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleEdit(row)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(row.id)}
                                                className="text-solarized-red"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-solarized-base02">Document Types</h1>
                    <p className="text-solarized-base01">Manage document type categories</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            className="bg-solarized-blue hover:bg-solarized-blue/90"
                            onClick={() => {
                                resetForm();
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Document Type
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingDocumentType ? 'Edit Document Type' : 'Add New Document Type'}</DialogTitle>
                            <DialogDescription>
                                {editingDocumentType ? 'Update the document type details.' : 'Add a new document type.'}
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
                                        placeholder="e.g., Employment Contract"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="owner_type">Owner Type *</Label>
                                    <Select
                                        value={formData.owner_type}
                                        onValueChange={(value) => setFormData({ ...formData, owner_type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select owner type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {OWNER_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Additional notes..."
                                        rows={3}
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="is_active"
                                        checked={formData.is_active}
                                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                    />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : (editingDocumentType ? 'Update' : 'Create')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-0 shadow-md">
                <CardHeader>
                    <form onSubmit={handleSearchSubmit} className="flex gap-4">
                        <Input
                            placeholder="Search document types..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <Button type="submit" variant="outline">
                            <Search className="mr-2 h-4 w-4" /> Search
                        </Button>
                    </form>
                </CardHeader>
                <CardContent>
                    {!isLoading && documentTypes.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-solarized-base02">No document types found</h3>
                            <p className="text-solarized-base01 mt-1">Get started by adding your first document type.</p>
                            <Button
                                className="mt-4 bg-solarized-blue hover:bg-solarized-blue/90"
                                onClick={() => {
                                    resetForm();
                                    setIsDialogOpen(true);
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Document Type
                            </Button>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={documentTypes}
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
                            highlightOnHover
                            responsive
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
