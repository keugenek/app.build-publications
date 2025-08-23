import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import type { Product, Supplier, Customer, Transaction, CreateTransactionInput } from '../../../server/src/schema';

interface TransactionManagementProps {
  type: 'IN' | 'OUT';
  title: string;
  buttonText: string;
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  setProducts: (products: Product[]) => void;
}

export function TransactionManagement({
  type,
  title,
  buttonText,
  products,
  suppliers,
  customers,
  transactions,
  setTransactions,
  setProducts
}: TransactionManagementProps) {
  const [transactionForm, setTransactionForm] = useState<Omit<CreateTransactionInput, 'type'> & { type: 'IN' | 'OUT' }>({
    product_id: 0,
    type,
    quantity: 1,
    reference: null,
    notes: null
  });
  
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);

  const handleCreateTransaction = async () => {
    try {
      const newTransaction = await trpc.createTransaction.mutate({
        ...transactionForm,
        type: transactionForm.type
      });
      
      if (newTransaction) {
        setTransactions([newTransaction, ...transactions]);
      }
      
      setTransactionForm({
        product_id: 0,
        type,
        quantity: 1,
        reference: null,
        notes: null
      });
      setIsTransactionDialogOpen(false);
      
      // Refresh products to update stock
      try {
        const updatedProducts = await trpc.getProducts.query();
        if (updatedProducts) {
          setProducts(updatedProducts);
        }
      } catch (error) {
        console.error('Gagal memperbarui daftar produk:', error);
      }
    } catch (error) {
      console.error('Gagal membuat transaksi:', error);
    }
  };

  const filteredTransactions = transactions.filter(t => t.type === type);
  
  const getReferenceName = (transaction: Transaction) => {
    if (type === 'IN') {
      const supplier = suppliers.find(s => s.id === parseInt(transaction.reference || '0'));
      return supplier ? supplier.name : (transaction.reference || '-');
    } else {
      const customer = customers.find(c => c.id === parseInt(transaction.reference || '0'));
      return customer ? customer.name : (transaction.reference || '-');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setTransactionForm({
                  product_id: 0,
                  type,
                  quantity: 1,
                  reference: null,
                  notes: null
                });
              }}>
                {buttonText}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{type === 'IN' ? 'Tambah Transaksi Barang Masuk' : 'Tambah Transaksi Barang Keluar'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="product_id" className="text-right">
                    Barang
                  </Label>
                  <Select 
                    value={transactionForm.product_id.toString() || ''} 
                    onValueChange={(value) => setTransactionForm({...transactionForm, product_id: parseInt(value)})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Pilih barang" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantity" className="text-right">
                    Jumlah
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={transactionForm.quantity}
                    onChange={(e) => setTransactionForm({...transactionForm, quantity: parseInt(e.target.value) || 1})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="reference" className="text-right">
                    {type === 'IN' ? 'Referensi (Supplier)' : 'Referensi (Pelanggan)'}
                  </Label>
                  <Select 
                    value={transactionForm.reference || ''} 
                    onValueChange={(value) => setTransactionForm({...transactionForm, reference: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={type === 'IN' ? 'Pilih supplier' : 'Pilih pelanggan'} />
                    </SelectTrigger>
                    <SelectContent>
                      {type === 'IN' 
                        ? suppliers.map(supplier => (
                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                              {supplier.name}
                            </SelectItem>
                          ))
                        : customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.name}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    Catatan
                  </Label>
                  <Input
                    id="notes"
                    value={transactionForm.notes || ''}
                    onChange={(e) => setTransactionForm({...transactionForm, notes: e.target.value || null})}
                    className="col-span-3"
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleCreateTransaction}>
                    Tambah Transaksi
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
              <TableHead>Tanggal</TableHead>
              <TableHead>Barang</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>{type === 'IN' ? 'Supplier' : 'Pelanggan'}</TableHead>
              <TableHead>Catatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => {
              const product = products.find(p => p.id === transaction.product_id);
              const referenceName = getReferenceName(transaction);
              return (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.created_at.toLocaleDateString('id-ID')}</TableCell>
                  <TableCell>{product?.name || 'Barang tidak ditemukan'}</TableCell>
                  <TableCell>{type === 'IN' ? '+' : '-'}{transaction.quantity}</TableCell>
                  <TableCell>{referenceName}</TableCell>
                  <TableCell>{transaction.notes || '-'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
