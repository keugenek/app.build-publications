import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import type { Barang, CreateBarangInput, UpdateBarangInput } from '../../../server/src/schema';

export function BarangManagement() {
  const [barangs, setBarangs] = useState<Barang[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBarang, setEditingBarang] = useState<Barang | null>(null);

  // Form state untuk create
  const [createFormData, setCreateFormData] = useState<CreateBarangInput>({
    nama_barang: '',
    kode_barang: '',
    deskripsi: null,
    harga_beli: null,
    harga_jual: null
  });

  // Form state untuk edit
  const [editFormData, setEditFormData] = useState<Partial<UpdateBarangInput>>({
    nama_barang: '',
    kode_barang: '',
    deskripsi: null,
    harga_beli: null,
    harga_jual: null
  });

  const loadBarangs = useCallback(async () => {
    try {
      const result = await trpc.getBarang.query();
      setBarangs(result);
    } catch (error) {
      console.error('Gagal memuat daftar barang:', error);
    }
  }, []);

  useEffect(() => {
    loadBarangs();
  }, [loadBarangs]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createBarang.mutate(createFormData);
      setBarangs((prev: Barang[]) => [...prev, response]);
      setCreateFormData({
        nama_barang: '',
        kode_barang: '',
        deskripsi: null,
        harga_beli: null,
        harga_jual: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Gagal membuat barang:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBarang) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateBarangInput = {
        id: editingBarang.id,
        ...editFormData
      };
      const response = await trpc.updateBarang.mutate(updateData);
      setBarangs((prev: Barang[]) => 
        prev.map((barang: Barang) => 
          barang.id === editingBarang.id ? response : barang
        )
      );
      setIsEditDialogOpen(false);
      setEditingBarang(null);
    } catch (error) {
      console.error('Gagal mengupdate barang:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteBarang.mutate({ id });
      setBarangs((prev: Barang[]) => prev.filter((barang: Barang) => barang.id !== id));
    } catch (error) {
      console.error('Gagal menghapus barang:', error);
    }
  };

  const openEditDialog = (barang: Barang) => {
    setEditingBarang(barang);
    setEditFormData({
      nama_barang: barang.nama_barang,
      kode_barang: barang.kode_barang,
      deskripsi: barang.deskripsi,
      harga_beli: barang.harga_beli,
      harga_jual: barang.harga_jual
    });
    setIsEditDialogOpen(true);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">📋 Kelola Barang</h2>
          <p className="text-gray-600">Tambah, edit, atau hapus barang dari inventaris</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              ➕ Tambah Barang
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>➕ Tambah Barang Baru</DialogTitle>
              <DialogDescription>
                Isi informasi barang yang akan ditambahkan ke inventaris.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama_barang">Nama Barang *</Label>
                <Input
                  id="nama_barang"
                  placeholder="Masukkan nama barang"
                  value={createFormData.nama_barang}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateBarangInput) => ({ ...prev, nama_barang: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="kode_barang">Kode Barang *</Label>
                <Input
                  id="kode_barang"
                  placeholder="Masukkan kode barang unik"
                  value={createFormData.kode_barang}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateBarangInput) => ({ ...prev, kode_barang: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deskripsi">Deskripsi</Label>
                <Textarea
                  id="deskripsi"
                  placeholder="Deskripsi barang (opsional)"
                  value={createFormData.deskripsi || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCreateFormData((prev: CreateBarangInput) => ({
                      ...prev,
                      deskripsi: e.target.value || null
                    }))
                  }
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="harga_beli">Harga Beli</Label>
                  <Input
                    id="harga_beli"
                    type="number"
                    placeholder="0"
                    value={createFormData.harga_beli || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateBarangInput) => ({
                        ...prev,
                        harga_beli: e.target.value ? parseFloat(e.target.value) : null
                      }))
                    }
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="harga_jual">Harga Jual</Label>
                  <Input
                    id="harga_jual"
                    type="number"
                    placeholder="0"
                    value={createFormData.harga_jual || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateBarangInput) => ({
                        ...prev,
                        harga_jual: e.target.value ? parseFloat(e.target.value) : null
                      }))
                    }
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Menyimpan...' : 'Simpan Barang'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>✏️ Edit Barang</DialogTitle>
            <DialogDescription>
              Update informasi barang {editingBarang?.nama_barang}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_nama_barang">Nama Barang</Label>
              <Input
                id="edit_nama_barang"
                placeholder="Masukkan nama barang"
                value={editFormData.nama_barang || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev) => ({ ...prev, nama_barang: e.target.value }))
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_kode_barang">Kode Barang</Label>
              <Input
                id="edit_kode_barang"
                placeholder="Masukkan kode barang unik"
                value={editFormData.kode_barang || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev) => ({ ...prev, kode_barang: e.target.value }))
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_deskripsi">Deskripsi</Label>
              <Textarea
                id="edit_deskripsi"
                placeholder="Deskripsi barang (opsional)"
                value={editFormData.deskripsi || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    deskripsi: e.target.value || null
                  }))
                }
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_harga_beli">Harga Beli</Label>
                <Input
                  id="edit_harga_beli"
                  type="number"
                  placeholder="0"
                  value={editFormData.harga_beli || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      harga_beli: e.target.value ? parseFloat(e.target.value) : null
                    }))
                  }
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_harga_jual">Harga Jual</Label>
                <Input
                  id="edit_harga_jual"
                  type="number"
                  placeholder="0"
                  value={editFormData.harga_jual || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      harga_jual: e.target.value ? parseFloat(e.target.value) : null
                    }))
                  }
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Menyimpan...' : 'Update Barang'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Daftar Barang */}
      <Card>
        <CardHeader>
          <CardTitle>📦 Daftar Barang</CardTitle>
          <CardDescription>
            Total: {barangs.length} barang
          </CardDescription>
        </CardHeader>
        <CardContent>
          {barangs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg mb-2">📭 Belum ada barang</p>
              <p>Klik "Tambah Barang" untuk menambahkan barang pertama Anda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Barang</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead>Harga Beli</TableHead>
                    <TableHead>Harga Jual</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {barangs.map((barang: Barang) => (
                    <TableRow key={barang.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {barang.kode_barang}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{barang.nama_barang}</div>
                          {barang.deskripsi && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {barang.deskripsi}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={barang.jumlah_stok > 10 ? "default" : 
                                  barang.jumlah_stok > 0 ? "secondary" : "destructive"}
                        >
                          {barang.jumlah_stok} unit
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(barang.harga_beli)}</TableCell>
                      <TableCell>{formatCurrency(barang.harga_jual)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(barang)}
                          >
                            ✏️ Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                🗑️ Hapus
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Barang</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus barang "{barang.nama_barang}"? 
                                  Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(barang.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Ya, Hapus
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
