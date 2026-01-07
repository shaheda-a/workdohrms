import { useState, useEffect, useCallback } from 'react';
import { companyService, organizationService } from '../../services/api';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent } from '../../components/ui/card';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import DataTable, { TableColumn } from 'react-data-table-component';
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    Briefcase,
    Eye,
    MapPin,
    Calendar,
    Building2,
} from 'lucide-react';

interface Company {
    id: number;
    org_id: number;
    company_name: string;
    address: string;
    organization?: { name: string };
    created_at?: string;
    updated_at?: string;
}

interface Organization {
    id: number;
    name: string;
}

export default function CompanyList() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchInput, setSearchInput] = useState(''); // What user types
    const [search, setSearch] = useState(''); // What's sent to API
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [formData, setFormData] = useState({
        org_id: '',
        company_name: '',
        address: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // View dialog state
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [viewingCompany, setViewingCompany] = useState<Company | null>(null);

    // ================= FETCH COMPANIES =================
    const fetchCompanies = useCallback(
        async (currentPage: number = 1) => {
            setIsLoading(true);
            try {
                const response = await companyService.getAll({
                    page: currentPage,
                    per_page: perPage,
                    search,
                });

                const { data, meta } = response.data;

                if (Array.isArray(data)) {
                    setCompanies(data);
                    setTotalRows(meta?.total ?? 0);
                } else {
                    setCompanies([]);
                    setTotalRows(0);
                }
            } catch (error) {
                console.error('Failed to fetch companies:', error);
                showAlert('error', 'Error', getErrorMessage(error, 'Failed to fetch companies'));
                setCompanies([]);
                setTotalRows(0);
            } finally {
                setIsLoading(false);
            }
        },
        [perPage, search]
    );

    useEffect(() => {
        fetchCompanies(page);
        fetchOrganizations();
    }, [page, fetchCompanies]);

    const fetchOrganizations = async () => {
        try {
            const response = await organizationService.getAll({ page: 1 });
            const payload = response.data.data;
            if (Array.isArray(payload)) {
                setOrganizations(payload);
            } else if (payload && Array.isArray(payload.data)) {
                setOrganizations(payload.data);
            }
        } catch (error) {
            console.error('Failed to fetch organizations for dropdown:', error);
        }
    }

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
        const handleView = (company: Company) => {
            setViewingCompany(company);
            setIsViewDialogOpen(true);
        };

        const handleEdit = (company: Company) => {
            setEditingCompany(company);
            setFormData({
                org_id: company.org_id.toString(),
                company_name: company.company_name,
                address: company.address || '',
            });
            setIsDialogOpen(true);
        };

    const handleDelete = async (id: number) => {
        const result = await showConfirmDialog('Delete Company', 'Are you sure you want to delete this company?');
        if (!result.isConfirmed) return;
        try {
            await companyService.delete(id);
            showAlert('success', 'Deleted!', 'Company deleted successfully', 2000);
            fetchCompanies(page);
        } catch (error) {
            console.error('Failed to delete company:', error);
            const errorMessage = getErrorMessage(error, 'Failed to delete company');
            showAlert('error', 'Error', errorMessage);
        }
    };

    const resetForm = () => {
        setFormData({
            org_id: '',
            company_name: '',
            address: '',
        });
        setEditingCompany(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingCompany) {
                await companyService.update(editingCompany.id, formData);
                showAlert('success', 'Success', 'Company updated successfully', 2000);
            } else {
                await companyService.create(formData);
                showAlert('success', 'Success', 'Company created successfully', 2000);
            }
            setIsDialogOpen(false);
            resetForm();
            fetchCompanies(page);
        } catch (error) {
            console.error('Failed to save company:', error);
            const errorMessage = getErrorMessage(error, 'Failed to save company');
            showAlert('error', 'Error', errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ================= TABLE COLUMNS =================
    const columns: TableColumn<Company>[] = [
        {
            name: 'Organization',
            selector: (row) => row.organization?.name || '-',
            sortable: true,
            minWidth: '150px',
        },
        {
            name: 'Company Name',
            selector: (row) => row.company_name,
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
                    <h1 className="text-2xl font-bold">Companies</h1>
                    <p className="text-muted-foreground">Manage your companies under organizations</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-solarized-blue hover:bg-solarized-blue/90" onClick={() => resetForm()}>
                            <Plus className="mr-2 h-4 w-4" /> Add Company
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingCompany ? 'Edit Company' : 'Add New Company'}</DialogTitle>
                            <DialogDescription>
                                {editingCompany ? 'Update the company details.' : 'Add a new company.'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="org_id">Organization *</Label>
                                    <Select
                                        value={formData.org_id}
                                        onValueChange={(value) => setFormData({ ...formData, org_id: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Organization" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {organizations.map((org) => (
                                                <SelectItem key={org.id} value={org.id.toString()}>
                                                    {org.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="company_name">Company Name *</Label>
                                    <Input
                                        id="company_name"
                                        value={formData.company_name}
                                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                        placeholder="Company Name"
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
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : (editingCompany ? 'Update' : 'Create')}
                                </Button>
                            </DialogFooter>
                        </form>
                                </DialogContent>
                            </Dialog>

                            {/* View Company Dialog */}
                            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                            <Briefcase className="h-5 w-5 text-solarized-blue" />
                                            Company Details
                                        </DialogTitle>
                                        <DialogDescription>
                                            View company information
                                        </DialogDescription>
                                    </DialogHeader>
                                                                        {viewingCompany && (
                                                                            <div className="space-y-4 py-4">
                                                                                <div className="space-y-2">
                                                                                    <Label className="text-sm text-muted-foreground">Company Name</Label>
                                                                                    <p className="text-lg font-semibold">{viewingCompany.company_name}</p>
                                                                                </div>
                                                                                <div className="space-y-2">
                                                                                    <Label className="text-sm text-muted-foreground flex items-center gap-1">
                                                                                        <Building2 className="h-4 w-4" /> Organization
                                                                                    </Label>
                                                                                    <Badge variant="secondary">{viewingCompany.organization?.name || 'N/A'}</Badge>
                                                                                </div>
                                                                                <div className="space-y-2">
                                                                                    <Label className="text-sm text-muted-foreground flex items-center gap-1">
                                                                                        <MapPin className="h-4 w-4" /> Address
                                                                                    </Label>
                                                                                    <p className="text-base">{viewingCompany.address || 'No address provided'}</p>
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
                                        placeholder="Search companies..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <Button type="submit" variant="outline">
                            <Search className="mr-2 h-4 w-4" /> Search
                        </Button>
                    </form>

                    {!isLoading && companies.length === 0 ? (
                        <div className="text-center py-12">
                            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p>No companies found</p>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={companies}
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
