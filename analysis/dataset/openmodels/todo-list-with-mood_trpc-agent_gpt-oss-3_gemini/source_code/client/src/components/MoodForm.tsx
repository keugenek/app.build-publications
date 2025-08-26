import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
// type-only import for mood entry input
import type { CreateMoodEntryInput } from '../../../server/src/schema';

interface MoodFormProps {
  onSubmit: (data: CreateMoodEntryInput) => Promise<void>;
  isLoading?: boolean;
}

export function MoodForm({ onSubmit, isLoading = false }: MoodFormProps) {
  const [formData, setFormData] = useState<CreateMoodEntryInput>({
    date: new Date(),
    rating: 5,
    note: null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Convert date to Date object (already is)
    await onSubmit(formData);
    // Reset after submit
    setFormData({
      date: new Date(),
      rating: 5,
      note: null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md shadow-sm bg-white">
      <Input
        type="date"
        value={formData.date.toISOString().split('T')[0]}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setFormData((prev) => ({
            ...prev,
            date: e.target.value ? new Date(e.target.value) : new Date(),
          }))
        }
        required
      />
      <Input
        type="number"
        min="1"
        max="10"
        value={formData.rating}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setFormData((prev) => ({ ...prev, rating: parseInt(e.target.value) || 5 }))
        }
        required
      />
      <Textarea
        placeholder="Note (optional)"
        value={formData.note ?? ''}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          setFormData((prev) => ({ ...prev, note: e.target.value || null }))
        }
      />
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Saving...' : 'Add Mood Entry'}
      </Button>
    </form>
  );
}
