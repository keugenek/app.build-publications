import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import type { 
  HardwareAsset, 
  CreateHardwareAssetInput,
  SoftwareAsset,
  CreateSoftwareAssetInput,
  IPAddress,
  CreateIPAddressInput
} from '../../server/src/schema';

function App() {
  // Hardware Assets State
  const [hardwareAssets, setHardwareAssets] = useState<HardwareAsset[]>([]);
  const [isHardwareFormOpen, setIsHardwareFormOpen] = useState(false);
  const [currentHardwareAsset, setCurrentHardwareAsset] = useState<HardwareAsset | null>(null);
  
  // Software Assets State
  const [softwareAssets, setSoftwareAssets] = useState<SoftwareAsset[]>([]);
  const [isSoftwareFormOpen, setIsSoftwareFormOpen] = useState(false);
  const [currentSoftwareAsset, setCurrentSoftwareAsset] = useState<SoftwareAsset | null>(null);
  
  // IP Addresses State
  const [ipAddresses, setIPAddresses] = useState<IPAddress[]>([]);
  const [isIPFormOpen, setIsIPFormOpen] = useState(false);
  const [currentIPAddress, setCurrentIPAddress] = useState<IPAddress | null>(null);
  
  // Form States
  const [hardwareFormData, setHardwareFormData] = useState<Omit<CreateHardwareAssetInput, 'id'>>({
    name: '',
    type: '',
    model: '',
    serialNumber: '',
    location: ''
  });
  
  const [softwareFormData, setSoftwareFormData] = useState<Omit<CreateSoftwareAssetInput, 'id'>>({
    name: '',
    type: '',
    operatingSystem: '',
    host: ''
  });
  
  const [ipFormData, setIPFormData] = useState<Omit<CreateIPAddressInput, 'id'>>({
    address: '',
    assignedTo: ''
  });
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  
  // Load all data
  const loadData = useCallback(async () => {
    try {
      const [hardware, software, ips] = await Promise.all([
        trpc.getHardwareAssets.query(),
        trpc.getSoftwareAssets.query(),
        trpc.getIPAddresses.query()
      ]);
      
      setHardwareAssets(hardware);
      setSoftwareAssets(software);
      setIPAddresses(ips);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Hardware Asset Functions
  const handleHardwareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (currentHardwareAsset) {
        // Update existing hardware asset
        const updatedAsset = await trpc.updateHardwareAsset.mutate({
          id: currentHardwareAsset.id,
          ...hardwareFormData
        });
        
        if (updatedAsset) {
          setHardwareAssets(assets => 
            assets.map(asset => asset.id === currentHardwareAsset.id ? updatedAsset : asset)
          );
        }
      } else {
        // Create new hardware asset
        const newAsset = await trpc.createHardwareAsset.mutate(hardwareFormData);
        setHardwareAssets(assets => [...assets, newAsset]);
      }
      
      // Reset form and close dialog
      setHardwareFormData({
        name: '',
        type: '',
        model: '',
        serialNumber: '',
        location: ''
      });
      setCurrentHardwareAsset(null);
      setIsHardwareFormOpen(false);
    } catch (error) {
      console.error('Failed to save hardware asset:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditHardware = (asset: HardwareAsset) => {
    setCurrentHardwareAsset(asset);
    setHardwareFormData({
      name: asset.name,
      type: asset.type,
      model: asset.model,
      serialNumber: asset.serialNumber,
      location: asset.location
    });
    setIsHardwareFormOpen(true);
  };
  
  const handleDeleteHardware = async (id: number) => {
    try {
      await trpc.deleteHardwareAsset.mutate({ id });
      setHardwareAssets(assets => assets.filter(asset => asset.id !== id));
    } catch (error) {
      console.error('Failed to delete hardware asset:', error);
    }
  };
  
  // Software Asset Functions
  const handleSoftwareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (currentSoftwareAsset) {
        // Update existing software asset
        const updatedAsset = await trpc.updateSoftwareAsset.mutate({
          id: currentSoftwareAsset.id,
          ...softwareFormData
        });
        
        if (updatedAsset) {
          setSoftwareAssets(assets => 
            assets.map(asset => asset.id === currentSoftwareAsset.id ? updatedAsset : asset)
          );
        }
      } else {
        // Create new software asset
        const newAsset = await trpc.createSoftwareAsset.mutate(softwareFormData);
        setSoftwareAssets(assets => [...assets, newAsset]);
      }
      
      // Reset form and close dialog
      setSoftwareFormData({
        name: '',
        type: '',
        operatingSystem: '',
        host: ''
      });
      setCurrentSoftwareAsset(null);
      setIsSoftwareFormOpen(false);
    } catch (error) {
      console.error('Failed to save software asset:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditSoftware = (asset: SoftwareAsset) => {
    setCurrentSoftwareAsset(asset);
    setSoftwareFormData({
      name: asset.name,
      type: asset.type,
      operatingSystem: asset.operatingSystem,
      host: asset.host
    });
    setIsSoftwareFormOpen(true);
  };
  
  const handleDeleteSoftware = async (id: number) => {
    try {
      await trpc.deleteSoftwareAsset.mutate({ id });
      setSoftwareAssets(assets => assets.filter(asset => asset.id !== id));
    } catch (error) {
      console.error('Failed to delete software asset:', error);
    }
  };
  
  // IP Address Functions
  const handleIPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (currentIPAddress) {
        // Update existing IP address
        const updatedIP = await trpc.updateIPAddress.mutate({
          id: currentIPAddress.id,
          ...ipFormData
        });
        
        if (updatedIP) {
          setIPAddresses(ips => 
            ips.map(ip => ip.id === currentIPAddress.id ? updatedIP : ip)
          );
        }
      } else {
        // Create new IP address
        const newIP = await trpc.createIPAddress.mutate(ipFormData);
        setIPAddresses(ips => [...ips, newIP]);
      }
      
      // Reset form and close dialog
      setIPFormData({
        address: '',
        assignedTo: ''
      });
      setCurrentIPAddress(null);
      setIsIPFormOpen(false);
    } catch (error) {
      console.error('Failed to save IP address:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditIP = (ip: IPAddress) => {
    setCurrentIPAddress(ip);
    setIPFormData({
      address: ip.address,
      assignedTo: ip.assignedTo
    });
    setIsIPFormOpen(true);
  };
  
  const handleDeleteIP = async (id: number) => {
    try {
      await trpc.deleteIPAddress.mutate({ id });
      setIPAddresses(ips => ips.filter(ip => ip.id !== id));
    } catch (error) {
      console.error('Failed to delete IP address:', error);
    }
  };
  
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-2">Home Lab Infrastructure Manager</h1>
          <p className="text-muted-foreground">
            Manage your hardware assets, software assets, and IP addresses
          </p>
        </div>
        
        <Tabs defaultValue="hardware" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="hardware">Hardware Assets</TabsTrigger>
            <TabsTrigger value="software">Software Assets</TabsTrigger>
            <TabsTrigger value="ip">IP Addresses</TabsTrigger>
          </TabsList>
          
          {/* Hardware Assets Tab */}
          <TabsContent value="hardware">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Hardware Assets</CardTitle>
                    <CardDescription>
                      Manage your physical hardware devices
                    </CardDescription>
                  </div>
                  <Dialog open={isHardwareFormOpen} onOpenChange={setIsHardwareFormOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => {
                          setCurrentHardwareAsset(null);
                          setHardwareFormData({
                            name: '',
                            type: '',
                            model: '',
                            serialNumber: '',
                            location: ''
                          });
                        }}
                      >
                        Add Hardware Asset
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {currentHardwareAsset ? 'Edit Hardware Asset' : 'Add Hardware Asset'}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleHardwareSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="hardware-name">Name</Label>
                          <Input
                            id="hardware-name"
                            value={hardwareFormData.name}
                            onChange={(e) => setHardwareFormData({...hardwareFormData, name: e.target.value})}
                            placeholder="e.g., Server-01"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hardware-type">Type</Label>
                          <Select 
                            value={hardwareFormData.type} 
                            onValueChange={(value) => setHardwareFormData({...hardwareFormData, type: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type">
                                {hardwareFormData.type || "Select type"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Server">Server</SelectItem>
                              <SelectItem value="Switch">Switch</SelectItem>
                              <SelectItem value="Router">Router</SelectItem>
                              <SelectItem value="Firewall">Firewall</SelectItem>
                              <SelectItem value="NAS">NAS</SelectItem>
                              <SelectItem value="Workstation">Workstation</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hardware-model">Model</Label>
                          <Input
                            id="hardware-model"
                            value={hardwareFormData.model}
                            onChange={(e) => setHardwareFormData({...hardwareFormData, model: e.target.value})}
                            placeholder="e.g., Dell PowerEdge R740"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hardware-serial">Serial Number</Label>
                          <Input
                            id="hardware-serial"
                            value={hardwareFormData.serialNumber}
                            onChange={(e) => setHardwareFormData({...hardwareFormData, serialNumber: e.target.value})}
                            placeholder="e.g., ABC123XYZ"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hardware-location">Location</Label>
                          <Input
                            id="hardware-location"
                            value={hardwareFormData.location}
                            onChange={(e) => setHardwareFormData({...hardwareFormData, location: e.target.value})}
                            placeholder="e.g., Rack 1, Shelf 3"
                            required
                          />
                        </div>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? 'Saving...' : (currentHardwareAsset ? 'Update' : 'Create')}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {hardwareAssets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hardware assets found. Add your first hardware asset!
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hardwareAssets.map((asset) => (
                        <TableRow key={asset.id}>
                          <TableCell className="font-medium">{asset.name}</TableCell>
                          <TableCell>{asset.type}</TableCell>
                          <TableCell>{asset.model}</TableCell>
                          <TableCell>{asset.serialNumber}</TableCell>
                          <TableCell>{asset.location}</TableCell>
                          <TableCell>{asset.created_at.toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditHardware(asset)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDeleteHardware(asset.id)}
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
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Software Assets Tab */}
          <TabsContent value="software">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Software Assets</CardTitle>
                    <CardDescription>
                      Manage your virtual machines and containers
                    </CardDescription>
                  </div>
                  <Dialog open={isSoftwareFormOpen} onOpenChange={setIsSoftwareFormOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => {
                          setCurrentSoftwareAsset(null);
                          setSoftwareFormData({
                            name: '',
                            type: '',
                            operatingSystem: '',
                            host: ''
                          });
                        }}
                      >
                        Add Software Asset
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {currentSoftwareAsset ? 'Edit Software Asset' : 'Add Software Asset'}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSoftwareSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="software-name">Name</Label>
                          <Input
                            id="software-name"
                            value={softwareFormData.name}
                            onChange={(e) => setSoftwareFormData({...softwareFormData, name: e.target.value})}
                            placeholder="e.g., web-server-01"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="software-type">Type</Label>
                          <Select 
                            value={softwareFormData.type} 
                            onValueChange={(value) => setSoftwareFormData({...softwareFormData, type: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type">
                                {softwareFormData.type || "Select type"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="VM">Virtual Machine</SelectItem>
                              <SelectItem value="Container">Container</SelectItem>
                              <SelectItem value="Service">Service</SelectItem>
                              <SelectItem value="Application">Application</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="software-os">Operating System</Label>
                          <Input
                            id="software-os"
                            value={softwareFormData.operatingSystem}
                            onChange={(e) => setSoftwareFormData({...softwareFormData, operatingSystem: e.target.value})}
                            placeholder="e.g., Ubuntu 22.04"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="software-host">Host</Label>
                          <Select 
                            value={softwareFormData.host} 
                            onValueChange={(value) => setSoftwareFormData({...softwareFormData, host: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select host">
                                {softwareFormData.host || "Select host"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {hardwareAssets.map(asset => (
                                <SelectItem key={asset.id} value={asset.name}>
                                  {asset.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? 'Saving...' : (currentSoftwareAsset ? 'Update' : 'Create')}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {softwareAssets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No software assets found. Add your first software asset!
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>OS</TableHead>
                        <TableHead>Host</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {softwareAssets.map((asset) => (
                        <TableRow key={asset.id}>
                          <TableCell className="font-medium">{asset.name}</TableCell>
                          <TableCell>{asset.type}</TableCell>
                          <TableCell>{asset.operatingSystem}</TableCell>
                          <TableCell>{asset.host}</TableCell>
                          <TableCell>{asset.created_at.toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditSoftware(asset)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDeleteSoftware(asset.id)}
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
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* IP Addresses Tab */}
          <TabsContent value="ip">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>IP Addresses</CardTitle>
                    <CardDescription>
                      Manage IP address assignments
                    </CardDescription>
                  </div>
                  <Dialog open={isIPFormOpen} onOpenChange={setIsIPFormOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => {
                          setCurrentIPAddress(null);
                          setIPFormData({
                            address: '',
                            assignedTo: ''
                          });
                        }}
                      >
                        Add IP Address
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {currentIPAddress ? 'Edit IP Address' : 'Add IP Address'}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleIPSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="ip-address">IP Address</Label>
                          <Input
                            id="ip-address"
                            value={ipFormData.address}
                            onChange={(e) => setIPFormData({...ipFormData, address: e.target.value})}
                            placeholder="e.g., 192.168.1.100"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ip-assigned">Assigned To</Label>
                          <Select 
                            value={ipFormData.assignedTo} 
                            onValueChange={(value) => setIPFormData({...ipFormData, assignedTo: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select asset">
                                {ipFormData.assignedTo || "Select asset"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="select-asset" disabled>Select asset</SelectItem>
                              <SelectItem value="hardware-divider" disabled>--- Hardware Assets ---</SelectItem>
                              {hardwareAssets.map(asset => (
                                <SelectItem key={`hw-${asset.id}`} value={asset.name}>
                                  {asset.name} (Hardware)
                                </SelectItem>
                              ))}
                              <SelectItem value="software-divider" disabled>--- Software Assets ---</SelectItem>
                              {softwareAssets.map(asset => (
                                <SelectItem key={`sw-${asset.id}`} value={asset.name}>
                                  {asset.name} (Software)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? 'Saving...' : (currentIPAddress ? 'Update' : 'Create')}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {ipAddresses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No IP addresses found. Add your first IP address!
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ipAddresses.map((ip) => (
                        <TableRow key={ip.id}>
                          <TableCell className="font-medium">{ip.address}</TableCell>
                          <TableCell>{ip.assignedTo}</TableCell>
                          <TableCell>{ip.created_at.toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditIP(ip)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDeleteIP(ip.id)}
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
