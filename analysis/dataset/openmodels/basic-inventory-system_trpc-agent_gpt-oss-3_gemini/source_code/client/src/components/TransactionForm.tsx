import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import type { CreateStockTransactionInput, TransactionType } from '../../../server/src/schema';
import type { Product } from '../../../server/src/schema';

export function TransactionForm() {
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<CreateStockTransactionInput>({
    product_id: 0,
    type: 'stock_in',
    quantity: 1,
  });
  const [loading, setLoading] = useState(false);

  // Load products for dropdown
  const loadProducts = useCallback(async () => {
    try {
      const data = await trpc.getProducts.query();
      setProducts(data);
    } catch (e) {
      console.error('Failed to load products', e);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id) return;
    setLoading(true);
    try {
      await trpc.createStockTransaction.mutate(formData);
      // Reset form
      setFormData({ product_id: 0, type: 'stock_in', quantity: 1 });
    } catch (err) {
      console.error('Failed to create transaction', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md shadow-sm">
      <h2 className="text-lg font-semibold">Record Stock Transaction</h2>
      <Select
        value={String(formData.product_id)}
        onValueChange={(value) =>
          setFormData((prev) => ({ ...prev, product_id: Number(value) }))
        }
        disabled={products.length === 0}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select product" />
        </SelectTrigger>
        <SelectContent>
          {products.map((p) => (
            <SelectItem key={p.id} value={String(p.id)}>
              {p.name} (SKU: {p.sku})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={formData.type}
        onValueChange={(value) =>
          setFormData((prev) => ({ ...prev, type: value as TransactionType }))
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select transaction type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="stock_in">Stock In</SelectItem>
          <SelectItem value="stock_out">Stock Out</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="number"
        placeholder="Quantity"
        value={formData.quantity}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            quantity: parseInt(e.target.value) || 1,
          }))
        }
        min="1"
        required
      />
      <Button type="submit" disabled={loading || !formData.product_id} className="w-full">
        {loading ? 'Saving...' : 'Record Transaction'}
      </Button>
    </form>
  );
}
