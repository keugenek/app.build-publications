import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import type { Product, StockMovementWithProduct, CreateStockMovementInput, StockMovementType } from '../../../server/src/schema';

export function StockMovements() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovementWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  
  // Form state for creating stock movements
  const [movementForm, setMovementForm] = useState<CreateStockMovementInput>({
    product_id: 0,
    movement_type: 'stock-in',
    quantity: 1,
    notes: null
  });

  // Load data from API
  const loadData = useCallback(async () => {
    try {
      const [productsData, movementsData] = await Promise.all([
        trpc.getProducts.query(),
        trpc.getStockMovements.query()
      ]);
      setProducts(productsData);
      setStockMovements(movementsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle creating new stock movement
  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newMovement = await trpc.createStockMovement.mutate(movementForm);
      
      // Refresh data to get updated stock levels and movement list
      await loadData();
      
      // Reset form
      setMovementForm({
        product_id: 0,
        movement_type: 'stock-in',
        quantity: 1,
        notes: null
      });
      setSelectedProductId('');
    } catch (error) {
      console.error('Failed to create stock movement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle product selection change
  const handleProductChange = (value: string) => {
    setSelectedProductId(value);
    setMovementForm((prev: CreateStockMovementInput) => ({
      ...prev,
      product_id: parseInt(value) || 0
    }));
  };

  // Get movement type badge variant
  const getMovementBadgeVariant = (movementType: StockMovementType) => {
    return movementType === 'stock-in' ? 'default' : 'secondary';
  };

  // Get movement type display with emoji
  const getMovementTypeDisplay = (movementType: StockMovementType) => {
    return movementType === 'stock-in' ? '📈 Stock In' : '📉 Stock Out';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">📊 Stock Movements</h2>
      </div>

      <Tabs defaultValue="movements" className="w-full">
        <TabsList>
          <TabsTrigger value="movements">Recent Movements</TabsTrigger>
          <TabsTrigger value="record">Record Movement</TabsTrigger>
        </TabsList>

        <TabsContent value="movements" className="space-y-4">
          {stockMovements.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">No stock movements recorded yet. Record your first movement to track inventory changes! 📈</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {stockMovements.map((movement: StockMovementWithProduct) => (
                <Card key={movement.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{movement.product.name}</CardTitle>
                      <Badge variant={getMovementBadgeVariant(movement.movement_type)}>
                        {getMovementTypeDisplay(movement.movement_type)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">SKU:</span> {movement.product.sku}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Quantity:</span> {movement.quantity} units
                          </p>
                          <p className="text-xs text-gray-400">
                            {movement.created_at.toLocaleDateString()} at {movement.created_at.toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Current Stock:</span> {movement.product.stock_level}
                          </p>
                        </div>
                      </div>
                      {movement.notes && (
                        <div className="mt-3 p-2 bg-gray-50 rounded">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">📝 Notes:</span> {movement.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="record">
          <Card>
            <CardHeader>
              <CardTitle>📝 Record Stock Movement</CardTitle>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No products available. Create products first before recording stock movements! 📦</p>
                </div>
              ) : (
                <form onSubmit={handleCreateMovement} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="product-select">Product</Label>
                    <Select value={selectedProductId} onValueChange={handleProductChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product: Product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name} ({product.sku}) - {product.stock_level} in stock
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="movement-type">Movement Type</Label>
                    <Select
                      value={movementForm.movement_type}
                      onValueChange={(value: StockMovementType) =>
                        setMovementForm((prev: CreateStockMovementInput) => ({
                          ...prev,
                          movement_type: value
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stock-in">📈 Stock In (Adding inventory)</SelectItem>
                        <SelectItem value="stock-out">📉 Stock Out (Removing inventory)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      placeholder="Enter quantity"
                      value={movementForm.quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setMovementForm((prev: CreateStockMovementInput) => ({
                          ...prev,
                          quantity: parseInt(e.target.value) || 1
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any notes about this stock movement..."
                      value={movementForm.notes || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setMovementForm((prev: CreateStockMovementInput) => ({
                          ...prev,
                          notes: e.target.value || null
                        }))
                      }
                      rows={3}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !selectedProductId}
                    className="w-full"
                  >
                    {isLoading ? 'Recording...' : '✅ Record Movement'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
