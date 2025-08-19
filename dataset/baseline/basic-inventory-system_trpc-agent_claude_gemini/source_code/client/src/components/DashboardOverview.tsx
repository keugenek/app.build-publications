import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Package, TrendingUp, TrendingDown, AlertTriangle, Clock } from 'lucide-react';
import type { Product, StockTransaction } from '../../../server/src/schema';

interface DashboardOverviewProps {
  products: Product[];
  transactions: StockTransaction[];
  isLoading: boolean;
}

export function DashboardOverview({ products, transactions, isLoading }: DashboardOverviewProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
          <p className="text-gray-500 mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalProducts = products.length;
  const totalStockUnits = products.reduce((sum: number, p: Product) => sum + p.stock_level, 0);
  const outOfStockProducts = products.filter((p: Product) => p.stock_level === 0);
  const lowStockProducts = products.filter((p: Product) => p.stock_level > 0 && p.stock_level <= 10);
  const inStockProducts = products.filter((p: Product) => p.stock_level > 10);

  // Recent transactions (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentTransactions = transactions
    .filter((t: StockTransaction) => new Date(t.created_at) >= sevenDaysAgo)
    .sort((a: StockTransaction, b: StockTransaction) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 10);

  const stockInCount = recentTransactions.filter((t: StockTransaction) => t.transaction_type === 'stock_in').length;
  const stockOutCount = recentTransactions.filter((t: StockTransaction) => t.transaction_type === 'stock_out').length;

  // Top products by stock level
  const topStockedProducts = [...products]
    .sort((a: Product, b: Product) => b.stock_level - a.stock_level)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          📊 Dashboard Overview
        </h2>
        <p className="text-gray-600">Monitor your inventory health and recent activity</p>
      </div>

      {/* Stock Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-800 text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              In Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{inStockProducts.length}</div>
            <p className="text-xs text-green-600">Products with good stock levels</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-orange-800 text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{lowStockProducts.length}</div>
            <p className="text-xs text-orange-600">Products need restocking (≤10 units)</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-800 text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{outOfStockProducts.length}</div>
            <p className="text-xs text-red-600">Products unavailable</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Health Summary */}
        <Card>
          <CardHeader>
            <CardTitle>📈 Stock Health Summary</CardTitle>
            <CardDescription>Overall inventory status breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {totalProducts === 0 ? (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No products in inventory</p>
                <p className="text-sm text-gray-400">Add some products to get started</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-700">In Stock ({inStockProducts.length})</span>
                    <span className="text-sm text-gray-600">
                      {totalProducts > 0 ? Math.round((inStockProducts.length / totalProducts) * 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={totalProducts > 0 ? (inStockProducts.length / totalProducts) * 100 : 0} 
                    className="h-2" 
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-orange-700">Low Stock ({lowStockProducts.length})</span>
                    <span className="text-sm text-gray-600">
                      {totalProducts > 0 ? Math.round((lowStockProducts.length / totalProducts) * 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={totalProducts > 0 ? (lowStockProducts.length / totalProducts) * 100 : 0} 
                    className="h-2" 
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-red-700">Out of Stock ({outOfStockProducts.length})</span>
                    <span className="text-sm text-gray-600">
                      {totalProducts > 0 ? Math.round((outOfStockProducts.length / totalProducts) * 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={totalProducts > 0 ? (outOfStockProducts.length / totalProducts) * 100 : 0} 
                    className="h-2" 
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    <strong>{totalStockUnits}</strong> total units across all products
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              🕒 Recent Activity (7 days)
            </CardTitle>
            <CardDescription>Latest stock transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No recent activity</p>
                <p className="text-sm text-gray-400">Transactions from the last 7 days will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">{stockInCount} Stock In</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-600">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-sm font-medium">{stockOutCount} Stock Out</span>
                  </div>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {recentTransactions.map((transaction: StockTransaction) => {
                    const product = products.find((p: Product) => p.id === transaction.product_id);
                    const isStockIn = transaction.transaction_type === 'stock_in';
                    
                    return (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {isStockIn ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                          <div>
                            <div className="font-medium text-sm">
                              {product?.name || `Product #${transaction.product_id}`}
                            </div>
                            <div className="text-xs text-gray-500">
                              {transaction.created_at.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Badge variant={isStockIn ? 'default' : 'destructive'}>
                          {isStockIn ? '+' : '-'}{transaction.quantity}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Stocked Products */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>📦 Products Overview</CardTitle>
            <CardDescription>Current stock levels and product status</CardDescription>
          </CardHeader>
          <CardContent>
            {topStockedProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No products to display</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topStockedProducts.map((product: Product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.sku}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{product.stock_level}</span> units
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            product.stock_level === 0 ? 'destructive' :
                            product.stock_level <= 10 ? 'secondary' : 'default'
                          }
                        >
                          {product.stock_level === 0 ? (
                            <>
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Out of Stock
                            </>
                          ) : product.stock_level <= 10 ? (
                            'Low Stock'
                          ) : (
                            'In Stock'
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.updated_at.toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
