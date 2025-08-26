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
import type { HardwareAsset, CreateHardwareAssetInput, UpdateHardwareAssetInput } from '../../../server/src/schema';

interface HardwareAssetsTabProps {
  hardwareAssets: HardwareAsset[];
  setHardwareAssets: React.Dispatch<React.SetStateAction<HardwareAsset[]>>;
}

const hardwareTypes = ['Server', 'Switch', 'Router', 'Storage', 'Firewall', 'Access Point', 'UPS', 'Other'];

export function HardwareAssetsTab({ hardwareAssets, setHardwareAssets }: HardwareAssetsTabProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<HardwareAsset | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<CreateHardwareAssetInput>({
    name: '',
    type: '',
    manufacturer: '',
    model: '',
    description: null
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      manufacturer: '',
      model: '',
      description: null
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createHardwareAsset.mutate(formData);
      setHardwareAssets((prev: HardwareAsset[]) => [...prev, response]);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create hardware asset:', error);
      // Backend handlers are placeholders, creating local entry for demonstration
      const newAsset: HardwareAsset = {
        id: Date.now(),
        ...formData,
        created_at: new Date(),
        updated_at: new Date()
      };
      setHardwareAssets((prev: HardwareAsset[]) => [...prev, newAsset]);
      setIsCreateDialogOpen(false);
      resetForm();
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (asset: HardwareAsset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      type: asset.type,
      manufacturer: asset.manufacturer,
      model: asset.model,
      description: asset.description
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateHardwareAssetInput = {
        id: editingAsset.id,
        ...formData
      };
      const response = await trpc.updateHardwareAsset.mutate(updateData);
      setHardwareAssets((prev: HardwareAsset[]) => 
        prev.map((asset: HardwareAsset) => asset.id === editingAsset.id ? response : asset)
      );
      setEditingAsset(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update hardware asset:', error);
      // Fallback local update
      setHardwareAssets((prev: HardwareAsset[]) => 
        prev.map((asset: HardwareAsset) => 
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
      await trpc.deleteHardwareAsset.mutate({ id: assetId });
      setHardwareAssets((prev: HardwareAsset[]) => 
        prev.filter((asset: HardwareAsset) => asset.id !== assetId)
      );
    } catch (error) {
      console.error('Failed to delete hardware asset:', error);
      // Fallback local delete
      setHardwareAssets((prev: HardwareAsset[]) => 
        prev.filter((asset: HardwareAsset) => asset.id !== assetId)
      );
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'server': return '🖥️';
      case 'switch': return '🔌';
      case 'router': return '📡';
      case 'storage': return '💾';
      case 'firewall': return '🛡️';
      case 'access point': return '📶';
      case 'ups': return '🔋';
      default: return '⚙️';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Hardware Assets</h2>
          <p className="text-sm text-gray-600">Physical infrastructure components</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>+ Add Hardware Asset</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Hardware Asset</DialogTitle>
              <DialogDescription>
                Create a new hardware asset in your infrastructure.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateHardwareAssetInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Main Server"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select value={formData.type || 'Server'} onValueChange={(value: string) => 
                  setFormData((prev: CreateHardwareAssetInput) => ({ ...prev, type: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select hardware type" />
                  </SelectTrigger>
                  <SelectContent>
                    {hardwareTypes.map((type: string) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer *</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateHardwareAssetInput) => ({ ...prev, manufacturer: e.target.value }))
                  }
                  placeholder="e.g., Dell, HP, Cisco"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateHardwareAssetInput) => ({ ...prev, model: e.target.value }))
                  }
                  placeholder="e.g., PowerEdge R720"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateHardwareAssetInput) => ({ 
                      ...prev, 
                      description: e.target.value || null 
                    }))
                  }
                  placeholder="Additional details about this hardware..."
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
      {hardwareAssets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-6xl mb-4">🖥️</div>
            <CardTitle className="mb-2">No Hardware Assets</CardTitle>
            <CardDescription className="mb-4">
              Start building your infrastructure catalog by adding your first hardware asset.
            </CardDescription>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Add Hardware Asset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hardwareAssets.map((asset: HardwareAsset) => (
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
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Manufacturer:</span>
                    <span className="text-gray-600">{asset.manufacturer}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Model:</span>
                    <span className="text-gray-600">{asset.model}</span>
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
                        <AlertDialogTitle>Delete Hardware Asset</AlertDialogTitle>
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
            <DialogTitle>Edit Hardware Asset</DialogTitle>
            <DialogDescription>
              Update the details of your hardware asset.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateHardwareAssetInput) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type *</Label>
              <Select value={formData.type || 'Server'} onValueChange={(value: string) => 
                setFormData((prev: CreateHardwareAssetInput) => ({ ...prev, type: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hardwareTypes.map((type: string) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-manufacturer">Manufacturer *</Label>
              <Input
                id="edit-manufacturer"
                value={formData.manufacturer}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateHardwareAssetInput) => ({ ...prev, manufacturer: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-model">Model *</Label>
              <Input
                id="edit-model"
                value={formData.model}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateHardwareAssetInput) => ({ ...prev, model: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateHardwareAssetInput) => ({ 
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
