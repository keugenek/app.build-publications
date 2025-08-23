import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import type { CreateCategoryInput } from '../../../server/src/schema';

export function CategoryForm() {
  const [formData, setFormData] = useState<CreateCategoryInput>({
    name: '',
    description: null,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await trpc.createCategory.mutate(formData);
      // Reset form
      setFormData({ name: '', description: null });
    } catch (err) {
      console.error('Failed to create category', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md">
      <h2 className="text-xl font-semibold">Add Category</h2>
      <Input
        placeholder="Category name"
        value={formData.name}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, name: e.target.value }))
        }
        required
      />
      <Input
        placeholder="Description (optional)"
        value={formData.description || ''}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            description: e.target.value || null,
          }))
        }
      />
      <Button type="submit">Create Category</Button>
    </form>
  );
}
