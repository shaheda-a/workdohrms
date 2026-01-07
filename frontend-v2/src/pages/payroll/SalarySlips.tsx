import { useState, useEffect } from 'react';
import { payrollService } from '../../services/api';
import { showAlert } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import SalarySlipModal from './SalarySlipModal'; // Import the modal
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Skeleton } from '../../components/ui/skeleton';
import {
  DollarSign,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertCircle
} from 'lucide-react';

interface SalarySlip {
  id: number;
  slip_reference: string;
  staff_member: {
    full_name: string;
    staff_code: string;
    personal_email: string | null;
    mobile_number: string | null;
    bank_account_name: string | null;
    bank_account_number: string | null;
    bank_name: string | null;
    job_title?: {
      title: string;
    };
  };
  salary_period: string;
  basic_salary: string;
  benefits_breakdown: Array<{ name: string; amount: string }>;
  deductions_breakdown: Array<{ name: string; amount: string }>;
  total_earnings: string;
  total_deductions: string;
  net_payable: string;
  status: string;
  generated_at: string;
  paid_at: string | null;
  created_at: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function SalarySlips() {
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [salaryPeriod, setSalaryPeriod] = useState('');
  const [month, setMonth] = useState<number>(0);
  const [year, setYear] = useState<number>(0);

  // Modal state
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchSlips();
  }, [page]);

  useEffect(() => {
    // When salaryPeriod changes, parse month and year
    if (salaryPeriod) {
      const [yearStr, monthStr] = salaryPeriod.split('-');
      setYear(parseInt(yearStr, 10));
      setMonth(parseInt(monthStr, 10));
    } else {
      setMonth(0);
      setYear(0);
    }
  }, [salaryPeriod]);

  const fetchSlips = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = { page };

      // Send month and year separately as the backend expects
      if (month && year) {
        params.month = month;
        params.year = year;
      }

      console.log('Fetching with params:', params); // Debug log

      const response = await payrollService.getSalarySlips(params);
      setSlips(response.data.data || []);
      setMeta(response.data.meta);
    } catch (error) {
      console.error('Failed to fetch salary slips:', error);
      showAlert('error', 'Error', 'Failed to fetch salary slips');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (id: number) => {
    try {
      // First check if we need to implement this endpoint
      // showAlert('warning', 'Coming Soon', 'PDF download feature coming soon!');
      // return;

      // Uncomment when backend implements download endpoint
      const response = await payrollService.downloadSlip(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `salary-slip-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download slip:', error);
      showAlert('error', 'Error', 'PDF download not available yet');
    }
  };

  const handleViewDetails = (slip: SalarySlip) => {
    setSelectedSlip(slip);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      generated: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
    };
    return variants[status] || variants.generated;
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num || 0);
  };

  const handleFilter = () => {
    setPage(1); // Reset to first page when filtering
    fetchSlips();
  };

  const handleClearFilter = () => {
    setSalaryPeriod('');
    setPage(1);
    fetchSlips();
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salary Slips</h1>
          <p className="text-gray-600">View and download generated salary slips</p>
        </div>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Salary Slips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="salary_period">Salary Period (YYYY-MM)</Label>
                <div className="flex gap-2">
                  <Input
                    id="salary_period"
                    type="month"
                    value={salaryPeriod}
                    onChange={(e) => setSalaryPeriod(e.target.value)}
                    placeholder="Select month and year"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleFilter}
                    className="bg-solarized-blue hover:bg-solarized-blue/90"
                  >
                    Apply Filter
                  </Button>
                  {salaryPeriod && (
                    <Button
                      onClick={handleClearFilter}
                      variant="outline"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {salaryPeriod && (
                  <p className="text-sm text-gray-500">
                    Filtering for: {month}/{year}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : slips.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No salary slips found</h3>
                <p className="text-gray-600 mt-1">
                  {salaryPeriod
                    ? `No salary slips found for ${salaryPeriod}. Try a different period.`
                    : 'Generate payroll to create salary slips.'}
                </p>
                {salaryPeriod && (
                  <Button
                    onClick={handleClearFilter}
                    variant="outline"
                    className="mt-4"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="mb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {salaryPeriod ? `Salary Slips for ${salaryPeriod}` : 'All Salary Slips'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Showing {slips.length} of {meta?.total || 0} total slips
                    </p>
                  </div>
                  {salaryPeriod && (
                    <Button
                      onClick={handleClearFilter}
                      variant="outline"
                      size="sm"
                    >
                      Clear Filter
                    </Button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Earnings</TableHead>
                        <TableHead>Deductions</TableHead>
                        <TableHead>Net Pay</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slips.map((slip) => (
                        <TableRow key={slip.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span>{slip.slip_reference}</span>
                              {/* <Badge variant="outline" className="text-xs">
                                #{slip.id}
                              </Badge> */}
                            </div>
                          </TableCell>
                          <TableCell>{slip.staff_member?.full_name || 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {slip.salary_period}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-green-600 font-medium">
                            {formatCurrency(slip.total_earnings)}
                          </TableCell>
                          <TableCell className="text-red-600">
                            {formatCurrency(slip.total_deductions)}
                          </TableCell>
                          <TableCell className="font-bold text-gray-900">
                            {formatCurrency(slip.net_payable)}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusBadge(slip.status)} capitalize`}>
                              {slip.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDetails(slip)}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownload(slip.id)}
                                // title="Download PDF (Coming Soon)"
                                className="relative group"
                              >
                                <Download className="h-4 w-4" />
                                {/* <span className="absolute -top-1 -right-1">
                                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                                </span> */}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {meta && meta.last_page > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                    <p className="text-sm text-gray-600">
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
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => {
                          let pageNum;
                          if (meta.last_page <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= meta.last_page - 2) {
                            pageNum = meta.last_page - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={page === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPage(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
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

      <SalarySlipModal
        slip={selectedSlip}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSlip(null);
        }}
      />
    </>
  );
}
