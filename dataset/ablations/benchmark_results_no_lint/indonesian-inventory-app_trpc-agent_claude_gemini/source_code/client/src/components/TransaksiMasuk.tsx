import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { TrendingUp, Package, Calendar, CheckCircle } from 'lucide-react';
import type { Barang, CreateTransaksiMasukInput } from '../../../server/src/schema';

interface TransaksiMasukProps {
  barang: Barang[];
  onCreateTransaksi: (data: CreateTransaksiMasukInput) => Promise<void>;
  isLoading: boolean;
}

export function TransaksiMasuk({ barang, onCreateTransaksi, isLoading }: TransaksiMasukProps) {
  const [formData, setFormData] = useState<CreateTransaksiMasukInput>({
    kode_sku: '',
    jumlah: 1,
    tanggal_transaksi: new Date()
  });

  const [selectedBarang, setSelectedBarang] = useState<Barang | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarang) return;
    
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
      console.error('Error creating transaksi masuk:', error);
      setShowConfirmation(false);
    }
  };

  const handleSkuChange = (kodeSku: string) => {
    const selected = barang.find(item => item.kode_sku === kodeSku);
    setSelectedBarang(selected || null);
    setFormData(prev => ({ ...prev, kode_sku: kodeSku }));
  };

  const todayString = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          📈 Transaksi Barang Masuk
        </h3>
        <p className="text-gray-600">Catat penambahan stok barang ke inventaris</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Form Barang Masuk
            </CardTitle>
            <CardDescription>
              Masukkan detail barang yang akan ditambahkan ke stok
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
                    {barang.map((item: Barang) => (
                      <SelectItem key={item.id} value={item.kode_sku}>
                        <div className="flex items-center justify-between w-full">
                          <span>{item.nama_barang}</span>
                          <Badge variant="outline" className="ml-2 font-mono">
                            {item.kode_sku}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="jumlah">Jumlah Masuk</Label>
                <Input
                  id="jumlah"
                  type="number"
                  placeholder="Masukkan jumlah barang masuk"
                  value={formData.jumlah}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateTransaksiMasukInput) => ({ 
                      ...prev, 
                      jumlah: parseInt(e.target.value) || 1 
                    }))
                  }
                  min="1"
                  required
                />
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
                    setFormData((prev: CreateTransaksiMasukInput) => ({ 
                      ...prev, 
                      tanggal_transaksi: new Date(e.target.value) 
                    }))
                  }
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading || !selectedBarang}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Catat Barang Masuk
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
                      <span className="font-semibold text-blue-600">
                        {selectedBarang.jumlah_stok} unit
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Detail Transaksi</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jumlah Masuk:</span>
                      <span className="font-semibold text-green-600">
                        +{formData.jumlah} unit
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
                      <span className="text-green-600">
                        {selectedBarang.jumlah_stok + formData.jumlah} unit
                      </span>
                    </div>
                  </div>
                </div>

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
              <CheckCircle className="h-5 w-5 text-green-600" />
              Konfirmasi Transaksi Barang Masuk
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
                      <span className="text-gray-600">Jumlah Masuk:</span>
                      <span className="font-semibold text-green-600">+{formData.jumlah} unit</span>
                      <span className="text-gray-600">Stok Baru:</span>
                      <span className="font-semibold">{selectedBarang.jumlah_stok + formData.jumlah} unit</span>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmTransaction}
              className="bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? 'Memproses...' : 'Catat Transaksi'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Help Text */}
      {barang.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="text-yellow-600">⚠️</div>
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">Belum Ada Barang</h4>
                <p className="text-yellow-700 text-sm">
                  Anda perlu menambahkan barang terlebih dahulu di tab "Daftar Barang" 
                  sebelum dapat mencatat transaksi masuk.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
