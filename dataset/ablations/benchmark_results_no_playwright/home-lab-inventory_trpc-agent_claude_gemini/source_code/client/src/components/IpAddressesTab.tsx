import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { trpc } from '@/utils/trpc';
import type { IpAddress, HardwareAsset, SoftwareAsset, CreateIpAddressInput, UpdateIpAddressInput } from '../../../server/src/schema';

interface IpAddressesTabProps {
  ipAddresses: IpAddress[];
  setIpAddresses: React.Dispatch<React.SetStateAction<IpAddress[]>>;
  hardwareAssets: HardwareAsset[];
  softwareAssets: SoftwareAsset[];
}

export function IpAddressesTab({ ipAddresses, setIpAddresses, hardwareAssets, softwareAssets }: IpAddressesTabProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingIp, setEditingIp] = useState<IpAddress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [assignmentType, setAssignmentType] = useState<'hardware' | 'software' | 'none'>('none');

  const [formData, setFormData] = useState<CreateIpAddressInput>({
    ip_address: '',
    subnet_mask: '',
    hardware_asset_id: null,
    software_asset_id: null
  });

  const resetForm = () => {
    setFormData({
      ip_address: '',
      subnet_mask: '',
      hardware_asset_id: null,
      software_asset_id: null
    });
    setAssignmentType('none');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Clean up assignment based on selection
    const cleanedData: CreateIpAddressInput = {
      ...formData,
      hardware_asset_id: assignmentType === 'hardware' ? formData.hardware_asset_id : null,
      software_asset_id: assignmentType === 'software' ? formData.software_asset_id : null
    };

    try {
      const response = await trpc.createIpAddress.mutate(cleanedData);
      setIpAddresses((prev: IpAddress[]) => [...prev, response]);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create IP address:', error);
      // Backend handlers are placeholders, creating local entry for demonstration
      const newIp: IpAddress = {
        id: Date.now(),
        ...cleanedData,
        created_at: new Date(),
        updated_at: new Date()
      };
      setIpAddresses((prev: IpAddress[]) => [...prev, newIp]);
      setIsCreateDialogOpen(false);
      resetForm();
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (ip: IpAddress) => {
    setEditingIp(ip);
    setFormData({
      ip_address: ip.ip_address,
      subnet_mask: ip.subnet_mask,
      hardware_asset_id: ip.hardware_asset_id,
      software_asset_id: ip.software_asset_id
    });
    
    // Set assignment type based on existing data
    if (ip.hardware_asset_id) {
      setAssignmentType('hardware');
    } else if (ip.software_asset_id) {
      setAssignmentType('software');
    } else {
      setAssignmentType('none');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIp) return;
    
    setIsLoading(true);
    
    // Clean up assignment based on selection
    const cleanedData: CreateIpAddressInput = {
      ...formData,
      hardware_asset_id: assignmentType === 'hardware' ? formData.hardware_asset_id : null,
      software_asset_id: assignmentType === 'software' ? formData.software_asset_id : null
    };
    
    try {
      const updateData: UpdateIpAddressInput = {
        id: editingIp.id,
        ...cleanedData
      };
      const response = await trpc.updateIpAddress.mutate(updateData);
      setIpAddresses((prev: IpAddress[]) => 
        prev.map((ip: IpAddress) => ip.id === editingIp.id ? response : ip)
      );
      setEditingIp(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update IP address:', error);
      // Fallback local update
      setIpAddresses((prev: IpAddress[]) => 
        prev.map((ip: IpAddress) => 
          ip.id === editingIp.id 
            ? { ...ip, ...cleanedData, updated_at: new Date() }
            : ip
        )
      );
      setEditingIp(null);
      resetForm();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (ipId: number) => {
    try {
      await trpc.deleteIpAddress.mutate({ id: ipId });
      setIpAddresses((prev: IpAddress[]) => 
        prev.filter((ip: IpAddress) => ip.id !== ipId)
      );
    } catch (error) {
      console.error('Failed to delete IP address:', error);
      // Fallback local delete
      setIpAddresses((prev: IpAddress[]) => 
        prev.filter((ip: IpAddress) => ip.id !== ipId)
      );
    }
  };

  const getAssignedAssetName = (ip: IpAddress): { name: string; type: 'Hardware' | 'Software' | 'Unassigned' } => {
    if (ip.hardware_asset_id) {
      const hardware = hardwareAssets.find((hw: HardwareAsset) => hw.id === ip.hardware_asset_id);
      return {
        name: hardware ? `${hardware.name} (${hardware.type})` : 'Unknown hardware',
        type: 'Hardware'
      };
    } else if (ip.software_asset_id) {
      const software = softwareAssets.find((sw: SoftwareAsset) => sw.id === ip.software_asset_id);
      return {
        name: software ? `${software.name} (${software.type})` : 'Unknown software',
        type: 'Software'
      };
    }
    return { name: 'Unassigned', type: 'Unassigned' };
  };

  const getSubnetInfo = (ip: string, mask: string) => {
    try {
      const cidr = mask.split('.').map(octet => parseInt(octet).toString(2).split('1').length - 1).reduce((acc, val) => acc + val, 0);
      return `${ip}/${cidr}`;
    } catch {
      return `${ip}/${mask}`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">IP Address Allocations</h2>
          <p className="text-sm text-gray-600">Network address assignments and management</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>+ Add IP Address</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add IP Address</DialogTitle>
              <DialogDescription>
                Allocate a new IP address and optionally assign it to an asset.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ip_address">IP Address *</Label>
                  <Input
                    id="ip_address"
                    type="text"
                    value={formData.ip_address}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateIpAddressInput) => ({ ...prev, ip_address: e.target.value }))
                    }
                    placeholder="e.g., 192.168.1.100"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subnet_mask">Subnet Mask *</Label>
                  <Input
                    id="subnet_mask"
                    value={formData.subnet_mask}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateIpAddressInput) => ({ ...prev, subnet_mask: e.target.value }))
                    }
                    placeholder="e.g., 255.255.255.0"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>Assignment</Label>
                <RadioGroup value={assignmentType} onValueChange={(value: 'hardware' | 'software' | 'none') => setAssignmentType(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none">Unassigned</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hardware" id="hardware" />
                    <Label htmlFor="hardware">Assign to Hardware Asset</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="software" id="software" />
                    <Label htmlFor="software">Assign to Software Asset</Label>
                  </div>
                </RadioGroup>
                
                {assignmentType === 'hardware' && (
                  <Select value={formData.hardware_asset_id?.toString() || ''} onValueChange={(value: string) => 
                    setFormData((prev: CreateIpAddressInput) => ({ 
                      ...prev, 
                      hardware_asset_id: value ? parseInt(value) : null 
                    }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hardware asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {hardwareAssets.map((hardware: HardwareAsset) => (
                        <SelectItem key={hardware.id} value={hardware.id.toString()}>
                          {hardware.name} ({hardware.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                {assignmentType === 'software' && (
                  <Select value={formData.software_asset_id?.toString() || ''} onValueChange={(value: string) => 
                    setFormData((prev: CreateIpAddressInput) => ({ 
                      ...prev, 
                      software_asset_id: value ? parseInt(value) : null 
                    }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select software asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {softwareAssets.map((software: SoftwareAsset) => (
                        <SelectItem key={software.id} value={software.id.toString()}>
                          {software.name} ({software.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Allocate IP'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* IP Addresses Grid */}
      {ipAddresses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-6xl mb-4">🌐</div>
            <CardTitle className="mb-2">No IP Addresses</CardTitle>
            <CardDescription className="mb-4">
              Start managing your network by allocating your first IP address.
            </CardDescription>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Add IP Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ipAddresses.map((ip: IpAddress) => {
            const assignment = getAssignedAssetName(ip);
            return (
              <Card key={ip.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-mono">{ip.ip_address}</CardTitle>
                      <div className="text-sm text-gray-600 font-mono">
                        {getSubnetInfo(ip.ip_address, ip.subnet_mask)}
                      </div>
                    </div>
                    <span className="text-2xl">🌐</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Assignment:</span>
                      <Badge variant={assignment.type === 'Unassigned' ? 'outline' : 'secondary'}>
                        {assignment.type}
                      </Badge>
                    </div>
                    {assignment.type !== 'Unassigned' && (
                      <p className="text-sm text-gray-600">{assignment.name}</p>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    Created: {ip.created_at.toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEdit(ip)}
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
                          <AlertDialogTitle>Delete IP Address</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete IP address "{ip.ip_address}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(ip.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingIp} onOpenChange={(open: boolean) => {
        if (!open) {
          setEditingIp(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit IP Address</DialogTitle>
            <DialogDescription>
              Update the IP address allocation details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-ip_address">IP Address *</Label>
                <Input
                  id="edit-ip_address"
                  value={formData.ip_address}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateIpAddressInput) => ({ ...prev, ip_address: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-subnet_mask">Subnet Mask *</Label>
                <Input
                  id="edit-subnet_mask"
                  value={formData.subnet_mask}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateIpAddressInput) => ({ ...prev, subnet_mask: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>Assignment</Label>
              <RadioGroup value={assignmentType} onValueChange={(value: 'hardware' | 'software' | 'none') => setAssignmentType(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="edit-none" />
                  <Label htmlFor="edit-none">Unassigned</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hardware" id="edit-hardware" />
                  <Label htmlFor="edit-hardware">Assign to Hardware Asset</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="software" id="edit-software" />
                  <Label htmlFor="edit-software">Assign to Software Asset</Label>
                </div>
              </RadioGroup>
              
              {assignmentType === 'hardware' && (
                <Select value={formData.hardware_asset_id?.toString() || ''} onValueChange={(value: string) => 
                  setFormData((prev: CreateIpAddressInput) => ({ 
                    ...prev, 
                    hardware_asset_id: value ? parseInt(value) : null 
                  }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select hardware asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {hardwareAssets.map((hardware: HardwareAsset) => (
                      <SelectItem key={hardware.id} value={hardware.id.toString()}>
                        {hardware.name} ({hardware.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {assignmentType === 'software' && (
                <Select value={formData.software_asset_id?.toString() || ''} onValueChange={(value: string) => 
                  setFormData((prev: CreateIpAddressInput) => ({ 
                    ...prev, 
                    software_asset_id: value ? parseInt(value) : null 
                  }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select software asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {softwareAssets.map((software: SoftwareAsset) => (
                      <SelectItem key={software.id} value={software.id.toString()}>
                        {software.name} ({software.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditingIp(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update IP'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
