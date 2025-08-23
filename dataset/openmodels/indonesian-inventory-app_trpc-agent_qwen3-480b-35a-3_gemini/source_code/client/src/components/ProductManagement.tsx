import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import type { Product, CreateProductInput } from '../../../server/src/schema';

interface ProductManagementProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
  loadData: () => Promise<void>;
}

export function ProductManagement({ products, setProducts }: ProductManagementProps) {
  // Form states
  const [productForm, setProductForm] = useState<CreateProductInput>({
    code: '',
    name: '',
    description: null,
    purchase_price: 0,
    selling_price: 0,
    stock_quantity: 0
  });
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);

  // Product management
  const handleCreateProduct = async () => {
    try {
      const newProduct = await trpc.createProduct.mutate(productForm);
      if (newProduct) {
        setProducts([...products, newProduct]);
      }
      resetProductForm();
      setIsProductDialogOpen(false);
    } catch (error) {
      console.error('Gagal membuat produk:', error);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    
    try {
      const updatedProduct = await trpc.updateProduct.mutate({
        id: editingProduct.id,
        ...productForm
      });
      
      if (updatedProduct) {
        setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        setEditingProduct(null);
        resetProductForm();
        setIsProductDialogOpen(false);
      }
    } catch (error) {
      console.error('Gagal memperbarui produk:', error);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      await trpc.deleteProduct.mutate({ id });
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error('Gagal menghapus produk:', error);
    }
  };

  const resetProductForm = () => {
    setProductForm({
      code: '',
      name: '',
      description: null,
      purchase_price: 0,
      selling_price: 0,
      stock_quantity: 0
    });
  };

  const openEditProduct = (product: Product) => {
    setProductForm({
      code: product.code,
      name: product.name,
      description: product.description,
      purchase_price: product.purchase_price,
      selling_price: product.selling_price,
      stock_quantity: product.stock_quantity
    });
    setEditingProduct(product);
    setIsProductDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Daftar Barang</CardTitle>
          <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                resetProductForm();
                setEditingProduct(null);
              }}>
                Tambah Barang
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Edit Barang' : 'Tambah Barang Baru'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="code" className="text-right">
                    Kode Barang
                  </Label>
                  <Input
                    id="code"
                    value={productForm.code}
                    onChange={(e) => setProductForm({...productForm, code: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nama Barang
                  </Label>
                  <Input
                    id="name"
                    value={productForm.name}
                    onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Deskripsi
                  </Label>
                  <Input
                    id="description"
                    value={productForm.description || ''}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value || null})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="purchase_price" className="text-right">
                    Harga Beli
                  </Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    value={productForm.purchase_price}
                    onChange={(e) => setProductForm({...productForm, purchase_price: parseFloat(e.target.value) || 0})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="selling_price" className="text-right">
                    Harga Jual
                  </Label>
                  <Input
                    id="selling_price"
                    type="number"
                    value={productForm.selling_price}
                    onChange={(e) => setProductForm({...productForm, selling_price: parseFloat(e.target.value) || 0})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stock_quantity" className="text-right">
                    Stok Awal
                  </Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={productForm.stock_quantity}
                    onChange={(e) => setProductForm({...productForm, stock_quantity: parseInt(e.target.value) || 0})}
                    className="col-span-3"
                  />
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={editingProduct ? handleUpdateProduct : handleCreateProduct}
                  >
                    {editingProduct ? 'Simpan Perubahan' : 'Tambah Barang'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama Barang</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Harga Beli</TableHead>
              <TableHead>Harga Jual</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.code}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.description || '-'}</TableCell>
                <TableCell>{product.purchase_price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</TableCell>
                <TableCell>{product.selling_price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</TableCell>
                <TableCell>{product.stock_quantity}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEditProduct(product)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                      Hapus
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
