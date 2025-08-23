import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { CreateProductInput } from '../../../server/src/schema';
import { useState } from 'react';

interface ProductFormProps {
  onSubmit: (data: CreateProductInput) => Promise<void>;
  isLoading?: boolean;
}

export function ProductForm({ onSubmit, isLoading = false }: ProductFormProps) {
  const [formData, setFormData] = useState<CreateProductInput>({
    name: '',
    sku: '',
    stock_quantity: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({ name: '', sku: '', stock_quantity: 0 });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md shadow-sm">
      <h2 className="text-lg font-semibold">Add New Product</h2>
      <Input
        placeholder="Product name"
        value={formData.name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setFormData((prev) => ({ ...prev, name: e.target.value }))
        }
        required
      />
      <Input
        placeholder="SKU"
        value={formData.sku}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setFormData((prev) => ({ ...prev, sku: e.target.value }))
        }
        required
      />
      <Input
        type="number"
        placeholder="Initial stock"
        value={formData.stock_quantity}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setFormData((prev) => ({
            ...prev,
            stock_quantity: parseInt(e.target.value) || 0,
          }))
        }
        min="0"
        required
      />
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Creating...' : 'Create Product'}
      </Button>
    </form>
  );
}
