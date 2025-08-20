import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { trpc } from '@/utils/trpc';
import type { Barang, TransaksiWithBarang, CreateTransaksiInput, JenisTransaksi } from '../../../server/src/schema';

export function TransaksiManagement() {
  const [transaksis, setTransaksis] = useState<TransaksiWithBarang[]>([]);
  const [barangs, setBarangs] = useState<Barang[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Form state untuk create transaksi
  const [createFormData, setCreateFormData] = useState<CreateTransaksiInput>({
    tanggal_transaksi: new Date(),
    jenis_transaksi: 'Masuk',
    barang_id: 0,
    jumlah: 1,
    catatan: null
  });

  const loadData = useCallback(async () => {
    try {
      const [transaksiResult, barangResult] = await Promise.all([
        trpc.getTransaksi.query(),
        trpc.getBarang.query()
      ]);
      setTransaksis(transaksiResult);
      setBarangs(barangResult);
    } catch (error) {
      console.error('Gagal memuat data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createFormData.barang_id === 0) return;
    
    setIsLoading(true);
    try {
      await trpc.createTransaksi.mutate(createFormData);
      // Reload data untuk memperbarui stok barang dan daftar transaksi
      await loadData();
      setCreateFormData({
        tanggal_transaksi: new Date(),
        jenis_transaksi: 'Masuk',
        barang_id: 0,
        jumlah: 1,
        catatan: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Gagal membuat transaksi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedBarang = () => {
    return barangs.find((barang: Barang) => barang.id === createFormData.barang_id);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getTodayString = () => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">💹 Catat Transaksi</h2>
          <p className="text-gray-600">Tambah transaksi barang masuk atau keluar</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              ➕ Tambah Transaksi
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>➕ Tambah Transaksi Baru</DialogTitle>
              <DialogDescription>
                Catat transaksi barang masuk atau keluar dari inventaris.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tanggal_transaksi">Tanggal Transaksi *</Label>
                <Input
                  id="tanggal_transaksi"
                  type="datetime-local"
                  value={getTodayString()}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateTransaksiInput) => ({ 
                      ...prev, 
                      tanggal_transaksi: new Date(e.target.value) 
                    }))
                  }
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="jenis_transaksi">Jenis Transaksi *</Label>
                <Select
                  value={createFormData.jenis_transaksi}
                  onValueChange={(value: JenisTransaksi) =>
                    setCreateFormData((prev: CreateTransaksiInput) => ({ 
                      ...prev, 
                      jenis_transaksi: value 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masuk">📦 Barang Masuk</SelectItem>
                    <SelectItem value="Keluar">📤 Barang Keluar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="barang_id">Pilih Barang *</Label>
                <Select
                  value={createFormData.barang_id > 0 ? createFormData.barang_id.toString() : ''}
                  onValueChange={(value: string) =>
                    setCreateFormData((prev: CreateTransaksiInput) => ({ 
                      ...prev, 
                      barang_id: parseInt(value) 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih barang..." />
                  </SelectTrigger>
                  <SelectContent>
                    {barangs.map((barang: Barang) => (
                      <SelectItem key={barang.id} value={barang.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{barang.nama_barang}</span>
                          <Badge variant="outline" className="ml-2">
                            {barang.kode_barang}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Info barang yang dipilih */}
              {getSelectedBarang() && (
                <Card className="bg-gray-50">
                  <CardContent className="pt-4">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stok Saat Ini:</span>
                        <Badge variant={getSelectedBarang()!.jumlah_stok > 10 ? "default" : 
                                      getSelectedBarang()!.jumlah_stok > 0 ? "secondary" : "destructive"}>
                          {getSelectedBarang()!.jumlah_stok} unit
                        </Badge>
                      </div>
                      {getSelectedBarang()!.harga_jual && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Harga Jual:</span>
                          <span>{formatCurrency(getSelectedBarang()!.harga_jual)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="jumlah">Jumlah *</Label>
                <Input
                  id="jumlah"
                  type="number"
                  placeholder="Masukkan jumlah"
                  value={createFormData.jumlah}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateTransaksiInput) => ({ 
                      ...prev, 
                      jumlah: parseInt(e.target.value) || 1 
                    }))
                  }
                  min="1"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="catatan">Catatan</Label>
                <Textarea
                  id="catatan"
                  placeholder="Catatan tambahan (opsional)"
                  value={createFormData.catatan || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCreateFormData((prev: CreateTransaksiInput) => ({
                      ...prev,
                      catatan: e.target.value || null
                    }))
                  }
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading || createFormData.barang_id === 0}>
                  {isLoading ? 'Menyimpan...' : 'Simpan Transaksi'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Ringkasan Stok */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Ringkasan Stok Barang</CardTitle>
          <CardDescription>
            Status stok terkini dari semua barang
          </CardDescription>
        </CardHeader>
        <CardContent>
          {barangs.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p>Belum ada data barang</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {barangs.map((barang: Barang) => (
                <Card key={barang.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{barang.nama_barang}</h4>
                        <p className="text-sm text-gray-500">{barang.kode_barang}</p>
                      </div>
                      <Badge 
                        variant={barang.jumlah_stok > 10 ? "default" : 
                                barang.jumlah_stok > 0 ? "secondary" : "destructive"}
                      >
                        {barang.jumlah_stok} unit
                      </Badge>
                    </div>
                    {barang.harga_jual && (
                      <p className="text-sm text-gray-600">
                        Harga: {formatCurrency(barang.harga_jual)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Riwayat Transaksi */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Riwayat Transaksi</CardTitle>
          <CardDescription>
            Daftar semua transaksi barang masuk dan keluar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transaksis.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg mb-2">📭 Belum ada transaksi</p>
              <p>Klik "Tambah Transaksi" untuk mencatat transaksi pertama Anda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Barang</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transaksis.map((transaksi: TransaksiWithBarang) => (
                    <TableRow key={transaksi.id}>
                      <TableCell className="text-sm">
                        {formatDate(transaksi.tanggal_transaksi)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={transaksi.jenis_transaksi === 'Masuk' ? "default" : "secondary"}
                        >
                          {transaksi.jenis_transaksi === 'Masuk' ? '📦 Masuk' : '📤 Keluar'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaksi.barang.nama_barang}</div>
                          <div className="text-sm text-gray-500">{transaksi.barang.kode_barang}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {transaksi.jenis_transaksi === 'Masuk' ? '+' : '-'}{transaksi.jumlah} unit
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transaksi.catatan ? (
                          <span className="text-sm text-gray-600">{transaksi.catatan}</span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
