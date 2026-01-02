import { useState, useEffect } from 'react';
import { contractService } from '../../services/api';
import { showAlert } from '../../lib/sweetalert';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Plus,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Edit,
  Download,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

/* =========================
   TYPES (MATCH API)
========================= */
interface Contract {
  id: number;
  reference_number: string;
  start_date: string;
  end_date: string | null;
  salary: string;
  status: string;

  staff_member?: {
    full_name: string;
  };

  contract_type?: {
    id: number;
    title: string;
  };
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/* =========================
   COMPONENT
========================= */
export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [editSalary, setEditSalary] = useState('');
  const [editStatus, setEditStatus] = useState('');


  useEffect(() => {
    fetchContracts();
  }, [page]);

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const response = await contractService.getAll({ page });

      const payload = response.data.data;

      // paginator response
      if (payload && Array.isArray(payload.data)) {
        setContracts(payload.data);
        setMeta({
          current_page: payload.current_page,
          last_page: payload.last_page,
          per_page: payload.per_page,
          total: payload.total,
        });
      } else {
        setContracts([]);
        setMeta(null);
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
      setContracts([]);
      showAlert('error', 'Error', 'Failed to fetch contracts');
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================
     HELPERS
  ========================= */
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-solarized-green/10 text-solarized-green',
      pending: 'bg-solarized-yellow/10 text-solarized-yellow',
      expired: 'bg-solarized-red/10 text-solarized-red',
      terminated: 'bg-solarized-base01/10 text-solarized-base01',
    };
    return variants[status] || variants.pending;
  };
  const handleView = (contract: Contract) => {
    setSelectedContract(contract);
    setIsViewOpen(true);
  };

 const handleEdit = (c: Contract) => {
    setSelectedContract(c);
    setEditSalary(c.salary);
    setEditStatus(c.status);
    setIsEditOpen(true);
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
        <Button className="bg-solarized-blue hover:bg-solarized-blue/90">
          <Plus className="mr-2 h-4 w-4" />
          New Contract
        </Button>
      </div>

      {/* SUMMARY */}
      <div className="grid gap-6 sm:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <FileText className="h-5 w-5 text-solarized-blue" />
              <div>
                <p className="text-sm">Total Contracts</p>
                <p className="text-xl font-bold">{meta?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <FileText className="h-5 w-5 text-solarized-green" />
              <div>
                <p className="text-sm">Active</p>
                <p className="text-xl font-bold">
                  {contracts.filter((c) => c.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-solarized-yellow" />
              <div>
                <p className="text-sm">Expiring Soon</p>
                <p className="text-xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <FileText className="h-5 w-5 text-solarized-red" />
              <div>
                <p className="text-sm">Terminated</p>
                <p className="text-xl font-bold">
                  {contracts.filter((c) => c.status === 'terminated').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          {isLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : contracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-solarized-base01" />
              <h3 className="text-lg font-medium">No contracts found</h3>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Contract Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {getInitials(contract.staff_member?.full_name || 'NA')}
                            </AvatarFallback>
                          </Avatar>
                          {contract.staff_member?.full_name || 'Unknown'}
                        </div>
                      </TableCell>

                      <TableCell className="font-medium">
                        {contract.contract_type?.title || '-'}
                      </TableCell>

                      <TableCell>{formatDate(contract.start_date)}</TableCell>
                      <TableCell>{formatDate(contract.end_date)}</TableCell>
                      <TableCell>{formatCurrency(contract.salary)}</TableCell>

                      <TableCell>
                        <Badge className={getStatusBadge(contract.status)}>
                          {contract.status}
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
                            <DropdownMenuItem onClick={() => handleView(contract)}>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => handleEdit(contract)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>

                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" /> Download
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {meta && meta.last_page > 1 && (
                <div className="flex justify-between mt-6">
                  <span>
                    Page {meta.current_page} of {meta.last_page}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage(page + 1)}
                      disabled={page === meta.last_page}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      {/* VIEW CONTRACT MODAL */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contract Details</DialogTitle>
          </DialogHeader>

          {selectedContract && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-solarized-base01">Employee</p>
                  <p className="font-medium">
                    {selectedContract.staff_member?.full_name || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-solarized-base01">Contract Type</p>
                  <p>{selectedContract.contract_type?.title || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-solarized-base01">Start Date</p>
                  <p>{formatDate(selectedContract.start_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-solarized-base01">End Date</p>
                  <p>{formatDate(selectedContract.end_date)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-solarized-base01">Salary</p>
                  <p>{formatCurrency(selectedContract.salary)}</p>
                </div>
                <div>
                  <p className="text-sm text-solarized-base01">Status</p>
                  <Badge className={getStatusBadge(selectedContract.status)}>
                    {selectedContract.status}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-solarized-base01">Reference Number</p>
                <p className="font-mono">{selectedContract.reference_number}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contract</DialogTitle>
          </DialogHeader>

          {selectedContract && (
            <p className="text-sm">
              Editing contract <strong>{selectedContract.reference_number}</strong>
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      


    </div>
  );
}
