import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HardwareAssetsTab } from './components/HardwareAssetsTab';
import { SoftwareAssetsTab } from './components/SoftwareAssetsTab';
import { IpAddressAllocationsTab } from './components/IpAddressAllocationsTab';
import { Server, Monitor, Network } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            🏠 Home Lab Manager
          </h1>
          <p className="text-slate-600 text-lg">
            Catalog and manage your home lab infrastructure
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="hardware" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm">
            <TabsTrigger value="hardware" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              Hardware Assets
            </TabsTrigger>
            <TabsTrigger value="software" className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Software Assets
            </TabsTrigger>
            <TabsTrigger value="ip" className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              IP Allocations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hardware">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Server className="w-5 h-5" />
                  Hardware Assets
                </CardTitle>
                <CardDescription className="text-blue-600">
                  Manage servers, switches, routers, and other physical devices
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <HardwareAssetsTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="software">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Monitor className="w-5 h-5" />
                  Software Assets
                </CardTitle>
                <CardDescription className="text-green-600">
                  Track virtual machines, containers, and software deployments
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <SoftwareAssetsTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ip">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <Network className="w-5 h-5" />
                  IP Address Allocations
                </CardTitle>
                <CardDescription className="text-purple-600">
                  Manage IP address assignments and network configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <IpAddressAllocationsTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
