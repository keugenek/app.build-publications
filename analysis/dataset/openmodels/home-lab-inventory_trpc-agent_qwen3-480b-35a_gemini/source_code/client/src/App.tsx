import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import './App.css';

function App() {
  // State for active tab
  const [activeTab, setActiveTab] = useState('hardware');
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Home Lab Infrastructure Manager</h1>
          <p className="text-gray-600">Track your hardware, software, and IP allocations</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hardware">Hardware Assets</TabsTrigger>
            <TabsTrigger value="software">Software Assets</TabsTrigger>
            <TabsTrigger value="ip">IP Addresses</TabsTrigger>
          </TabsList>
          
          {/* Hardware Assets Tab */}
          <TabsContent value="hardware" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Hardware Assets</CardTitle>
                <CardDescription>
                  Manage your physical infrastructure like servers, switches, routers, and storage devices.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Add New Hardware Asset</h3>
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hardware-name">Name *</Label>
                      <Input
                        id="hardware-name"
                        placeholder="Server 1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hardware-type">Type *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="server">Server</SelectItem>
                          <SelectItem value="switch">Switch</SelectItem>
                          <SelectItem value="router">Router</SelectItem>
                          <SelectItem value="storage">Storage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="hardware-make">Make *</Label>
                      <Input
                        id="hardware-make"
                        placeholder="Dell"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hardware-model">Model *</Label>
                      <Input
                        id="hardware-model"
                        placeholder="PowerEdge R740"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hardware-serial">Serial Number *</Label>
                      <Input
                        id="hardware-serial"
                        placeholder="ABC123"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hardware-description">Description</Label>
                      <Textarea
                        id="hardware-description"
                        placeholder="Optional description"
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <Button type="submit">Add Hardware Asset</Button>
                    </div>
                  </form>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Hardware Assets List</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="flex flex-col">
                      <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                          <span>Server 1</span>
                          <span className="text-sm font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Server
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Make:</span>
                            <span>Dell</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Model:</span>
                            <span>PowerEdge R740</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Serial:</span>
                            <span>ABC123</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Description:</span>
                            <span>Primary web server</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Added:</span>
                            <span>Jan 15, 2023</span>
                          </div>
                        </div>
                      </CardContent>
                      <div className="px-6 pb-4 flex space-x-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">Delete</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the hardware asset.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Software Assets Tab */}
          <TabsContent value="software" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Software Assets</CardTitle>
                <CardDescription>
                  Manage your virtual machines and containers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Add New Software Asset</h3>
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="software-name">Name *</Label>
                      <Input
                        id="software-name"
                        placeholder="Web Server VM"
                      />
                    </div>
                    <div>
                      <Label htmlFor="software-type">Type *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vm">VM</SelectItem>
                          <SelectItem value="container">Container</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="software-host">Host *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select host" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="server1">Server 1 (Server)</SelectItem>
                          <SelectItem value="server2">Server 2 (Server)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="software-os">Operating System *</Label>
                      <Input
                        id="software-os"
                        placeholder="Ubuntu 22.04"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="software-description">Description</Label>
                      <Textarea
                        id="software-description"
                        placeholder="Optional description"
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <Button type="submit">Add Software Asset</Button>
                    </div>
                  </form>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Software Assets List</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="flex flex-col">
                      <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                          <span>Web Server VM</span>
                          <span className="text-sm font-normal bg-green-100 text-green-800 px-2 py-1 rounded">
                            VM
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Host:</span>
                            <span>Server 1</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">OS:</span>
                            <span>Ubuntu 22.04</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Description:</span>
                            <span>Nginx web server</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Added:</span>
                            <span>Mar 10, 2023</span>
                          </div>
                        </div>
                      </CardContent>
                      <div className="px-6 pb-4 flex space-x-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">Delete</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the software asset.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* IP Addresses Tab */}
          <TabsContent value="ip" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>IP Addresses</CardTitle>
                <CardDescription>
                  Manage IP address allocations for your devices.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Add New IP Address</h3>
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ip-address">IP Address *</Label>
                      <Input
                        id="ip-address"
                        placeholder="192.168.1.100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ip-device-type">Device Type *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select device type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hardware">Hardware</SelectItem>
                          <SelectItem value="software">Software</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="ip-device">Device *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select device" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="server1">Server 1 (Server)</SelectItem>
                          <SelectItem value="webvm">Web Server VM (VM)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="ip-description">Description</Label>
                      <Textarea
                        id="ip-description"
                        placeholder="Optional description"
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <Button type="submit">Add IP Address</Button>
                    </div>
                  </form>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">IP Addresses List</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="flex flex-col">
                      <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                          <span>192.168.1.100</span>
                          <span className="text-sm font-normal bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            Hardware
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Device:</span>
                            <span>Server 1</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Description:</span>
                            <span>Server 1 management IP</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Added:</span>
                            <span>Mar 15, 2023</span>
                          </div>
                        </div>
                      </CardContent>
                      <div className="px-6 pb-4 flex space-x-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">Delete</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the IP address allocation.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
