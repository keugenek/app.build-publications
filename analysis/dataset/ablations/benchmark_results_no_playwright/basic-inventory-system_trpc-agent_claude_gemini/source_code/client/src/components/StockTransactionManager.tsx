import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import type { 
  Product, 
  StockTransaction, 
  CreateStockTransactionInput,
  TransactionType 
} from '../../../server/src/schema';

interface StockTransactionManagerProps {
  products: Product[];
  onTransactionComplete: () => void;
}

export function StockTransactionManager({ 
  products, 
  onTransactionComplete 
}: StockTransactionManagerProps) {
  // State for transactions and UI
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data for creating transactions
  const [formData, setFormData] = useState<CreateStockTransactionInput>({
    product_id: 0,
    transaction_type: 'STOCK_IN',
    quantity: 1,
    notes: null
  });

  // Load all stock transactions
  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getStockTransactions.query();
      setTransactions(result);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load transactions on component mount
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.product_id === 0) return;

    setIsSubmitting(true);
    try {
      const result = await trpc.createStockTransaction.mutate(formData);
      setTransactions((prev: StockTransaction[]) => [result, ...prev]);
      onTransactionComplete(); // Notify parent to refresh products
      
      // Reset form
      setFormData({
        product_id: 0,
        transaction_type: 'STOCK_IN',
        quantity: 1,
        notes: null
      });
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get product name by ID
  const getProductName = (productId: number): string => {
    const product = products.find((p: Product) => p.id === productId);
    return product ? product.name : `Product #${productId}`;
  };

  // Get product SKU by ID
  const getProductSku = (productId: number): string => {
    const product = products.find((p: Product) => p.id === productId);
    return product ? product.sku : 'Unknown';
  };

  // Get transaction type badge variant
  const getTransactionBadgeVariant = (type: TransactionType) => {
    return type === 'STOCK_IN' ? 'default' : 'secondary';
  };

  // Get transaction type color
  const getTransactionColor = (type: TransactionType) => {
    return type === 'STOCK_IN' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Stock Transactions</h2>
          <p className="text-muted-foreground">Record stock movements and view transaction history</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadTransactions} variant="outline" disabled={isLoading}>
            🔄 Refresh
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={products.length === 0}>
                {products.length === 0 ? 'No Products Available' : '📝 Record Transaction'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Stock Transaction</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product-select">Select Product</Label>
                  <Select 
                    value={formData.product_id.toString()} 
                    onValueChange={(value) => 
                      setFormData((prev: CreateStockTransactionInput) => ({ 
                        ...prev, 
                        product_id: parseInt(value) 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product: Product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{product.name}</span>
                            <div className="ml-2 text-xs text-muted-foreground">
                              SKU: {product.sku} | Stock: {product.stock_level}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transaction-type">Transaction Type</Label>
                  <Select 
                    value={formData.transaction_type} 
                    onValueChange={(value: TransactionType) => 
                      setFormData((prev: CreateStockTransactionInput) => ({ 
                        ...prev, 
                        transaction_type: value 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STOCK_IN">
                        <div className="flex items-center gap-2">
                          <span className="text-green-600">📈 Stock In</span>
                          <span className="text-xs text-muted-foreground">(Add inventory)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="STOCK_OUT">
                        <div className="flex items-center gap-2">
                          <span className="text-red-600">📉 Stock Out</span>
                          <span className="text-xs text-muted-foreground">(Remove inventory)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateStockTransactionInput) => ({ 
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
                    value={formData.notes || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateStockTransactionInput) => ({
                        ...prev,
                        notes: e.target.value || null
                      }))
                    }
                    placeholder="Add any notes about this transaction"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCreateDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || formData.product_id === 0}>
                    {isSubmitting ? 'Recording...' : 'Record Transaction'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Transactions</span>
            <Badge variant="secondary" className="text-sm">
              {transactions.length} transactions
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading transactions...</p>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
                <p className="text-muted-foreground mb-4">Record your first stock transaction to get started</p>
                {products.length > 0 && (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    Record First Transaction
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction: StockTransaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-sm">
                        {transaction.created_at.toLocaleDateString()} {transaction.created_at.toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {getProductName(transaction.product_id)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getProductSku(transaction.product_id)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTransactionBadgeVariant(transaction.transaction_type)}>
                          <span className={getTransactionColor(transaction.transaction_type)}>
                            {transaction.transaction_type === 'STOCK_IN' ? '📈 IN' : '📉 OUT'}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${getTransactionColor(transaction.transaction_type)}`}>
                        {transaction.transaction_type === 'STOCK_IN' ? '+' : '-'}{transaction.quantity}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {transaction.notes || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
