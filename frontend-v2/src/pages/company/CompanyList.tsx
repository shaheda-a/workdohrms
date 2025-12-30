import { useState, useEffect } from 'react';
import { companyService, organizationService } from '../../services/api';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Briefcase,
} from 'lucide-react';
import { toast } from '../../hooks/use-toast';

interface Company {
    id: number;
    org_id: number;
    company_name: string;
    address: string;
    organization?: { name: string };
}

interface Organization {
    id: number;
    name: string;
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export default function CompanyList() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [formData, setFormData] = useState({
        org_id: '',
        company_name: '',
        address: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchCompanies();
        fetchOrganizations();
    }, [page, search]);

    const fetchCompanies = async () => {
        setIsLoading(true);
        try {
            const response = await companyService.getAll({ page, search });
            const payload = response.data.data;

            if (Array.isArray(payload)) {
                setCompanies(payload);
                setMeta(null);
            } else if (payload && Array.isArray(payload.data)) {
                setCompanies(payload.data);
                setMeta({
                    current_page: payload.current_page,
                    last_page: payload.last_page,
                    per_page: payload.per_page,
                    total: payload.total,
                });
            } else {
                setCompanies([]);
                setMeta(null);
            }
        } catch (error) {
            console.error('Failed to fetch companies:', error);
            setCompanies([]);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch companies',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchOrganizations = async () => {
        try {
            const response = await organizationService.getAll({ page: 1 }); // Assuming we want all or paginated? For dropdown usually want all. Using page 1 for now.
            // Ideally backend should support "all" or specific endpoint for dropdowns.
            // Assuming the current getAll returns paginated data, we might need to handle "load more" or assume page 1 covers enough for now or user search.
            // For now, let's just take whatever comes back.
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
        if (!confirm('Are you sure you want to delete this company?')) return;
        try {
            await companyService.delete(id);
            toast({
                title: 'Success',
                description: 'Company deleted successfully',
            });
            fetchCompanies();
        } catch (error) {
            console.error('Failed to delete company:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete company',
            });
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
                toast({
                    title: 'Success',
                    description: 'Company updated successfully',
                });
            } else {
                await companyService.create(formData);
                toast({
                    title: 'Success',
                    description: 'Company created successfully',
                });
            }
            setIsDialogOpen(false);
            resetForm();
            fetchCompanies();
        } catch (error) {
            console.error('Failed to save company:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save company',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-solarized-base02">Companies</h1>
                    <p className="text-solarized-base01">Manage your companies under organizations</p>
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
                            Add Company
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
            </div>

            <Card className="border-0 shadow-md">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-solarized-base01" />
                            <Input
                                placeholder="Search companies..."
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
                    ) : companies.length === 0 ? (
                        <div className="text-center py-12">
                            <Briefcase className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-solarized-base02">No companies found</h3>
                            <p className="text-solarized-base01 mt-1">Get started by adding your first company.</p>
                            <Button
                                className="mt-4 bg-solarized-blue hover:bg-solarized-blue/90"
                                onClick={() => {
                                    resetForm();
                                    setIsDialogOpen(true);
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Company
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Organization</TableHead>
                                            <TableHead>Company Name</TableHead>
                                            <TableHead>Address</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {companies.map((company) => (
                                            <TableRow key={company.id}>
                                                <TableCell>{company.organization?.name || '-'}</TableCell>
                                                <TableCell className="font-medium text-solarized-base02">
                                                    {company.company_name}
                                                </TableCell>
                                                <TableCell>{company.address || '-'}</TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleEdit(company)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(company.id)}
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
