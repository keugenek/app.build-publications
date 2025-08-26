import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarangManagement } from './components/BarangManagement';
import { TransaksiManagement } from './components/TransaksiManagement';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📦 Sistem Manajemen Inventaris
          </h1>
          <p className="text-gray-600 text-lg">
            Kelola barang dan transaksi inventaris dengan mudah
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏢 Dashboard Inventaris
            </CardTitle>
            <CardDescription>
              Pilih tab untuk mengelola barang atau mencatat transaksi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="barang" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="barang" className="flex items-center gap-2">
                  📋 Kelola Barang
                </TabsTrigger>
                <TabsTrigger value="transaksi" className="flex items-center gap-2">
                  💹 Catat Transaksi
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="barang" className="space-y-6">
                <BarangManagement />
              </TabsContent>
              
              <TabsContent value="transaksi" className="space-y-6">
                <TransaksiManagement />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <footer className="text-center mt-8 text-gray-500">
          <p>© 2024 Sistem Manajemen Inventaris - Dibuat dengan ❤️</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
