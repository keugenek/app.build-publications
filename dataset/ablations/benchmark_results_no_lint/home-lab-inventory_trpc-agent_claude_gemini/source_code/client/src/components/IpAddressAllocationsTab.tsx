import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Network, Search, Link } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { IpAddressAllocation, CreateIpAddressAllocationInput, UpdateIpAddressAllocationInput, HardwareAsset, SoftwareAsset } from '../../../server/src/schema';

export function IpAddressAllocationsTab() {
  const [allocations, setAllocations] = useState<IpAddressAllocation[]>([]);
  const [hardwareAssets, setHardwareAssets] = useState<HardwareAsset[]>([]);
  const [softwareAssets, setSoftwareAssets] = useState<SoftwareAsset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<IpAddressAllocation | null>(null);

  const [createFormData, setCreateFormData] = useState<CreateIpAddressAllocationInput>({
    ip_address: '',
    purpose: null,
    assigned_hardware_id: null,
    assigned_software_id: null,
    status: 'Static'
  });

  const [updateFormData, setUpdateFormData] = useState<UpdateIpAddressAllocationInput>({
    id: 0,
    ip_address: '',
    purpose: null,
    assigned_hardware_id: null,
    assigned_software_id: null,
    status: 'Static'
  });

  const loadData = useCallback(async () => {
    try {
      const [ipResult, hardwareResult, softwareResult] = await Promise.all([
        trpc.getIpAddressAllocations.query(),
        trpc.getHardwareAssets.query(),
        trpc.getSoftwareAssets.query()
      ]);
      setAllocations(ipResult);
      setHardwareAssets(hardwareResult);
      setSoftwareAssets(softwareResult);
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
      const response = await trpc.createIpAddressAllocation.mutate(createFormData);
      setAllocations((prev: IpAddressAllocation[]) => [...prev, response]);
      setCreateFormData({
        ip_address: '',
        purpose: null,
        assigned_hardware_id: null,
        assigned_software_id: null,
        status: 'Static'
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create IP address allocation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAllocation) return;
    
    setIsLoading(true);
    try {
      const response = await trpc.updateIpAddressAllocation.mutate(updateFormData);
      setAllocations((prev: IpAddressAllocation[]) => 
        prev.map((allocation: IpAddressAllocation) => allocation.id === response.id ? response : allocation)
      );
      setEditingAllocation(null);
    } catch (error) {
      console.error('Failed to update IP address allocation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteIpAddressAllocation.mutate({ id });
      setAllocations((prev: IpAddressAllocation[]) => prev.filter((allocation: IpAddressAllocation) => allocation.id !== id));
    } catch (error) {
      console.error('Failed to delete IP address allocation:', error);
    }
  };

  const startEditing = (allocation: IpAddressAllocation) => {
    setEditingAllocation(allocation);
    setUpdateFormData({
      id: allocation.id,
      ip_address: allocation.ip_address,
      purpose: allocation.purpose,
      assigned_hardware_id: allocation.assigned_hardware_id,
      assigned_software_id: allocation.assigned_software_id,
      status: allocation.status
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'static': return 'bg-blue-100 text-blue-800';
      case 'dhcp': return 'bg-green-100 text-green-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHardwareAssetName = (id: number | null) => {
    if (!id) return null;
    const hardware = hardwareAssets.find((hw: HardwareAsset) => hw.id === id);
    return hardware ? hardware.name : null;
  };

  const getSoftwareAssetName = (id: number | null) => {
    if (!id) return null;
    const software = softwareAssets.find((sw: SoftwareAsset) => sw.id === id);
    return software ? software.name : null;
  };

  const filteredAllocations = allocations.filter((allocation: IpAddressAllocation) => {
    const matchesSearch = allocation.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (allocation.purpose?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || allocation.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Search, Filter, and Add Button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search IP addresses..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="static">Static</SelectItem>
              <SelectItem value="dhcp">DHCP</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Add IP Allocation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add IP Address Allocation</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <Label htmlFor="ip_address">IP Address</Label>
                <Input
                  id="ip_address"
                  value={createFormData.ip_address}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateIpAddressAllocationInput) => ({ ...prev, ip_address: e.target.value }))
                  }
                  placeholder="e.g., 192.168.1.100"
                  required
                />
              </div>
              <div>
                <Label htmlFor="purpose">Purpose/Description</Label>
                <Input
                  id="purpose"
                  value={createFormData.purpose || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateIpAddressAllocationInput) => ({ 
                      ...prev, 
                      purpose: e.target.value || null 
                    }))
                  }
                  placeholder="e.g., Main Server Management IP"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={createFormData.status}
                  onValueChange={(value: string) =>
                    setCreateFormData((prev: CreateIpAddressAllocationInput) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Static">Static</SelectItem>
                    <SelectItem value="DHCP">DHCP</SelectItem>
                    <SelectItem value="Reserved">Reserved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assigned_hardware">Assigned Hardware</Label>
                <Select
                  value={createFormData.assigned_hardware_id?.toString() || ''}
                  onValueChange={(value: string) =>
                    setCreateFormData((prev: CreateIpAddressAllocationInput) => ({ 
                      ...prev, 
                      assigned_hardware_id: value ? parseInt(value) : null 
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
                <Label htmlFor="assigned_software">Assigned Software</Label>
                <Select
                  value={createFormData.assigned_software_id?.toString() || ''}
                  onValueChange={(value: string) =>
                    setCreateFormData((prev: CreateIpAddressAllocationInput) => ({ 
                      ...prev, 
                      assigned_software_id: value ? parseInt(value) : null 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select software (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {softwareAssets.map((sw: SoftwareAsset) => (
                      <SelectItem key={sw.id} value={sw.id.toString()}>
                        {sw.name} ({sw.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
                  {isLoading ? 'Creating...' : 'Create Allocation'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* IP Allocations Grid */}
      {filteredAllocations.length === 0 ? (
        <div className="text-center py-12">
          <Network className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No IP allocations found</p>
          <p className="text-gray-400">
            {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filter' : 'Add your first IP allocation to get started'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAllocations.map((allocation: IpAddressAllocation) => (
            <Card key={allocation.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4" />
                    <CardTitle className="text-lg font-mono">{allocation.ip_address}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(allocation)}
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
                          <AlertDialogTitle>Delete IP Allocation</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete IP allocation "{allocation.ip_address}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(allocation.id)} className="bg-red-600 hover:bg-red-700">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <Badge className={`w-fit ${getStatusBadgeColor(allocation.status)}`}>
                  {allocation.status}
                </Badge>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  {allocation.purpose && (
                    <div><strong>Purpose:</strong> {allocation.purpose}</div>
                  )}
                  {allocation.assigned_hardware_id && (
                    <div className="flex items-center gap-1">
                      <Link className="w-3 h-3" />
                      <strong>Hardware:</strong> {getHardwareAssetName(allocation.assigned_hardware_id)}
                    </div>
                  )}
                  {allocation.assigned_software_id && (
                    <div className="flex items-center gap-1">
                      <Link className="w-3 h-3" />
                      <strong>Software:</strong> {getSoftwareAssetName(allocation.assigned_software_id)}
                    </div>
                  )}
                  {!allocation.assigned_hardware_id && !allocation.assigned_software_id && (
                    <div className="text-gray-400 italic">Unassigned</div>
                  )}
                  <div className="text-xs text-gray-400 pt-2 border-t">
                    Created: {allocation.created_at.toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingAllocation} onOpenChange={() => setEditingAllocation(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit IP Address Allocation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-ip_address">IP Address</Label>
              <Input
                id="edit-ip_address"
                value={updateFormData.ip_address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUpdateFormData((prev: UpdateIpAddressAllocationInput) => ({ ...prev, ip_address: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-purpose">Purpose/Description</Label>
              <Input
                id="edit-purpose"
                value={updateFormData.purpose || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUpdateFormData((prev: UpdateIpAddressAllocationInput) => ({ 
                    ...prev, 
                    purpose: e.target.value || null 
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={updateFormData.status}
                onValueChange={(value: string) =>
                  setUpdateFormData((prev: UpdateIpAddressAllocationInput) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Static">Static</SelectItem>
                  <SelectItem value="DHCP">DHCP</SelectItem>
                  <SelectItem value="Reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-assigned_hardware">Assigned Hardware</Label>
              <Select
                value={updateFormData.assigned_hardware_id?.toString() || ''}
                onValueChange={(value: string) =>
                  setUpdateFormData((prev: UpdateIpAddressAllocationInput) => ({ 
                    ...prev, 
                    assigned_hardware_id: value ? parseInt(value) : null 
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
              <Label htmlFor="edit-assigned_software">Assigned Software</Label>
              <Select
                value={updateFormData.assigned_software_id?.toString() || ''}
                onValueChange={(value: string) =>
                  setUpdateFormData((prev: UpdateIpAddressAllocationInput) => ({ 
                    ...prev, 
                    assigned_software_id: value ? parseInt(value) : null 
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select software (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {softwareAssets.map((sw: SoftwareAsset) => (
                    <SelectItem key={sw.id} value={sw.id.toString()}>
                      {sw.name} ({sw.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingAllocation(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
                {isLoading ? 'Updating...' : 'Update Allocation'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
