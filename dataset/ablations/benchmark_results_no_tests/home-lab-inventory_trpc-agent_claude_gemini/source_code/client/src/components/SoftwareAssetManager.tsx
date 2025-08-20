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
import type { SoftwareAsset, CreateSoftwareAssetInput, UpdateSoftwareAssetInput, HardwareAsset } from '../../../server/src/schema';

interface SoftwareAssetManagerProps {
  onDataChange?: () => void;
}

export function SoftwareAssetManager({ onDataChange }: SoftwareAssetManagerProps) {
  const [assets, setAssets] = useState<SoftwareAsset[]>([]);
  const [hardwareAssets, setHardwareAssets] = useState<HardwareAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<SoftwareAsset | null>(null);
  const [formData, setFormData] = useState<CreateSoftwareAssetInput>({
    name: '',
    type: 'virtual_machine',
    status: 'stopped',
    host_hardware_id: null,
    operating_system: null,
    version: null,
    notes: null
  });

  const loadAssets = useCallback(async () => {
    try {
      const result = await trpc.getSoftwareAssets.query();
      setAssets(result);
    } catch (error) {
      console.error('Failed to load software assets:', error);
    }
  }, []);

  const loadHardwareAssets = useCallback(async () => {
    try {
      const result = await trpc.getHardwareAssets.query();
      setHardwareAssets(result);
    } catch (error) {
      console.error('Failed to load hardware assets:', error);
    }
  }, []);

  useEffect(() => {
    loadAssets();
    loadHardwareAssets();
  }, [loadAssets, loadHardwareAssets]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createSoftwareAsset.mutate(formData);
      setAssets((prev: SoftwareAsset[]) => [...prev, response]);
      setFormData({
        name: '',
        type: 'virtual_machine',
        status: 'stopped',
        host_hardware_id: null,
        operating_system: null,
        version: null,
        notes: null
      });
      setIsCreateDialogOpen(false);
      onDataChange?.();
    } catch (error) {
      console.error('Failed to create software asset:', error);
    } finally {
      setIsLoading(false);
    }
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
      if (response) {
        setAssets((prev: SoftwareAsset[]) => 
          prev.map(asset => asset.id === editingAsset.id ? response : asset)
        );
      }
      setEditingAsset(null);
      onDataChange?.();
    } catch (error) {
      console.error('Failed to update software asset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteSoftwareAsset.mutate({ id });
      setAssets((prev: SoftwareAsset[]) => prev.filter(asset => asset.id !== id));
      onDataChange?.();
    } catch (error) {
      console.error('Failed to delete software asset:', error);
    }
  };

  const startEdit = (asset: SoftwareAsset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      type: asset.type,
      status: asset.status,
      host_hardware_id: asset.host_hardware_id,
      operating_system: asset.operating_system,
      version: asset.version,
      notes: asset.notes
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800 border-green-200';
      case 'stopped': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'virtual_machine': return '🖥️';
      case 'container': return '📦';
      case 'service': return '⚙️';
      case 'application': return '💻';
      default: return '📋';
    }
  };

  const getHostHardwareName = (hostId: number | null) => {
    if (!hostId) return null;
    const hardware = hardwareAssets.find(h => h.id === hostId);
    return hardware ? hardware.name : `Hardware ID ${hostId}`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Software Inventory</h3>
          <p className="text-sm text-slate-600">
            {assets.length === 0 ? 
              "No software assets yet. Add your first virtual machine or service below!" : 
              `Managing ${assets.length} software asset${assets.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <span className="mr-2">➕</span>
              Add Software
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Software Asset</DialogTitle>
              <DialogDescription>
                Add a new virtual machine, container, or service to your lab.
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
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData((prev: CreateSoftwareAssetInput) => ({ ...prev, type: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="virtual_machine">🖥️ Virtual Machine</SelectItem>
                    <SelectItem value="container">📦 Container</SelectItem>
                    <SelectItem value="service">⚙️ Service</SelectItem>
                    <SelectItem value="application">💻 Application</SelectItem>
                    <SelectItem value="other">📋 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev: CreateSoftwareAssetInput) => ({ ...prev, status: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="running">🟢 Running</SelectItem>
                    <SelectItem value="stopped">⚪ Stopped</SelectItem>
                    <SelectItem value="paused">🟡 Paused</SelectItem>
                    <SelectItem value="error">🔴 Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="host_hardware">Host Hardware</Label>
                <Select
                  value={formData.host_hardware_id?.toString() || 'none'}
                  onValueChange={(value) =>
                    setFormData((prev: CreateSoftwareAssetInput) => ({ 
                      ...prev, 
                      host_hardware_id: value === 'none' ? null : parseInt(value) 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select host hardware" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No hardware assigned</SelectItem>
                    {hardwareAssets.map((hardware: HardwareAsset) => (
                      <SelectItem key={hardware.id} value={hardware.id.toString()}>
                        {getTypeIcon(hardware.type)} {hardware.name}
                      </SelectItem>
                    ))}
                    {hardwareAssets.length === 0 && (
                      <SelectItem value="none" disabled>
                        No hardware assets available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="operating_system">Operating System</Label>
                  <Input
                    id="operating_system"
                    value={formData.operating_system || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateSoftwareAssetInput) => ({ 
                        ...prev, 
                        operating_system: e.target.value || null 
                      }))
                    }
                    placeholder="e.g., Ubuntu 22.04"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={formData.version || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateSoftwareAssetInput) => ({ 
                        ...prev, 
                        version: e.target.value || null 
                      }))
                    }
                    placeholder="e.g., v1.0.0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateSoftwareAssetInput) => ({ 
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
            <div className="text-6xl mb-4">💻</div>
            <h3 className="text-lg font-semibold mb-2">No Software Assets</h3>
            <p className="text-slate-600 text-center mb-4">
              Get started by adding your first virtual machine, container, or service.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline">
              Add Your First Software
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset: SoftwareAsset) => (
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
                  {asset.host_hardware_id && (
                    <div>
                      <span className="font-medium">Host:</span>{' '}
                      <span className="inline-flex items-center gap-1">
                        🖥️ {getHostHardwareName(asset.host_hardware_id)}
                      </span>
                    </div>
                  )}
                  {asset.operating_system && (
                    <div>
                      <span className="font-medium">OS:</span> {asset.operating_system}
                    </div>
                  )}
                  {asset.version && (
                    <div>
                      <span className="font-medium">Version:</span> {asset.version}
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
                        <DialogTitle>Edit Software Asset</DialogTitle>
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
                              setFormData((prev: CreateSoftwareAssetInput) => ({ ...prev, name: e.target.value }))
                            }
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="edit-type">Type *</Label>
                          <Select
                            value={formData.type}
                            onValueChange={(value) =>
                              setFormData((prev: CreateSoftwareAssetInput) => ({ ...prev, type: value as any }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="virtual_machine">🖥️ Virtual Machine</SelectItem>
                              <SelectItem value="container">📦 Container</SelectItem>
                              <SelectItem value="service">⚙️ Service</SelectItem>
                              <SelectItem value="application">💻 Application</SelectItem>
                              <SelectItem value="other">📋 Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-status">Status</Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value) =>
                              setFormData((prev: CreateSoftwareAssetInput) => ({ ...prev, status: value as any }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="running">🟢 Running</SelectItem>
                              <SelectItem value="stopped">⚪ Stopped</SelectItem>
                              <SelectItem value="paused">🟡 Paused</SelectItem>
                              <SelectItem value="error">🔴 Error</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-host">Host Hardware</Label>
                          <Select
                            value={formData.host_hardware_id?.toString() || 'none'}
                            onValueChange={(value) =>
                              setFormData((prev: CreateSoftwareAssetInput) => ({ 
                                ...prev, 
                                host_hardware_id: value === 'none' ? null : parseInt(value) 
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No hardware assigned</SelectItem>
                              {hardwareAssets.map((hardware: HardwareAsset) => (
                                <SelectItem key={hardware.id} value={hardware.id.toString()}>
                                  {getTypeIcon(hardware.type)} {hardware.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-os">Operating System</Label>
                            <Input
                              id="edit-os"
                              value={formData.operating_system || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setFormData((prev: CreateSoftwareAssetInput) => ({ 
                                  ...prev, 
                                  operating_system: e.target.value || null 
                                }))
                              }
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="edit-version">Version</Label>
                            <Input
                              id="edit-version"
                              value={formData.version || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setFormData((prev: CreateSoftwareAssetInput) => ({ 
                                  ...prev, 
                                  version: e.target.value || null 
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-notes">Notes</Label>
                          <Textarea
                            id="edit-notes"
                            value={formData.notes || ''}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                              setFormData((prev: CreateSoftwareAssetInput) => ({ 
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
                        <AlertDialogTitle>Delete Software Asset</AlertDialogTitle>
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
