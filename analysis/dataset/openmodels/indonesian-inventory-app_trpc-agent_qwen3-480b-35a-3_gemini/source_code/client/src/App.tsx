import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductManagement } from '@/components/ProductManagement';
import { TransactionManagement } from '@/components/TransactionManagement';
import { TransactionHistory } from '@/components/TransactionHistory';
import { trpc } from '@/utils/trpc';
import type { Product, Supplier, Customer, Transaction } from '../../server/src/schema';

export default function InventoryApp() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Load data
  const loadData = useCallback(async () => {
    try {
      const [productsData, suppliersData, customersData, transactionsData] = await Promise.all([
        trpc.getProducts.query(),
        trpc.getSuppliers.query(),
        trpc.getCustomers.query(),
        trpc.getTransactions.query()
      ]);
      
      setProducts(productsData);
      setSuppliers(suppliersData);
      setCustomers(customersData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Gagal memuat data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Sistem Manajemen Inventaris</h1>
      
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products">Daftar Barang</TabsTrigger>
          <TabsTrigger value="transactions-in">Barang Masuk</TabsTrigger>
          <TabsTrigger value="transactions-out">Barang Keluar</TabsTrigger>
          <TabsTrigger value="history">Riwayat Transaksi</TabsTrigger>
        </TabsList>
        
        {/* Products Tab */}
        <TabsContent value="products">
          <ProductManagement 
            products={products} 
            setProducts={setProducts} 
            loadData={loadData} 
          />
        </TabsContent>
        
        {/* Incoming Transactions Tab */}
        <TabsContent value="transactions-in">
          <TransactionManagement
            type="IN"
            title="Transaksi Barang Masuk"
            buttonText="Tambah Transaksi Masuk"
            products={products}
            suppliers={suppliers}
            customers={customers}
            transactions={transactions}
            setTransactions={setTransactions}
            setProducts={setProducts}
          />
        </TabsContent>
        
        {/* Outgoing Transactions Tab */}
        <TabsContent value="transactions-out">
          <TransactionManagement
            type="OUT"
            title="Transaksi Barang Keluar"
            buttonText="Tambah Transaksi Keluar"
            products={products}
            suppliers={suppliers}
            customers={customers}
            transactions={transactions}
            setTransactions={setTransactions}
            setProducts={setProducts}
          />
        </TabsContent>
        
        {/* Transaction History Tab */}
        <TabsContent value="history">
          <TransactionHistory
            products={products}
            suppliers={suppliers}
            customers={customers}
            transactions={transactions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
