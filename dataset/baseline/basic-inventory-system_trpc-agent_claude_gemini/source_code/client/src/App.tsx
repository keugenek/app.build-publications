import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { ProductManagement } from '@/components/ProductManagement';
import { TransactionManagement } from '@/components/TransactionManagement';
import { DashboardOverview } from '@/components/DashboardOverview';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Product, StockTransaction } from '../../server/src/schema';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [productsData, transactionsData] = await Promise.all([
        trpc.getProducts.query(),
        trpc.getStockTransactions.query()
      ]);
      setProducts(productsData);
      setTransactions(transactionsData);
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
  };

  const handleProductUpdated = (updatedProduct: Product) => {
    setProducts((prev: Product[]) => 
      prev.map((p: Product) => p.id === updatedProduct.id ? updatedProduct : p)
    );
  };

  const handleProductDeleted = (productId: number) => {
    setProducts((prev: Product[]) => prev.filter((p: Product) => p.id !== productId));
  };

  const handleTransactionCreated = (newTransaction: StockTransaction) => {
    setTransactions((prev: StockTransaction[]) => [...prev, newTransaction]);
    // Refresh products to get updated stock levels
    loadData();
  };

  // Calculate summary stats
  const totalProducts = products.length;
  const lowStockProducts = products.filter((p: Product) => p.stock_level <= 10).length;
  const totalStockValue = products.reduce((sum: number, p: Product) => sum + p.stock_level, 0);
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Package className="text-blue-600" />
            📦 Inventory Management System
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your products, track stock levels, and record transactions
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalProducts}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Low Stock Alert</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{lowStockProducts}</div>
              <p className="text-xs text-gray-500">≤ 10 units</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Stock Units</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totalStockValue}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{recentTransactions.length}</div>
              <p className="text-xs text-gray-500">transactions</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
          <Tabs defaultValue="dashboard" className="w-full">
            <CardHeader className="pb-0">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="products" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Products
                </TabsTrigger>
                <TabsTrigger value="stock-in" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Stock In
                </TabsTrigger>
                <TabsTrigger value="stock-out" className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Stock Out
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="dashboard" className="mt-0">
                <DashboardOverview 
                  products={products}
                  transactions={transactions}
                  isLoading={isLoading}
                />
              </TabsContent>

              <TabsContent value="products" className="mt-0">
                <ProductManagement
                  products={products}
                  onProductCreated={handleProductCreated}
                  onProductUpdated={handleProductUpdated}
                  onProductDeleted={handleProductDeleted}
                  isLoading={isLoading}
                />
              </TabsContent>

              <TabsContent value="stock-in" className="mt-0">
                <TransactionManagement
                  products={products}
                  transactionType="stock_in"
                  onTransactionCreated={handleTransactionCreated}
                />
              </TabsContent>

              <TabsContent value="stock-out" className="mt-0">
                <TransactionManagement
                  products={products}
                  transactionType="stock_out"
                  onTransactionCreated={handleTransactionCreated}
                />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

export default App;
