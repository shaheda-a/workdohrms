import { useEffect, useState } from 'react';
import { settingsApi } from '../../api';
import { Division, OfficeLocation } from '../../types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Plus, Edit, Trash2, Building, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';

export default function Divisions() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [locations, setLocations] = useState<OfficeLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', office_location_id: '', description: '', is_active: true });

  const fetchData = async () => {
    try {
      const [divRes, locRes] = await Promise.all([
        settingsApi.getDivisions(),
        settingsApi.getOfficeLocations(),
      ]);
      if (divRes.success) setDivisions(divRes.data);
      if (locRes.success) setLocations(locRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDialog = (division?: Division) => {
    if (division) {
      setEditingId(division.id);
      setFormData({
        name: division.name,
        office_location_id: division.office_location_id?.toString() || '',
        description: division.description || '',
        is_active: division.is_active,
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', office_location_id: '', description: '', is_active: true });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data = {
        name: formData.name,
        office_location_id: formData.office_location_id ? parseInt(formData.office_location_id) : null,
        description: formData.description || null,
        is_active: formData.is_active,
      };
      if (editingId) {
        await settingsApi.updateDivision(editingId, data);
      } else {
        await settingsApi.createDivision(data);
      }
      await fetchData();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save division:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await settingsApi.deleteDivision(deleteId);
      setDivisions(divisions.filter((d) => d.id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error('Failed to delete division:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02 flex items-center gap-2">
            <Building className="h-6 w-6" />
            Divisions
          </h1>
          <p className="text-solarized-base01">Manage organizational divisions/departments</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Division
        </Button>
      </div>

      <Card className="bg-white border-solarized-base2">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solarized-blue"></div>
            </div>
          ) : divisions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-solarized-base01">
              <Building className="h-12 w-12 mb-4" />
              <p>No divisions found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-solarized-base2 hover:bg-solarized-base2">
                  <TableHead className="text-solarized-base01">Name</TableHead>
                  <TableHead className="text-solarized-base01">Office Location</TableHead>
                  <TableHead className="text-solarized-base01">Description</TableHead>
                  <TableHead className="text-solarized-base01">Status</TableHead>
                  <TableHead className="text-solarized-base01 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {divisions.map((division) => (
                  <TableRow key={division.id} className="border-solarized-base2 hover:bg-solarized-base2">
                    <TableCell className="font-medium text-solarized-base02">{division.name}</TableCell>
                    <TableCell className="text-solarized-base01">{division.office_location?.name || '-'}</TableCell>
                    <TableCell className="text-solarized-base01 max-w-xs truncate">{division.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={division.is_active ? 'default' : 'secondary'}>
                        {division.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(division)} className="text-solarized-base01 hover:text-solarized-base02">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(division.id)} className="text-solarized-base01 hover:text-red-400">
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
            <DialogTitle className="text-solarized-base02">{editingId ? 'Edit Division' : 'Add Division'}</DialogTitle>
            <DialogDescription className="text-solarized-base01">
              {editingId ? 'Update the division details' : 'Create a new division'}
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
              <Label className="text-solarized-base01">Office Location</Label>
              <Select value={formData.office_location_id} onValueChange={(v) => setFormData({ ...formData, office_location_id: v })}>
                <SelectTrigger className="bg-solarized-base2 border-solarized-base2 text-solarized-base02">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent className="bg-white border-solarized-base2">
                  <SelectItem value="">None</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-solarized-base01">Active</Label>
              <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-solarized-base2 text-solarized-base01 hover:bg-solarized-base2">Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.name}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white border-solarized-base2">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-solarized-base02">Delete Division?</AlertDialogTitle>
            <AlertDialogDescription className="text-solarized-base01">This action cannot be undone.</AlertDialogDescription>
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
