import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HardwareAssetManager } from '@/components/HardwareAssetManager';
import { SoftwareAssetManager } from '@/components/SoftwareAssetManager';
import { IpAddressManager } from '@/components/IpAddressManager';
import { trpc } from '@/utils/trpc';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">🏠</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Home Lab Manager
              </h1>
              <p className="text-slate-600">
                Manage your hardware, software, and network resources
              </p>
            </div>
          </div>
          
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hardware Assets</CardTitle>
                <span className="text-2xl">🖥️</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {/* Note: This shows 0 because backend handlers return empty arrays */}
                  0
                </div>
                <p className="text-xs text-slate-600">
                  Servers, switches, and more
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Software Assets</CardTitle>
                <span className="text-2xl">💻</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {/* Note: This shows 0 because backend handlers return empty arrays */}
                  0
                </div>
                <p className="text-xs text-slate-600">
                  VMs, containers, services
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">IP Addresses</CardTitle>
                <span className="text-2xl">🌐</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {/* Note: This shows 0 because backend handlers return empty arrays */}
                  0
                </div>
                <p className="text-xs text-slate-600">
                  Network allocations
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="hardware" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="hardware" className="flex items-center gap-2">
              <span>🖥️</span>
              Hardware
            </TabsTrigger>
            <TabsTrigger value="software" className="flex items-center gap-2">
              <span>💻</span>
              Software
            </TabsTrigger>
            <TabsTrigger value="network" className="flex items-center gap-2">
              <span>🌐</span>
              Network
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hardware" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🖥️</span>
                  Hardware Assets
                </CardTitle>
                <CardDescription>
                  Manage your physical infrastructure including servers, switches, and storage devices.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HardwareAssetManager key={`hardware-${refreshTrigger}`} onDataChange={triggerRefresh} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="software" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>💻</span>
                  Software Assets
                </CardTitle>
                <CardDescription>
                  Track virtual machines, containers, and services running on your hardware.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SoftwareAssetManager key={`software-${refreshTrigger}`} onDataChange={triggerRefresh} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🌐</span>
                  IP Address Management
                </CardTitle>
                <CardDescription>
                  Manage IP address allocations and track which devices use which addresses.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IpAddressManager key={`network-${refreshTrigger}`} onDataChange={triggerRefresh} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
