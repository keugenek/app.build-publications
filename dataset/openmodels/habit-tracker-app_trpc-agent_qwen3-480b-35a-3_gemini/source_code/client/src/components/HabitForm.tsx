import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CreateHabitInput } from '../../../server/src/schema';

interface HabitFormProps {
  onSubmit: (data: CreateHabitInput) => Promise<void>;
  isLoading: boolean;
}

export function HabitForm({ onSubmit, isLoading }: HabitFormProps) {
  const [formData, setFormData] = useState<CreateHabitInput>({ name: '', description: null });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    // Reset form after successful submission
    setFormData({ name: '', description: null });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>✨</span>
          <span>Create New Habit</span>
        </CardTitle>
        <CardDescription>Add a new habit to track daily</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="habit-name">Habit Name</Label>
            <Input
              id="habit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Drink 8 glasses of water"
              required
              className="py-5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="habit-description">Description (Optional)</Label>
            <Input
              id="habit-description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
              placeholder="Add details about your habit"
              className="py-5"
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full py-5 text-base">
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-2">⏳</span>
                Creating...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <span className="mr-2">➕</span>
                Add Habit
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
