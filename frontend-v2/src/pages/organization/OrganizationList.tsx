import { useState, useEffect, useCallback } from 'react';
import { organizationService } from '../../services/api';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent } from '../../components/ui/card';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import DataTable, { TableColumn } from 'react-data-table-component';
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    Building2,
    Eye,
    MapPin,
    Calendar,
} from 'lucide-react';

interface Organization {
    id: number;
    name: string;
    address: string;
    created_at?: string;
    updated_at?: string;
}
// export interface OrganizationListParams {
//   page?: number;
//   per_page?: number;
//   search?: string;
// }


export default function OrganizationList() {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchInput, setSearchInput] = useState(''); // What user types
    const [search, setSearch] = useState(''); // What's sent to API
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);

    // View dialog state
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [viewingOrganization, setViewingOrganization] = useState<Organization | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        user_name: '',
        email: '',
        password: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ================= FETCH ORGANIZATIONS =================
    const fetchOrganizations = useCallback(
        async (currentPage: number = 1) => {
            setIsLoading(true);
            try {
                const response = await organizationService.getAll({
                    page: currentPage,
                    per_page: perPage,
                    search,
                });

                const { data, meta } = response.data;

                if (Array.isArray(data)) {
                    setOrganizations(data);
                    setTotalRows(meta?.total ?? 0);
                } else {
                    setOrganizations([]);
                    setTotalRows(0);
                }
            } catch (error) {
                console.error('Failed to fetch organizations:', error);
                showAlert('error', 'Error', getErrorMessage(error, 'Failed to fetch organizations'));
                setOrganizations([]);
                setTotalRows(0);
            } finally {
                setIsLoading(false);
            }
        },
        [perPage, search]
    );

    useEffect(() => {
        fetchOrganizations(page);
    }, [page, fetchOrganizations]);

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

        // ================= DIALOG HANDLERS =================
        const handleView = (org: Organization) => {
            setViewingOrganization(org);
            setIsViewDialogOpen(true);
        };

        const handleEdit = (org: Organization) => {
            setEditingOrganization(org);
            setFormData({
                name: org.name,
                address: org.address || '',
                user_name: '',
                email: '',
                password: '',
            });
            setIsDialogOpen(true);
        };

    const handleDelete = async (id: number) => {
        const result = await showConfirmDialog('Delete Organization', 'Are you sure you want to delete this organization?');
        if (!result.isConfirmed) return;
        try {
            await organizationService.delete(id);
            showAlert('success', 'Deleted!', 'Organization deleted successfully', 2000);
            fetchOrganizations(page);
        } catch (error) {
            console.error('Failed to delete organization:', error);
            const errorMessage = getErrorMessage(error, 'Failed to delete organization');
            showAlert('error', 'Error', errorMessage);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            address: '',
            user_name: '',
            email: '',
            password: '',
        });
        setEditingOrganization(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingOrganization) {
                await organizationService.update(editingOrganization.id, formData);
                showAlert('success', 'Success', 'Organization updated successfully', 2000);
            } else {
                // Backend expects 'org_name' for create
                const createPayload = {
                    org_name: formData.name,
                    address: formData.address,
                    user_name: formData.user_name,
                    email: formData.email,
                    password: formData.password,
                };
                await organizationService.create(createPayload);
                showAlert('success', 'Success', 'Organization created successfully', 2000);
            }
            setIsDialogOpen(false);
            resetForm();
            fetchOrganizations(page);
        } catch (error) {
            console.error('Failed to save organization:', error);
            const errorMessage = getErrorMessage(error, 'Failed to save organization');
            showAlert('error', 'Error', errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ================= TABLE COLUMNS =================
    const columns: TableColumn<Organization>[] = [
        {
            name: 'Name',
            selector: (row) => row.name,
            sortable: true,
            minWidth: '200px',
        },
        {
            name: 'Address',
            selector: (row) => row.address || '-',
            sortable: true,
            grow: 2,
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
                                                                    <Eye className="mr-2 h-4 w-4" /> View
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleEdit(row)}>
                                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDelete(row.id)}
                                                                    className="text-red-600"
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

    // ================= UI =================
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Organizations</h1>
                    <p className="text-muted-foreground">Manage your client organizations</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-solarized-blue hover:bg-solarized-blue/90" onClick={() => resetForm()}>
                            <Plus className="mr-2 h-4 w-4" /> Add Organization
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingOrganization ? 'Edit Organization' : 'Add New Organization'}</DialogTitle>
                            <DialogDescription>
                                {editingOrganization ? 'Update the organization details.' : 'Add a new organization.'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Organization Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Acme Corp"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Textarea
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="123 Main St, City, Country"
                                        rows={3}
                                    />
                                </div>

                                {!editingOrganization && (
                                    <>
                                        <hr />
                                        <div className="space-y-2">
                                            <Label htmlFor="user_name">Admin Name *</Label>
                                            <Input
                                                id="user_name"
                                                value={formData.user_name}
                                                onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                                                placeholder="John Doe"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Admin Email *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="admin@example.com"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                placeholder="Default: password123"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : (editingOrganization ? 'Update' : 'Create')}
                                </Button>
                            </DialogFooter>
                        </form>
                                </DialogContent>
                            </Dialog>

                            {/* View Organization Dialog */}
                            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                            <Building2 className="h-5 w-5 text-solarized-blue" />
                                            Organization Details
                                        </DialogTitle>
                                        <DialogDescription>
                                            View organization information
                                        </DialogDescription>
                                    </DialogHeader>
                                                                        {viewingOrganization && (
                                                                            <div className="space-y-4 py-4">
                                                                                <div className="space-y-2">
                                                                                    <Label className="text-sm text-muted-foreground">Organization Name</Label>
                                                                                    <p className="text-lg font-semibold">{viewingOrganization.name}</p>
                                                                                </div>
                                                                                <div className="space-y-2">
                                                                                    <Label className="text-sm text-muted-foreground flex items-center gap-1">
                                                                                        <MapPin className="h-4 w-4" /> Address
                                                                                    </Label>
                                                                                    <p className="text-base">{viewingOrganization.address || 'No address provided'}</p>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        <DialogFooter>
                                                                            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                                                                                Close
                                                                            </Button>
                                                                        </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSearchSubmit} className="flex gap-4 mb-4">
                        <Input
                            placeholder="Search organizations..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <Button type="submit" variant="outline">
                            <Search className="mr-2 h-4 w-4" /> Search
                        </Button>
                    </form>

                    {!isLoading && organizations.length === 0 ? (
                        <div className="text-center py-12">
                            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p>No organizations found</p>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={organizations}
                            progressPending={isLoading}
                            pagination
                            paginationServer
                            paginationTotalRows={totalRows}
                            paginationPerPage={perPage}
                            paginationRowsPerPageOptions={[1, 5, 10, 15, 20]}
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
