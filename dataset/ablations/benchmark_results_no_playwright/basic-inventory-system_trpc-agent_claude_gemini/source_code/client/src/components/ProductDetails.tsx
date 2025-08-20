import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import type { 
  Product, 
  ProductWithTransactions, 
  StockTransaction,
  UpdateProductInput,
  CreateStockTransactionInput,
  TransactionType 
} from '../../../server/src/schema';

interface ProductDetailsProps {
  product: Product;
  onProductUpdated: (product: Product) => void;
  onBack: () => void;
}

export function ProductDetails({ product, onProductUpdated, onBack }: ProductDetailsProps) {
  // State management
  const [productWithTransactions, setProductWithTransactions] = useState<ProductWithTransactions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [editFormData, setEditFormData] = useState<UpdateProductInput>({
    id: product.id,
    name: product.name,
    sku: product.sku,
    description: product.description
  });

  const [transactionFormData, setTransactionFormData] = useState<CreateStockTransactionInput>({
    product_id: product.id,
    transaction_type: 'STOCK_IN',
    quantity: 1,
    notes: null
  });

  // Load product with transactions
  const loadProductWithTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getProductWithTransactions.query({ id: product.id });
      setProductWithTransactions(result);
    } catch (error) {
      console.error('Failed to load product details:', error);
    } finally {
      setIsLoading(false);
    }
  }, [product.id]);

  // Load data on component mount and when product changes
  useEffect(() => {
    loadProductWithTransactions();
    setEditFormData({
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description
    });
    setTransactionFormData(prev => ({ ...prev, product_id: product.id }));
  }, [product, loadProductWithTransactions]);

  // Handle product update
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await trpc.updateProduct.mutate(editFormData);
      onProductUpdated(result);
      setEditDialogOpen(false);
      // Refresh the detailed view
      loadProductWithTransactions();
    } catch (error) {
      console.error('Failed to update product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle stock transaction
  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await trpc.createStockTransaction.mutate(transactionFormData);
      setTransactionDialogOpen(false);
      
      // Reset transaction form
      setTransactionFormData({
        product_id: product.id,
        transaction_type: 'STOCK_IN',
        quantity: 1,
        notes: null
      });
      
      // Refresh the detailed view to show new transaction and updated stock
      loadProductWithTransactions();
    } catch (error) {
      console.error('Failed to create transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get stock level status
  const getStockStatus = (stockLevel: number) => {
    if (stockLevel === 0) return { text: 'Out of Stock', color: 'text-red-600', variant: 'destructive' as const };
    if (stockLevel < 10) return { text: 'Low Stock', color: 'text-orange-600', variant: 'outline' as const };
    return { text: 'In Stock', color: 'text-green-600', variant: 'secondary' as const };
  };

  // Get transaction type details
  const getTransactionDetails = (type: TransactionType) => {
    return type === 'STOCK_IN' 
      ? { icon: '📈', text: 'Stock In', color: 'text-green-600', variant: 'default' as const }
      : { icon: '📉', text: 'Stock Out', color: 'text-red-600', variant: 'secondary' as const };
  };

  const stockStatus = getStockStatus(productWithTransactions?.stock_level || product.stock_level);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            ← Back to Products
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{product.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">SKU: {product.sku}</Badge>
              <Badge variant={stockStatus.variant}>
                Stock: {productWithTransactions?.stock_level || product.stock_level}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            ✏️ Edit Product
          </Button>
          <Button onClick={() => setTransactionDialogOpen(true)}>
            📝 Record Transaction
          </Button>
        </div>
      </div>

      {/* Product Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📦 Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Name</Label>
              <p className="text-lg font-medium">{product.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">SKU</Label>
              <p className="font-mono">{product.sku}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Description</Label>
              <p className={product.description ? '' : 'text-muted-foreground italic'}>
                {product.description || 'No description provided'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Created</Label>
              <p>{product.created_at.toLocaleDateString()} at {product.created_at.toLocaleTimeString()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
              <p>{product.updated_at.toLocaleDateString()} at {product.updated_at.toLocaleTimeString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Stock Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Stock Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Current Stock Level</Label>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-2xl font-bold">{productWithTransactions?.stock_level || product.stock_level}</p>
                <Badge variant={stockStatus.variant} className="text-sm">
                  {stockStatus.text}
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Stock In Total</Label>
                <p className="text-lg font-semibold text-green-600">
                  +{productWithTransactions?.transactions.filter((t: StockTransaction) => t.transaction_type === 'STOCK_IN')
                    .reduce((sum: number, t: StockTransaction) => sum + t.quantity, 0) || 0}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Stock Out Total</Label>
                <p className="text-lg font-semibold text-red-600">
                  -{productWithTransactions?.transactions.filter((t: StockTransaction) => t.transaction_type === 'STOCK_OUT')
                    .reduce((sum: number, t: StockTransaction) => sum + t.quantity, 0) || 0}
                </p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Total Transactions</Label>
              <p className="text-lg font-medium">{productWithTransactions?.transactions.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transaction History</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadProductWithTransactions} disabled={isLoading}>
              🔄 Refresh
            </Button>
            <Badge variant="secondary" className="text-sm">
              {productWithTransactions?.transactions.length || 0} transactions
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading transactions...</p>
              </div>
            </div>
          ) : !productWithTransactions?.transactions.length ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📝</div>
              <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
              <p className="text-muted-foreground mb-4">Record your first transaction for this product</p>
              <Button onClick={() => setTransactionDialogOpen(true)}>
                Record Transaction
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productWithTransactions.transactions
                    .sort((a: StockTransaction, b: StockTransaction) => b.created_at.getTime() - a.created_at.getTime())
                    .map((transaction: StockTransaction) => {
                      const details = getTransactionDetails(transaction.transaction_type);
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell className="text-sm">
                            <div>
                              <div>{transaction.created_at.toLocaleDateString()}</div>
                              <div className="text-xs text-muted-foreground">
                                {transaction.created_at.toLocaleTimeString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={details.variant}>
                              <span className={details.color}>
                                {details.icon} {details.text}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${details.color}`}>
                            {transaction.transaction_type === 'STOCK_IN' ? '+' : '-'}{transaction.quantity}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs">
                            {transaction.notes || '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Product Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev: UpdateProductInput) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sku">SKU</Label>
              <Input
                id="edit-sku"
                value={editFormData.sku}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev: UpdateProductInput) => ({ ...prev, sku: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditFormData((prev: UpdateProductInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Product'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Stock Transaction</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTransactionSubmit} className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Product:</span> {product.name} ({product.sku})
              </p>
              <p className="text-sm">
                <span className="font-medium">Current Stock:</span> {productWithTransactions?.stock_level || product.stock_level}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transaction-type">Transaction Type</Label>
              <Select 
                value={transactionFormData.transaction_type} 
                onValueChange={(value: TransactionType) => 
                  setTransactionFormData((prev: CreateStockTransactionInput) => ({ 
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
                    📈 Stock In (Add inventory)
                  </SelectItem>
                  <SelectItem value="STOCK_OUT">
                    📉 Stock Out (Remove inventory)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={transactionFormData.quantity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTransactionFormData((prev: CreateStockTransactionInput) => ({ 
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
                value={transactionFormData.notes || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setTransactionFormData((prev: CreateStockTransactionInput) => ({
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
                onClick={() => setTransactionDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Recording...' : 'Record Transaction'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
