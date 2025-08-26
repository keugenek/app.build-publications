import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import type { CreateHabitInput, Habit } from '../../../server/src/schema';

interface HabitFormProps {
  onHabitCreated: (habit: Habit) => void;
  isLoading?: boolean;
}

export function HabitForm({ onHabitCreated, isLoading = false }: HabitFormProps) {
  const [formData, setFormData] = useState<CreateHabitInput>({
    name: '',
    description: null,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const created = await trpc.createHabit.mutate(formData);
    onHabitCreated(created);
    setFormData({ name: '', description: null });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 border rounded-md bg-white shadow-sm">
      <h2 className="text-lg font-semibold">Add New Habit</h2>
      <Input
        placeholder="Habit name"
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
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Creating...' : 'Create Habit'}
      </Button>
    </form>
  );
}
