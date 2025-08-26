import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { trpc } from '@/utils/trpc';
import type { HardwareAsset, CreateHardwareAssetInput } from '../../../server/src/schema';

export function HardwareAssetsTab() {
  const [hardwareAssets, setHardwareAssets] = useState<HardwareAsset[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<HardwareAsset | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'server' as 'server' | 'switch',
    description: '',
  });

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
    loadHardwareAssets();
  }, [loadHardwareAssets]);

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'server',
      description: '',
    });
    setCurrentAsset(null);
    setIsEditing(false);
  };

  const handleCreate = async () => {
    try {
      const input: CreateHardwareAssetInput = {
        name: formData.name,
        type: formData.type,
        description: formData.description || null,
      };
      
      const newAsset = await trpc.createHardwareAsset.mutate(input);
      if (newAsset) {
        setHardwareAssets([...hardwareAssets, newAsset]);
      }
      setIsDialogOpen(false);
      resetForm();
      toast.success('Hardware asset created successfully');
    } catch (error) {
      console.error('Failed to create hardware asset:', error);
      toast.error('Failed to create hardware asset');
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
      };
      
      const updatedAsset = await trpc.updateHardwareAsset.mutate(input);
      if (updatedAsset) {
        setHardwareAssets(hardwareAssets.map(asset => 
          asset.id === updatedAsset.id ? updatedAsset : asset
        ));
      }
      setIsDialogOpen(false);
      resetForm();
      toast.success('Hardware asset updated successfully');
    } catch (error) {
      console.error('Failed to update hardware asset:', error);
      toast.error('Failed to update hardware asset');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteHardwareAsset.mutate({ id });
      setHardwareAssets(hardwareAssets.filter(asset => asset.id !== id));
      toast.success('Hardware asset deleted successfully');
    } catch (error) {
      console.error('Failed to delete hardware asset:', error);
      toast.error('Failed to delete hardware asset');
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (asset: HardwareAsset) => {
    setCurrentAsset(asset);
    setFormData({
      name: asset.name,
      type: asset.type,
      description: asset.description || '',
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Hardware Assets</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>Add Hardware Asset</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Edit Hardware Asset' : 'Create Hardware Asset'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter hardware name"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value: 'server' | 'switch') => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="server">Server</SelectItem>
                    <SelectItem value="switch">Switch</SelectItem>
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

      {hardwareAssets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hardware assets found. Create your first hardware asset!
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hardwareAssets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell className="font-medium">{asset.name}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                    {asset.type}
                  </span>
                </TableCell>
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
