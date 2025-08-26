import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { Product, Transaction, CreateTransactionInput, TransactionType } from '../../../server/src/schema';

interface TransactionManagementProps {
  products: Product[];
  transactions: Transaction[];
  onTransactionCreated: (transaction: Transaction) => void;
}

export function TransactionManagement({ 
  products, 
  transactions, 
  onTransactionCreated 
}: TransactionManagementProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(transactions);
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [filterProductId, setFilterProductId] = useState<string>('all');

  const [createFormData, setCreateFormData] = useState<CreateTransactionInput>({
    product_id: 0,
    type: 'stock_in',
    quantity: 1,
    notes: null
  });

  // Update filtered transactions when transactions or filters change
  useEffect(() => {
    let filtered = [...transactions];

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    if (filterProductId !== 'all') {
      const productId = parseInt(filterProductId);
      filtered = filtered.filter(t => t.product_id === productId);
    }

    setFilteredTransactions(filtered);
  }, [transactions, filterType, filterProductId]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const newTransaction = await trpc.createTransaction.mutate({
        ...createFormData,
        notes: createFormData.notes || null
      });
      onTransactionCreated(newTransaction);
      setCreateFormData({
        product_id: 0,
        type: 'stock_in',
        quantity: 1,
        notes: null
      });
      setCreateFormOpen(false);
    } catch (error) {
      console.error('Failed to create transaction:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const getTransactionBadge = (type: TransactionType) => {
    return type === 'stock_in' ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
        📈 Stock In
      </Badge>
    ) : (
      <Badge variant="destructive">
        📉 Stock Out
      </Badge>
    );
  };

  const getProductName = (productId: number) => {
    const product = products.find(p => p.id === productId);
    return product?.name || `Product ID: ${productId}`;
  };

  const getProductSku = (productId: number) => {
    const product = products.find(p => p.id === productId);
    return product?.sku || 'Unknown';
  };

  // Calculate summary stats
  const totalStockIn = transactions.filter(t => t.type === 'stock_in').reduce((sum, t) => sum + t.quantity, 0);
  const totalStockOut = transactions.filter(t => t.type === 'stock_out').reduce((sum, t) => sum + t.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header with Create Transaction Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Transaction Management</h2>
          <p className="text-gray-600">Track stock in and stock out movements</p>
        </div>
        
        <Dialog open={createFormOpen} onOpenChange={setCreateFormOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              disabled={products.length === 0}
            >
              <span className="mr-2">📝</span>
              Record Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Stock Transaction</DialogTitle>
              <DialogDescription>
                Add a new stock movement for your products.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product</Label>
                <Select
                  value={createFormData.product_id.toString()}
                  onValueChange={(value: string) =>
                    setCreateFormData((prev: CreateTransactionInput) => ({
                      ...prev,
                      product_id: parseInt(value)
                    }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product: Product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} (SKU: {product.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Transaction Type</Label>
                <Select
                  value={createFormData.type}
                  onValueChange={(value: TransactionType) =>
                    setCreateFormData((prev: CreateTransactionInput) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock_in">📈 Stock In (Received)</SelectItem>
                    <SelectItem value="stock_out">📉 Stock Out (Shipped/Sold)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={createFormData.quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateTransactionInput) => ({
                      ...prev,
                      quantity: parseInt(e.target.value) || 1
                    }))
                  }
                  min="1"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={createFormData.notes || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCreateFormData((prev: CreateTransactionInput) => ({
                      ...prev,
                      notes: e.target.value || null
                    }))
                  }
                  placeholder="Add any relevant notes about this transaction"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCreateFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Recording...' : 'Record Transaction'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <span className="text-2xl">📝</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">
              All recorded transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock In</CardTitle>
            <span className="text-2xl">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalStockIn}</div>
            <p className="text-xs text-muted-foreground">
              Units received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Out</CardTitle>
            <span className="text-2xl">📉</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalStockOut}</div>
            <p className="text-xs text-muted-foreground">
              Units shipped/sold
            </p>
          </CardContent>
        </Card>
      </div>

      {products.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Products Available
            </h3>
            <p className="text-gray-600 text-center max-w-md">
              You need to create products first before you can record transactions. 
              Go to the Products tab to add your first product.
            </p>
          </CardContent>
        </Card>
      ) : transactions.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Transactions Yet
            </h3>
            <p className="text-gray-600 text-center max-w-md">
              Start recording your inventory movements by creating your first transaction.
              Track stock coming in from suppliers or going out to customers.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
            <CardDescription>
              All stock movements in your inventory
            </CardDescription>
            
            {/* Filters */}
            <div className="flex space-x-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="filter-type">Filter by Type</Label>
                <Select
                  value={filterType}
                  onValueChange={(value: 'all' | TransactionType) => setFilterType(value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="stock_in">Stock In</SelectItem>
                    <SelectItem value="stock_out">Stock Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="filter-product">Filter by Product</Label>
                <Select
                  value={filterProductId}
                  onValueChange={(value: string) => setFilterProductId(value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map((product: Product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction: Transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {transaction.created_at.toLocaleDateString()}
                        </div>
                        <div className="text-gray-500">
                          {transaction.created_at.toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {getProductName(transaction.product_id)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {getProductSku(transaction.product_id)}
                    </TableCell>
                    <TableCell>
                      {getTransactionBadge(transaction.type)}
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold ${
                        transaction.type === 'stock_in' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'stock_in' ? '+' : '-'}{transaction.quantity}
                      </span> units
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {transaction.notes ? (
                        <span className="text-sm text-gray-600">
                          {transaction.notes.length > 50 
                            ? `${transaction.notes.substring(0, 50)}...` 
                            : transaction.notes
                          }
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">No notes</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredTransactions.length === 0 && (filterType !== 'all' || filterProductId !== 'all') && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No transactions match the current filters.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterType('all');
                    setFilterProductId('all');
                  }}
                  className="mt-2"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
