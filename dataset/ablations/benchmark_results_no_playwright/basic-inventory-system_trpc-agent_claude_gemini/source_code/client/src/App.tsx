import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { ProductManager } from '@/components/ProductManager';
import { StockTransactionManager } from '@/components/StockTransactionManager';
import { ProductDetails } from '@/components/ProductDetails';
// Using type-only imports for better TypeScript compliance
import type { Product } from '../../server/src/schema';

function App() {
  // State management for products and UI
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('products');

  // Load products with proper error handling
  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getProducts.query();
      setProducts(result);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Handle product creation
  const handleProductCreated = (newProduct: Product) => {
    setProducts((prev: Product[]) => [...prev, newProduct]);
  };

  // Handle product update
  const handleProductUpdated = (updatedProduct: Product) => {
    setProducts((prev: Product[]) => 
      prev.map((p: Product) => p.id === updatedProduct.id ? updatedProduct : p)
    );
    if (selectedProduct && selectedProduct.id === updatedProduct.id) {
      setSelectedProduct(updatedProduct);
    }
  };

  // Handle product deletion
  const handleProductDeleted = (deletedId: number) => {
    setProducts((prev: Product[]) => prev.filter((p: Product) => p.id !== deletedId));
    if (selectedProduct && selectedProduct.id === deletedId) {
      setSelectedProduct(null);
    }
  };

  // Handle stock transaction completion
  const handleStockTransactionComplete = () => {
    // Refresh products to get updated stock levels
    loadProducts();
    // If we have a selected product, we might want to refresh its details
    if (selectedProduct) {
      // The ProductDetails component will handle refreshing its own data
      setSelectedProduct({ ...selectedProduct });
    }
  };

  // Calculate summary statistics
  const totalProducts = products.length;
  const lowStockProducts = products.filter((p: Product) => p.stock_level < 10).length;
  const outOfStockProducts = products.filter((p: Product) => p.stock_level === 0).length;
  const totalStockValue = products.reduce((sum: number, p: Product) => sum + p.stock_level, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📦 Inventory Management System</h1>
              <p className="text-gray-600 mt-1">Manage your products and track stock levels</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="text-sm">
                {totalProducts} Products
              </Badge>
              <Badge variant={lowStockProducts > 0 ? "destructive" : "secondary"} className="text-sm">
                {lowStockProducts} Low Stock
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Dashboard Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Badge variant="secondary">📦</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stock Items</CardTitle>
              <Badge variant="secondary">📊</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStockValue}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
              <Badge variant={lowStockProducts > 0 ? "destructive" : "secondary"}>⚠️</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{lowStockProducts}</div>
              <p className="text-xs text-muted-foreground">Products below 10 units</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <Badge variant={outOfStockProducts > 0 ? "destructive" : "secondary"}>❌</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{outOfStockProducts}</div>
              <p className="text-xs text-muted-foreground">Products with 0 stock</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products">Product Management</TabsTrigger>
            <TabsTrigger value="transactions">Stock Transactions</TabsTrigger>
            <TabsTrigger value="details" disabled={!selectedProduct}>
              Product Details {selectedProduct && `(${selectedProduct.name})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <ProductManager
              products={products}
              isLoading={isLoading}
              onProductCreated={handleProductCreated}
              onProductUpdated={handleProductUpdated}
              onProductDeleted={handleProductDeleted}
              onProductSelected={(product: Product) => {
                setSelectedProduct(product);
                setActiveTab('details');
              }}
              onRefresh={loadProducts}
            />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <StockTransactionManager
              products={products}
              onTransactionComplete={handleStockTransactionComplete}
            />
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            {selectedProduct ? (
              <ProductDetails
                product={selectedProduct}
                onProductUpdated={handleProductUpdated}
                onBack={() => setActiveTab('products')}
              />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center text-muted-foreground">
                    <p className="text-lg mb-2">No product selected</p>
                    <p className="text-sm">Select a product from the Product Management tab to view details</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setActiveTab('products')}
                    >
                      Go to Products
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
