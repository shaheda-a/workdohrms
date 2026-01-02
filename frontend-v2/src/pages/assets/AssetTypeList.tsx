import { useState, useEffect } from 'react';
import { assetTypeService } from '../../services/api';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Skeleton } from '../../components/ui/skeleton';
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Package,
} from 'lucide-react';

interface AssetType {
    id: number;
    title: string;
    description: string;
    depreciation_rate: number;
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export default function AssetTypeList() {
    const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAssetType, setEditingAssetType] = useState<AssetType | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        depreciation_rate: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchAssetTypes();
    }, [page, search]);

    const fetchAssetTypes = async () => {
        setIsLoading(true);
        try {
            const response = await assetTypeService.getAll({ page, search });
            const payload = response.data.data;

            if (Array.isArray(payload)) {
                setAssetTypes(payload);
                setMeta(null);
            } else if (payload && Array.isArray(payload.data)) {
                setAssetTypes(payload.data);
                setMeta({
                    current_page: payload.current_page,
                    last_page: payload.last_page,
                    per_page: payload.per_page,
                    total: payload.total,
                });
            } else {
                setAssetTypes([]);
                setMeta(null);
            }
        } catch (error) {
            console.error('Failed to fetch asset types:', error);
            setAssetTypes([]);
            showAlert('error', 'Error', 'Failed to fetch asset types');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (assetType: AssetType) => {
        setEditingAssetType(assetType);
        setFormData({
            title: assetType.title,
            description: assetType.description || '',
            depreciation_rate: assetType.depreciation_rate?.toString() || '',
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        const result = await showConfirmDialog('Delete Asset Type', 'Are you sure you want to delete this asset type?');
        if (!result.isConfirmed) return;
        try {
            await assetTypeService.delete(id);
            showAlert('success', 'Deleted!', 'Asset type deleted successfully', 2000);
            fetchAssetTypes();
        } catch (error) {
            console.error('Failed to delete asset type:', error);
            const errorMessage = getErrorMessage(error, 'Failed to delete asset type');
            showAlert('error', 'Error', errorMessage);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            depreciation_rate: '',
        });
        setEditingAssetType(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingAssetType) {
                await assetTypeService.update(editingAssetType.id, formData);
                showAlert('success', 'Success', 'Asset type updated successfully', 2000);
            } else {
                await assetTypeService.create(formData);
                showAlert('success', 'Success', 'Asset type created successfully', 2000);
            }
            setIsDialogOpen(false);
            resetForm();
            fetchAssetTypes();
        } catch (error) {
            console.error('Failed to save asset type:', error);
            const errorMessage = getErrorMessage(error, 'Failed to save asset type');
            showAlert('error', 'Error', errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-solarized-base02">Asset Types</h1>
                    <p className="text-solarized-base01">Manage asset type categories</p>
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
                            Add Asset Type
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingAssetType ? 'Edit Asset Type' : 'Add New Asset Type'}</DialogTitle>
                            <DialogDescription>
                                {editingAssetType ? 'Update the asset type details.' : 'Add a new asset type.'}
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
                                        placeholder="e.g., Laptop, Vehicle, Furniture"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brief description of this asset type"
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="depreciation_rate">Depreciation Rate (%)</Label>
                                    <Input
                                        id="depreciation_rate"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={formData.depreciation_rate}
                                        onChange={(e) => setFormData({ ...formData, depreciation_rate: e.target.value })}
                                        placeholder="e.g., 20"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : (editingAssetType ? 'Update' : 'Create')}
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
                                placeholder="Search asset types..."
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
                    ) : assetTypes.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-solarized-base02">No asset types found</h3>
                            <p className="text-solarized-base01 mt-1">Get started by adding your first asset type.</p>
                            <Button
                                className="mt-4 bg-solarized-blue hover:bg-solarized-blue/90"
                                onClick={() => {
                                    resetForm();
                                    setIsDialogOpen(true);
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Asset Type
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Depreciation Rate</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {assetTypes.map((assetType) => (
                                            <TableRow key={assetType.id}>
                                                <TableCell className="font-medium text-solarized-base02">
                                                    {assetType.title}
                                                </TableCell>
                                                <TableCell>{assetType.description || '-'}</TableCell>
                                                <TableCell>{assetType.depreciation_rate ? `${assetType.depreciation_rate}%` : '-'}</TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleEdit(assetType)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(assetType.id)}
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
