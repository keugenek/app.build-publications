import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Server, Wifi, HardDrive, Search } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { HardwareAsset, CreateHardwareAssetInput, UpdateHardwareAssetInput } from '../../../server/src/schema';

export function HardwareAssetsTab() {
  const [assets, setAssets] = useState<HardwareAsset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<HardwareAsset | null>(null);

  const [createFormData, setCreateFormData] = useState<CreateHardwareAssetInput>({
    name: '',
    type: '',
    make: '',
    model: '',
    serial_number: null,
    description: null
  });

  const [updateFormData, setUpdateFormData] = useState<UpdateHardwareAssetInput>({
    id: 0,
    name: '',
    type: '',
    make: '',
    model: '',
    serial_number: null,
    description: null
  });

  const loadAssets = useCallback(async () => {
    try {
      const result = await trpc.getHardwareAssets.query();
      setAssets(result);
    } catch (error) {
      console.error('Failed to load hardware assets:', error);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createHardwareAsset.mutate(createFormData);
      setAssets((prev: HardwareAsset[]) => [...prev, response]);
      setCreateFormData({
        name: '',
        type: '',
        make: '',
        model: '',
        serial_number: null,
        description: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create hardware asset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    
    setIsLoading(true);
    try {
      const response = await trpc.updateHardwareAsset.mutate(updateFormData);
      setAssets((prev: HardwareAsset[]) => 
        prev.map((asset: HardwareAsset) => asset.id === response.id ? response : asset)
      );
      setEditingAsset(null);
    } catch (error) {
      console.error('Failed to update hardware asset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteHardwareAsset.mutate({ id });
      setAssets((prev: HardwareAsset[]) => prev.filter((asset: HardwareAsset) => asset.id !== id));
    } catch (error) {
      console.error('Failed to delete hardware asset:', error);
    }
  };

  const startEditing = (asset: HardwareAsset) => {
    setEditingAsset(asset);
    setUpdateFormData({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      make: asset.make,
      model: asset.model,
      serial_number: asset.serial_number,
      description: asset.description
    });
  };

  const getTypeIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('server')) return <Server className="w-4 h-4" />;
    if (lowerType.includes('switch') || lowerType.includes('router')) return <Wifi className="w-4 h-4" />;
    if (lowerType.includes('storage') || lowerType.includes('nas')) return <HardDrive className="w-4 h-4" />;
    return <Server className="w-4 h-4" />;
  };

  const getTypeBadgeColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('server')) return 'bg-blue-100 text-blue-800';
    if (lowerType.includes('switch') || lowerType.includes('router')) return 'bg-green-100 text-green-800';
    if (lowerType.includes('storage') || lowerType.includes('nas')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const filteredAssets = assets.filter((asset: HardwareAsset) =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search and Add Button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search hardware assets..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Hardware Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Hardware Asset</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={createFormData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateHardwareAssetInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Main Server"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  value={createFormData.type}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateHardwareAssetInput) => ({ ...prev, type: e.target.value }))
                  }
                  placeholder="e.g., Server, Switch, Router"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    value={createFormData.make}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateHardwareAssetInput) => ({ ...prev, make: e.target.value }))
                    }
                    placeholder="e.g., Dell, HP, Cisco"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={createFormData.model}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateHardwareAssetInput) => ({ ...prev, model: e.target.value }))
                    }
                    placeholder="e.g., PowerEdge R730"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="serial_number">Serial Number</Label>
                <Input
                  id="serial_number"
                  value={createFormData.serial_number || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateHardwareAssetInput) => ({ 
                      ...prev, 
                      serial_number: e.target.value || null 
                    }))
                  }
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={createFormData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCreateFormData((prev: CreateHardwareAssetInput) => ({ 
                      ...prev, 
                      description: e.target.value || null 
                    }))
                  }
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                  {isLoading ? 'Creating...' : 'Create Asset'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-12">
          <Server className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No hardware assets found</p>
          <p className="text-gray-400">
            {searchTerm ? 'Try adjusting your search terms' : 'Add your first hardware asset to get started'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset: HardwareAsset) => (
            <Card key={asset.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(asset.type)}
                    <CardTitle className="text-lg">{asset.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(asset)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
                          <AlertDialogAction onClick={() => handleDelete(asset.id)} className="bg-red-600 hover:bg-red-700">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <Badge className={`w-fit ${getTypeBadgeColor(asset.type)}`}>
                  {asset.type}
                </Badge>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  <div><strong>Make:</strong> {asset.make}</div>
                  <div><strong>Model:</strong> {asset.model}</div>
                  {asset.serial_number && (
                    <div><strong>S/N:</strong> {asset.serial_number}</div>
                  )}
                  {asset.description && (
                    <div className="text-gray-600 mt-2">{asset.description}</div>
                  )}
                  <div className="text-xs text-gray-400 pt-2 border-t">
                    Created: {asset.created_at.toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingAsset} onOpenChange={() => setEditingAsset(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Hardware Asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={updateFormData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUpdateFormData((prev: UpdateHardwareAssetInput) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-type">Type</Label>
              <Input
                id="edit-type"
                value={updateFormData.type}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUpdateFormData((prev: UpdateHardwareAssetInput) => ({ ...prev, type: e.target.value }))
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-make">Make</Label>
                <Input
                  id="edit-make"
                  value={updateFormData.make}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUpdateFormData((prev: UpdateHardwareAssetInput) => ({ ...prev, make: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-model">Model</Label>
                <Input
                  id="edit-model"
                  value={updateFormData.model}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUpdateFormData((prev: UpdateHardwareAssetInput) => ({ ...prev, model: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-serial_number">Serial Number</Label>
              <Input
                id="edit-serial_number"
                value={updateFormData.serial_number || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUpdateFormData((prev: UpdateHardwareAssetInput) => ({ 
                    ...prev, 
                    serial_number: e.target.value || null 
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={updateFormData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setUpdateFormData((prev: UpdateHardwareAssetInput) => ({ 
                    ...prev, 
                    description: e.target.value || null 
                  }))
                }
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingAsset(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                {isLoading ? 'Updating...' : 'Update Asset'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
