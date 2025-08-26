import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Package, TrendingUp, TrendingDown, Archive } from 'lucide-react';
// Using type-only import for better TypeScript compliance
import type { Barang, Transaksi, CreateBarangInput, CreateTransaksiMasukInput, CreateTransaksiKeluarInput, UpdateBarangInput } from '../../server/src/schema';

import { DaftarBarang } from '@/components/DaftarBarang';
import { TransaksiMasuk } from '@/components/TransaksiMasuk';
import { TransaksiKeluar } from '@/components/TransaksiKeluar';
import { RiwayatTransaksi } from '@/components/RiwayatTransaksi';

function App() {
  // Explicit typing with interfaces
  const [barang, setBarang] = useState<Barang[]>([]);
  const [transaksi, setTransaksi] = useState<Transaksi[]>([]);
  const [activeTab, setActiveTab] = useState('daftar-barang');
  const [isLoading, setIsLoading] = useState(false);

  // useCallback to memoize functions used in useEffect
  const loadBarang = useCallback(async () => {
    try {
      const result = await trpc.getAllBarang.query();
      setBarang(result);
    } catch (error) {
      console.error('Failed to load barang:', error);
    }
  }, []);

  const loadTransaksi = useCallback(async () => {
    try {
      const result = await trpc.getAllTransaksi.query();
      setTransaksi(result);
    } catch (error) {
      console.error('Failed to load transaksi:', error);
    }
  }, []);

  // useEffect with proper dependencies
  useEffect(() => {
    loadBarang();
    loadTransaksi();
  }, [loadBarang, loadTransaksi]);

  const handleCreateBarang = async (data: CreateBarangInput) => {
    setIsLoading(true);
    try {
      const newBarang = await trpc.createBarang.mutate(data);
      setBarang((prev: Barang[]) => [...prev, newBarang]);
    } catch (error) {
      console.error('Failed to create barang:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBarang = async (data: UpdateBarangInput) => {
    setIsLoading(true);
    try {
      const updatedBarang = await trpc.updateBarang.mutate(data);
      setBarang((prev: Barang[]) => 
        prev.map((item: Barang) => item.id === data.id ? updatedBarang : item)
      );
    } catch (error) {
      console.error('Failed to update barang:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBarang = async (id: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteBarang.mutate({ id });
      setBarang((prev: Barang[]) => prev.filter((item: Barang) => item.id !== id));
    } catch (error) {
      console.error('Failed to delete barang:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransaksiMasuk = async (data: CreateTransaksiMasukInput) => {
    setIsLoading(true);
    try {
      const newTransaksi = await trpc.createTransaksiMasuk.mutate(data);
      setTransaksi((prev: Transaksi[]) => [...prev, newTransaksi]);
      // Refresh barang list to get updated stock
      await loadBarang();
    } catch (error) {
      console.error('Failed to create transaksi masuk:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransaksiKeluar = async (data: CreateTransaksiKeluarInput) => {
    setIsLoading(true);
    try {
      const newTransaksi = await trpc.createTransaksiKeluar.mutate(data);
      setTransaksi((prev: Transaksi[]) => [...prev, newTransaksi]);
      // Refresh barang list to get updated stock
      await loadBarang();
    } catch (error) {
      console.error('Failed to create transaksi keluar:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const totalBarang = barang.length;
  const totalStok = barang.reduce((sum, item) => sum + item.jumlah_stok, 0);
  const transaksiMasukCount = transaksi.filter(t => t.jenis_transaksi === 'masuk').length;
  const transaksiKeluarCount = transaksi.filter(t => t.jenis_transaksi === 'keluar').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            📦 Sistem Manajemen Inventaris
          </h1>
          <p className="text-gray-600 text-lg">
            Kelola inventaris barang dengan mudah dan efisien
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Barang</CardTitle>
              <Package className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBarang}</div>
              <p className="text-blue-100 text-xs">Jenis barang terdaftar</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stok</CardTitle>
              <Archive className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStok}</div>
              <p className="text-green-100 text-xs">Unit tersedia</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Barang Masuk</CardTitle>
              <TrendingUp className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transaksiMasukCount}</div>
              <p className="text-emerald-100 text-xs">Transaksi masuk</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Barang Keluar</CardTitle>
              <TrendingDown className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transaksiKeluarCount}</div>
              <p className="text-orange-100 text-xs">Transaksi keluar</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">Panel Manajemen</CardTitle>
            <CardDescription>
              Kelola barang dan transaksi inventaris Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger 
                  value="daftar-barang" 
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Daftar Barang
                </TabsTrigger>
                <TabsTrigger 
                  value="transaksi-masuk"
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Barang Masuk
                </TabsTrigger>
                <TabsTrigger 
                  value="transaksi-keluar"
                  className="flex items-center gap-2"
                >
                  <TrendingDown className="h-4 w-4" />
                  Barang Keluar
                </TabsTrigger>
                <TabsTrigger 
                  value="riwayat-transaksi"
                  className="flex items-center gap-2"
                >
                  <Archive className="h-4 w-4" />
                  Riwayat Transaksi
                </TabsTrigger>
              </TabsList>

              <TabsContent value="daftar-barang">
                <DaftarBarang
                  barang={barang}
                  onCreateBarang={handleCreateBarang}
                  onUpdateBarang={handleUpdateBarang}
                  onDeleteBarang={handleDeleteBarang}
                  isLoading={isLoading}
                />
              </TabsContent>

              <TabsContent value="transaksi-masuk">
                <TransaksiMasuk
                  barang={barang}
                  onCreateTransaksi={handleTransaksiMasuk}
                  isLoading={isLoading}
                />
              </TabsContent>

              <TabsContent value="transaksi-keluar">
                <TransaksiKeluar
                  barang={barang}
                  onCreateTransaksi={handleTransaksiKeluar}
                  isLoading={isLoading}
                />
              </TabsContent>

              <TabsContent value="riwayat-transaksi">
                <RiwayatTransaksi
                  transaksi={transaksi}
                  barang={barang}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
