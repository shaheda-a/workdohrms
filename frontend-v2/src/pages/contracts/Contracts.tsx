import { useState, useEffect, useCallback } from 'react';
import { contractService, staffService, contractTypeService } from '../../services/api';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  FileText,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Search,
} from 'lucide-react';
import DataTable, { TableColumn } from 'react-data-table-component';

/* =========================
   TYPES
========================= */
interface Contract {
  id: number;
  reference_number: string;
  start_date: string;
  end_date: string | null;
  salary: string;
  status: string;
  staff_member?: {
    id: number;
    full_name: string;
  };
  contract_type?: {
    id: number;
    title: string;
  };
}

interface Staff {
  id: number;
  full_name: string;
  staff_code: string;
}

interface ContractType {
  id: number;
  title: string;
}

/* =========================
   COMPONENT
========================= */
export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Dialog state
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // Edit form state
  const [editSalary, setEditSalary] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

  // Add form state
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [newContract, setNewContract] = useState({
    staff_member_id: '',
    contract_type_id: '',
    start_date: '',
    end_date: '',
    salary: '',
    terms: '',
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

  // Fetch contracts with pagination
  const fetchContracts = useCallback(
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

        const response = await contractService.getAll(params);
        const { data, meta } = response.data;

        if (Array.isArray(data)) {
          setContracts(data);
          setTotalRows(meta?.total ?? 0);
        } else {
          setContracts([]);
          setTotalRows(0);
        }
      } catch (error) {
        console.error('Failed to fetch contracts:', error);
        showAlert('error', 'Error', 'Failed to fetch contracts');
        setContracts([]);
        setTotalRows(0);
      } finally {
        setIsLoading(false);
      }
    },
    [perPage, searchQuery, sortField, sortDirection]
  );

  const fetchDropdownData = async () => {
    try {
      const [staffResponse, typesResponse] = await Promise.all([
        staffService.getAll({ per_page: 100 }),
        contractTypeService.getAll({ per_page: 100 }),
      ]);

      const staffData = staffResponse.data.data;
      if (staffData && Array.isArray(staffData.data)) {
        setStaffMembers(staffData.data);
      } else if (Array.isArray(staffData)) {
        setStaffMembers(staffData);
      }

      const typesData = typesResponse.data.data;
      if (typesData && Array.isArray(typesData.data)) {
        setContractTypes(typesData.data);
      } else if (Array.isArray(typesData)) {
        setContractTypes(typesData);
      }
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error);
    }
  };

  useEffect(() => {
    fetchContracts(page);
  }, [page, fetchContracts]);

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

  // Sorting Handler
  const handleSort = (column: TableColumn<Contract>, direction: 'asc' | 'desc') => {
    const columnId = String(column.id || '');
    if (columnId === 'employee' || column.name === 'Employee') {
      setSortField('staff_member_id');
      setSortDirection(direction);
      setPage(1);
    }
  };

  /* =========================
     HELPERS
  ========================= */
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      draft: 'bg-solarized-base01/10 text-solarized-base01',
      active: 'bg-solarized-green/10 text-solarized-green',
      expired: 'bg-solarized-red/10 text-solarized-red',
      terminated: 'bg-solarized-base01/10 text-solarized-base01',
    };
    return variants[status] || variants.draft;
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const formatCurrency = (amount: string) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(Number(amount || 0));

  const formatDate = (date: string | null) =>
    date ? new Date(date).toLocaleDateString() : 'Indefinite';

  /* =========================
     HANDLERS
  ========================= */
  const handleView = (contract: Contract) => {
    setSelectedContract(contract);
    setIsViewOpen(true);
  };

  const handleEdit = (c: Contract) => {
    setSelectedContract(c);
    setEditSalary(c.salary);
    setEditStatus(c.status);
    setEditStartDate(c.start_date ? c.start_date.split('T')[0] : '');
    setEditEndDate(c.end_date ? c.end_date.split('T')[0] : '');
    setIsEditOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await showConfirmDialog('Delete Contract', 'Are you sure you want to delete this contract?');
    if (!result.isConfirmed) return;

    try {
      await contractService.deleteContract(id);
      showAlert('success', 'Deleted!', 'Contract deleted successfully', 2000);
      fetchContracts(page);
    } catch (error) {
      console.error('Failed to delete contract:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to delete contract'));
    }
  };

  const handleAddClick = () => {
    fetchDropdownData();
    setNewContract({
      staff_member_id: '',
      contract_type_id: '',
      start_date: '',
      end_date: '',
      salary: '',
      terms: '',
    });
    setIsAddOpen(true);
  };

  const handleCreateContract = async () => {
    if (!newContract.staff_member_id || !newContract.start_date || !newContract.end_date) {
      showAlert('error', 'Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const contractData = {
        staff_member_id: parseInt(newContract.staff_member_id),
        contract_type_id: newContract.contract_type_id ? parseInt(newContract.contract_type_id) : null,
        start_date: newContract.start_date,
        end_date: newContract.end_date,
        salary: newContract.salary ? parseFloat(newContract.salary) : null,
        terms: newContract.terms || null,
      };

      await contractService.createContract(contractData);
      showAlert('success', 'Success', 'Contract created successfully', 2000);
      setIsAddOpen(false);
      fetchContracts(page);
    } catch (error) {
      console.error('Failed to create contract:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to create contract'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateContract = async () => {
    if (!selectedContract) return;

    try {
      await contractService.update(selectedContract.id, {
        start_date: editStartDate,
        end_date: editEndDate,
        salary: editSalary,
        status: editStatus,
      });

      showAlert('success', 'Success', 'Contract updated successfully', 2000);
      setIsEditOpen(false);
      fetchContracts(page);
    } catch (error) {
      console.error('Failed to update contract:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to update contract'));
    }
  };

  // Table Columns
  const columns: TableColumn<Contract>[] = [
    {
      id: 'employee',
      name: 'Employee',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {getInitials(row.staff_member?.full_name || 'NA')}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{row.staff_member?.full_name || 'Unknown'}</span>
        </div>
      ),
      sortable: true,
      minWidth: '180px',
    },
    {
      name: 'Contract Type',
      selector: (row) => row.contract_type?.title || '-',
    },
    {
      name: 'Start Date',
      selector: (row) => row.start_date,
      cell: (row) => formatDate(row.start_date),
    },
    {
      name: 'End Date',
      selector: (row) => row.end_date || '',
      cell: (row) => formatDate(row.end_date),
    },
    {
      name: 'Salary',
      selector: (row) => row.salary,
      cell: (row) => formatCurrency(row.salary),
    },
    {
      name: 'Status',
      cell: (row) => (
        <Badge className={getStatusBadge(row.status)}>
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
              <Eye className="mr-2 h-4 w-4" /> View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(row)}>
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

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">Contracts</h1>
          <p className="text-solarized-base01">
            Manage employee contracts and agreements
          </p>
        </div>
        <Button className="bg-solarized-blue hover:bg-solarized-blue/90" onClick={handleAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contract
        </Button>
      </div>

      {/* SUMMARY */}
      <div className="grid gap-6 sm:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-blue/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-solarized-blue" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Total Contracts</p>
                <p className="text-xl font-bold text-solarized-base02">{totalRows || contracts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-green/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-solarized-green" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Active</p>
                <p className="text-xl font-bold text-solarized-base02">
                  {contracts.filter((c) => c.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-yellow/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-solarized-yellow" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Expiring Soon</p>
                <p className="text-xl font-bold text-solarized-base02">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-red/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-solarized-red" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Terminated</p>
                <p className="text-xl font-bold text-solarized-base02">
                  {contracts.filter((c) => c.status === 'terminated').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Contracts List</CardTitle>
          <form onSubmit={handleSearchSubmit} className="flex gap-4 mt-4">
            <Input
              placeholder="Search by employee name "
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button type="submit" variant="outline">
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {!isLoading && contracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-solarized-base01" />
              <h3 className="text-lg font-medium text-solarized-base02">No contracts found</h3>
              <p className="text-solarized-base01 mt-1">Create your first contract to get started.</p>
              <Button
                className="mt-4 bg-solarized-blue hover:bg-solarized-blue/90"
                onClick={handleAddClick}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Contract
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={contracts}
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
              defaultSortFieldId="employee"
              defaultSortAsc={true}
              highlightOnHover
              responsive
            />
          )}
        </CardContent>
      </Card>

      {/* VIEW CONTRACT MODAL */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contract Details</DialogTitle>
            <DialogDescription>View the details of this contract</DialogDescription>
          </DialogHeader>

          {selectedContract && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-solarized-base01">Employee</Label>
                  <p className="font-medium">
                    {selectedContract.staff_member?.full_name || '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-solarized-base01">Contract Type</Label>
                  <p>{selectedContract.contract_type?.title || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-solarized-base01">Start Date</Label>
                  <p>{formatDate(selectedContract.start_date)}</p>
                </div>
                <div>
                  <Label className="text-solarized-base01">End Date</Label>
                  <p>{formatDate(selectedContract.end_date)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-solarized-base01">Salary</Label>
                  <p>{formatCurrency(selectedContract.salary)}</p>
                </div>
                <div>
                  <Label className="text-solarized-base01">Status</Label>
                  <div className="mt-1">
                    <Badge className={getStatusBadge(selectedContract.status)}>
                      {selectedContract.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-solarized-base01">Reference Number</Label>
                <p className="font-mono">{selectedContract.reference_number}</p>
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
                if (selectedContract) {
                  handleEdit(selectedContract);
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

      {/* EDIT CONTRACT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Contract</DialogTitle>
            <DialogDescription>Update the contract details</DialogDescription>
          </DialogHeader>

          {selectedContract && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-solarized-base01">Contract Reference</Label>
                <p className="font-mono font-medium">{selectedContract.reference_number}</p>
              </div>

              <div>
                <Label className="text-solarized-base01">Employee</Label>
                <p>{selectedContract.staff_member?.full_name || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editStartDate">Start Date</Label>
                  <Input
                    id="editStartDate"
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEndDate">End Date</Label>
                  <Input
                    id="editEndDate"
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editSalary">Salary</Label>
                <Input
                  id="editSalary"
                  type="number"
                  value={editSalary}
                  onChange={(e) => setEditSalary(e.target.value)}
                  placeholder="Enter salary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-solarized-blue hover:bg-solarized-blue/90"
              onClick={handleUpdateContract}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD CONTRACT DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Contract</DialogTitle>
            <DialogDescription>Create a new contract for an employee</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newStaffMember">Employee *</Label>
              <Select
                value={newContract.staff_member_id}
                onValueChange={(value) => setNewContract({ ...newContract, staff_member_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff.id} value={String(staff.id)}>
                      {staff.full_name} ({staff.staff_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newContractType">Contract Type</Label>
              <Select
                value={newContract.contract_type_id}
                onValueChange={(value) => setNewContract({ ...newContract, contract_type_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Contract Type" />
                </SelectTrigger>
                <SelectContent>
                  {contractTypes.map((type) => (
                    <SelectItem key={type.id} value={String(type.id)}>
                      {type.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newStartDate">Start Date *</Label>
                <Input
                  id="newStartDate"
                  type="date"
                  value={newContract.start_date}
                  onChange={(e) => setNewContract({ ...newContract, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newEndDate">End Date *</Label>
                <Input
                  id="newEndDate"
                  type="date"
                  value={newContract.end_date}
                  onChange={(e) => setNewContract({ ...newContract, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newSalary">Salary</Label>
              <Input
                id="newSalary"
                type="number"
                value={newContract.salary}
                onChange={(e) => setNewContract({ ...newContract, salary: e.target.value })}
                placeholder="Enter amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newTerms">Terms & Conditions</Label>
              <Textarea
                id="newTerms"
                value={newContract.terms}
                onChange={(e) => setNewContract({ ...newContract, terms: e.target.value })}
                rows={3}
                placeholder="Enter contract terms..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-solarized-blue hover:bg-solarized-blue/90"
              onClick={handleCreateContract}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Contract'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
