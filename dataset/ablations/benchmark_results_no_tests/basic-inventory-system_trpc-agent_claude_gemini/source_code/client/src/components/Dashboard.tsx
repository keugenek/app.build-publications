import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { Product, StockMovementWithProduct } from '../../../server/src/schema';

export function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockMovementWithProduct[]>([]);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      const [productsData, movementsData] = await Promise.all([
        trpc.getProducts.query(),
        trpc.getStockMovements.query()
      ]);
      setProducts(productsData);
      // Show only the 5 most recent movements for dashboard
      setRecentMovements(movementsData.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Calculate dashboard statistics
  const stats = {
    totalProducts: products.length,
    lowStockProducts: products.filter((p: Product) => p.stock_level <= 5).length,
    outOfStockProducts: products.filter((p: Product) => p.stock_level === 0).length,
    totalStockValue: products.reduce((sum: number, p: Product) => sum + p.stock_level, 0)
  };

  // Get low stock products for alerts
  const lowStockProducts = products.filter((p: Product) => p.stock_level <= 5 && p.stock_level > 0);
  const outOfStockProducts = products.filter((p: Product) => p.stock_level === 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">🏠 Dashboard</h2>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <span className="text-2xl">📦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-gray-500">Products in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <span className="text-2xl">⚠️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lowStockProducts}</div>
            <p className="text-xs text-gray-500">Products with ≤5 units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <span className="text-2xl">🚨</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outOfStockProducts}</div>
            <p className="text-xs text-gray-500">Products with 0 units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Units</CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalStockValue}</div>
            <p className="text-xs text-gray-500">Units across all products</p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Alerts */}
      {(outOfStockProducts.length > 0 || lowStockProducts.length > 0) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">📢 Stock Alerts</h3>
          
          {outOfStockProducts.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center gap-2">
                  🚨 Out of Stock Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {outOfStockProducts.map((product: Product) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{product.name}</span>
                        <span className="text-sm text-gray-600 ml-2">({product.sku})</span>
                      </div>
                      <Badge variant="destructive">Out of Stock</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {lowStockProducts.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-800 flex items-center gap-2">
                  ⚠️ Low Stock Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lowStockProducts.map((product: Product) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{product.name}</span>
                        <span className="text-sm text-gray-600 ml-2">({product.sku})</span>
                      </div>
                      <Badge variant="outline">{product.stock_level} left</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent Stock Movements */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">🔄 Recent Stock Movements</h3>
        
        {recentMovements.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No recent stock movements. Start recording movements to see activity here! 📈</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                {recentMovements.map((movement: StockMovementWithProduct) => (
                  <div key={movement.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {movement.movement_type === 'stock-in' ? '📈' : '📉'}
                      </span>
                      <div>
                        <p className="font-medium">{movement.product.name}</p>
                        <p className="text-sm text-gray-600">
                          {movement.movement_type === 'stock-in' ? 'Added' : 'Removed'} {movement.quantity} units
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {movement.created_at.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
