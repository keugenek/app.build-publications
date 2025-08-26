import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { trpc } from '@/utils/trpc';
import type { IpAddress, CreateIpAddressInput, HardwareAsset, SoftwareAsset } from '../../../server/src/schema';

export function IpAddressesTab() {
  const [ipAddresses, setIpAddresses] = useState<IpAddress[]>([]);
  const [hardwareAssets, setHardwareAssets] = useState<HardwareAsset[]>([]);
  const [softwareAssets, setSoftwareAssets] = useState<SoftwareAsset[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentIp, setCurrentIp] = useState<IpAddress | null>(null);
  const [formData, setFormData] = useState({
    ip_address: '',
    status: 'free' as 'allocated' | 'free',
    hardware_asset_id: null as number | null,
    software_asset_id: null as number | null,
  });

  const loadIpAddresses = useCallback(async () => {
    try {
      const result = await trpc.getIpAddresses.query();
      setIpAddresses(result);
    } catch (error) {
      console.error('Failed to load IP addresses:', error);
      toast.error('Failed to load IP addresses');
    }
  }, []);

  const loadHardwareAssets = useCallback(async () => {
    try {
      const result = await trpc.getHardwareAssets.query();
      setHardwareAssets(result);
    } catch (error) {
      console.error('Failed to load hardware assets:', error);
      toast.error('Failed to load hardware assets');
    }
  }, []);

  const loadSoftwareAssets = useCallback(async () => {
    try {
      const result = await trpc.getSoftwareAssets.query();
      setSoftwareAssets(result);
    } catch (error) {
      console.error('Failed to load software assets:', error);
      toast.error('Failed to load software assets');
    }
  }, []);

  useEffect(() => {
    loadIpAddresses();
    loadHardwareAssets();
    loadSoftwareAssets();
  }, [loadIpAddresses, loadHardwareAssets, loadSoftwareAssets]);

  const resetForm = () => {
    setFormData({
      ip_address: '',
      status: 'free',
      hardware_asset_id: null,
      software_asset_id: null,
    });
    setCurrentIp(null);
    setIsEditing(false);
  };

  const handleCreate = async () => {
    try {
      const input: CreateIpAddressInput = {
        ip_address: formData.ip_address,
        status: formData.status,
        hardware_asset_id: formData.hardware_asset_id,
        software_asset_id: formData.software_asset_id,
      };
      
      const newIp = await trpc.createIpAddress.mutate(input);
      if (newIp) {
        setIpAddresses([...ipAddresses, newIp]);
      }
      setIsDialogOpen(false);
      resetForm();
      toast.success('IP address created successfully');
    } catch (error) {
      console.error('Failed to create IP address:', error);
      toast.error('Failed to create IP address');
    }
  };

  const handleUpdate = async () => {
    if (!currentIp) return;
    
    try {
      const input = {
        id: currentIp.id,
        ip_address: formData.ip_address,
        status: formData.status,
        hardware_asset_id: formData.hardware_asset_id,
        software_asset_id: formData.software_asset_id,
      };
      
      const updatedIp = await trpc.updateIpAddress.mutate(input);
      if (updatedIp) {
        setIpAddresses(ipAddresses.map(ip => 
          ip.id === updatedIp.id ? updatedIp : ip
        ));
      }
      setIsDialogOpen(false);
      resetForm();
      toast.success('IP address updated successfully');
    } catch (error) {
      console.error('Failed to update IP address:', error);
      toast.error('Failed to update IP address');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteIpAddress.mutate({ id });
      setIpAddresses(ipAddresses.filter(ip => ip.id !== id));
      toast.success('IP address deleted successfully');
    } catch (error) {
      console.error('Failed to delete IP address:', error);
      toast.error('Failed to delete IP address');
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (ip: IpAddress) => {
    setCurrentIp(ip);
    setFormData({
      ip_address: ip.ip_address,
      status: ip.status,
      hardware_asset_id: ip.hardware_asset_id,
      software_asset_id: ip.software_asset_id,
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const getAssetName = (ip: IpAddress) => {
    if (ip.hardware_asset_id) {
      const asset = hardwareAssets.find(h => h.id === ip.hardware_asset_id);
      return asset ? `${asset.name} (Hardware)` : 'Unknown Hardware';
    }
    
    if (ip.software_asset_id) {
      const asset = softwareAssets.find(s => s.id === ip.software_asset_id);
      return asset ? `${asset.name} (Software)` : 'Unknown Software';
    }
    
    return 'Unassigned';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">IP Addresses</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>Add IP Address</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Edit IP Address' : 'Create IP Address'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ip_address">IP Address</Label>
                <Input
                  id="ip_address"
                  value={formData.ip_address}
                  onChange={(e) => setFormData({...formData, ip_address: e.target.value})}
                  placeholder="Enter IP address (e.g., 192.168.1.100)"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: 'allocated' | 'free') => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allocated">Allocated</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="hardware_asset_id">Hardware Asset (Optional)</Label>
                <Select 
                  value={formData.hardware_asset_id?.toString() || 'none'} 
                  onValueChange={(value) => setFormData({
                    ...formData, 
                    hardware_asset_id: value ? parseInt(value) : null,
                    software_asset_id: null
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hardware asset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>Select hardware asset</SelectItem>
                    {hardwareAssets.map(asset => (
                      <SelectItem key={asset.id} value={asset.id.toString()}>
                        {asset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="software_asset_id">Software Asset (Optional)</Label>
                <Select 
                  value={formData.software_asset_id?.toString() || 'none'} 
                  onValueChange={(value) => setFormData({
                    ...formData, 
                    software_asset_id: value ? parseInt(value) : null,
                    hardware_asset_id: null
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select software asset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>Select software asset</SelectItem>
                    {softwareAssets.map(asset => (
                      <SelectItem key={asset.id} value={asset.id.toString()}>
                        {asset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

      {ipAddresses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No IP addresses found. Create your first IP address!
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>IP Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ipAddresses.map((ip) => (
              <TableRow key={ip.id}>
                <TableCell className="font-medium">{ip.ip_address}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    ip.status === 'allocated' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {ip.status}
                  </span>
                </TableCell>
                <TableCell>{getAssetName(ip)}</TableCell>
                <TableCell>{ip.created_at.toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openEditDialog(ip)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDelete(ip.id)}
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
