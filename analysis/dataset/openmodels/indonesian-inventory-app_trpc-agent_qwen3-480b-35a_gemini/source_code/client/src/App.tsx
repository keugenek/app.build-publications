import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarIcon, PlusIcon, PencilIcon, TrashIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types from server schema
import type { Product, CreateProductInput, Transaction, CreateTransactionInput } from '../../server/src/schema';
import { trpc } from '@/utils/trpc';

function App() {
  // Product states
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductLoading, setIsProductLoading] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<CreateProductInput>({
    name: '',
    stock_quantity: 0
  });
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  
  // Transaction states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [transactionForm, setTransactionForm] = useState<CreateTransactionInput>({
    product_id: 0,
    type: 'masuk',
    quantity: 1,
    transaction_date: new Date()
  });
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Load data with error handling
  const loadProducts = useCallback(async () => {
    setIsProductLoading(true);
    setProductError(null);
    try {
      const result = await trpc.getProducts.query();
      setProducts(result);
    } catch (error) {
      console.error('Gagal memuat produk:', error);
      setProductError('Gagal memuat data produk. Silakan coba lagi.');
    } finally {
      setIsProductLoading(false);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    setIsTransactionLoading(true);
    setTransactionError(null);
    try {
      const result = await trpc.getTransactions.query();
      setTransactions(result);
    } catch (error) {
      console.error('Gagal memuat transaksi:', error);
      setTransactionError('Gagal memuat data transaksi. Silakan coba lagi.');
    } finally {
      setIsTransactionLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadTransactions();
  }, [loadProducts, loadTransactions]);

  // Product handlers
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProductLoading(true);
    setProductError(null);
    try {
      const newProduct = await trpc.createProduct.mutate(productForm);
      setProducts([...products, newProduct]);
      setProductForm({ name: '', stock_quantity: 0 });
    } catch (error) {
      console.error('Gagal membuat produk:', error);
      setProductError('Gagal membuat produk. Silakan coba lagi.');
    } finally {
      setIsProductLoading(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProductId) return;
    
    setIsProductLoading(true);
    setProductError(null);
    try {
      const updatedProduct = await trpc.updateProduct.mutate({
        id: editingProductId,
        name: productForm.name,
        stock_quantity: productForm.stock_quantity
      });
      
      setProducts(products.map(p => 
        p.id === editingProductId ? updatedProduct : p
      ));
      
      setProductForm({ name: '', stock_quantity: 0 });
      setEditingProductId(null);
    } catch (error) {
      console.error('Gagal memperbarui produk:', error);
      setProductError('Gagal memperbarui produk. Silakan coba lagi.');
    } finally {
      setIsProductLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      await trpc.deleteProduct.mutate({ id });
      setProducts(products.filter(product => product.id !== id));
    } catch (error) {
      console.error('Gagal menghapus produk:', error);
      setProductError('Gagal menghapus produk. Silakan coba lagi.');
    }
  };

  const startEditProduct = (product: Product) => {
    setProductForm({
      name: product.name,
      stock_quantity: product.stock_quantity
    });
    setEditingProductId(product.id);
  };

  const cancelEditProduct = () => {
    setProductForm({ name: '', stock_quantity: 0 });
    setEditingProductId(null);
  };

  // Transaction handlers
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTransactionLoading(true);
    setTransactionError(null);
    try {
      const newTransaction = await trpc.createTransaction.mutate(transactionForm);
      setTransactions([newTransaction, ...transactions]);
      setTransactionForm({
        product_id: 0,
        type: 'masuk',
        quantity: 1,
        transaction_date: new Date()
      });
      setIsTransactionDialogOpen(false);
      setDate(undefined);
      
      // Refresh products to show updated stock
      loadProducts();
    } catch (error) {
      console.error('Gagal membuat transaksi:', error);
      setTransactionError('Gagal membuat transaksi. Silakan coba lagi.');
    } finally {
      setIsTransactionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Aplikasi Manajemen Inventaris
          </h1>
          <p className="text-gray-600">
            Kelola barang dan catat transaksi masuk/keluar dengan mudah
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Management Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>Daftar Barang</span>
                  <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="ml-auto">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Tambah Transaksi
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Tambah Transaksi Baru</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateTransaction} className="space-y-4">
                        {transactionError && (
                          <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            {transactionError}
                          </div>
                        )}
                        
                        <div>
                          <Label htmlFor="product">Barang</Label>
                          <Select
                            value={transactionForm.product_id.toString()}
                            onValueChange={(value) => 
                              setTransactionForm({...transactionForm, product_id: parseInt(value)})
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih barang" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id.toString()}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="type">Jenis Transaksi</Label>
                          <Select
                            value={transactionForm.type}
                            onValueChange={(value) => 
                              setTransactionForm({...transactionForm, type: value as 'masuk' | 'keluar'})
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih jenis transaksi" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="masuk">Barang Masuk</SelectItem>
                              <SelectItem value="keluar">Barang Keluar</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="quantity">Jumlah</Label>
                          <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={transactionForm.quantity}
                            onChange={(e) => 
                              setTransactionForm({...transactionForm, quantity: parseInt(e.target.value) || 1})
                            }
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="date">Tanggal Transaksi</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !date && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP", { locale: id }) : "Pilih tanggal"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(newDate) => {
                                  setDate(newDate);
                                  if (newDate) {
                                    setTransactionForm({...transactionForm, transaction_date: newDate});
                                  }
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <Button type="submit" disabled={isTransactionLoading} className="w-full">
                          {isTransactionLoading ? 'Menyimpan...' : 'Simpan Transaksi'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form 
                  onSubmit={editingProductId ? handleUpdateProduct : handleCreateProduct} 
                  className="space-y-4 mb-6"
                >
                  {productError && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      {productError}
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="product-name">Nama Barang</Label>
                    <Input
                      id="product-name"
                      value={productForm.name}
                      onChange={(e) => 
                        setProductForm({...productForm, name: e.target.value})
                      }
                      placeholder="Masukkan nama barang"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="stock-quantity">Jumlah Stok</Label>
                    <Input
                      id="stock-quantity"
                      type="number"
                      min="0"
                      value={productForm.stock_quantity}
                      onChange={(e) => 
                        setProductForm({...productForm, stock_quantity: parseInt(e.target.value) || 0})
                      }
                      placeholder="Masukkan jumlah stok"
                      required
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isProductLoading} className="flex-1">
                      {isProductLoading 
                        ? (editingProductId ? 'Memperbarui...' : 'Menyimpan...') 
                        : (editingProductId ? 'Perbarui Barang' : 'Tambah Barang')}
                    </Button>
                    
                    {editingProductId && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={cancelEditProduct}
                      >
                        Batal
                      </Button>
                    )}
                  </div>
                </form>
                
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Barang</TableHead>
                        <TableHead className="text-right">Stok</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isProductLoading ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                              <span className="ml-2">Memuat data produk...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : products.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                            Belum ada barang. Tambahkan barang baru!
                          </TableCell>
                        </TableRow>
                      ) : (
                        products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="text-right">{product.stock_quantity}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditProduct(product)}
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive">
                                      <TrashIcon className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Apakah Anda yakin ingin menghapus barang "{product.name}"? 
                                        Tindakan ini tidak dapat dibatalkan.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Batal</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteProduct(product.id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                      >
                                        Hapus
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Transaction History Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Transaksi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Barang</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead className="text-right">Tanggal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isTransactionLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                              <span className="ml-2">Memuat data transaksi...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                            Belum ada transaksi. Tambahkan transaksi baru!
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((transaction) => {
                          const product = products.find(p => p.id === transaction.product_id);
                          return (
                            <TableRow key={transaction.id}>
                              <TableCell>
                                {product ? product.name : 'Barang tidak ditemukan'}
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  transaction.type === 'masuk' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {transaction.type === 'masuk' ? 'Masuk' : 'Keluar'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {transaction.quantity}
                              </TableCell>
                              <TableCell className="text-right text-sm text-gray-500">
                                {format(new Date(transaction.transaction_date), 'dd MMM yyyy', { locale: id })}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Aplikasi Manajemen Inventaris</p>
        </footer>
      </div>
    </div>
  );
}

export default App;