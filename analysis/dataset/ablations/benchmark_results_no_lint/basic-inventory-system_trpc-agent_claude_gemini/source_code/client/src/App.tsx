import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { ProductManagement } from '@/components/ProductManagement';
import { TransactionManagement } from '@/components/TransactionManagement';
import { DashboardOverview } from '@/components/DashboardOverview';
import type { Product, ProductWithStockSummary, Transaction } from '../../server/src/schema';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsWithSummary, setProductsWithSummary] = useState<ProductWithStockSummary[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load all data concurrently
      const [productsResult, summaryResult, transactionsResult] = await Promise.all([
        trpc.getProducts.query(),
        trpc.getProductsWithStockSummary.query(),
        trpc.getTransactions.query({ limit: 20 })
      ]);
      
      setProducts(productsResult);
      setProductsWithSummary(summaryResult);
      setTransactions(transactionsResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleProductCreated = (newProduct: Product) => {
    setProducts((prev: Product[]) => [...prev, newProduct]);
    loadData(); // Refresh all data to update summaries
  };

  const handleProductUpdated = (updatedProduct: Product) => {
    setProducts((prev: Product[]) => 
      prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    );
    loadData(); // Refresh all data to update summaries
  };

  const handleProductDeleted = (productId: number) => {
    setProducts((prev: Product[]) => prev.filter(p => p.id !== productId));
    setProductsWithSummary((prev: ProductWithStockSummary[]) => 
      prev.filter(p => p.id !== productId)
    );
    setTransactions((prev: Transaction[]) => 
      prev.filter(t => t.product_id !== productId)
    );
  };

  const handleTransactionCreated = (newTransaction: Transaction) => {
    setTransactions((prev: Transaction[]) => [newTransaction, ...prev]);
    loadData(); // Refresh all data to update stock levels and summaries
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                📦 Inventory Management System
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your products and track stock transactions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {products.length} Products
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {transactions.length} Transactions
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading && (
          <div className="mb-6">
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600">Loading inventory data...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <span>📊</span>
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center space-x-2">
              <span>📦</span>
              <span>Products</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center space-x-2">
              <span>📝</span>
              <span>Transactions</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardOverview 
              products={products}
              productsWithSummary={productsWithSummary}
              transactions={transactions}
            />
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement
              products={products}
              onProductCreated={handleProductCreated}
              onProductUpdated={handleProductUpdated}
              onProductDeleted={handleProductDeleted}
            />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionManagement
              products={products}
              transactions={transactions}
              onTransactionCreated={handleTransactionCreated}
            />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-600">
            <p>Inventory Management System - Built with React & tRPC</p>
            {products.length === 0 && transactions.length === 0 && (
              <p className="text-sm text-amber-600 mt-2">
                ⚠️ Note: Backend uses stub data. Create products and transactions to see the system in action.
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
