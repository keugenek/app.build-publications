import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import type { CreateBarangInput, Barang } from '../../../server/src/schema';

interface BarangFormProps {
  onBarangCreated: (barang: Barang) => void;
  isLoading?: boolean;
}

export function BarangForm({ onBarangCreated, isLoading = false }: BarangFormProps) {
  const [formData, setFormData] = useState<CreateBarangInput>({
    nama: '',
    kode: '',
    jumlah_stok: 0,
    deskripsi: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await trpc.createBarang.mutate(formData);
      onBarangCreated(response);
      
      // Reset form
      setFormData({
        nama: '',
        kode: '',
        jumlah_stok: 0,
        deskripsi: null
      });
    } catch (error) {
      console.error('Gagal membuat barang:', error);
      alert('Gagal menambahkan barang. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateBarangInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setFormData((prev: CreateBarangInput) => ({
      ...prev,
      [field]: field === 'jumlah_stok' 
        ? parseInt(value) || 0 
        : field === 'deskripsi' 
          ? value || null 
          : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nama" className="text-sm font-medium text-gray-700">
          Nama Barang *
        </Label>
        <Input
          id="nama"
          placeholder="Masukkan nama barang"
          value={formData.nama}
          onChange={handleInputChange('nama')}
          required
          disabled={isSubmitting || isLoading}
          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="kode" className="text-sm font-medium text-gray-700">
          Kode Barang *
        </Label>
        <Input
          id="kode"
          placeholder="Masukkan kode barang (contoh: BRG001)"
          value={formData.kode}
          onChange={handleInputChange('kode')}
          required
          disabled={isSubmitting || isLoading}
          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="jumlah_stok" className="text-sm font-medium text-gray-700">
          Jumlah Stok Awal *
        </Label>
        <Input
          id="jumlah_stok"
          type="number"
          min="0"
          placeholder="0"
          value={formData.jumlah_stok}
          onChange={handleInputChange('jumlah_stok')}
          required
          disabled={isSubmitting || isLoading}
          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="deskripsi" className="text-sm font-medium text-gray-700">
          Deskripsi (Opsional)
        </Label>
        <Textarea
          id="deskripsi"
          placeholder="Masukkan deskripsi barang (opsional)"
          value={formData.deskripsi || ''}
          onChange={handleInputChange('deskripsi')}
          disabled={isSubmitting || isLoading}
          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
          rows={3}
        />
      </div>

      <Button 
        type="submit" 
        disabled={isSubmitting || isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Menambahkan...
          </span>
        ) : (
          '➕ Tambah Barang'
        )}
      </Button>
    </form>
  );
}
