import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { trpc } from '@/utils/trpc';
import type { SoftwareAsset, CreateSoftwareAssetInput, HardwareAsset } from '../../../server/src/schema';

export function SoftwareAssetsTab() {
  const [softwareAssets, setSoftwareAssets] = useState<SoftwareAsset[]>([]);
  const [hardwareAssets, setHardwareAssets] = useState<HardwareAsset[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<SoftwareAsset | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'VM' as 'VM' | 'container',
    description: '',
    host_id: 0,
  });

  const loadSoftwareAssets = useCallback(async () => {
    try {
      const result = await trpc.getSoftwareAssets.query();
      setSoftwareAssets(result);
    } catch (error) {
      console.error('Failed to load software assets:', error);
      toast.error('Failed to load software assets');
    }
  }, []);

  const loadHardwareAssets = useCallback(async () => {
    try {
      const result = await trpc.getHardwareAssets.query();
      setHardwareAssets(result);
    } catch (error) {
      console.error('Failed to load hardware assets:', error);
      toast.error('Failed to load hardware assets');
    }
  }, []);

  useEffect(() => {
    loadSoftwareAssets();
    loadHardwareAssets();
  }, [loadSoftwareAssets, loadHardwareAssets]);

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'VM',
      description: '',
      host_id: 0,
    });
    setCurrentAsset(null);
    setIsEditing(false);
  };

  const handleCreate = async () => {
    try {
      const input: CreateSoftwareAssetInput = {
        name: formData.name,
        type: formData.type,
        description: formData.description || null,
        host_id: formData.host_id,
      };
      
      const newAsset = await trpc.createSoftwareAsset.mutate(input);
      if (newAsset) {
        setSoftwareAssets([...softwareAssets, newAsset]);
      }
      setIsDialogOpen(false);
      resetForm();
      toast.success('Software asset created successfully');
    } catch (error) {
      console.error('Failed to create software asset:', error);
      toast.error('Failed to create software asset');
    }
  };

  const handleUpdate = async () => {
    if (!currentAsset) return;
    
    try {
      const input = {
        id: currentAsset.id,
        name: formData.name,
        type: formData.type,
        description: formData.description || null,
        host_id: formData.host_id,
      };
      
      const updatedAsset = await trpc.updateSoftwareAsset.mutate(input);
      if (updatedAsset) {
        setSoftwareAssets(softwareAssets.map(asset => 
          asset.id === updatedAsset.id ? updatedAsset : asset
        ));
      }
      setIsDialogOpen(false);
      resetForm();
      toast.success('Software asset updated successfully');
    } catch (error) {
      console.error('Failed to update software asset:', error);
      toast.error('Failed to update software asset');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteSoftwareAsset.mutate({ id });
      setSoftwareAssets(softwareAssets.filter(asset => asset.id !== id));
      toast.success('Software asset deleted successfully');
    } catch (error) {
      console.error('Failed to delete software asset:', error);
      toast.error('Failed to delete software asset');
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (asset: SoftwareAsset) => {
    setCurrentAsset(asset);
    setFormData({
      name: asset.name,
      type: asset.type,
      description: asset.description || '',
      host_id: asset.host_id,
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const getHardwareAssetName = (id: number) => {
    const asset = hardwareAssets.find(h => h.id === id);
    return asset ? asset.name : 'Unknown Host';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Software Assets</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>Add Software Asset</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Edit Software Asset' : 'Create Software Asset'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter software name"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value: 'VM' | 'container') => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VM">VM</SelectItem>
                    <SelectItem value="container">Container</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="host_id">Host</Label>
                <Select value={formData.host_id > 0 ? formData.host_id.toString() : ''} onValueChange={(value) => setFormData({...formData, host_id: parseInt(value)})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select host" />
                  </SelectTrigger>
                  <SelectContent>
                    {hardwareAssets.map(asset => (
                      <SelectItem key={asset.id} value={asset.id.toString()}>
                        {asset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter description (optional)"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={isEditing ? handleUpdate : handleCreate}>
                  {isEditing ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {softwareAssets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No software assets found. Create your first software asset!
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {softwareAssets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell className="font-medium">{asset.name}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                    {asset.type}
                  </span>
                </TableCell>
                <TableCell>{getHardwareAssetName(asset.host_id)}</TableCell>
                <TableCell>{asset.description || '-'}</TableCell>
                <TableCell>{asset.created_at.toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openEditDialog(asset)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDelete(asset.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
