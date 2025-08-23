import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Product, Supplier, Customer, Transaction } from '../../../server/src/schema';

interface TransactionHistoryProps {
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  transactions: Transaction[];
}

export function TransactionHistory({
  products,
  suppliers,
  customers,
  transactions
}: TransactionHistoryProps) {
  const getReferenceName = (transaction: Transaction) => {
    if (transaction.type === 'IN') {
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
        <CardTitle>Riwayat Transaksi</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Barang</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Referensi</TableHead>
              <TableHead>Catatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              const product = products.find(p => p.id === transaction.product_id);
              const referenceName = getReferenceName(transaction);
              
              return (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.created_at.toLocaleDateString('id-ID')}</TableCell>
                  <TableCell>{product?.name || 'Barang tidak ditemukan'}</TableCell>
                  <TableCell>
                    <span className={transaction.type === 'IN' ? 'text-green-600' : 'text-red-600'}>
                      {transaction.type === 'IN' ? 'Masuk' : 'Keluar'}
                    </span>
                  </TableCell>
                  <TableCell>{transaction.quantity}</TableCell>
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
