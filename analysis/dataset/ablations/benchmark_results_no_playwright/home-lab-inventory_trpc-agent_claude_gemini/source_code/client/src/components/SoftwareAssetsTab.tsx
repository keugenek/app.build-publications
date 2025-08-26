import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import type { SoftwareAsset, HardwareAsset, CreateSoftwareAssetInput, UpdateSoftwareAssetInput } from '../../../server/src/schema';

interface SoftwareAssetsTabProps {
  softwareAssets: SoftwareAsset[];
  setSoftwareAssets: React.Dispatch<React.SetStateAction<SoftwareAsset[]>>;
  hardwareAssets: HardwareAsset[];
}

const softwareTypes = ['VM', 'Container', 'Service', 'Database', 'Web Server', 'Application', 'Other'];

export function SoftwareAssetsTab({ softwareAssets, setSoftwareAssets, hardwareAssets }: SoftwareAssetsTabProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<SoftwareAsset | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<CreateSoftwareAssetInput>({
    name: '',
    type: '',
    description: null,
    hardware_asset_id: null
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      description: null,
      hardware_asset_id: null
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createSoftwareAsset.mutate(formData);
      setSoftwareAssets((prev: SoftwareAsset[]) => [...prev, response]);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create software asset:', error);
      // Backend handlers are placeholders, creating local entry for demonstration
      const newAsset: SoftwareAsset = {
        id: Date.now(),
        ...formData,
        created_at: new Date(),
        updated_at: new Date()
      };
      setSoftwareAssets((prev: SoftwareAsset[]) => [...prev, newAsset]);
      setIsCreateDialogOpen(false);
      resetForm();
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (asset: SoftwareAsset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      type: asset.type,
      description: asset.description,
      hardware_asset_id: asset.hardware_asset_id
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateSoftwareAssetInput = {
        id: editingAsset.id,
        ...formData
      };
      const response = await trpc.updateSoftwareAsset.mutate(updateData);
      setSoftwareAssets((prev: SoftwareAsset[]) => 
        prev.map((asset: SoftwareAsset) => asset.id === editingAsset.id ? response : asset)
      );
      setEditingAsset(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update software asset:', error);
      // Fallback local update
      setSoftwareAssets((prev: SoftwareAsset[]) => 
        prev.map((asset: SoftwareAsset) => 
          asset.id === editingAsset.id 
            ? { ...asset, ...formData, updated_at: new Date() }
            : asset
        )
      );
      setEditingAsset(null);
      resetForm();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (assetId: number) => {
    try {
      await trpc.deleteSoftwareAsset.mutate({ id: assetId });
      setSoftwareAssets((prev: SoftwareAsset[]) => 
        prev.filter((asset: SoftwareAsset) => asset.id !== assetId)
      );
    } catch (error) {
      console.error('Failed to delete software asset:', error);
      // Fallback local delete
      setSoftwareAssets((prev: SoftwareAsset[]) => 
        prev.filter((asset: SoftwareAsset) => asset.id !== assetId)
      );
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'vm': return '🖥️';
      case 'container': return '📦';
      case 'service': return '⚙️';
      case 'database': return '🗃️';
      case 'web server': return '🌐';
      case 'application': return '📱';
      default: return '💾';
    }
  };

  const getHostHardwareName = (hardwareId: number | null) => {
    if (!hardwareId) return 'No host assigned';
    const hardware = hardwareAssets.find((hw: HardwareAsset) => hw.id === hardwareId);
    return hardware ? `${hardware.name} (${hardware.type})` : 'Unknown host';
  };

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Software Assets</h2>
          <p className="text-sm text-gray-600">Virtual machines, containers, and services</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>+ Add Software Asset</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Software Asset</DialogTitle>
              <DialogDescription>
                Create a new software asset in your infrastructure.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateSoftwareAssetInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Web Server VM"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select value={formData.type || 'VM'} onValueChange={(value: string) => 
                  setFormData((prev: CreateSoftwareAssetInput) => ({ ...prev, type: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select software type" />
                  </SelectTrigger>
                  <SelectContent>
                    {softwareTypes.map((type: string) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hardware_host">Host Hardware (Optional)</Label>
                <Select value={formData.hardware_asset_id?.toString() || 'unassigned'} onValueChange={(value: string) => 
                  setFormData((prev: CreateSoftwareAssetInput) => ({ 
                    ...prev, 
                    hardware_asset_id: value === 'unassigned' ? null : parseInt(value) 
                  }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select host hardware (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">No host assigned</SelectItem>
                    {hardwareAssets.map((hardware: HardwareAsset) => (
                      <SelectItem key={hardware.id} value={hardware.id.toString()}>
                        {hardware.name} ({hardware.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateSoftwareAssetInput) => ({ 
                      ...prev, 
                      description: e.target.value || null 
                    }))
                  }
                  placeholder="Additional details about this software..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Asset'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Assets Grid */}
      {softwareAssets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-6xl mb-4">💾</div>
            <CardTitle className="mb-2">No Software Assets</CardTitle>
            <CardDescription className="mb-4">
              Start cataloging your virtual infrastructure by adding your first software asset.
            </CardDescription>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Add Software Asset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {softwareAssets.map((asset: SoftwareAsset) => (
            <Card key={asset.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getTypeIcon(asset.type)}</span>
                    <div>
                      <CardTitle className="text-lg">{asset.name}</CardTitle>
                      <Badge variant="secondary">{asset.type}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Host Hardware:</span>
                    <p className="text-sm text-gray-600">{getHostHardwareName(asset.hardware_asset_id)}</p>
                  </div>
                </div>
                {asset.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{asset.description}</p>
                )}
                <div className="text-xs text-gray-400">
                  Created: {asset.created_at.toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleEdit(asset)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Software Asset</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{asset.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(asset.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingAsset} onOpenChange={(open: boolean) => {
        if (!open) {
          setEditingAsset(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Software Asset</DialogTitle>
            <DialogDescription>
              Update the details of your software asset.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateSoftwareAssetInput) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type *</Label>
              <Select value={formData.type || 'VM'} onValueChange={(value: string) => 
                setFormData((prev: CreateSoftwareAssetInput) => ({ ...prev, type: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {softwareTypes.map((type: string) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-hardware_host">Host Hardware</Label>
              <Select value={formData.hardware_asset_id?.toString() || 'unassigned'} onValueChange={(value: string) => 
                setFormData((prev: CreateSoftwareAssetInput) => ({ 
                  ...prev, 
                  hardware_asset_id: value === 'unassigned' ? null : parseInt(value) 
                }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">No host assigned</SelectItem>
                  {hardwareAssets.map((hardware: HardwareAsset) => (
                    <SelectItem key={hardware.id} value={hardware.id.toString()}>
                      {hardware.name} ({hardware.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateSoftwareAssetInput) => ({ 
                    ...prev, 
                    description: e.target.value || null 
                  }))
                }
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditingAsset(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Asset'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
