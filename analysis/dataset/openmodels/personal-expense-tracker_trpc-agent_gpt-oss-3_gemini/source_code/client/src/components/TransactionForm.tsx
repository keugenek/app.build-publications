import { useState, useEffect, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import type { CreateTransactionInput, Category } from '../../../server/src/schema';

export function TransactionForm() {
  const [formData, setFormData] = useState<CreateTransactionInput>({
    amount: 0,
    description: null,
    date: new Date(),
    category_id: 0,
    type: 'expense',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCategories = async () => {
    try {
      const cats = await trpc.getCategories.query();
      setCategories(cats);
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createTransaction.mutate(formData);
      // Reset form
      setFormData({
        amount: 0,
        description: null,
        date: new Date(),
        category_id: 0,
        type: 'expense',
      });
    } catch (err) {
      console.error('Failed to create transaction', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md">
      <h2 className="text-xl font-semibold">Add Transaction</h2>
      <Input
        type="number"
        placeholder="Amount"
        value={formData.amount}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
        }
        required
      />
      <Input
        placeholder="Description (optional)"
        value={formData.description || ''}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, description: e.target.value || null }))
        }
      />
      <Input
        type="date"
        value={
          // format date as YYYY-MM-DD for input value
          formData.date instanceof Date
            ? formData.date.toISOString().split('T')[0]
            : ''
        }
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, date: new Date(e.target.value) }))
        }
        required
      />
      <select
        className="w-full border rounded px-2 py-1"
        value={formData.category_id}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, category_id: parseInt(e.target.value) }))
        }
        required
      >
        <option value={0} disabled>
          Select Category
        </option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
      <select
        className="w-full border rounded px-2 py-1"
        value={formData.type}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, type: e.target.value as 'income' | 'expense' }))
        }
        required
      >
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Create Transaction'}
      </Button>
    </form>
  );
}
