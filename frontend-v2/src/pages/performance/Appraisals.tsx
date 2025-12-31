import { useState, useEffect } from 'react';
import { performanceService } from '../../services/api';
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
import { Skeleton } from '../../components/ui/skeleton';
import {
  Plus,
  Star,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Edit,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

interface Appraisal {
  id: number;
  staff_member?: { full_name: string };
  reviewer?: { name: string };
  appraisal_period: string;
  overall_rating: number;
  status: string;
  submitted_date: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function Appraisals() {
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchAppraisals();
  }, [page]);

  // ✅ FIXED API HANDLING
  const fetchAppraisals = async () => {
    setIsLoading(true);
    try {
      const response = await performanceService.getAppraisals({ page });

      /*
        Expected Laravel response:
        {
          success: true,
          data: {
            current_page,
            data: [],
            last_page,
            per_page,
            total
          }
        }
      */

      const paginated = response.data.data;

      setAppraisals(Array.isArray(paginated.data) ? paginated.data : []);

      setMeta({
        current_page: paginated.current_page,
        last_page: paginated.last_page,
        per_page: paginated.per_page,
        total: paginated.total,
      });
    } catch (error) {
      console.error('Failed to fetch appraisals:', error);
      setAppraisals([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      draft: 'bg-solarized-base01/10 text-solarized-base01',
      pending_review: 'bg-solarized-yellow/10 text-solarized-yellow',
      reviewed: 'bg-solarized-blue/10 text-solarized-blue',
      completed: 'bg-solarized-green/10 text-solarized-green',
    };
    return variants[status] || variants.draft;
  };

  const renderRating = (rating: number) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? 'fill-solarized-yellow text-solarized-yellow'
              : 'text-solarized-base2'
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">
            Appraisals
          </h1>
          <p className="text-solarized-base01">
            Manage performance appraisals and reviews
          </p>
        </div>
        <Button className="bg-solarized-blue hover:bg-solarized-blue/90">
          <Plus className="mr-2 h-4 w-4" />
          New Appraisal
        </Button>
      </div>

      {/* STATS */}
      <div className="grid gap-6 sm:grid-cols-4">
        <StatCard title="Total" value={meta?.total ?? 0} />
        <StatCard
          title="Pending Review"
          value={appraisals.filter(a => a.status === 'pending_review').length}
        />
        <StatCard
          title="Completed"
          value={appraisals.filter(a => a.status === 'completed').length}
        />
        <StatCard
          title="Avg Rating"
          value={
            appraisals.length
              ? (
                  appraisals.reduce(
                    (sum, a) => sum + (a.overall_rating || 0),
                    0
                  ) / appraisals.length
                ).toFixed(1)
              : '0.0'
          }
        />
      </div>

      {/* TABLE */}
      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : appraisals.length === 0 ? (
            <p className="text-center py-10 text-solarized-base01">
              No appraisals found
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appraisals.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {getInitials(a.staff_member?.full_name || 'UN')}
                            </AvatarFallback>
                          </Avatar>
                          {a.staff_member?.full_name || 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell>{a.appraisal_period}</TableCell>
                      <TableCell>{a.reviewer?.name || '-'}</TableCell>
                      <TableCell>{renderRating(a.overall_rating || 0)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(a.status)}>
                          {a.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{a.submitted_date || '-'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" /> Edit
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
                  <span className="text-sm">
                    Page {meta.current_page} of {meta.last_page}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page === meta.last_page}
                      onClick={() => setPage(page + 1)}
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
    </div>
  );
}

/* 🔹 SMALL HELPER */
function StatCard({ title, value }: { title: string; value: any }) {
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="pt-6">
        <p className="text-sm text-solarized-base01">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
