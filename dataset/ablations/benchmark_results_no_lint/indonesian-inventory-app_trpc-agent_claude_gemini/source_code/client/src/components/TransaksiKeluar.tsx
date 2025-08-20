import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import { TrendingDown, Package, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import type { Barang, CreateTransaksiKeluarInput } from '../../../server/src/schema';

interface TransaksiKeluarProps {
  barang: Barang[];
  onCreateTransaksi: (data: CreateTransaksiKeluarInput) => Promise<void>;
  isLoading: boolean;
}

export function TransaksiKeluar({ barang, onCreateTransaksi, isLoading }: TransaksiKeluarProps) {
  const [formData, setFormData] = useState<CreateTransaksiKeluarInput>({
    kode_sku: '',
    jumlah: 1,
    tanggal_transaksi: new Date()
  });

  const [selectedBarang, setSelectedBarang] = useState<Barang | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Filter barang yang memiliki stok
  const barangWithStock = barang.filter((item: Barang) => item.jumlah_stok > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarang) return;
    
    // Check if requested quantity exceeds available stock
    if (formData.jumlah > selectedBarang.jumlah_stok) {
      return; // This will be prevented by the form validation
    }
    
    setShowConfirmation(true);
  };

  const handleConfirmTransaction = async () => {
    try {
      await onCreateTransaksi(formData);
      // Reset form
      setFormData({
        kode_sku: '',
        jumlah: 1,
        tanggal_transaksi: new Date()
      });
      setSelectedBarang(null);
      setShowConfirmation(false);
    } catch (error) {
      console.error('Error creating transaksi keluar:', error);
      setShowConfirmation(false);
    }
  };

  const handleSkuChange = (kodeSku: string) => {
    const selected = barang.find(item => item.kode_sku === kodeSku);
    setSelectedBarang(selected || null);
    setFormData(prev => ({ ...prev, kode_sku: kodeSku, jumlah: 1 }));
  };

  const isQuantityExceedsStock = selectedBarang && formData.jumlah > selectedBarang.jumlah_stok;
  const todayString = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          📉 Transaksi Barang Keluar
        </h3>
        <p className="text-gray-600">Catat pengurangan stok barang dari inventaris</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Form Barang Keluar
            </CardTitle>
            <CardDescription>
              Masukkan detail barang yang akan dikeluarkan dari stok
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="kode_sku">Pilih Barang</Label>
                <Select
                  value={formData.kode_sku}
                  onValueChange={handleSkuChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih barang berdasarkan kode SKU" />
                  </SelectTrigger>
                  <SelectContent>
                    {barangWithStock.map((item: Barang) => (
                      <SelectItem key={item.id} value={item.kode_sku}>
                        <div className="flex items-center justify-between w-full">
                          <span>{item.nama_barang}</span>
                          <div className="flex items-center gap-2 ml-2">
                            <Badge 
                              variant="outline" 
                              className={`font-mono ${
                                item.jumlah_stok <= 5 ? 'border-red-300 text-red-600' : 'border-gray-300'
                              }`}
                            >
                              {item.kode_sku}
                            </Badge>
                            <Badge 
                              variant={item.jumlah_stok <= 5 ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {item.jumlah_stok} unit
                            </Badge>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBarang && selectedBarang.jumlah_stok <= 5 && (
                  <Alert className="mt-2 border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-700">
                      Peringatan: Stok barang ini rendah ({selectedBarang.jumlah_stok} unit tersisa)
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div>
                <Label htmlFor="jumlah">Jumlah Keluar</Label>
                <Input
                  id="jumlah"
                  type="number"
                  placeholder="Masukkan jumlah barang keluar"
                  value={formData.jumlah}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateTransaksiKeluarInput) => ({ 
                      ...prev, 
                      jumlah: parseInt(e.target.value) || 1 
                    }))
                  }
                  min="1"
                  max={selectedBarang?.jumlah_stok || undefined}
                  required
                  className={isQuantityExceedsStock ? 'border-red-500' : ''}
                />
                {isQuantityExceedsStock && (
                  <Alert className="mt-2 border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      Jumlah tidak boleh melebihi stok yang tersedia ({selectedBarang?.jumlah_stok} unit)
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div>
                <Label htmlFor="tanggal_transaksi">Tanggal Transaksi</Label>
                <Input
                  id="tanggal_transaksi"
                  type="date"
                  value={formData.tanggal_transaksi instanceof Date 
                    ? formData.tanggal_transaksi.toISOString().split('T')[0] 
                    : todayString}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateTransaksiKeluarInput) => ({ 
                      ...prev, 
                      tanggal_transaksi: new Date(e.target.value) 
                    }))
                  }
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={isLoading || !selectedBarang || !!isQuantityExceedsStock}
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Catat Barang Keluar
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Preview Transaksi
            </CardTitle>
            <CardDescription>
              Lihat detail transaksi yang akan dicatat
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedBarang ? (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Informasi Barang</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nama Barang:</span>
                      <span className="font-medium">{selectedBarang.nama_barang}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kode SKU:</span>
                      <Badge variant="outline" className="font-mono">
                        {selectedBarang.kode_sku}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stok Saat Ini:</span>
                      <span className={`font-semibold ${selectedBarang.jumlah_stok <= 5 ? 'text-red-600' : 'text-blue-600'}`}>
                        {selectedBarang.jumlah_stok} unit
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-900 mb-2">Detail Transaksi</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jumlah Keluar:</span>
                      <span className="font-semibold text-red-600">
                        -{formData.jumlah} unit
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tanggal:</span>
                      <span className="font-medium">
                        {formData.tanggal_transaksi instanceof Date
                          ? formData.tanggal_transaksi.toLocaleDateString('id-ID')
                          : new Date().toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-800">Stok Setelah Transaksi:</span>
                      <span className={`${
                        (selectedBarang.jumlah_stok - formData.jumlah) <= 5 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {selectedBarang.jumlah_stok - formData.jumlah} unit
                      </span>
                    </div>
                  </div>
                </div>

                {(selectedBarang.jumlah_stok - formData.jumlah) === 0 && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      Perhatian: Stok akan habis setelah transaksi ini
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Stok akan diperbarui otomatis setelah transaksi dicatat</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  Pilih barang untuk melihat preview transaksi
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-red-600" />
              Konfirmasi Transaksi Barang Keluar
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Apakah Anda yakin ingin mencatat transaksi berikut?</p>
                {selectedBarang && (
                  <div className="bg-gray-50 p-4 rounded-lg text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-gray-600">Barang:</span>
                      <span className="font-medium">{selectedBarang.nama_barang}</span>
                      <span className="text-gray-600">Kode SKU:</span>
                      <span className="font-mono">{selectedBarang.kode_sku}</span>
                      <span className="text-gray-600">Jumlah Keluar:</span>
                      <span className="font-semibold text-red-600">-{formData.jumlah} unit</span>
                      <span className="text-gray-600">Stok Baru:</span>
                      <span className={`font-semibold ${
                        (selectedBarang.jumlah_stok - formData.jumlah) <= 5 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {selectedBarang.jumlah_stok - formData.jumlah} unit
                      </span>
                    </div>
                    {(selectedBarang.jumlah_stok - formData.jumlah) === 0 && (
                      <div className="mt-3 p-2 bg-red-100 rounded text-red-700 text-xs">
                        ⚠️ Barang akan habis setelah transaksi ini
                      </div>
                    )}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmTransaction}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? 'Memproses...' : 'Catat Transaksi'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Help Text */}
      {barangWithStock.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="text-yellow-600">⚠️</div>
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">
                  {barang.length === 0 ? 'Belum Ada Barang' : 'Semua Barang Habis'}
                </h4>
                <p className="text-yellow-700 text-sm">
                  {barang.length === 0
                    ? 'Anda perlu menambahkan barang terlebih dahulu di tab "Daftar Barang".'
                    : 'Semua barang dalam inventaris sudah habis. Lakukan transaksi barang masuk terlebih dahulu.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
