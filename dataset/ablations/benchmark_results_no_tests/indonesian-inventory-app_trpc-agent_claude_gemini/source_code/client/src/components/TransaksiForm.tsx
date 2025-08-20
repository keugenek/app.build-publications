import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, TrendingDown, Package } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { CreateTransaksiInput, Transaksi, Barang, JenisTransaksi } from '../../../server/src/schema';

interface TransaksiFormProps {
  barangs: Barang[];
  onTransaksiCreated: (transaksi: Transaksi) => void;
  isLoading?: boolean;
}

export function TransaksiForm({ barangs, onTransaksiCreated, isLoading = false }: TransaksiFormProps) {
  const [formData, setFormData] = useState<CreateTransaksiInput>({
    jenis: 'masuk',
    barang_id: 0,
    jumlah: 0,
    tanggal_transaksi: new Date()
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedBarang = barangs.find((barang: Barang) => barang.id === formData.barang_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.barang_id === 0) {
      alert('Silakan pilih barang terlebih dahulu.');
      return;
    }

    if (formData.jumlah <= 0) {
      alert('Jumlah transaksi harus lebih dari 0.');
      return;
    }

    // Validasi stok untuk transaksi keluar
    if (formData.jenis === 'keluar' && selectedBarang && formData.jumlah > selectedBarang.jumlah_stok) {
      alert(`Stok tidak mencukupi. Stok tersedia: ${selectedBarang.jumlah_stok} unit.`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await trpc.createTransaksi.mutate(formData);
      onTransaksiCreated(response);
      
      // Reset form
      setFormData({
        jenis: 'masuk',
        barang_id: 0,
        jumlah: 0,
        tanggal_transaksi: new Date()
      });
    } catch (error) {
      console.error('Gagal membuat transaksi:', error);
      alert('Gagal menambahkan transaksi. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJenisChange = (value: string) => {
    setFormData((prev: CreateTransaksiInput) => ({
      ...prev,
      jenis: value as JenisTransaksi
    }));
  };

  const handleBarangChange = (value: string) => {
    setFormData((prev: CreateTransaksiInput) => ({
      ...prev,
      barang_id: parseInt(value) || 0
    }));
  };

  const handleJumlahChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev: CreateTransaksiInput) => ({
      ...prev,
      jumlah: parseInt(e.target.value) || 0
    }));
  };

  const handleTanggalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev: CreateTransaksiInput) => ({
      ...prev,
      tanggal_transaksi: new Date(e.target.value)
    }));
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  if (barangs.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada barang</h3>
        <p className="text-gray-500 mb-4">
          Anda perlu menambahkan barang terlebih dahulu sebelum dapat mencatat transaksi.
        </p>
        <p className="text-sm text-blue-600">
          💡 Tip: Buka tab "Kelola Barang" untuk menambahkan barang baru.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Jenis Transaksi */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">
          Jenis Transaksi *
        </Label>
        <RadioGroup
          value={formData.jenis}
          onValueChange={handleJenisChange}
          className="flex gap-4"
          disabled={isSubmitting || isLoading}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="masuk" id="masuk" />
            <Label 
              htmlFor="masuk" 
              className="flex items-center gap-2 cursor-pointer text-green-700 hover:text-green-800"
            >
              <TrendingUp className="h-4 w-4" />
              Barang Masuk
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="keluar" id="keluar" />
            <Label 
              htmlFor="keluar" 
              className="flex items-center gap-2 cursor-pointer text-red-700 hover:text-red-800"
            >
              <TrendingDown className="h-4 w-4" />
              Barang Keluar
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Pilih Barang */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          Pilih Barang *
        </Label>
        <Select 
          value={formData.barang_id.toString()} 
          onValueChange={handleBarangChange}
          disabled={isSubmitting || isLoading}
        >
          <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
            <SelectValue placeholder="Pilih barang untuk transaksi" />
          </SelectTrigger>
          <SelectContent>
            {barangs.map((barang: Barang) => (
              <SelectItem key={barang.id} value={barang.id.toString()}>
                <div className="flex items-center justify-between w-full">
                  <span>{barang.nama} ({barang.kode})</span>
                  <Badge 
                    variant={barang.jumlah_stok === 0 ? 'destructive' : 'secondary'}
                    className="ml-2"
                  >
                    {barang.jumlah_stok} unit
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Info Barang yang Dipilih */}
      {selectedBarang && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              📦 Informasi Barang Terpilih
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Nama:</p>
                <p className="text-gray-600">{selectedBarang.nama}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Stok Tersedia:</p>
                <p className="text-gray-600 font-mono">
                  {selectedBarang.jumlah_stok.toLocaleString('id-ID')} unit
                </p>
              </div>
            </div>
            {formData.jenis === 'keluar' && (
              <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                ⚠️ Pastikan jumlah yang dikeluarkan tidak melebihi stok yang tersedia
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Jumlah */}
      <div className="space-y-2">
        <Label htmlFor="jumlah" className="text-sm font-medium text-gray-700">
          Jumlah *
        </Label>
        <Input
          id="jumlah"
          type="number"
          min="1"
          max={formData.jenis === 'keluar' && selectedBarang ? selectedBarang.jumlah_stok : undefined}
          placeholder="Masukkan jumlah transaksi"
          value={formData.jumlah || ''}
          onChange={handleJumlahChange}
          required
          disabled={isSubmitting || isLoading}
          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
        {formData.jenis === 'keluar' && selectedBarang && formData.jumlah > selectedBarang.jumlah_stok && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <TrendingDown className="h-3 w-3" />
            Jumlah melebihi stok tersedia ({selectedBarang.jumlah_stok} unit)
          </p>
        )}
      </div>

      {/* Tanggal Transaksi */}
      <div className="space-y-2">
        <Label htmlFor="tanggal" className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Tanggal Transaksi *
        </Label>
        <Input
          id="tanggal"
          type="date"
          value={formatDateForInput(formData.tanggal_transaksi)}
          onChange={handleTanggalChange}
          required
          disabled={isSubmitting || isLoading}
          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        disabled={isSubmitting || isLoading || formData.barang_id === 0}
        className={`w-full text-white ${
          formData.jenis === 'masuk' 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Menyimpan...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            {formData.jenis === 'masuk' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            Catat Transaksi {formData.jenis === 'masuk' ? 'Masuk' : 'Keluar'}
          </span>
        )}
      </Button>
    </form>
  );
}
