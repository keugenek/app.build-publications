import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
// type-only import for task creation input
import type { CreateTaskInput } from '../../../server/src/schema';

interface TaskFormProps {
  onSubmit: (data: CreateTaskInput) => Promise<void>;
  isLoading?: boolean;
}

export function TaskForm({ onSubmit, isLoading = false }: TaskFormProps) {
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: '',
    description: null,
    completed: false,
    due_date: null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    // Reset form after successful submission
    setFormData({
      title: '',
      description: null,
      completed: false,
      due_date: null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md shadow-sm bg-white">
      <Input
        placeholder="Task title"
        value={formData.title}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setFormData((prev) => ({ ...prev, title: e.target.value }))
        }
        required
      />
      <Textarea
        placeholder="Description (optional)"
        value={formData.description ?? ''}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          setFormData((prev) => ({ ...prev, description: e.target.value || null }))
        }
      />
      <div className="flex items-center space-x-2">
        <Checkbox
          id="completed"
          checked={formData.completed}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({ ...prev, completed: !!checked }))
          }
        />
        <label htmlFor="completed" className="text-sm">Completed</label>
      </div>
      <Input
        type="date"
        placeholder="Due date"
        value={formData.due_date ? (formData.due_date as Date).toISOString().split('T')[0] : ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setFormData((prev) => ({
            ...prev,
            due_date: e.target.value ? new Date(e.target.value) : null,
          }))
        }
      />
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Saving...' : 'Add Task'}
      </Button>
    </form>
  );
}
