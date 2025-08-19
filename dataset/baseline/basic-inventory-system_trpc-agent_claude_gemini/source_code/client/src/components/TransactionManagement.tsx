import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect } from 'react';
import type { Product, StockTransaction, CreateStockTransactionInput, TransactionType } from '../../../server/src/schema';

interface TransactionManagementProps {
  products: Product[];
  transactionType: TransactionType;
  onTransactionCreated: (transaction: StockTransaction) => void;
}

export function TransactionManagement({ 
  products, 
  transactionType, 
  onTransactionCreated 
}: TransactionManagementProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<StockTransaction[]>([]);

  const [formData, setFormData] = useState<CreateStockTransactionInput>({
    product_id: 0,
    transaction_type: transactionType,
    quantity: 1,
    notes: null
  });

  useEffect(() => {
    setFormData((prev: CreateStockTransactionInput) => ({
      ...prev,
      transaction_type: transactionType
    }));
  }, [transactionType]);

  useEffect(() => {
    const loadRecentTransactions = async () => {
      try {
        const transactions = await trpc.getStockTransactions.query();
        const filtered = transactions.filter((t: StockTransaction) => t.transaction_type === transactionType);
        setRecentTransactions(filtered.slice(0, 10));
      } catch (error) {
        console.error('Failed to load transactions:', error);
      }
    };
    loadRecentTransactions();
  }, [transactionType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.product_id === 0) {
      alert('Please select a product');
      return;
    }

    setIsSubmitting(true);
    try {
      const newTransaction = await trpc.createStockTransaction.mutate(formData);
      onTransactionCreated(newTransaction);
      
      // Reset form
      setFormData({
        product_id: 0,
        transaction_type: transactionType,
        quantity: 1,
        notes: null
      });
      setSelectedProduct(null);

      // Refresh recent transactions
      const transactions = await trpc.getStockTransactions.query();
      const filtered = transactions.filter((t: StockTransaction) => t.transaction_type === transactionType);
      setRecentTransactions(filtered.slice(0, 10));
    } catch (error) {
      console.error('Failed to create transaction:', error);
      alert('Failed to create transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find((p: Product) => p.id === parseInt(productId));
    setSelectedProduct(product || null);
    setFormData((prev: CreateStockTransactionInput) => ({
      ...prev,
      product_id: parseInt(productId)
    }));
  };

  const isStockOut = transactionType === 'stock_out';
  const icon = isStockOut ? TrendingDown : TrendingUp;
  const IconComponent = icon;
  const title = isStockOut ? '📤 Stock Out' : '📥 Stock In';
  const description = isStockOut 
    ? 'Record products removed from inventory' 
    : 'Record products added to inventory';
  const buttonText = isStockOut ? 'Record Stock Out' : 'Record Stock In';
  const colorClass = isStockOut ? 'text-red-600' : 'text-green-600';
  const bgColorClass = isStockOut ? 'bg-red-50' : 'bg-green-50';

  const canSubmit = selectedProduct && formData.quantity > 0;
  const willCauseNegativeStock = isStockOut && selectedProduct && 
    (selectedProduct.stock_level < formData.quantity);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <IconComponent className={`w-6 h-6 ${colorClass}`} />
          {title}
        </h2>
        <p className="text-gray-600">{description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Form */}
        <Card>
          <CardHeader>
            <CardTitle>New Transaction</CardTitle>
            <CardDescription>
              {isStockOut ? 'Remove stock from inventory' : 'Add stock to inventory'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="product">Select Product</Label>
                <Select onValueChange={handleProductSelect} value={formData.product_id.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">
                        No products available. Add products first.
                      </div>
                    ) : (
                      products.map((product: Product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{product.name}</span>
                            <Badge variant={product.stock_level <= 10 ? 'secondary' : 'outline'}>
                              {product.stock_level} units
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedProduct && (
                <div className={`p-3 rounded-lg ${bgColorClass}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedProduct.name}</p>
                      <p className="text-sm text-gray-600">SKU: {selectedProduct.sku}</p>
                    </div>
                    <Badge variant={selectedProduct.stock_level <= 10 ? 'secondary' : 'default'}>
                      {selectedProduct.stock_level} in stock
                    </Badge>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateStockTransactionInput) => ({ 
                      ...prev, 
                      quantity: parseInt(e.target.value) || 0 
                    }))
                  }
                  placeholder="Enter quantity"
                  min="1"
                  required
                />
                {willCauseNegativeStock && (
                  <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>
                      This would result in negative stock 
                      ({selectedProduct.stock_level - formData.quantity} units)
                    </span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateStockTransactionInput) => ({ 
                      ...prev, 
                      notes: e.target.value || null 
                    }))
                  }
                  placeholder="Add any additional notes..."
                  rows={3}
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting || !canSubmit || !!willCauseNegativeStock}
                className="w-full"
              >
                {isSubmitting ? 'Processing...' : buttonText}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent {isStockOut ? 'Stock Out' : 'Stock In'} Transactions</CardTitle>
            <CardDescription>
              Last {recentTransactions.length} transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <IconComponent className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No transactions yet</p>
                <p className="text-sm text-gray-400">
                  Your recent {isStockOut ? 'stock out' : 'stock in'} transactions will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((transaction: StockTransaction) => {
                  const product = products.find((p: Product) => p.id === transaction.product_id);
                  return (
                    <div key={transaction.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">
                          {product?.name || `Product ID: ${transaction.product_id}`}
                        </div>
                        <Badge variant={isStockOut ? 'destructive' : 'default'}>
                          {isStockOut ? '-' : '+'}{transaction.quantity} units
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>SKU: {product?.sku || 'N/A'}</span>
                        <span>{transaction.created_at.toLocaleDateString()}</span>
                      </div>
                      
                      {transaction.notes && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          "{transaction.notes}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
