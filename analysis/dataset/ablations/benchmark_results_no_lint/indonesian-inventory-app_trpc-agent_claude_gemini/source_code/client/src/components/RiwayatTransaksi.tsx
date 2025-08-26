import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Archive, Search, Filter, Calendar } from 'lucide-react';
import type { Transaksi, Barang } from '../../../server/src/schema';

interface RiwayatTransaksiProps {
  transaksi: Transaksi[];
  barang: Barang[];
}

export function RiwayatTransaksi({ transaksi, barang }: RiwayatTransaksiProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenis, setFilterJenis] = useState<'all' | 'masuk' | 'keluar'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Create a map for faster barang lookup
  const barangMap = useMemo(() => {
    const map = new Map<string, Barang>();
    barang.forEach((item: Barang) => {
      map.set(item.kode_sku, item);
    });
    return map;
  }, [barang]);

  // Filter and sort transactions
  const filteredTransaksi = useMemo(() => {
    let filtered = transaksi.filter((t: Transaksi) => {
      const matchesSearch = t.kode_sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        barangMap.get(t.kode_sku)?.nama_barang.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterJenis === 'all' || t.jenis_transaksi === filterJenis;
      
      return matchesSearch && matchesFilter;
    });

    // Sort by date
    filtered.sort((a: Transaksi, b: Transaksi) => {
      const dateA = new Date(a.tanggal_transaksi).getTime();
      const dateB = new Date(b.tanggal_transaksi).getTime();
      
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [transaksi, searchTerm, filterJenis, sortBy, barangMap]);

  // Calculate statistics
  const totalTransaksi = transaksi.length;
  const totalMasuk = transaksi.filter(t => t.jenis_transaksi === 'masuk').length;
  const totalKeluar = transaksi.filter(t => t.jenis_transaksi === 'keluar').length;

  const getBarangName = (kodeSku: string): string => {
    return barangMap.get(kodeSku)?.nama_barang || 'Barang tidak ditemukan';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          📋 Riwayat Transaksi
        </h3>
        <p className="text-gray-600">Lihat semua transaksi barang masuk dan keluar</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <Archive className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransaksi}</div>
            <p className="text-purple-100 text-xs">Semua transaksi</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaksi Masuk</CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMasuk}</div>
            <p className="text-green-100 text-xs">Penambahan stok</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaksi Keluar</CardTitle>
            <TrendingDown className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalKeluar}</div>
            <p className="text-red-100 text-xs">Pengurangan stok</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Pencarian
          </CardTitle>
          <CardDescription>
            Filter transaksi berdasarkan kriteria yang diinginkan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Cari Transaksi
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari nama barang atau kode SKU..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Jenis Transaksi
              </label>
              <Select value={filterJenis} onValueChange={(value: 'all' | 'masuk' | 'keluar') => setFilterJenis(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Transaksi</SelectItem>
                  <SelectItem value="masuk">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Barang Masuk
                    </div>
                  </SelectItem>
                  <SelectItem value="keluar">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      Barang Keluar
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Urutkan
              </label>
              <Select value={sortBy} onValueChange={(value: 'newest' | 'oldest') => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Terbaru
                    </div>
                  </SelectItem>
                  <SelectItem value="oldest">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Terlama
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filters summary */}
          {(searchTerm || filterJenis !== 'all') && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-gray-600">Filter aktif:</span>
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  <Search className="h-3 w-3" />
                  "{searchTerm}"
                </Badge>
              )}
              {filterJenis !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {filterJenis === 'masuk' ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  {filterJenis === 'masuk' ? 'Barang Masuk' : 'Barang Keluar'}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterJenis('all');
                }}
                className="text-xs h-6 px-2"
              >
                Hapus filter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction List */}
      {filteredTransaksi.length === 0 ? (
        <Card className="p-8 text-center">
          <Archive className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            {transaksi.length === 0 
              ? 'Belum ada transaksi' 
              : 'Transaksi tidak ditemukan'
            }
          </h3>
          <p className="text-gray-500">
            {transaksi.length === 0
              ? 'Mulai dengan mencatat transaksi barang masuk atau keluar'
              : 'Coba ubah kriteria pencarian atau filter'
            }
          </p>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Daftar Transaksi</CardTitle>
                <CardDescription>
                  Menampilkan {filteredTransaksi.length} dari {totalTransaksi} transaksi
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Barang</TableHead>
                  <TableHead>Kode SKU</TableHead>
                  <TableHead className="text-center">Jumlah</TableHead>
                  <TableHead>Dicatat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransaksi.map((t: Transaksi) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      {t.tanggal_transaksi.toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={t.jenis_transaksi === 'masuk' ? 'default' : 'destructive'}
                        className={
                          t.jenis_transaksi === 'masuk'
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : 'bg-red-100 text-red-800 hover:bg-red-100'
                        }
                      >
                        {t.jenis_transaksi === 'masuk' ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {t.jenis_transaksi === 'masuk' ? 'Masuk' : 'Keluar'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {getBarangName(t.kode_sku)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {t.kode_sku}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-semibold ${
                        t.jenis_transaksi === 'masuk' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {t.jenis_transaksi === 'masuk' ? '+' : '-'}{t.jumlah}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {t.created_at.toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
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
