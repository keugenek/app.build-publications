import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HardwareAssetsTab } from '@/components/HardwareAssetsTab';
import { SoftwareAssetsTab } from '@/components/SoftwareAssetsTab';
import { IpAddressesTab } from '@/components/IpAddressesTab';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster } from '@/components/Toaster';

function App() {
  const [activeTab, setActiveTab] = useState('hardware');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8">
      <Toaster />
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">HomeAs Lab Manager</h1>
          <p className="text-gray-600 mt-2">
            Manage your hardware, software, and IP addresses in one place
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Infrastructure Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="hardware">Hardware Assets</TabsTrigger>
                <TabsTrigger value="software">Software Assets</TabsTrigger>
                <TabsTrigger value="ip">IP Addresses</TabsTrigger>
              </TabsList>
              
              <TabsContent value="hardware" className="mt-4">
                <HardwareAssetsTab />
              </TabsContent>
              
              <TabsContent value="software" className="mt-4">
                <SoftwareAssetsTab />
              </TabsContent>
              
              <TabsContent value="ip" className="mt-4">
                <IpAddressesTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
