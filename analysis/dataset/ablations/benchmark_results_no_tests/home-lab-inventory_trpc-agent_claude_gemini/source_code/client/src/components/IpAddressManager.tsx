import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { IpAddress, CreateIpAddressInput, UpdateIpAddressInput, HardwareAsset, SoftwareAsset } from '../../../server/src/schema';

interface IpAddressManagerProps {
  onDataChange?: () => void;
}

export function IpAddressManager({ onDataChange }: IpAddressManagerProps) {
  const [ipAddresses, setIpAddresses] = useState<IpAddress[]>([]);
  const [hardwareAssets, setHardwareAssets] = useState<HardwareAsset[]>([]);
  const [softwareAssets, setSoftwareAssets] = useState<SoftwareAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingIp, setEditingIp] = useState<IpAddress | null>(null);
  const [formData, setFormData] = useState<CreateIpAddressInput>({
    ip_address: '',
    subnet: '',
    assignment_type: 'hardware',
    hardware_asset_id: null,
    software_asset_id: null,
    description: null,
    is_reserved: false
  });

  const loadIpAddresses = useCallback(async () => {
    try {
      const result = await trpc.getIpAddresses.query();
      setIpAddresses(result);
    } catch (error) {
      console.error('Failed to load IP addresses:', error);
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

  const loadSoftwareAssets = useCallback(async () => {
    try {
      const result = await trpc.getSoftwareAssets.query();
      setSoftwareAssets(result);
    } catch (error) {
      console.error('Failed to load software assets:', error);
    }
  }, []);

  useEffect(() => {
    loadIpAddresses();
    loadHardwareAssets();
    loadSoftwareAssets();
  }, [loadIpAddresses, loadHardwareAssets, loadSoftwareAssets]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createIpAddress.mutate(formData);
      setIpAddresses((prev: IpAddress[]) => [...prev, response]);
      setFormData({
        ip_address: '',
        subnet: '',
        assignment_type: 'hardware',
        hardware_asset_id: null,
        software_asset_id: null,
        description: null,
        is_reserved: false
      });
      setIsCreateDialogOpen(false);
      onDataChange?.();
    } catch (error) {
      console.error('Failed to create IP address:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIp) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateIpAddressInput = {
        id: editingIp.id,
        ...formData
      };
      const response = await trpc.updateIpAddress.mutate(updateData);
      if (response) {
        setIpAddresses((prev: IpAddress[]) => 
          prev.map(ip => ip.id === editingIp.id ? response : ip)
        );
      }
      setEditingIp(null);
      onDataChange?.();
    } catch (error) {
      console.error('Failed to update IP address:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteIpAddress.mutate({ id });
      setIpAddresses((prev: IpAddress[]) => prev.filter(ip => ip.id !== id));
      onDataChange?.();
    } catch (error) {
      console.error('Failed to delete IP address:', error);
    }
  };

  const startEdit = (ip: IpAddress) => {
    setEditingIp(ip);
    setFormData({
      ip_address: ip.ip_address,
      subnet: ip.subnet,
      assignment_type: ip.assignment_type,
      hardware_asset_id: ip.hardware_asset_id,
      software_asset_id: ip.software_asset_id,
      description: ip.description,
      is_reserved: ip.is_reserved
    });
  };

  const getAssignmentName = (ip: IpAddress) => {
    if (ip.assignment_type === 'hardware' && ip.hardware_asset_id) {
      const hardware = hardwareAssets.find(h => h.id === ip.hardware_asset_id);
      return hardware ? `🖥️ ${hardware.name}` : `Hardware ID ${ip.hardware_asset_id}`;
    } else if (ip.assignment_type === 'software' && ip.software_asset_id) {
      const software = softwareAssets.find(s => s.id === ip.software_asset_id);
      return software ? `💻 ${software.name}` : `Software ID ${ip.software_asset_id}`;
    }
    return null;
  };

  const handleAssignmentTypeChange = (value: string) => {
    setFormData((prev: CreateIpAddressInput) => ({
      ...prev,
      assignment_type: value as 'hardware' | 'software',
      hardware_asset_id: null,
      software_asset_id: null
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">IP Address Management</h3>
          <p className="text-sm text-slate-600">
            {ipAddresses.length === 0 ? 
              "No IP addresses allocated yet. Start managing your network addresses below!" : 
              `Managing ${ipAddresses.length} IP address${ipAddresses.length !== 1 ? 'es' : ''}`
            }
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <span className="mr-2">➕</span>
              Add IP Address
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add IP Address</DialogTitle>
              <DialogDescription>
                Allocate a new IP address to a hardware device or software asset.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ip_address">IP Address *</Label>
                  <Input
                    id="ip_address"
                    value={formData.ip_address}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateIpAddressInput) => ({ ...prev, ip_address: e.target.value }))
                    }
                    placeholder="192.168.1.100"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subnet">Subnet *</Label>
                  <Input
                    id="subnet"
                    value={formData.subnet}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateIpAddressInput) => ({ ...prev, subnet: e.target.value }))
                    }
                    placeholder="192.168.1.0/24"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="assignment_type">Assignment Type *</Label>
                <Select
                  value={formData.assignment_type}
                  onValueChange={handleAssignmentTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hardware">🖥️ Hardware Device</SelectItem>
                    <SelectItem value="software">💻 Software Asset</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.assignment_type === 'hardware' && (
                <div className="space-y-2">
                  <Label htmlFor="hardware_asset">Hardware Asset</Label>
                  <Select
                    value={formData.hardware_asset_id?.toString() || 'none'}
                    onValueChange={(value) =>
                      setFormData((prev: CreateIpAddressInput) => ({ 
                        ...prev, 
                        hardware_asset_id: value === 'none' ? null : parseInt(value) 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hardware device" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No assignment</SelectItem>
                      {hardwareAssets.map((hardware: HardwareAsset) => (
                        <SelectItem key={hardware.id} value={hardware.id.toString()}>
                          🖥️ {hardware.name} ({hardware.type.replace('_', ' ')})
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
              )}

              {formData.assignment_type === 'software' && (
                <div className="space-y-2">
                  <Label htmlFor="software_asset">Software Asset</Label>
                  <Select
                    value={formData.software_asset_id?.toString() || 'none'}
                    onValueChange={(value) =>
                      setFormData((prev: CreateIpAddressInput) => ({ 
                        ...prev, 
                        software_asset_id: value === 'none' ? null : parseInt(value) 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select software asset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No assignment</SelectItem>
                      {softwareAssets.map((software: SoftwareAsset) => (
                        <SelectItem key={software.id} value={software.id.toString()}>
                          💻 {software.name} ({software.type.replace('_', ' ')})
                        </SelectItem>
                      ))}
                      {softwareAssets.length === 0 && (
                        <SelectItem value="none" disabled>
                          No software assets available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_reserved"
                  checked={formData.is_reserved}
                  onCheckedChange={(checked: boolean) =>
                    setFormData((prev: CreateIpAddressInput) => ({ ...prev, is_reserved: checked }))
                  }
                />
                <Label htmlFor="is_reserved">Reserved IP Address</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateIpAddressInput) => ({ 
                      ...prev, 
                      description: e.target.value || null 
                    }))
                  }
                  placeholder="Purpose or additional notes..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create IP Address'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* IP Addresses Grid */}
      {ipAddresses.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">🌐</div>
            <h3 className="text-lg font-semibold mb-2">No IP Addresses</h3>
            <p className="text-slate-600 text-center mb-4">
              Get started by adding your first IP address allocation.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline">
              Add Your First IP
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ipAddresses.map((ip: IpAddress) => (
            <Card key={ip.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">🌐</div>
                    <div>
                      <CardTitle className="text-lg font-mono">{ip.ip_address}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {ip.subnet}
                        </Badge>
                        {ip.is_reserved && (
                          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                            Reserved
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Assignment:</span>{' '}
                    <span className="capitalize">{ip.assignment_type}</span>
                  </div>
                  
                  {getAssignmentName(ip) && (
                    <div>
                      <span className="font-medium">Assigned to:</span>{' '}
                      {getAssignmentName(ip)}
                    </div>
                  )}
                  
                  {ip.description && (
                    <div>
                      <span className="font-medium">Description:</span>
                      <p className="text-slate-600 mt-1">{ip.description}</p>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />
                
                <div className="flex gap-2">
                  <Dialog 
                    open={editingIp?.id === ip.id} 
                    onOpenChange={(open) => !open && setEditingIp(null)}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => startEdit(ip)}>
                        ✏️ Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Edit IP Address</DialogTitle>
                        <DialogDescription>
                          Update the allocation for {ip.ip_address}.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-ip">IP Address *</Label>
                            <Input
                              id="edit-ip"
                              value={formData.ip_address}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setFormData((prev: CreateIpAddressInput) => ({ ...prev, ip_address: e.target.value }))
                              }
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="edit-subnet">Subnet *</Label>
                            <Input
                              id="edit-subnet"
                              value={formData.subnet}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setFormData((prev: CreateIpAddressInput) => ({ ...prev, subnet: e.target.value }))
                              }
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="edit-assignment-type">Assignment Type *</Label>
                          <Select
                            value={formData.assignment_type}
                            onValueChange={handleAssignmentTypeChange}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hardware">🖥️ Hardware Device</SelectItem>
                              <SelectItem value="software">💻 Software Asset</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.assignment_type === 'hardware' && (
                          <div className="space-y-2">
                            <Label htmlFor="edit-hardware">Hardware Asset</Label>
                            <Select
                              value={formData.hardware_asset_id?.toString() || 'none'}
                              onValueChange={(value) =>
                                setFormData((prev: CreateIpAddressInput) => ({ 
                                  ...prev, 
                                  hardware_asset_id: value === 'none' ? null : parseInt(value) 
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No assignment</SelectItem>
                                {hardwareAssets.map((hardware: HardwareAsset) => (
                                  <SelectItem key={hardware.id} value={hardware.id.toString()}>
                                    🖥️ {hardware.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {formData.assignment_type === 'software' && (
                          <div className="space-y-2">
                            <Label htmlFor="edit-software">Software Asset</Label>
                            <Select
                              value={formData.software_asset_id?.toString() || 'none'}
                              onValueChange={(value) =>
                                setFormData((prev: CreateIpAddressInput) => ({ 
                                  ...prev, 
                                  software_asset_id: value === 'none' ? null : parseInt(value) 
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No assignment</SelectItem>
                                {softwareAssets.map((software: SoftwareAsset) => (
                                  <SelectItem key={software.id} value={software.id.toString()}>
                                    💻 {software.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="edit-reserved"
                            checked={formData.is_reserved}
                            onCheckedChange={(checked: boolean) =>
                              setFormData((prev: CreateIpAddressInput) => ({ ...prev, is_reserved: checked }))
                            }
                          />
                          <Label htmlFor="edit-reserved">Reserved IP Address</Label>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-description">Description</Label>
                          <Textarea
                            id="edit-description"
                            value={formData.description || ''}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                              setFormData((prev: CreateIpAddressInput) => ({ 
                                ...prev, 
                                description: e.target.value || null 
                              }))
                            }
                            rows={3}
                          />
                        </div>

                        <DialogFooter>
                          <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Updating...' : 'Update IP Address'}
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
                        <AlertDialogTitle>Delete IP Address</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the allocation for {ip.ip_address}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(ip.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="text-xs text-slate-400 mt-4">
                  Created: {ip.created_at.toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
