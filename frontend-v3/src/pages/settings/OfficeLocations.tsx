import { useEffect, useState } from 'react';
import { settingsApi } from '../../api';
import { OfficeLocation } from '../../types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Switch } from '../../components/ui/switch';
import { Plus, Edit, Trash2, MapPin, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';

export default function OfficeLocations() {
  const [locations, setLocations] = useState<OfficeLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', address: '', city: '', country: '', is_active: true });

  const fetchLocations = async () => {
    try {
      const response = await settingsApi.getOfficeLocations();
      if (response.success) setLocations(response.data);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleOpenDialog = (location?: OfficeLocation) => {
    if (location) {
      setEditingId(location.id);
      setFormData({
        name: location.name,
        address: location.address || '',
        city: location.city || '',
        country: location.country || '',
        is_active: location.is_active,
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', address: '', city: '', country: '', is_active: true });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editingId) {
        await settingsApi.updateOfficeLocation(editingId, formData);
      } else {
        await settingsApi.createOfficeLocation(formData);
      }
      await fetchLocations();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save location:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await settingsApi.deleteOfficeLocation(deleteId);
      setLocations(locations.filter((l) => l.id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error('Failed to delete location:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02 flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            Office Locations
          </h1>
          <p className="text-solarized-base01">Manage your organization's office locations</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      <Card className="bg-white border-solarized-base2">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solarized-blue"></div>
            </div>
          ) : locations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-solarized-base01">
              <MapPin className="h-12 w-12 mb-4" />
              <p>No office locations found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-solarized-base2 hover:bg-solarized-base2">
                  <TableHead className="text-solarized-base01">Name</TableHead>
                  <TableHead className="text-solarized-base01">Address</TableHead>
                  <TableHead className="text-solarized-base01">City</TableHead>
                  <TableHead className="text-solarized-base01">Country</TableHead>
                  <TableHead className="text-solarized-base01">Status</TableHead>
                  <TableHead className="text-solarized-base01 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id} className="border-solarized-base2 hover:bg-solarized-base2">
                    <TableCell className="font-medium text-solarized-base02">{location.name}</TableCell>
                    <TableCell className="text-solarized-base01">{location.address || '-'}</TableCell>
                    <TableCell className="text-solarized-base01">{location.city || '-'}</TableCell>
                    <TableCell className="text-solarized-base01">{location.country || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={location.is_active ? 'default' : 'secondary'}>
                        {location.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(location)} className="text-solarized-base01 hover:text-solarized-base02">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(location.id)} className="text-solarized-base01 hover:text-red-400">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white border-solarized-base2">
          <DialogHeader>
            <DialogTitle className="text-solarized-base02">{editingId ? 'Edit Location' : 'Add Location'}</DialogTitle>
            <DialogDescription className="text-solarized-base01">
              {editingId ? 'Update the office location details' : 'Create a new office location'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-solarized-base01">Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-solarized-base01">City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-solarized-base01">Country</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-solarized-base01">Active</Label>
              <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-solarized-base2 text-solarized-base01 hover:bg-solarized-base2">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.name}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white border-solarized-base2">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-solarized-base02">Delete Location?</AlertDialogTitle>
            <AlertDialogDescription className="text-solarized-base01">
              This action cannot be undone. This will permanently delete the office location.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-solarized-base2 text-solarized-base02 border-solarized-base2 hover:bg-solarized-base2">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
