import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Product, CreateProductInput, CreateTransactionInput, Transaction } from '../../server/src/schema';
import { trpc } from '@/utils/trpc';

function App() {
  // State for products and transactions
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Form states
  const [productForm, setProductForm] = useState<CreateProductInput>({
    name: '',
    sku: '',
    stock_level: 0
  });
  
  const [transactionForm, setTransactionForm] = useState<CreateTransactionInput>({
    product_sku: '',
    transaction_type: 'stock-in',
    quantity: 1
  });
  
  // Loading states
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [creatingTransaction, setCreatingTransaction] = useState(false);
  
  // Fetch products
  const loadProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const result = await trpc.getProducts.query();
      setProducts(result);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoadingProducts(false);
    }
  }, []);
  
  // Fetch transactions
  const loadTransactions = useCallback(async () => {
    try {
      setLoadingTransactions(true);
      const result = await trpc.getTransactions.query();
      setTransactions(result);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  }, []);
  
  // Initial data loading
  useEffect(() => {
    loadProducts();
    loadTransactions();
  }, [loadProducts, loadTransactions]);
  
  // Handle product form submission
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.sku) return;
    
    setCreatingProduct(true);
    try {
      const newProduct = await trpc.createProduct.mutate(productForm);
      setProducts(prev => [...prev, newProduct]);
      setProductForm({ name: '', sku: '', stock_level: 0 });
    } catch (error) {
      console.error('Failed to create product:', error);
    } finally {
      setCreatingProduct(false);
    }
  };
  
  // Handle transaction form submission
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionForm.product_sku || transactionForm.quantity <= 0) return;
    
    setCreatingTransaction(true);
    try {
      const newTransaction = await trpc.createTransaction.mutate(transactionForm);
      setTransactions(prev => [newTransaction, ...prev]);
      
      // Update product stock level in the UI
      setProducts(prev => prev.map(product => {
        if (product.sku === transactionForm.product_sku) {
          const newStockLevel = transactionForm.transaction_type === 'stock-in' 
            ? product.stock_level + transactionForm.quantity
            : product.stock_level - transactionForm.quantity;
          return { ...product, stock_level: newStockLevel };
        }
        return product;
      }));
      
      setTransactionForm({ 
        product_sku: '', 
        transaction_type: 'stock-in', 
        quantity: 1 
      });
    } catch (error) {
      console.error('Failed to create transaction:', error);
    } finally {
      setCreatingTransaction(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management System</h1>
          <p className="text-gray-600">Track your products and inventory transactions</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Management Section */}
          <Card>
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <Label htmlFor="product-name">Product Name</Label>
                  <Input
                    id="product-name"
                    value={productForm.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="product-sku">SKU</Label>
                  <Input
                    id="product-sku"
                    value={productForm.sku}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="Enter product SKU"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="product-stock">Initial Stock Level</Label>
                  <Input
                    id="product-stock"
                    type="number"
                    min="0"
                    value={productForm.stock_level}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setProductForm(prev => ({ ...prev, stock_level: parseInt(e.target.value) || 0 }))}
                    placeholder="Enter initial stock level"
                  />
                </div>
                
                <Button type="submit" disabled={creatingProduct} className="w-full">
                  {creatingProduct ? 'Creating...' : 'Add Product'}
                </Button>
              </form>
              
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Product List</h3>
                {loadingProducts ? (
                  <p className="text-gray-500">Loading products...</p>
                ) : products.length === 0 ? (
                  <p className="text-gray-500">No products found. Add your first product above.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {products.map((product) => (
                      <div 
                        key={product.id} 
                        className="flex justify-between items-center p-3 border rounded-lg bg-white"
                      >
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">Stock: {product.stock_level}</div>
                          <div className="text-xs text-gray-500">
                            Added: {product.created_at.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Transaction Section */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Record Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTransaction} className="space-y-4">
                  <div>
                    <Label htmlFor="transaction-sku">Product SKU</Label>
                    <Select 
                      value={transactionForm.product_sku}
                      onValueChange={(value) => 
                        setTransactionForm(prev => ({ ...prev, product_sku: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.sku}>
                            {product.name} ({product.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="transaction-type">Transaction Type</Label>
                    <Select 
                      value={transactionForm.transaction_type}
                      onValueChange={(value: 'stock-in' | 'stock-out') => 
                        setTransactionForm(prev => ({ ...prev, transaction_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stock-in">Stock In</SelectItem>
                        <SelectItem value="stock-out">Stock Out</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="transaction-quantity">Quantity</Label>
                    <Input
                      id="transaction-quantity"
                      type="number"
                      min="1"
                      value={transactionForm.quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setTransactionForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      required
                    />
                  </div>
                  
                  <Button type="submit" disabled={creatingTransaction} className="w-full">
                    {creatingTransaction ? 'Recording...' : 'Record Transaction'}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTransactions ? (
                  <p className="text-gray-500">Loading transactions...</p>
                ) : transactions.length === 0 ? (
                  <p className="text-gray-500">No transactions recorded yet.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {transactions.map((transaction) => (
                      <div 
                        key={transaction.id} 
                        className="flex justify-between items-center p-3 border rounded-lg bg-white"
                      >
                        <div>
                          <div className="font-medium">
                            {transaction.transaction_type === 'stock-in' ? 'Stock In' : 'Stock Out'}
                          </div>
                          <div className="text-sm text-gray-500">SKU: {transaction.product_sku}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">Qty: {transaction.quantity}</div>
                          <div className="text-xs text-gray-500">
                            {transaction.transaction_date.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
