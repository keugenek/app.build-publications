import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Barang, UpdateBarangInput } from '../../../server/src/schema';

interface BarangListProps {
  barangs: Barang[];
  onBarangUpdated: (barang: Barang) => void;
  onBarangDeleted: (id: number) => void;
  isLoading?: boolean;
}

export function BarangList({ barangs, onBarangUpdated, onBarangDeleted, isLoading = false }: BarangListProps) {
  const [editingBarang, setEditingBarang] = useState<Barang | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateBarangInput>({
    id: 0,
    nama: '',
    kode: '',
    jumlah_stok: 0,
    deskripsi: null
  });

  const handleEditClick = (barang: Barang) => {
    setEditingBarang(barang);
    setEditFormData({
      id: barang.id,
      nama: barang.nama,
      kode: barang.kode,
      jumlah_stok: barang.jumlah_stok,
      deskripsi: barang.deskripsi
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBarang) return;

    setIsEditing(true);
    try {
      const response = await trpc.updateBarang.mutate(editFormData);
      onBarangUpdated(response);
      setEditingBarang(null);
    } catch (error) {
      console.error('Gagal memperbarui barang:', error);
      alert('Gagal memperbarui barang. Silakan coba lagi.');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsDeleting(true);
    try {
      await trpc.deleteBarang.mutate({ id });
      onBarangDeleted(id);
    } catch (error) {
      console.error('Gagal menghapus barang:', error);
      alert('Gagal menghapus barang. Silakan coba lagi.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditInputChange = (field: keyof UpdateBarangInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setEditFormData((prev: UpdateBarangInput) => ({
      ...prev,
      [field]: field === 'jumlah_stok' 
        ? parseInt(value) || 0 
        : field === 'deskripsi' 
          ? value || null 
          : value
    }));
  };

  const getStockBadgeVariant = (stok: number) => {
    if (stok === 0) return 'destructive';
    if (stok <= 5) return 'outline';
    return 'secondary';
  };

  const getStockBadgeText = (stok: number) => {
    if (stok === 0) return 'Habis';
    if (stok <= 5) return 'Stok Rendah';
    return 'Stok Aman';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          Memuat data barang...
        </div>
      </div>
    );
  }

  if (barangs.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada barang</h3>
        <p className="text-gray-500">
          Mulai dengan menambahkan barang pertama Anda ke inventaris.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {barangs.map((barang: Barang) => (
        <Card key={barang.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  📦 {barang.nama}
                  <Badge variant={getStockBadgeVariant(barang.jumlah_stok)}>
                    {getStockBadgeText(barang.jumlah_stok)}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Kode: <span className="font-mono">{barang.kode}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditClick(barang)}
                      disabled={isDeleting}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>✏️ Edit Barang</DialogTitle>
                      <DialogDescription>
                        Perbarui informasi barang. Klik simpan untuk menyimpan perubahan.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit}>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-nama">Nama Barang</Label>
                          <Input
                            id="edit-nama"
                            value={editFormData.nama || ''}
                            onChange={handleEditInputChange('nama')}
                            disabled={isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-kode">Kode Barang</Label>
                          <Input
                            id="edit-kode"
                            value={editFormData.kode || ''}
                            onChange={handleEditInputChange('kode')}
                            disabled={isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-stok">Jumlah Stok</Label>
                          <Input
                            id="edit-stok"
                            type="number"
                            min="0"
                            value={editFormData.jumlah_stok || 0}
                            onChange={handleEditInputChange('jumlah_stok')}
                            disabled={isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-deskripsi">Deskripsi</Label>
                          <Textarea
                            id="edit-deskripsi"
                            value={editFormData.deskripsi || ''}
                            onChange={handleEditInputChange('deskripsi')}
                            disabled={isEditing}
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isEditing}>
                          {isEditing ? (
                            <span className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Menyimpan...
                            </span>
                          ) : (
                            '💾 Simpan Perubahan'
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        Hapus Barang
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Apakah Anda yakin ingin menghapus barang <strong>"{barang.nama}"</strong>?
                        Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait barang ini.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>
                        Batal
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(barang.id)}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isDeleting ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Menghapus...
                          </span>
                        ) : (
                          '🗑️ Hapus'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Jumlah Stok</p>
                <p className="text-2xl font-bold text-gray-900">
                  {barang.jumlah_stok.toLocaleString('id-ID')} unit
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Ditambahkan</p>
                <p className="text-sm text-gray-600">
                  {new Date(barang.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
            
            {barang.deskripsi && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Deskripsi</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {barang.deskripsi}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
