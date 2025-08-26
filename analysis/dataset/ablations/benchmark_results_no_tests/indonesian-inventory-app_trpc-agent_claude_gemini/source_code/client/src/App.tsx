import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { BarangForm } from '@/components/BarangForm';
import { BarangList } from '@/components/BarangList';
import { TransaksiForm } from '@/components/TransaksiForm';
import { TransaksiList } from '@/components/TransaksiList';
import type { Barang, Transaksi } from '../../server/src/schema';

function App() {
  const [barangs, setBarangs] = useState<Barang[]>([]);
  const [transaksis, setTransaksis] = useState<Transaksi[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load barang data
  const loadBarangs = useCallback(async () => {
    try {
      const result = await trpc.getAllBarang.query();
      setBarangs(result);
    } catch (error) {
      console.error('Gagal memuat data barang:', error);
    }
  }, []);

  // Load transaksi data
  const loadTransaksis = useCallback(async () => {
    try {
      const result = await trpc.getAllTransaksi.query();
      setTransaksis(result);
    } catch (error) {
      console.error('Gagal memuat data transaksi:', error);
    }
  }, []);

  // Load all data
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadBarangs(), loadTransaksis()]);
    } finally {
      setIsLoading(false);
    }
  }, [loadBarangs, loadTransaksis]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handle barang creation
  const handleBarangCreated = useCallback((newBarang: Barang) => {
    setBarangs((prev: Barang[]) => [...prev, newBarang]);
  }, []);

  // Handle barang update
  const handleBarangUpdated = useCallback((updatedBarang: Barang) => {
    setBarangs((prev: Barang[]) => 
      prev.map((barang: Barang) => 
        barang.id === updatedBarang.id ? updatedBarang : barang
      )
    );
  }, []);

  // Handle barang deletion
  const handleBarangDeleted = useCallback((deletedId: number) => {
    setBarangs((prev: Barang[]) => 
      prev.filter((barang: Barang) => barang.id !== deletedId)
    );
  }, []);

  // Handle transaksi creation
  const handleTransaksiCreated = useCallback((newTransaksi: Transaksi) => {
    setTransaksis((prev: Transaksi[]) => [newTransaksi, ...prev]);
    // Update stok barang setelah transaksi
    loadBarangs();
  }, [loadBarangs]);

  // Calculate statistics
  const totalBarang = barangs.length;
  const totalStok = barangs.reduce((sum: number, barang: Barang) => sum + barang.jumlah_stok, 0);
  const barangStokRendah = barangs.filter((barang: Barang) => barang.jumlah_stok <= 5).length;
  const transaksiHariIni = transaksis.filter((transaksi: Transaksi) => {
    const today = new Date();
    const transaksiDate = new Date(transaksi.tanggal_transaksi);
    return transaksiDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            📦 Manajemen Inventaris
          </h1>
          <p className="text-gray-600">
            Kelola barang dan transaksi inventaris dengan mudah
          </p>
        </div>

        {/* Backend Status Alert */}
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Catatan:</strong> Backend saat ini menggunakan data dummy. 
            Data yang ditambahkan tidak akan tersimpan secara permanen dan akan reset saat aplikasi dimuat ulang.
          </AlertDescription>
        </Alert>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Barang</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{totalBarang}</div>
              <p className="text-xs text-blue-600">Jenis barang berbeda</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-r from-green-50 to-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Total Stok</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{totalStok}</div>
              <p className="text-xs text-green-600">Total unit barang</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-gradient-to-r from-red-50 to-red-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700">Stok Rendah</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">{barangStokRendah}</div>
              <p className="text-xs text-red-600">≤ 5 unit tersisa</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Transaksi Hari Ini</CardTitle>
              <Badge variant="secondary" className="bg-purple-200 text-purple-800">
                {transaksiHariIni}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{transaksiHariIni}</div>
              <p className="text-xs text-purple-600">Transaksi masuk & keluar</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="barang" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto bg-white shadow-sm">
            <TabsTrigger value="barang" className="flex items-center gap-2">
              📦 Kelola Barang
            </TabsTrigger>
            <TabsTrigger value="transaksi" className="flex items-center gap-2">
              📊 Transaksi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="barang" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    ➕ Tambah Barang Baru
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    Masukkan informasi barang yang akan ditambahkan ke inventaris
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <BarangForm
                    onBarangCreated={handleBarangCreated}
                    isLoading={isLoading}
                  />
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    📋 Daftar Barang
                  </CardTitle>
                  <CardDescription className="text-gray-200">
                    Kelola dan lihat semua barang dalam inventaris
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <BarangList
                    barangs={barangs}
                    onBarangUpdated={handleBarangUpdated}
                    onBarangDeleted={handleBarangDeleted}
                    isLoading={isLoading}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transaksi" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    📝 Catat Transaksi
                  </CardTitle>
                  <CardDescription className="text-green-100">
                    Tambah transaksi barang masuk atau keluar
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <TransaksiForm
                    barangs={barangs}
                    onTransaksiCreated={handleTransaksiCreated}
                    isLoading={isLoading}
                  />
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    📈 Riwayat Transaksi
                  </CardTitle>
                  <CardDescription className="text-purple-100">
                    Lihat semua transaksi barang masuk dan keluar
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <TransaksiList
                    transaksis={transaksis}
                    isLoading={isLoading}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
