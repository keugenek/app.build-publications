import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { HardwareAsset, CreateHardwareAssetInput, UpdateHardwareAssetInput } from '../../../server/src/schema';

interface HardwareAssetManagerProps {
  onDataChange?: () => void;
}

export function HardwareAssetManager({ onDataChange }: HardwareAssetManagerProps) {
  const [assets, setAssets] = useState<HardwareAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<HardwareAsset | null>(null);
  const [formData, setFormData] = useState<CreateHardwareAssetInput>({
    name: '',
    type: 'server',
    status: 'active',
    model: null,
    manufacturer: null,
    serial_number: null,
    location: null,
    notes: null
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createHardwareAsset.mutate(formData);
      setAssets((prev: HardwareAsset[]) => [...prev, response]);
      setFormData({
        name: '',
        type: 'server',
        status: 'active',
        model: null,
        manufacturer: null,
        serial_number: null,
        location: null,
        notes: null
      });
      setIsCreateDialogOpen(false);
      onDataChange?.();
    } catch (error) {
      console.error('Failed to create hardware asset:', error);
    } finally {
      setIsLoading(false);
    }
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
      if (response) {
        setAssets((prev: HardwareAsset[]) => 
          prev.map(asset => asset.id === editingAsset.id ? response : asset)
        );
      }
      setEditingAsset(null);
      onDataChange?.();
    } catch (error) {
      console.error('Failed to update hardware asset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteHardwareAsset.mutate({ id });
      setAssets((prev: HardwareAsset[]) => prev.filter(asset => asset.id !== id));
      onDataChange?.();
    } catch (error) {
      console.error('Failed to delete hardware asset:', error);
    }
  };

  const startEdit = (asset: HardwareAsset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      type: asset.type,
      status: asset.status,
      model: asset.model,
      manufacturer: asset.manufacturer,
      serial_number: asset.serial_number,
      location: asset.location,
      notes: asset.notes
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'decommissioned': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'server': return '🖥️';
      case 'network_switch': return '🔌';
      case 'router': return '📡';
      case 'firewall': return '🛡️';
      case 'storage': return '💾';
      default: return '📦';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Hardware Inventory</h3>
          <p className="text-sm text-slate-600">
            {assets.length === 0 ? 
              "No hardware assets yet. Add your first device below!" : 
              `Managing ${assets.length} hardware asset${assets.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <span className="mr-2">➕</span>
              Add Hardware
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Hardware Asset</DialogTitle>
              <DialogDescription>
                Add a new piece of hardware to your lab inventory.
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
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData((prev: CreateHardwareAssetInput) => ({ ...prev, type: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="server">🖥️ Server</SelectItem>
                    <SelectItem value="network_switch">🔌 Network Switch</SelectItem>
                    <SelectItem value="router">📡 Router</SelectItem>
                    <SelectItem value="firewall">🛡️ Firewall</SelectItem>
                    <SelectItem value="storage">💾 Storage</SelectItem>
                    <SelectItem value="other">📦 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev: CreateHardwareAssetInput) => ({ ...prev, status: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">🟢 Active</SelectItem>
                    <SelectItem value="inactive">⚪ Inactive</SelectItem>
                    <SelectItem value="maintenance">🟡 Maintenance</SelectItem>
                    <SelectItem value="decommissioned">🔴 Decommissioned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateHardwareAssetInput) => ({ 
                        ...prev, 
                        manufacturer: e.target.value || null 
                      }))
                    }
                    placeholder="e.g., Dell"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateHardwareAssetInput) => ({ 
                        ...prev, 
                        model: e.target.value || null 
                      }))
                    }
                    placeholder="e.g., PowerEdge R720"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serial_number">Serial Number</Label>
                <Input
                  id="serial_number"
                  value={formData.serial_number || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateHardwareAssetInput) => ({ 
                      ...prev, 
                      serial_number: e.target.value || null 
                    }))
                  }
                  placeholder="Device serial number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateHardwareAssetInput) => ({ 
                      ...prev, 
                      location: e.target.value || null 
                    }))
                  }
                  placeholder="e.g., Server Room, Rack A"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateHardwareAssetInput) => ({ 
                      ...prev, 
                      notes: e.target.value || null 
                    }))
                  }
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Asset'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Assets Grid */}
      {assets.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">🖥️</div>
            <h3 className="text-lg font-semibold mb-2">No Hardware Assets</h3>
            <p className="text-slate-600 text-center mb-4">
              Get started by adding your first piece of hardware to track.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline">
              Add Your First Device
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset: HardwareAsset) => (
            <Card key={asset.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getTypeIcon(asset.type)}</div>
                    <div>
                      <CardTitle className="text-lg">{asset.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusColor(asset.status)}>
                          {asset.status}
                        </Badge>
                        <span className="text-sm text-slate-500 capitalize">
                          {asset.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  {asset.manufacturer && (
                    <div>
                      <span className="font-medium">Manufacturer:</span> {asset.manufacturer}
                    </div>
                  )}
                  {asset.model && (
                    <div>
                      <span className="font-medium">Model:</span> {asset.model}
                    </div>
                  )}
                  {asset.serial_number && (
                    <div>
                      <span className="font-medium">Serial:</span> {asset.serial_number}
                    </div>
                  )}
                  {asset.location && (
                    <div>
                      <span className="font-medium">Location:</span> {asset.location}
                    </div>
                  )}
                  {asset.notes && (
                    <div>
                      <span className="font-medium">Notes:</span>
                      <p className="text-slate-600 mt-1">{asset.notes}</p>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />
                
                <div className="flex gap-2">
                  <Dialog 
                    open={editingAsset?.id === asset.id} 
                    onOpenChange={(open) => !open && setEditingAsset(null)}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => startEdit(asset)}>
                        ✏️ Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Edit Hardware Asset</DialogTitle>
                        <DialogDescription>
                          Update the details for {asset.name}.
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
                          <Select
                            value={formData.type}
                            onValueChange={(value) =>
                              setFormData((prev: CreateHardwareAssetInput) => ({ ...prev, type: value as any }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="server">🖥️ Server</SelectItem>
                              <SelectItem value="network_switch">🔌 Network Switch</SelectItem>
                              <SelectItem value="router">📡 Router</SelectItem>
                              <SelectItem value="firewall">🛡️ Firewall</SelectItem>
                              <SelectItem value="storage">💾 Storage</SelectItem>
                              <SelectItem value="other">📦 Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-status">Status</Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value) =>
                              setFormData((prev: CreateHardwareAssetInput) => ({ ...prev, status: value as any }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">🟢 Active</SelectItem>
                              <SelectItem value="inactive">⚪ Inactive</SelectItem>
                              <SelectItem value="maintenance">🟡 Maintenance</SelectItem>
                              <SelectItem value="decommissioned">🔴 Decommissioned</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-manufacturer">Manufacturer</Label>
                            <Input
                              id="edit-manufacturer"
                              value={formData.manufacturer || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setFormData((prev: CreateHardwareAssetInput) => ({ 
                                  ...prev, 
                                  manufacturer: e.target.value || null 
                                }))
                              }
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="edit-model">Model</Label>
                            <Input
                              id="edit-model"
                              value={formData.model || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setFormData((prev: CreateHardwareAssetInput) => ({ 
                                  ...prev, 
                                  model: e.target.value || null 
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-serial">Serial Number</Label>
                          <Input
                            id="edit-serial"
                            value={formData.serial_number || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setFormData((prev: CreateHardwareAssetInput) => ({ 
                                ...prev, 
                                serial_number: e.target.value || null 
                              }))
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-location">Location</Label>
                          <Input
                            id="edit-location"
                            value={formData.location || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setFormData((prev: CreateHardwareAssetInput) => ({ 
                                ...prev, 
                                location: e.target.value || null 
                              }))
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-notes">Notes</Label>
                          <Textarea
                            id="edit-notes"
                            value={formData.notes || ''}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                              setFormData((prev: CreateHardwareAssetInput) => ({ 
                                ...prev, 
                                notes: e.target.value || null 
                              }))
                            }
                            rows={3}
                          />
                        </div>

                        <DialogFooter>
                          <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Updating...' : 'Update Asset'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        🗑️ Delete
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
                        <AlertDialogAction
                          onClick={() => handleDelete(asset.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="text-xs text-slate-400 mt-4">
                  Created: {asset.created_at.toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
