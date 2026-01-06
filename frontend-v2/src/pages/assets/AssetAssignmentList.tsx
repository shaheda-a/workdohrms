import { useState, useEffect, useCallback } from 'react';
import { assetService, staffService } from '../../services/api';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
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
import {
    Plus,
    Search,
    ClipboardList,
    MoreHorizontal,
    Eye,
    RotateCcw,
} from 'lucide-react';
import DataTable, { TableColumn } from 'react-data-table-component';

interface Asset {
    id: number;
    name: string;
    asset_code: string;
    status: string;
    assigned_to?: number;
    assigned_employee?: {
        id: number;
        full_name: string;
    };
    assigned_date?: string;
    asset_type?: {
        id: number;
        title: string;
    };
}

interface Staff {
    id: number;
    full_name: string;
    email: string;
}

export default function AssetAssignmentList() {
    const [assignments, setAssignments] = useState<Asset[]>([]);
    const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
    const [formData, setFormData] = useState({
        asset_id: '',
        staff_member_id: '',
        notes: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pagination & Sorting State
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);
    const [sortField, setSortField] = useState<string>('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Fetch assignments with pagination
    const fetchAssignments = useCallback(
        async (currentPage: number = 1) => {
            setIsLoading(true);
            try {
                const params: Record<string, unknown> = {
                    status: 'assigned',
                    page: currentPage,
                    per_page: perPage,
                    search: searchQuery,
                };

                if (sortField) {
                    params.order_by = sortField;
                    params.order = sortDirection;
                }

                const response = await assetService.getAll(params);
                const { data, meta } = response.data;

                if (Array.isArray(data)) {
                    setAssignments(data);
                    setTotalRows(meta?.total ?? 0);
                } else {
                    setAssignments([]);
                    setTotalRows(0);
                }
            } catch (error) {
                console.error('Failed to fetch assignments:', error);
                showAlert('error', 'Error', 'Failed to fetch assignments');
                setAssignments([]);
                setTotalRows(0);
            } finally {
                setIsLoading(false);
            }
        },
        [perPage, searchQuery, sortField, sortDirection]
    );

    const fetchAvailableAssets = async () => {
        try {
            const response = await assetService.getAvailable();
            const data = response.data.data || response.data;
            setAvailableAssets(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch available assets:', error);
        }
    };

    const fetchStaff = async () => {
        try {
            const response = await staffService.getAll({ per_page: 100 });
            const payload = response.data.data;
            if (payload && Array.isArray(payload.data)) {
                setStaffList(payload.data);
            } else if (Array.isArray(payload)) {
                setStaffList(payload);
            }
        } catch (error) {
            console.error('Failed to fetch staff:', error);
        }
    };

    useEffect(() => {
        fetchAssignments(page);
    }, [page, fetchAssignments]);

    useEffect(() => {
        if (isDialogOpen) {
            fetchAvailableAssets();
            fetchStaff();
        }
    }, [isDialogOpen]);

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

    // Sorting Handler - Name column is sortable
    const handleSort = (column: TableColumn<Asset>, sortDirection: 'asc' | 'desc') => {
        if (column.name === 'Asset') {
            setSortField('name');
            setSortDirection(sortDirection);
            setPage(1);
        }
    };

    const resetForm = () => {
        setFormData({
            asset_id: '',
            staff_member_id: '',
            notes: '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.asset_id || !formData.staff_member_id) {
            showAlert('error', 'Error', 'Please select both an asset and a staff member');
            return;
        }

        setIsSubmitting(true);
        try {
            await assetService.assignAsset(Number(formData.asset_id), {
                staff_member_id: Number(formData.staff_member_id),
                notes: formData.notes
            });

            showAlert('success', 'Success', 'Asset assigned successfully', 2000);
            setIsDialogOpen(false);
            resetForm();
            fetchAssignments(page);
        } catch (error) {
            console.error('Failed to assign asset:', error);
            showAlert('error', 'Error', getErrorMessage(error, 'Failed to assign asset'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleView = (asset: Asset) => {
        setViewingAsset(asset);
        setIsViewDialogOpen(true);
    };

    const handleReturn = async (asset: Asset) => {
        const result = await showConfirmDialog(
            'Return Asset',
            `Are you sure you want to return "${asset.name}" from ${asset.assigned_employee?.full_name}?`
        );
        if (!result.isConfirmed) return;

        try {
            await assetService.returnAsset(asset.id);
            showAlert('success', 'Success', 'Asset returned successfully', 2000);
            fetchAssignments(page);
        } catch (error) {
            console.error('Failed to return asset:', error);
            showAlert('error', 'Error', getErrorMessage(error, 'Failed to return asset'));
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return '-';
        }
    };

    // Table Columns
    const columns: TableColumn<Asset>[] = [
        {
            name: 'Asset',
            selector: (row) => row.name,
            cell: (row) => (
                <div>
                    <span className="font-medium">{row.name}</span>
                    <span className="block text-xs text-solarized-base01 font-mono">{row.asset_code}</span>
                </div>
            ),
            sortable: true,
            minWidth: '180px',
        },
        {
            name: 'Type',
            selector: (row) => row.asset_type?.title || '-',
        },
        {
            name: 'Assigned To',
            selector: (row) => row.assigned_employee?.full_name || 'Unknown',
            cell: (row) => (
                <span className="font-medium text-solarized-base02">
                    {row.assigned_employee?.full_name || 'Unknown'}
                </span>
            ),
        },
        {
            name: 'Assigned Date',
            selector: (row) => row.assigned_date || '',
            cell: (row) => row.assigned_date ? formatDate(row.assigned_date) : '-',
        },
        {
            name: 'Status',
            cell: (row) => (
                <Badge className="bg-solarized-blue/10 text-solarized-blue">
                    {row.status}
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
                        <DropdownMenuItem onClick={() => handleView(row)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleReturn(row)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Return Asset
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
                    <h1 className="text-2xl font-bold text-solarized-base02">Asset Assignments</h1>
                    <p className="text-solarized-base01">Manage asset allocation to staff</p>
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
                            New Assignment
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Assign Asset</DialogTitle>
                            <DialogDescription>
                                Select an available asset and assign it to a staff member.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="asset">Asset *</Label>
                                    <Select
                                        value={formData.asset_id}
                                        onValueChange={(value) => setFormData({ ...formData, asset_id: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select asset" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableAssets.length === 0 ? (
                                                <SelectItem value="none" disabled>No available assets</SelectItem>
                                            ) : (
                                                availableAssets.map((asset) => (
                                                    <SelectItem key={asset.id} value={String(asset.id)}>
                                                        {asset.name} ({asset.asset_code})
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="staff">Staff Member *</Label>
                                    <Select
                                        value={formData.staff_member_id}
                                        onValueChange={(value) => setFormData({ ...formData, staff_member_id: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select staff member" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {staffList.map((staff) => (
                                                <SelectItem key={staff.id} value={String(staff.id)}>
                                                    {staff.full_name}
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
                                        placeholder="Additional comments..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90" disabled={isSubmitting}>
                                    {isSubmitting ? 'Assigning...' : 'Assign'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* View Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assignment Details</DialogTitle>
                        <DialogDescription>View the details of this assignment</DialogDescription>
                    </DialogHeader>
                    {viewingAsset && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-solarized-base01">Asset</Label>
                                    <p className="font-medium">{viewingAsset.name}</p>
                                </div>
                                <div>
                                    <Label className="text-solarized-base01">Asset Code</Label>
                                    <p className="font-mono">{viewingAsset.asset_code}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-solarized-base01">Type</Label>
                                    <p>{viewingAsset.asset_type?.title || '-'}</p>
                                </div>
                                <div>
                                    <Label className="text-solarized-base01">Status</Label>
                                    <div className="mt-1">
                                        <Badge className="bg-solarized-blue/10 text-solarized-blue">
                                            {viewingAsset.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-solarized-base01">Assigned To</Label>
                                    <p className="font-medium">{viewingAsset.assigned_employee?.full_name || 'Unknown'}</p>
                                </div>
                                <div>
                                    <Label className="text-solarized-base01">Assigned Date</Label>
                                    <p>{viewingAsset.assigned_date ? formatDate(viewingAsset.assigned_date) : '-'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                            Close
                        </Button>
                        <Button
                            className="bg-solarized-orange hover:bg-solarized-orange/90"
                            onClick={() => {
                                if (viewingAsset) {
                                    handleReturn(viewingAsset);
                                    setIsViewDialogOpen(false);
                                }
                            }}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Return Asset
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card className="border-0 shadow-md">
                <CardHeader>
                    <CardTitle>Assignment List</CardTitle>
                    <form onSubmit={handleSearchSubmit} className="flex gap-4 mt-4">
                        <Input
                            placeholder="Search assignments..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <Button type="submit" variant="outline">
                            <Search className="mr-2 h-4 w-4" /> Search
                        </Button>
                    </form>
                </CardHeader>
                <CardContent>
                    {!isLoading && assignments.length === 0 ? (
                        <div className="text-center py-12">
                            <ClipboardList className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-solarized-base02">No active assignments</h3>
                            <p className="text-solarized-base01 mt-1">Assignments will appear here once assets are assigned to staff.</p>
                            <Button
                                className="mt-4 bg-solarized-blue hover:bg-solarized-blue/90"
                                onClick={() => {
                                    resetForm();
                                    setIsDialogOpen(true);
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                New Assignment
                            </Button>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={assignments}
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