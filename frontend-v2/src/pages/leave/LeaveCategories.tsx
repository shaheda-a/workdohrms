import { useState, useEffect } from 'react';
import { leaveService } from '../../services/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
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
import { Skeleton } from '../../components/ui/skeleton';
import { Plus, Edit, Trash2, Calendar, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

/* =========================
   TYPES (REALISTIC API)
========================= */
interface LeaveCategory {
  id: number;
  name?: string;
  title?: string;
  annual_quota?: number | null;
  is_paid?: boolean;
  is_carry_forward_allowed?: boolean;
  max_carry_forward_days?: number | null;
  is_active?: boolean;
}

/* =========================
   COMPONENT
========================= */
export default function LeaveCategories() {
  const [categories, setCategories] = useState<LeaveCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<LeaveCategory | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    annual_quota: '10',
    is_paid: true,
    is_carry_forward_allowed: false,
    max_carry_forward_days: '0',
  });

  /* =========================
     FETCH
  ========================= */
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await leaveService.getCategories();
      const data = response.data.data;

      let categoriesArray: any[] = [];

      if (Array.isArray(data)) {
        categoriesArray = data;
      } else if (data && Array.isArray(data.data)) {
        categoriesArray = data.data;
      }

      const mapped = categoriesArray.map((cat) => ({
        ...cat,
        name: cat.name ?? cat.title ?? 'Unnamed Category',
      }));

      setCategories(mapped);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      title: formData.name,
      annual_quota: Number(formData.annual_quota),
      is_paid: formData.is_paid,
      is_carry_forward_allowed: formData.is_carry_forward_allowed,
      max_carry_forward_days: formData.is_carry_forward_allowed
        ? Number(formData.max_carry_forward_days)
        : 0,
    };

    try {
      if (editingCategory) {
        await leaveService.updateCategory(editingCategory.id, payload);
      } else {
        await leaveService.createCategory(payload);
      }

      setIsDialogOpen(false);
      setEditingCategory(null);
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  /* =========================
     EDIT (SAFE)
  ========================= */
  const handleEdit = (category: LeaveCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name ?? category.title ?? '',
      annual_quota:
        category.annual_quota !== null && category.annual_quota !== undefined
          ? category.annual_quota.toString()
          : '0',
      is_paid: Boolean(category.is_paid),
      is_carry_forward_allowed: Boolean(category.is_carry_forward_allowed),
      max_carry_forward_days:
        category.max_carry_forward_days !== null &&
          category.max_carry_forward_days !== undefined
          ? category.max_carry_forward_days.toString()
          : '0',
    });
    setIsDialogOpen(true);
  };

  /* =========================
     DELETE
  ========================= */
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await leaveService.deleteCategory(id);
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      annual_quota: '10',
      is_paid: true,
      is_carry_forward_allowed: false,
      max_carry_forward_days: '0',
    });
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Leave Categories</h1>
          <p className="text-muted-foreground">Manage leave types and policies</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingCategory(null);
                resetForm();
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? 'Update leave category details'
                  : 'Create a new leave category'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div>
                  <Label>Category Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label>Annual Quota (days)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.annual_quota}
                    onChange={(e) =>
                      setFormData({ ...formData, annual_quota: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Paid Leave</Label>
                  <Switch
                    checked={formData.is_paid}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_paid: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Allow Carry Forward</Label>
                  <Switch
                    checked={formData.is_carry_forward_allowed}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        is_carry_forward_allowed: checked,
                      })
                    }
                  />
                </div>

                {formData.is_carry_forward_allowed && (
                  <div>
                    <Label>Max Carry Forward Days</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.max_carry_forward_days}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_carry_forward_days: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCategory ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
              <p>No categories found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Annual Quota</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Carry Forward</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>

              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell>{cat.name}</TableCell>
                    <TableCell>{cat.annual_quota ?? 0} days</TableCell>
                    <TableCell>
                      <Badge>
                        {cat.is_paid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {cat.is_carry_forward_allowed
                        ? `Up to ${cat.max_carry_forward_days ?? 0} days`
                        : 'Not allowed'}
                    </TableCell>
                    <TableCell>
                      <Badge>
                        {cat.is_active ? 'Active' : 'Inactive'}
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
                          <DropdownMenuItem onClick={() => handleEdit(cat)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(cat.id)}
                            className="text-red-600"
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
