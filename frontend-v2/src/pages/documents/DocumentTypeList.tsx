import { useState, useEffect } from 'react';
import { documentTypeService } from '../../services/api';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
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
import { Skeleton } from '../../components/ui/skeleton';
import { Badge } from '../../components/ui/badge';
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
    FileText,
} from 'lucide-react';

interface DocumentType {
    id: number;
    title: string;
    notes: string;
    owner_type: string;
    is_active: boolean;
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

const OWNER_TYPES = [
    { value: 'employee', label: 'Employee' },
    { value: 'company', label: 'Company' },
    { value: 'accountant', label: 'Accountant' },
];

export default function DocumentTypeList() {
    const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

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

    useEffect(() => {
        fetchDocumentTypes();
    }, [page, search]);

    const fetchDocumentTypes = async () => {
        setIsLoading(true);
        try {
            const response = await documentTypeService.getAll({ page, search });
            const payload = response.data.data;

            if (Array.isArray(payload)) {
                setDocumentTypes(payload);
                setMeta(null);
            } else if (payload && Array.isArray(payload.data)) {
                setDocumentTypes(payload.data);
                setMeta({
                    current_page: payload.current_page,
                    last_page: payload.last_page,
                    per_page: payload.per_page,
                    total: payload.total,
                });
            } else {
                setDocumentTypes([]);
                setMeta(null);
            }
        } catch (error) {
            console.error('Failed to fetch document types:', error);
            setDocumentTypes([]);
            showAlert('error', 'Error', 'Failed to fetch document types');
        } finally {
            setIsLoading(false);
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
            fetchDocumentTypes();
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
            fetchDocumentTypes();
        } catch (error) {
            console.error('Failed to save document type:', error);
            const errorMessage = getErrorMessage(error, 'Failed to save document type');
            showAlert('error', 'Error', errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getOwnerTypeLabel = (value: string) => {
        return OWNER_TYPES.find(type => type.value === value)?.label || value;
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
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-solarized-base01" />
                            <Input
                                placeholder="Search document types..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : documentTypes.length === 0 ? (
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
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Owner Type</TableHead>
                                            <TableHead>Notes</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {documentTypes.map((docType) => (
                                            <TableRow key={docType.id}>
                                                <TableCell className="font-medium text-solarized-base02">
                                                    {docType.title}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {getOwnerTypeLabel(docType.owner_type)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{docType.notes || '-'}</TableCell>
                                                <TableCell>
                                                    <Badge className={docType.is_active ? 'bg-solarized-green/10 text-solarized-green' : 'bg-solarized-base01/10 text-solarized-base01'}>
                                                        {docType.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleEdit(docType)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(docType.id)}
                                                                className="text-solarized-red"
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
                            </div>

                            {meta && meta.last_page > 1 && (
                                <div className="flex items-center justify-between mt-6">
                                    <p className="text-sm text-solarized-base01">
                                        Showing {(meta.current_page - 1) * meta.per_page + 1} to{' '}
                                        {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total} results
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(page - 1)}
                                            disabled={page === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Previous
                                        </Button>
                                        <span className="text-sm text-solarized-base01">
                                            Page {meta.current_page} of {meta.last_page}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(page + 1)}
                                            disabled={page === meta.last_page}
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
