import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Monitor, Container, Search, Link } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { SoftwareAsset, CreateSoftwareAssetInput, UpdateSoftwareAssetInput, HardwareAsset, IpAddressAllocation } from '../../../server/src/schema';

export function SoftwareAssetsTab() {
  const [assets, setAssets] = useState<SoftwareAsset[]>([]);
  const [hardwareAssets, setHardwareAssets] = useState<HardwareAsset[]>([]);
  const [ipAllocations, setIpAllocations] = useState<IpAddressAllocation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<SoftwareAsset | null>(null);

  const [createFormData, setCreateFormData] = useState<CreateSoftwareAssetInput>({
    name: '',
    type: '',
    hardware_asset_id: null,
    operating_system: null,
    purpose: null,
    resource_allocation: null,
    ip_address_id: null
  });

  const [updateFormData, setUpdateFormData] = useState<UpdateSoftwareAssetInput>({
    id: 0,
    name: '',
    type: '',
    hardware_asset_id: null,
    operating_system: null,
    purpose: null,
    resource_allocation: null,
    ip_address_id: null
  });

  const loadData = useCallback(async () => {
    try {
      const [softwareResult, hardwareResult, ipResult] = await Promise.all([
        trpc.getSoftwareAssets.query(),
        trpc.getHardwareAssets.query(),
        trpc.getIpAddressAllocations.query()
      ]);
      setAssets(softwareResult);
      setHardwareAssets(hardwareResult);
      setIpAllocations(ipResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createSoftwareAsset.mutate(createFormData);
      setAssets((prev: SoftwareAsset[]) => [...prev, response]);
      setCreateFormData({
        name: '',
        type: '',
        hardware_asset_id: null,
        operating_system: null,
        purpose: null,
        resource_allocation: null,
        ip_address_id: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create software asset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    
    setIsLoading(true);
    try {
      const response = await trpc.updateSoftwareAsset.mutate(updateFormData);
      setAssets((prev: SoftwareAsset[]) => 
        prev.map((asset: SoftwareAsset) => asset.id === response.id ? response : asset)
      );
      setEditingAsset(null);
    } catch (error) {
      console.error('Failed to update software asset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteSoftwareAsset.mutate({ id });
      setAssets((prev: SoftwareAsset[]) => prev.filter((asset: SoftwareAsset) => asset.id !== id));
    } catch (error) {
      console.error('Failed to delete software asset:', error);
    }
  };

  const startEditing = (asset: SoftwareAsset) => {
    setEditingAsset(asset);
    setUpdateFormData({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      hardware_asset_id: asset.hardware_asset_id,
      operating_system: asset.operating_system,
      purpose: asset.purpose,
      resource_allocation: asset.resource_allocation,
      ip_address_id: asset.ip_address_id
    });
  };

  const getTypeIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('vm') || lowerType.includes('virtual')) return <Monitor className="w-4 h-4" />;
    if (lowerType.includes('container') || lowerType.includes('docker')) return <Container className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  const getTypeBadgeColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('vm') || lowerType.includes('virtual')) return 'bg-green-100 text-green-800';
    if (lowerType.includes('container') || lowerType.includes('docker')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getHardwareAssetName = (id: number | null) => {
    if (!id) return null;
    const hardware = hardwareAssets.find((hw: HardwareAsset) => hw.id === id);
    return hardware ? hardware.name : null;
  };

  const getIpAddress = (id: number | null) => {
    if (!id) return null;
    const ip = ipAllocations.find((ip: IpAddressAllocation) => ip.id === id);
    return ip ? ip.ip_address : null;
  };

  const filteredAssets = assets.filter((asset: SoftwareAsset) =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (asset.operating_system?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (asset.purpose?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Search and Add Button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search software assets..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Software Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Software Asset</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={createFormData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateSoftwareAssetInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Web Server VM"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={createFormData.type}
                  onValueChange={(value: string) =>
                    setCreateFormData((prev: CreateSoftwareAssetInput) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VM">Virtual Machine</SelectItem>
                    <SelectItem value="Container">Container</SelectItem>
                    <SelectItem value="Docker">Docker Container</SelectItem>
                    <SelectItem value="LXC">LXC Container</SelectItem>
                    <SelectItem value="Service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="hardware_asset">Hardware Asset</Label>
                <Select
                  value={createFormData.hardware_asset_id?.toString() || ''}
                  onValueChange={(value: string) =>
                    setCreateFormData((prev: CreateSoftwareAssetInput) => ({ 
                      ...prev, 
                      hardware_asset_id: value ? parseInt(value) : null 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hardware (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {hardwareAssets.map((hw: HardwareAsset) => (
                      <SelectItem key={hw.id} value={hw.id.toString()}>
                        {hw.name} ({hw.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="operating_system">Operating System</Label>
                <Input
                  id="operating_system"
                  value={createFormData.operating_system || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateSoftwareAssetInput) => ({ 
                      ...prev, 
                      operating_system: e.target.value || null 
                    }))
                  }
                  placeholder="e.g., Ubuntu 22.04, Windows Server 2022"
                />
              </div>
              <div>
                <Label htmlFor="purpose">Purpose</Label>
                <Input
                  id="purpose"
                  value={createFormData.purpose || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateSoftwareAssetInput) => ({ 
                      ...prev, 
                      purpose: e.target.value || null 
                    }))
                  }
                  placeholder="e.g., Web hosting, Database server"
                />
              </div>
              <div>
                <Label htmlFor="resource_allocation">Resource Allocation</Label>
                <Textarea
                  id="resource_allocation"
                  value={createFormData.resource_allocation || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCreateFormData((prev: CreateSoftwareAssetInput) => ({ 
                      ...prev, 
                      resource_allocation: e.target.value || null 
                    }))
                  }
                  placeholder="e.g., 4 vCPU, 8GB RAM, 100GB SSD"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="ip_address">IP Address</Label>
                <Select
                  value={createFormData.ip_address_id?.toString() || ''}
                  onValueChange={(value: string) =>
                    setCreateFormData((prev: CreateSoftwareAssetInput) => ({ 
                      ...prev, 
                      ip_address_id: value ? parseInt(value) : null 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select IP (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {ipAllocations.map((ip: IpAddressAllocation) => (
                      <SelectItem key={ip.id} value={ip.id.toString()}>
                        {ip.ip_address} {ip.purpose && `(${ip.purpose})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
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
          <Monitor className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No software assets found</p>
          <p className="text-gray-400">
            {searchTerm ? 'Try adjusting your search terms' : 'Add your first software asset to get started'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset: SoftwareAsset) => (
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
                          <AlertDialogTitle>Delete Software Asset</AlertDialogTitle>
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
                  {asset.operating_system && (
                    <div><strong>OS:</strong> {asset.operating_system}</div>
                  )}
                  {asset.purpose && (
                    <div><strong>Purpose:</strong> {asset.purpose}</div>
                  )}
                  {asset.resource_allocation && (
                    <div><strong>Resources:</strong> {asset.resource_allocation}</div>
                  )}
                  {asset.hardware_asset_id && (
                    <div className="flex items-center gap-1">
                      <Link className="w-3 h-3" />
                      <strong>Hardware:</strong> {getHardwareAssetName(asset.hardware_asset_id)}
                    </div>
                  )}
                  {asset.ip_address_id && (
                    <div className="flex items-center gap-1">
                      <Link className="w-3 h-3" />
                      <strong>IP:</strong> {getIpAddress(asset.ip_address_id)}
                    </div>
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
            <DialogTitle>Edit Software Asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={updateFormData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUpdateFormData((prev: UpdateSoftwareAssetInput) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-type">Type</Label>
              <Select
                value={updateFormData.type}
                onValueChange={(value: string) =>
                  setUpdateFormData((prev: UpdateSoftwareAssetInput) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VM">Virtual Machine</SelectItem>
                  <SelectItem value="Container">Container</SelectItem>
                  <SelectItem value="Docker">Docker Container</SelectItem>
                  <SelectItem value="LXC">LXC Container</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-hardware_asset">Hardware Asset</Label>
              <Select
                value={updateFormData.hardware_asset_id?.toString() || ''}
                onValueChange={(value: string) =>
                  setUpdateFormData((prev: UpdateSoftwareAssetInput) => ({ 
                    ...prev, 
                    hardware_asset_id: value ? parseInt(value) : null 
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select hardware (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {hardwareAssets.map((hw: HardwareAsset) => (
                    <SelectItem key={hw.id} value={hw.id.toString()}>
                      {hw.name} ({hw.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-operating_system">Operating System</Label>
              <Input
                id="edit-operating_system"
                value={updateFormData.operating_system || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUpdateFormData((prev: UpdateSoftwareAssetInput) => ({ 
                    ...prev, 
                    operating_system: e.target.value || null 
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-purpose">Purpose</Label>
              <Input
                id="edit-purpose"
                value={updateFormData.purpose || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUpdateFormData((prev: UpdateSoftwareAssetInput) => ({ 
                    ...prev, 
                    purpose: e.target.value || null 
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-resource_allocation">Resource Allocation</Label>
              <Textarea
                id="edit-resource_allocation"
                value={updateFormData.resource_allocation || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setUpdateFormData((prev: UpdateSoftwareAssetInput) => ({ 
                    ...prev, 
                    resource_allocation: e.target.value || null 
                  }))
                }
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="edit-ip_address">IP Address</Label>
              <Select
                value={updateFormData.ip_address_id?.toString() || ''}
                onValueChange={(value: string) =>
                  setUpdateFormData((prev: UpdateSoftwareAssetInput) => ({ 
                    ...prev, 
                    ip_address_id: value ? parseInt(value) : null 
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select IP (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {ipAllocations.map((ip: IpAddressAllocation) => (
                    <SelectItem key={ip.id} value={ip.id.toString()}>
                      {ip.ip_address} {ip.purpose && `(${ip.purpose})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingAsset(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                {isLoading ? 'Updating...' : 'Update Asset'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
