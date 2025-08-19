import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, AlertTriangle, Search } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { trpc } from '@/utils/trpc';
import type { Barang, TransaksiWithBarang, CreateTransaksiMasukInput, CreateTransaksiKeluarInput, JenisTransaksi } from '../../../server/src/schema';

interface TransaksiManagementProps {
  jenis: JenisTransaksi;
  barangList: Barang[];
  transaksiList: TransaksiWithBarang[];
  onTransaksiAdded: (transaksi: TransaksiWithBarang) => void;
  isLoading: boolean;
}

export function TransaksiManagement({ 
  jenis,
  barangList, 
  transaksiList, 
  onTransaksiAdded
}: TransaksiManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    tanggal: new Date(),
    barang_id: '',
    jumlah: 1,
    keterangan: null as string | null
  });

  // Get selected barang for stock validation
  const selectedBarang = barangList.find(b => b.id === parseInt(formData.barang_id));

  // Filter transactions based on search
  const filteredTransaksi = transaksiList.filter(transaksi =>
    transaksi.barang.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaksi.barang.kode_barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (transaksi.keterangan && transaksi.keterangan.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const resetForm = () => {
    setFormData({
      tanggal: new Date(),
      barang_id: '',
      jumlah: 1,
      keterangan: null
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.barang_id) return;
    
    // Validate stock for outgoing transactions
    if (jenis === 'KELUAR' && selectedBarang && formData.jumlah > selectedBarang.stok) {
      alert(`Stok tidak mencukupi. Stok tersedia: ${selectedBarang.stok}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const transactionData = {
        tanggal: formData.tanggal,
        barang_id: parseInt(formData.barang_id),
        jumlah: formData.jumlah,
        keterangan: formData.keterangan
      };

      let newTransaksi: TransaksiWithBarang;
      
      if (jenis === 'MASUK') {
        const result = await trpc.createTransaksiMasuk.mutate(transactionData as CreateTransaksiMasukInput);
        newTransaksi = result;
      } else {
        const result = await trpc.createTransaksiKeluar.mutate(transactionData as CreateTransaksiKeluarInput);
        newTransaksi = result;
      }
      
      onTransaksiAdded(newTransaksi);
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error(`Failed to create transaksi ${jenis.toLowerCase()}:`, error);
      alert(`Gagal mencatat transaksi ${jenis.toLowerCase()}.`);
    } finally {
      setIsSubmitting(false);
    }
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTitle = () => {
    return jenis === 'MASUK' ? 'Barang Masuk' : 'Barang Keluar';
  };

  const getEmoji = () => {
    return jenis === 'MASUK' ? '⬇️' : '⬆️';
  };

  const getButtonColor = () => {
    return jenis === 'MASUK' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';
  };

  const getBadgeColor = () => {
    return jenis === 'MASUK' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-6">
      {/* Actions Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder={`Cari transaksi ${jenis.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className={`flex items-center gap-2 ${getButtonColor()}`}>
              <Plus className="h-4 w-4" />
              Catat {getTitle()}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getEmoji()} Catat {getTitle()}
                </DialogTitle>
                <DialogDescription>
                  Masukkan detail transaksi {jenis.toLowerCase()} barang.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                {/* Date Picker */}
                <div className="space-y-2">
                  <Label>Tanggal Transaksi *</Label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.tanggal, 'PPP', { locale: idLocale })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.tanggal}
                        onSelect={(date: Date | undefined) => {
                          if (date) {
                            setFormData(prev => ({ ...prev, tanggal: date }));
                            setIsCalendarOpen(false);
                          }
                        }}
                        locale={idLocale}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Barang Selection */}
                <div className="space-y-2">
                  <Label htmlFor="barang">Pilih Barang *</Label>
                  <Select 
                    value={formData.barang_id || undefined} 
                    onValueChange={(value: string) => 
                      setFormData(prev => ({ ...prev, barang_id: value, jumlah: 1 }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih barang..." />
                    </SelectTrigger>
                    <SelectContent>
                      {barangList.map((barang: Barang) => (
                        <SelectItem key={barang.id} value={barang.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{barang.nama}</span>
                            <span className="text-sm text-gray-500">
                              {barang.kode_barang} • Stok: {barang.stok} • {formatCurrency(barang.harga)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Stock Warning for KELUAR transactions */}
                {jenis === 'KELUAR' && selectedBarang && (
                  <Alert className={selectedBarang.stok <= 5 ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Stok tersedia: <strong>{selectedBarang.stok} unit</strong>
                      {selectedBarang.stok <= 5 && (
                        <span className="text-red-600 font-medium"> (Stok Rendah!)</span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Jumlah */}
                <div className="space-y-2">
                  <Label htmlFor="jumlah">Jumlah *</Label>
                  <Input
                    id="jumlah"
                    type="number"
                    value={formData.jumlah}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData(prev => ({ 
                        ...prev, 
                        jumlah: parseInt(e.target.value) || 1 
                      }))
                    }
                    placeholder="Masukkan jumlah"
                    min="1"
                    max={jenis === 'KELUAR' && selectedBarang ? selectedBarang.stok : undefined}
                    required
                  />
                  {jenis === 'KELUAR' && selectedBarang && formData.jumlah > selectedBarang.stok && (
                    <p className="text-sm text-red-600">
                      Jumlah melebihi stok yang tersedia ({selectedBarang.stok})
                    </p>
                  )}
                </div>
                
                {/* Keterangan */}
                <div className="space-y-2">
                  <Label htmlFor="keterangan">Keterangan</Label>
                  <Textarea
                    id="keterangan"
                    value={formData.keterangan || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData(prev => ({ 
                        ...prev, 
                        keterangan: e.target.value || null 
                      }))
                    }
                    placeholder="Tambahkan keterangan (opsional)"
                    rows={3}
                  />
                </div>

                {/* Transaction Summary */}
                {selectedBarang && (
                  <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <h4 className="text-sm font-medium">Ringkasan Transaksi:</h4>
                    <div className="text-sm space-y-1">
                      <div>Barang: <span className="font-medium">{selectedBarang.nama}</span></div>
                      <div>Jumlah: <span className="font-medium">{formData.jumlah} unit</span></div>
                      <div>Nilai: <span className="font-medium">{formatCurrency(selectedBarang.harga * formData.jumlah)}</span></div>
                      {jenis === 'KELUAR' && (
                        <div>Stok setelah transaksi: <span className="font-medium">{selectedBarang.stok - formData.jumlah} unit</span></div>
                      )}
                      {jenis === 'MASUK' && (
                        <div>Stok setelah transaksi: <span className="font-medium">{selectedBarang.stok + formData.jumlah} unit</span></div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={
                    isSubmitting || 
                    !formData.barang_id || 
                    (jenis === 'KELUAR' && selectedBarang && formData.jumlah > selectedBarang.stok)
                  }
                  className={getButtonColor()}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Catat Transaksi'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getEmoji()} Riwayat {getTitle()} ({filteredTransaksi.length} dari {transaksiList.length})
          </CardTitle>
          {searchTerm && (
            <CardDescription>
              Hasil pencarian untuk: "{searchTerm}"
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {filteredTransaksi.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">{getEmoji()}</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm 
                  ? `Transaksi ${jenis.toLowerCase()} tidak ditemukan`
                  : `Belum ada transaksi ${jenis.toLowerCase()}`
                }
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? 'Coba kata kunci lain atau catat transaksi baru'
                  : `Mulai dengan mencatat transaksi ${jenis.toLowerCase()} pertama Anda`
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Barang</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Nilai</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Dicatat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransaksi.map((transaksi: TransaksiWithBarang) => (
                  <TableRow key={transaksi.id}>
                    <TableCell className="font-medium">
                      {format(transaksi.tanggal, 'dd MMM yyyy', { locale: idLocale })}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{transaksi.barang.nama}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            {transaksi.barang.kode_barang}
                          </Badge>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getBadgeColor()}`}
                          >
                            {getEmoji()} {transaksi.jenis}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">{transaksi.jumlah} unit</span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(transaksi.barang.harga * transaksi.jumlah)}
                    </TableCell>
                    <TableCell>
                      {transaksi.keterangan ? (
                        <div className="text-sm text-gray-600 max-w-xs truncate" title={transaksi.keterangan}>
                          {transaksi.keterangan}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm italic">Tidak ada keterangan</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(transaksi.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
