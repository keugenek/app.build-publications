import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState } from 'react';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import type { Barang, CreateBarangInput, UpdateBarangInput } from '../../../server/src/schema';

interface DaftarBarangProps {
  barang: Barang[];
  onCreateBarang: (data: CreateBarangInput) => Promise<void>;
  onUpdateBarang: (data: UpdateBarangInput) => Promise<void>;
  onDeleteBarang: (id: number) => Promise<void>;
  isLoading: boolean;
}

export function DaftarBarang({ barang, onCreateBarang, onUpdateBarang, onDeleteBarang, isLoading }: DaftarBarangProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBarang, setEditingBarang] = useState<Barang | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<CreateBarangInput>({
    nama_barang: '',
    kode_sku: '',
    jumlah_stok: 0
  });

  const [editFormData, setEditFormData] = useState<Partial<UpdateBarangInput>>({
    nama_barang: '',
    kode_sku: '',
    jumlah_stok: 0
  });

  // Filter barang based on search term
  const filteredBarang = barang.filter((item: Barang) =>
    item.nama_barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.kode_sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onCreateBarang(formData);
      setFormData({
        nama_barang: '',
        kode_sku: '',
        jumlah_stok: 0
      });
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Error creating barang:', error);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBarang) return;
    
    try {
      await onUpdateBarang({
        id: editingBarang.id,
        ...editFormData
      } as UpdateBarangInput);
      setEditingBarang(null);
      setEditFormData({
        nama_barang: '',
        kode_sku: '',
        jumlah_stok: 0
      });
    } catch (error) {
      console.error('Error updating barang:', error);
    }
  };

  const handleEdit = (item: Barang) => {
    setEditingBarang(item);
    setEditFormData({
      nama_barang: item.nama_barang,
      kode_sku: item.kode_sku,
      jumlah_stok: item.jumlah_stok
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await onDeleteBarang(id);
    } catch (error) {
      console.error('Error deleting barang:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            📦 Daftar Barang
          </h3>
          <p className="text-gray-600">Kelola data barang inventaris</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Barang
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Barang Baru</DialogTitle>
              <DialogDescription>
                Masukkan informasi barang yang akan ditambahkan ke inventaris.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitCreate}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nama_barang">Nama Barang</Label>
                  <Input
                    id="nama_barang"
                    placeholder="Masukkan nama barang"
                    value={formData.nama_barang}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateBarangInput) => ({ ...prev, nama_barang: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="kode_sku">Kode SKU</Label>
                  <Input
                    id="kode_sku"
                    placeholder="Masukkan kode SKU unik"
                    value={formData.kode_sku}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateBarangInput) => ({ ...prev, kode_sku: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="jumlah_stok">Jumlah Stok Awal</Label>
                  <Input
                    id="jumlah_stok"
                    type="number"
                    placeholder="0"
                    value={formData.jumlah_stok}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateBarangInput) => ({ ...prev, jumlah_stok: parseInt(e.target.value) || 0 }))
                    }
                    min="0"
                    required
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="w-full max-w-md">
        <Input
          placeholder="🔍 Cari nama barang atau kode SKU..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="bg-white"
        />
      </div>

      {/* Barang List */}
      {filteredBarang.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            {searchTerm ? 'Barang tidak ditemukan' : 'Belum ada barang'}
          </h3>
          <p className="text-gray-500">
            {searchTerm
              ? 'Coba kata kunci pencarian lain'
              : 'Mulai dengan menambahkan barang pertama Anda'}
          </p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Barang</TableHead>
                <TableHead>Kode SKU</TableHead>
                <TableHead className="text-center">Stok</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBarang.map((item: Barang) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nama_barang}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {item.kode_sku}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {item.jumlah_stok}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={item.jumlah_stok > 0 ? 'default' : 'destructive'}
                      className={
                        item.jumlah_stok > 10
                          ? 'bg-green-100 text-green-800'
                          : item.jumlah_stok > 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {item.jumlah_stok > 10
                        ? 'Stok Aman'
                        : item.jumlah_stok > 0
                        ? 'Stok Rendah'
                        : 'Habis'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {item.created_at.toLocaleDateString('id-ID')}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Dialog
                        open={editingBarang?.id === item.id}
                        onOpenChange={(open) => !open && setEditingBarang(null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Barang</DialogTitle>
                            <DialogDescription>
                              Perbarui informasi barang.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleSubmitEdit}>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="edit_nama_barang">Nama Barang</Label>
                                <Input
                                  id="edit_nama_barang"
                                  placeholder="Masukkan nama barang"
                                  value={editFormData.nama_barang || ''}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setEditFormData(prev => ({ ...prev, nama_barang: e.target.value }))
                                  }
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit_kode_sku">Kode SKU</Label>
                                <Input
                                  id="edit_kode_sku"
                                  placeholder="Masukkan kode SKU unik"
                                  value={editFormData.kode_sku || ''}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setEditFormData(prev => ({ ...prev, kode_sku: e.target.value }))
                                  }
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit_jumlah_stok">Jumlah Stok</Label>
                                <Input
                                  id="edit_jumlah_stok"
                                  type="number"
                                  placeholder="0"
                                  value={editFormData.jumlah_stok || 0}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setEditFormData(prev => ({ ...prev, jumlah_stok: parseInt(e.target.value) || 0 }))
                                  }
                                  min="0"
                                  required
                                />
                              </div>
                            </div>
                            <DialogFooter className="mt-6">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingBarang(null)}
                              >
                                Batal
                              </Button>
                              <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Menyimpan...' : 'Simpan'}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Barang</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus barang "{item.nama_barang}"?
                              Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(item.id)}
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
        </Card>
      )}
    </div>
  );
}
