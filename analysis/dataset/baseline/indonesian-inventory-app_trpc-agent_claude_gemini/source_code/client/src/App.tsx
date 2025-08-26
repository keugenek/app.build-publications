import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { trpc } from '@/utils/trpc';
import { BarangManagement } from '@/components/BarangManagement';
import { TransaksiManagement } from '@/components/TransaksiManagement';
import { DashboardOverview } from '@/components/DashboardOverview';
import type { Barang, TransaksiWithBarang } from '../../server/src/schema';

function App() {
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [transaksiList, setTransaksiList] = useState<TransaksiWithBarang[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load initial data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [barang, transaksi] = await Promise.all([
        trpc.getBarang.query(),
        trpc.getTransaksi.query()
      ]);
      setBarangList(barang);
      setTransaksiList(transaksi);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleBarangAdded = (newBarang: Barang) => {
    setBarangList(prev => [newBarang, ...prev]);
  };

  const handleBarangUpdated = (updatedBarang: Barang) => {
    setBarangList(prev => prev.map(item => 
      item.id === updatedBarang.id ? updatedBarang : item
    ));
  };

  const handleBarangDeleted = (deletedId: number) => {
    setBarangList(prev => prev.filter(item => item.id !== deletedId));
    // Also remove related transactions
    setTransaksiList(prev => prev.filter(transaksi => transaksi.barang_id !== deletedId));
  };

  const handleTransaksiAdded = (newTransaksi: TransaksiWithBarang) => {
    setTransaksiList(prev => [newTransaksi, ...prev]);
    // Update barang stock in the list
    setBarangList(prev => prev.map(barang => {
      if (barang.id === newTransaksi.barang_id) {
        const stockChange = newTransaksi.jenis === 'MASUK' 
          ? newTransaksi.jumlah 
          : -newTransaksi.jumlah;
        return { ...barang, stok: barang.stok + stockChange };
      }
      return barang;
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">📦</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Sistem Manajemen Inventaris
                </h1>
                <p className="text-sm text-gray-500">
                  Kelola stok barang dan transaksi dengan mudah
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {isLoading ? 'Memuat...' : 'Aktif'}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white border shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              📊 Dashboard
            </TabsTrigger>
            <TabsTrigger value="barang" className="flex items-center gap-2">
              📦 Kelola Barang
            </TabsTrigger>
            <TabsTrigger value="masuk" className="flex items-center gap-2">
              ⬇️ Barang Masuk
            </TabsTrigger>
            <TabsTrigger value="keluar" className="flex items-center gap-2">
              ⬆️ Barang Keluar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardOverview 
              barangList={barangList}
              transaksiList={transaksiList}
              isLoading={isLoading}
              onRefresh={handleRefresh}
            />
          </TabsContent>

          <TabsContent value="barang" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📦 Manajemen Barang
                </CardTitle>
                <CardDescription>
                  Tambah, edit, atau hapus barang dari inventaris Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BarangManagement
                  barangList={barangList}
                  onBarangAdded={handleBarangAdded}
                  onBarangUpdated={handleBarangUpdated}
                  onBarangDeleted={handleBarangDeleted}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="masuk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ⬇️ Transaksi Barang Masuk
                </CardTitle>
                <CardDescription>
                  Catat barang yang masuk ke dalam inventaris
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransaksiManagement
                  jenis="MASUK"
                  barangList={barangList}
                  transaksiList={transaksiList.filter(t => t.jenis === 'MASUK')}
                  onTransaksiAdded={handleTransaksiAdded}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keluar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ⬆️ Transaksi Barang Keluar
                </CardTitle>
                <CardDescription>
                  Catat barang yang keluar dari inventaris
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransaksiManagement
                  jenis="KELUAR"
                  barangList={barangList}
                  transaksiList={transaksiList.filter(t => t.jenis === 'KELUAR')}
                  onTransaksiAdded={handleTransaksiAdded}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
