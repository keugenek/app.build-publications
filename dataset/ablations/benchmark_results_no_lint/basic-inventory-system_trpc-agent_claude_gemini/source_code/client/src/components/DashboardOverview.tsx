import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import type { Product, ProductWithStockSummary, Transaction } from '../../../server/src/schema';

interface DashboardOverviewProps {
  products: Product[];
  productsWithSummary: ProductWithStockSummary[];
  transactions: Transaction[];
}

export function DashboardOverview({ products, productsWithSummary, transactions }: DashboardOverviewProps) {
  // Calculate summary statistics
  const totalProducts = products.length;
  const totalStockValue = products.reduce((sum, product) => sum + product.stock_level, 0);
  const lowStockProducts = products.filter(product => product.stock_level < 10);
  const outOfStockProducts = products.filter(product => product.stock_level === 0);
  
  const recentTransactions = transactions.slice(0, 5);
  const todayTransactions = transactions.filter(t => {
    const today = new Date();
    const transactionDate = t.created_at;
    return transactionDate.toDateString() === today.toDateString();
  });

  const stockInToday = todayTransactions
    .filter(t => t.type === 'stock_in')
    .reduce((sum, t) => sum + t.quantity, 0);
  
  const stockOutToday = todayTransactions
    .filter(t => t.type === 'stock_out')
    .reduce((sum, t) => sum + t.quantity, 0);

  if (products.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Welcome to Your Inventory System
            </h3>
            <p className="text-gray-600 text-center max-w-md mb-4">
              Get started by creating your first product in the Products tab. 
              You can then track stock movements with transactions.
            </p>
            <Badge variant="outline" className="text-amber-700 border-amber-300">
              No products yet - Create your first product to begin
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <span className="text-2xl">📦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Active products in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Units</CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStockValue}</div>
            <p className="text-xs text-muted-foreground">
              Units across all products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock In Today</CardTitle>
            <span className="text-2xl">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stockInToday}</div>
            <p className="text-xs text-muted-foreground">
              Units received today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Out Today</CardTitle>
            <span className="text-2xl">📉</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stockOutToday}</div>
            <p className="text-xs text-muted-foreground">
              Units shipped today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Alerts */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>⚠️</span>
              <span>Stock Alerts</span>
            </CardTitle>
            <CardDescription>
              Products requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {outOfStockProducts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-700">Out of Stock</span>
                  <Badge variant="destructive">{outOfStockProducts.length}</Badge>
                </div>
                <div className="space-y-1">
                  {outOfStockProducts.map((product: Product) => (
                    <div key={product.id} className="flex items-center justify-between text-sm">
                      <span>{product.name}</span>
                      <span className="text-gray-500">SKU: {product.sku}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {outOfStockProducts.length > 0 && lowStockProducts.length > 0 && <Separator />}
            
            {lowStockProducts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-amber-700">Low Stock (&lt;10 units)</span>
                  <Badge variant="secondary">{lowStockProducts.length}</Badge>
                </div>
                <div className="space-y-1">
                  {lowStockProducts.map((product: Product) => (
                    <div key={product.id} className="flex items-center justify-between text-sm">
                      <span>{product.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-amber-600">{product.stock_level} units</span>
                        <span className="text-gray-500">SKU: {product.sku}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity and Stock Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📝</span>
              <span>Recent Transactions</span>
            </CardTitle>
            <CardDescription>
              Latest stock movements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No transactions yet. Create your first transaction in the Transactions tab.
              </p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((transaction: Transaction) => {
                  const product = products.find(p => p.id === transaction.product_id);
                  return (
                    <div key={transaction.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">
                          {product?.name || `Product ID: ${transaction.product_id}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {transaction.created_at.toLocaleDateString()} at {transaction.created_at.toLocaleTimeString()}
                        </div>
                        {transaction.notes && (
                          <div className="text-xs text-gray-600 mt-1">
                            {transaction.notes}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={transaction.type === 'stock_in' ? 'default' : 'destructive'}
                          className={transaction.type === 'stock_in' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
                        >
                          {transaction.type === 'stock_in' ? '+' : '-'}{transaction.quantity}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products with Stock Levels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📊</span>
              <span>Stock Levels</span>
            </CardTitle>
            <CardDescription>
              Current inventory status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.slice(0, 6).map((product: Product) => {
                const maxStock = Math.max(...products.map(p => p.stock_level)) || 100;
                const percentage = (product.stock_level / maxStock) * 100;
                
                return (
                  <div key={product.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-gray-600">{product.stock_level} units</span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-2"
                    />
                    <div className="text-xs text-gray-500">
                      SKU: {product.sku}
                    </div>
                  </div>
                );
              })}
            </div>
            {products.length > 6 && (
              <div className="text-center mt-4">
                <p className="text-sm text-gray-500">
                  And {products.length - 6} more products...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
