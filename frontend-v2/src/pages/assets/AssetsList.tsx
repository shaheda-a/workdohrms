import { useState, useEffect } from 'react';
import { assetService, assetTypeService } from '../../services/api';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Skeleton } from '../../components/ui/skeleton';
import { Plus, Search, Package, ChevronLeft, ChevronRight, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

interface Asset {
  id: number;
  name: string;
  asset_code: string;
  asset_type_id: number;
  asset_type?: { id: number; title: string };
  serial_number?: string;
  purchase_date?: string;
  purchase_cost?: number;
  condition?: string;
  location?: string;
  status: string;
  current_value?: number;
  assigned_to?: { full_name: string };
}

interface AssetType {
  id: number;
  title: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function AssetsList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    asset_type_id: '',
    serial_number: '',
    purchase_date: '',
    purchase_cost: '',
    condition: '',
    location: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        asset_type_id: Number(formData.asset_type_id),
        serial_number: formData.serial_number || null,
        purchase_date: formData.purchase_date || null,
        purchase_cost: formData.purchase_cost ? Number(formData.purchase_cost) : null,
        condition: formData.condition || null,
        location: formData.location || null,
      };

      if (editingAsset) {
        await assetService.update(editingAsset.id, payload);
      } else {
        await assetService.create(payload);
      }
      setIsDialogOpen(false);
      setEditingAsset(null);
      resetForm();
      fetchAssets();
      showAlert('success', 'Success', editingAsset ? 'Asset updated successfully' : 'Asset created successfully', 2000);
    } catch (error) {
      console.error('Failed to save asset:', error);
      const errorMessage = getErrorMessage(error, 'Failed to save asset');
      showAlert('error', 'Error', errorMessage);
    }
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      asset_type_id: String(asset.asset_type_id),
      serial_number: asset.serial_number || '',
      purchase_date: asset.purchase_date || '',
      purchase_cost: asset.purchase_cost ? String(asset.purchase_cost) : '',
      condition: asset.condition || '',
      location: asset.location || '',
    });
    setIsDialogOpen(true);
  };

  const handleView = (asset: Asset) => {
    setViewingAsset(asset);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await showConfirmDialog('Delete Asset', 'Are you sure you want to delete this asset?');
    if (!result.isConfirmed) return;
    try {
      await assetService.delete(id);
      fetchAssets();
      showAlert('success', 'Deleted!', 'Asset deleted successfully', 2000);
    } catch (error) {
      console.error('Failed to delete asset:', error);
      const errorMessage = getErrorMessage(error, 'Failed to delete asset');
      showAlert('error', 'Error', errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      asset_type_id: '',
      serial_number: '',
      purchase_date: '',
      purchase_cost: '',
      condition: '',
      location: '',
    });
  };

  useEffect(() => {
    fetchAssets();
    fetchAssetTypes();
  }, [page]);

  const fetchAssetTypes = async () => {
    try {
      const response = await assetTypeService.getAll({});
      const payload = response.data.data;
      if (Array.isArray(payload)) {
        setAssetTypes(payload);
      } else if (payload && Array.isArray(payload.data)) {
        setAssetTypes(payload.data);
      }
    } catch (error) {
      console.error('Failed to fetch asset types:', error);
      showAlert('error', 'Error', 'Failed to fetch asset types');
    }
  };

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = { page };
      if (search) params.search = search;

      const response = await assetService.getAll(params);
      // Handle paginated response: response.data.data is the paginator object
      // The actual array is in response.data.data.data for paginated responses
      const payload = response.data.data;
      if (Array.isArray(payload)) {
        // Non-paginated response (when paginate=false)
        setAssets(payload);
        setMeta(null);
      } else if (payload && Array.isArray(payload.data)) {
        // Paginated response - extract the array and meta from paginator
        setAssets(payload.data);
        setMeta({
          current_page: payload.current_page,
          last_page: payload.last_page,
          per_page: payload.per_page,
          total: payload.total,
        });
      } else {
        // Fallback to empty array if response is unexpected
        setAssets([]);
        setMeta(null);
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
      setAssets([]);
      showAlert('error', 'Error', 'Failed to fetch assets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchAssets();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      available: 'bg-solarized-green/10 text-solarized-green',
      assigned: 'bg-solarized-blue/10 text-solarized-blue',
      maintenance: 'bg-solarized-yellow/10 text-solarized-yellow',
      retired: 'bg-solarized-base01/10 text-solarized-base01',
      lost: 'bg-solarized-red/10 text-solarized-red',
    };
    return variants[status] || variants.available;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">Assets</h1>
          <p className="text-solarized-base01">Manage company assets and equipment</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-solarized-blue hover:bg-solarized-blue/90"
              onClick={() => { setEditingAsset(null); resetForm(); }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingAsset ? 'Edit Asset' : 'Add Asset'}</DialogTitle>
              <DialogDescription>
                {editingAsset ? 'Update asset details.' : 'Add a new asset to the inventory.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Asset Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., MacBook Pro"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asset_type_id">Asset Type *</Label>
                  <Select
                    value={formData.asset_type_id}
                    onValueChange={(value) => setFormData({ ...formData, asset_type_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select asset type" />
                    </SelectTrigger>
                    <SelectContent>
                      {assetTypes.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          {type.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serial_number">Serial Number</Label>
                  <Input
                    id="serial_number"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    placeholder="e.g., SN123456"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchase_date">Purchase Date</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchase_cost">Purchase Cost</Label>
                    <Input
                      id="purchase_cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.purchase_cost}
                      onChange={(e) => setFormData({ ...formData, purchase_cost: e.target.value })}
                      placeholder="e.g., 1500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value) => setFormData({ ...formData, condition: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Office Floor 2"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90">
                  {editingAsset ? 'Update' : 'Create'}
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
            <DialogTitle>Asset Details</DialogTitle>
          </DialogHeader>
          {viewingAsset && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-solarized-base01">Asset Code</p>
                  <p className="font-mono">{viewingAsset.asset_code}</p>
                </div>
                <div>
                  <p className="text-sm text-solarized-base01">Name</p>
                  <p className="font-medium">{viewingAsset.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-solarized-base01">Type</p>
                  <p>{viewingAsset.asset_type?.title || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-solarized-base01">Status</p>
                  <Badge className={getStatusBadge(viewingAsset.status)}>
                    {viewingAsset.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-solarized-base01">Purchase Date</p>
                  <p>{viewingAsset.purchase_date}</p>
                </div>
                <div>
                  <p className="text-sm text-solarized-base01">Purchase Cost</p>
                  <p>{formatCurrency(viewingAsset.purchase_cost || 0)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Assigned To</p>
                <p>{viewingAsset.assigned_to?.full_name || 'Not assigned'}</p>
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

      <div className="grid gap-6 sm:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-blue/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-solarized-blue" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Total Assets</p>
                <p className="text-xl font-bold text-solarized-base02">{meta?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-green/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-solarized-green" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Available</p>
                <p className="text-xl font-bold text-solarized-base02">
                  {assets.filter((a) => a.status === 'available').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-cyan/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-solarized-cyan" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Assigned</p>
                <p className="text-xl font-bold text-solarized-base02">
                  {assets.filter((a) => a.status === 'assigned').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-yellow/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-solarized-yellow" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Maintenance</p>
                <p className="text-xl font-bold text-solarized-base02">
                  {assets.filter((a) => a.status === 'maintenance').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-solarized-base01" />
              <Input
                placeholder="Search assets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-solarized-blue hover:bg-solarized-blue/90">
              Search
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-solarized-base02">No assets found</h3>
              <p className="text-solarized-base01 mt-1">Add assets to track company equipment.</p>
              <Button className="mt-4 bg-solarized-blue hover:bg-solarized-blue/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Asset
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Purchase Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-mono text-sm">{asset.asset_code}</TableCell>
                        <TableCell className="font-medium">{asset.name}</TableCell>
                        <TableCell>{asset.asset_type?.title || '-'}</TableCell>
                        <TableCell>{asset.assigned_to?.full_name || '-'}</TableCell>
                        <TableCell>{formatCurrency(asset.purchase_cost || 0)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(asset.status)}>
                            {asset.status}
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
                              <DropdownMenuItem onClick={() => handleView(asset)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(asset)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-solarized-red" onClick={() => handleDelete(asset.id)}>
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
                    {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total}
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
