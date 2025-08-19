import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Barang, CreateBarangInput, UpdateBarangInput } from '../../../server/src/schema';

interface BarangManagementProps {
  barangList: Barang[];
  onBarangAdded: (barang: Barang) => void;
  onBarangUpdated: (barang: Barang) => void;
  onBarangDeleted: (id: number) => void;
  isLoading: boolean;
}

export function BarangManagement({ 
  barangList, 
  onBarangAdded, 
  onBarangUpdated, 
  onBarangDeleted
}: BarangManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBarang, setEditingBarang] = useState<Barang | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState<CreateBarangInput>({
    nama: '',
    kode_barang: '',
    deskripsi: null,
    harga: 0,
    stok: 0
  });

  // Filter barang based on search
  const filteredBarang = barangList.filter(barang =>
    barang.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    barang.kode_barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (barang.deskripsi && barang.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const resetForm = () => {
    setFormData({
      nama: '',
      kode_barang: '',
      deskripsi: null,
      harga: 0,
      stok: 0
    });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newBarang = await trpc.createBarang.mutate(formData);
      onBarangAdded(newBarang);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create barang:', error);
      alert('Gagal menambah barang. Periksa apakah kode barang sudah digunakan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBarang) return;
    
    setIsSubmitting(true);
    try {
      const updateData: UpdateBarangInput = {
        id: editingBarang.id,
        nama: formData.nama,
        kode_barang: formData.kode_barang,
        deskripsi: formData.deskripsi,
        harga: formData.harga,
        stok: formData.stok
      };
      
      const updatedBarang = await trpc.updateBarang.mutate(updateData);
      onBarangUpdated(updatedBarang);
      setIsEditDialogOpen(false);
      setEditingBarang(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update barang:', error);
      alert('Gagal memperbarui barang.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteBarang.mutate({ id });
      onBarangDeleted(id);
    } catch (error) {
      console.error('Failed to delete barang:', error);
      alert('Gagal menghapus barang.');
    }
  };

  const openEditDialog = (barang: Barang) => {
    setEditingBarang(barang);
    setFormData({
      nama: barang.nama,
      kode_barang: barang.kode_barang,
      deskripsi: barang.deskripsi,
      harga: barang.harga,
      stok: barang.stok
    });
    setIsEditDialogOpen(true);
  };

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
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Actions Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari nama, kode, atau deskripsi barang..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              Tambah Barang
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleAdd}>
              <DialogHeader>
                <DialogTitle>Tambah Barang Baru</DialogTitle>
                <DialogDescription>
                  Masukkan informasi barang yang ingin ditambahkan ke inventaris.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Barang *</Label>
                  <Input
                    id="nama"
                    value={formData.nama}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateBarangInput) => ({ ...prev, nama: e.target.value }))
                    }
                    placeholder="Masukkan nama barang"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="kode_barang">Kode Barang *</Label>
                  <Input
                    id="kode_barang"
                    value={formData.kode_barang}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateBarangInput) => ({ ...prev, kode_barang: e.target.value }))
                    }
                    placeholder="Masukkan kode unik"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deskripsi">Deskripsi</Label>
                  <Textarea
                    id="deskripsi"
                    value={formData.deskripsi || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateBarangInput) => ({ 
                        ...prev, 
                        deskripsi: e.target.value || null 
                      }))
                    }
                    placeholder="Deskripsi barang (opsional)"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="harga">Harga *</Label>
                    <Input
                      id="harga"
                      type="number"
                      value={formData.harga}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateBarangInput) => ({ 
                          ...prev, 
                          harga: parseFloat(e.target.value) || 0 
                        }))
                      }
                      placeholder="0"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stok">Stok Awal</Label>
                    <Input
                      id="stok"
                      type="number"
                      value={formData.stok}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateBarangInput) => ({ 
                          ...prev, 
                          stok: parseInt(e.target.value) || 0 
                        }))
                      }
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                  }}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Barang Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Daftar Barang ({filteredBarang.length} dari {barangList.length})
          </CardTitle>
          {searchTerm && (
            <CardDescription>
              Hasil pencarian untuk: "{searchTerm}"
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {filteredBarang.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📦</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Barang tidak ditemukan' : 'Belum ada barang'}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? 'Coba kata kunci lain atau tambah barang baru'
                  : 'Mulai dengan menambahkan barang pertama Anda'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barang</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                  <TableHead className="text-right">Stok</TableHead>
                  <TableHead className="text-right">Nilai</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBarang.map((barang: Barang) => (
                  <TableRow key={barang.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{barang.nama}</div>
                        {barang.deskripsi && (
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {barang.deskripsi}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {barang.kode_barang}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(barang.harga)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant={barang.stok <= 5 ? 'destructive' : 'secondary'}
                        className={barang.stok <= 5 ? 'bg-red-100 text-red-700' : ''}
                      >
                        {barang.stok}
                        {barang.stok <= 5 && ' ⚠️'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(barang.harga * barang.stok)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(barang.created_at)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(barang)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Barang</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus "{barang.nama}"? 
                                Tindakan ini tidak dapat dibatalkan dan akan menghapus 
                                semua transaksi terkait barang ini.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(barang.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit Barang</DialogTitle>
              <DialogDescription>
                Perbarui informasi barang "{editingBarang?.nama}".
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nama">Nama Barang *</Label>
                <Input
                  id="edit-nama"
                  value={formData.nama}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateBarangInput) => ({ ...prev, nama: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-kode">Kode Barang *</Label>
                <Input
                  id="edit-kode"
                  value={formData.kode_barang}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateBarangInput) => ({ ...prev, kode_barang: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-deskripsi">Deskripsi</Label>
                <Textarea
                  id="edit-deskripsi"
                  value={formData.deskripsi || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateBarangInput) => ({ 
                      ...prev, 
                      deskripsi: e.target.value || null 
                    }))
                  }
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-harga">Harga *</Label>
                  <Input
                    id="edit-harga"
                    type="number"
                    value={formData.harga}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateBarangInput) => ({ 
                        ...prev, 
                        harga: parseFloat(e.target.value) || 0 
                      }))
                    }
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-stok">Stok</Label>
                  <Input
                    id="edit-stok"
                    type="number"
                    value={formData.stok}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateBarangInput) => ({ 
                        ...prev, 
                        stok: parseInt(e.target.value) || 0 
                      }))
                    }
                    min="0"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingBarang(null);
                  resetForm();
                }}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
