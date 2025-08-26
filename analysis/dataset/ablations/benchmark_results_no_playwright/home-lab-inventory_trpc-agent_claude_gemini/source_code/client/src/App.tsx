import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { HardwareAssetsTab } from '@/components/HardwareAssetsTab';
import { SoftwareAssetsTab } from '@/components/SoftwareAssetsTab';
import { IpAddressesTab } from '@/components/IpAddressesTab';
import { trpc } from '@/utils/trpc';
import type { HardwareAsset, SoftwareAsset, IpAddress } from '../../server/src/schema';

function App() {
  const [hardwareAssets, setHardwareAssets] = useState<HardwareAsset[]>([]);
  const [softwareAssets, setSoftwareAssets] = useState<SoftwareAsset[]>([]);
  const [ipAddresses, setIpAddresses] = useState<IpAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all data
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [hardware, software, ips] = await Promise.all([
        trpc.getHardwareAssets.query(),
        trpc.getSoftwareAssets.query(),
        trpc.getIpAddresses.query()
      ]);
      
      setHardwareAssets(hardware);
      setSoftwareAssets(software);
      setIpAddresses(ips);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data. The backend handlers are currently using placeholder implementations.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Loading infrastructure data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">🏠 Home Lab Infrastructure</h1>
        <p className="text-gray-600">Manage your hardware assets, software deployments, and IP allocations</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              🖥️ Hardware Assets
            </CardTitle>
            <CardDescription>Physical infrastructure components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{hardwareAssets.length}</div>
            <div className="flex gap-1 mt-2 flex-wrap">
              {[...new Set(hardwareAssets.map((asset: HardwareAsset) => asset.type))].map((type: string) => (
                <Badge key={type} variant="secondary" className="text-xs">{type}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              💾 Software Assets
            </CardTitle>
            <CardDescription>Virtual machines and services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{softwareAssets.length}</div>
            <div className="flex gap-1 mt-2 flex-wrap">
              {[...new Set(softwareAssets.map((asset: SoftwareAsset) => asset.type))].map((type: string) => (
                <Badge key={type} variant="secondary" className="text-xs">{type}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              🌐 IP Addresses
            </CardTitle>
            <CardDescription>Network address allocations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{ipAddresses.length}</div>
            <div className="text-sm text-gray-500 mt-2">
              Active allocations
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Main Content Tabs */}
      <Tabs defaultValue="hardware" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hardware" className="flex items-center gap-2">
            🖥️ Hardware Assets
          </TabsTrigger>
          <TabsTrigger value="software" className="flex items-center gap-2">
            💾 Software Assets
          </TabsTrigger>
          <TabsTrigger value="ip" className="flex items-center gap-2">
            🌐 IP Addresses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hardware">
          <HardwareAssetsTab 
            hardwareAssets={hardwareAssets}
            setHardwareAssets={setHardwareAssets}
          />
        </TabsContent>

        <TabsContent value="software">
          <SoftwareAssetsTab 
            softwareAssets={softwareAssets}
            setSoftwareAssets={setSoftwareAssets}
            hardwareAssets={hardwareAssets}
          />
        </TabsContent>

        <TabsContent value="ip">
          <IpAddressesTab 
            ipAddresses={ipAddresses}
            setIpAddresses={setIpAddresses}
            hardwareAssets={hardwareAssets}
            softwareAssets={softwareAssets}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
