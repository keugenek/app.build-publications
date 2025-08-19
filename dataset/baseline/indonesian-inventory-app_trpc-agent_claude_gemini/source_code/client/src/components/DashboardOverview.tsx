import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { RefreshCw } from 'lucide-react';
import type { Barang, TransaksiWithBarang } from '../../../server/src/schema';

interface DashboardOverviewProps {
  barangList: Barang[];
  transaksiList: TransaksiWithBarang[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function DashboardOverview({ 
  barangList, 
  transaksiList, 
  isLoading, 
  onRefresh 
}: DashboardOverviewProps) {
  // Calculate statistics
  const totalBarang = barangList.length;
  const totalStok = barangList.reduce((sum, barang) => sum + barang.stok, 0);
  const totalNilaiInventaris = barangList.reduce((sum, barang) => sum + (barang.harga * barang.stok), 0);
  const stokRendah = barangList.filter(barang => barang.stok <= 5);
  
  // Recent transactions (last 10)
  const recentTransaksi = transaksiList.slice(0, 10);
  
  // Transaction statistics
  const transaksiMasukCount = transaksiList.filter(t => t.jenis === 'MASUK').length;
  const transaksiKeluarCount = transaksiList.filter(t => t.jenis === 'KELUAR').length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Ringkasan inventaris dan aktivitas terkini
          </p>
        </div>
        <Button
          onClick={onRefresh}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Barang</CardTitle>
            <span className="text-2xl">📦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{totalBarang}</div>
            <p className="text-xs text-blue-600">
              Jenis barang terdaftar
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stok</CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{totalStok.toLocaleString('id-ID')}</div>
            <p className="text-xs text-green-600">
              Unit barang tersedia
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nilai Inventaris</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              {formatCurrency(totalNilaiInventaris)}
            </div>
            <p className="text-xs text-purple-600">
              Total nilai stok
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${stokRendah.length > 0 ? 'from-red-50 to-red-100 border-red-200' : 'from-gray-50 to-gray-100 border-gray-200'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Rendah</CardTitle>
            <span className="text-2xl">{stokRendah.length > 0 ? '⚠️' : '✅'}</span>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stokRendah.length > 0 ? 'text-red-700' : 'text-gray-700'}`}>
              {stokRendah.length}
            </div>
            <p className={`text-xs ${stokRendah.length > 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {stokRendah.length > 0 ? 'Barang stok ≤ 5 unit' : 'Semua stok aman'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📈 Transaksi Terkini
            </CardTitle>
            <CardDescription>
              {transaksiList.length} total transaksi ({transaksiMasukCount} masuk, {transaksiKeluarCount} keluar)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransaksi.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl mb-2 block">📋</span>
                Belum ada transaksi
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransaksi.map((transaksi: TransaksiWithBarang) => (
                  <div key={transaksi.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant={transaksi.jenis === 'MASUK' ? 'default' : 'secondary'}
                          className={transaksi.jenis === 'MASUK' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                        >
                          {transaksi.jenis === 'MASUK' ? '⬇️' : '⬆️'} {transaksi.jenis}
                        </Badge>
                        <span className="font-medium">{transaksi.barang.nama}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {transaksi.jumlah} unit • {formatDate(transaksi.tanggal)}
                      </div>
                      {transaksi.keterangan && (
                        <div className="text-sm text-gray-500 mt-1">
                          {transaksi.keterangan}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⚠️ Barang Stok Rendah
            </CardTitle>
            <CardDescription>
              Barang dengan stok 5 unit atau kurang
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stokRendah.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl mb-2 block">✅</span>
                Semua barang memiliki stok yang cukup
              </div>
            ) : (
              <div className="space-y-3">
                {stokRendah.map((barang: Barang) => (
                  <div key={barang.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex-1">
                      <div className="font-medium text-red-900">{barang.nama}</div>
                      <div className="text-sm text-red-700">
                        Kode: {barang.kode_barang} • Harga: {formatCurrency(barang.harga)}
                      </div>
                    </div>
                    <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300">
                      {barang.stok} unit
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Items Table */}
      {barangList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📋 Daftar Semua Barang
            </CardTitle>
            <CardDescription>
              Ringkasan seluruh barang dalam inventaris
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                  <TableHead className="text-right">Stok</TableHead>
                  <TableHead className="text-right">Nilai Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {barangList.map((barang: Barang) => (
                  <TableRow key={barang.id}>
                    <TableCell className="font-medium">
                      <div>
                        {barang.nama}
                        {barang.stok <= 5 && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            Stok Rendah
                          </Badge>
                        )}
                      </div>
                      {barang.deskripsi && (
                        <div className="text-sm text-gray-500 mt-1">
                          {barang.deskripsi}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{barang.kode_barang}</TableCell>
                    <TableCell className="text-right">{formatCurrency(barang.harga)}</TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant={barang.stok <= 5 ? 'destructive' : 'secondary'}
                        className={barang.stok <= 5 ? 'bg-red-100 text-red-700' : ''}
                      >
                        {barang.stok}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(barang.harga * barang.stok)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
