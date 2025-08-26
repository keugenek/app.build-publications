import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CreateHabitInput } from '../../../server/src/schema';

interface HabitFormProps {
  onCreateHabit: (input: CreateHabitInput) => Promise<void>;
  isCreating: boolean;
}

export function HabitForm({ onCreateHabit, isCreating }: HabitFormProps) {
  const [habitName, setHabitName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;
    
    await onCreateHabit({ name: habitName.trim() });
    setHabitName('');
  };

  return (
    <Card className="mb-8 shadow-lg">
      <CardHeader>
        <CardTitle>Create New Habit</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
            placeholder="Enter habit name (e.g., Drink 8 glasses of water)"
            className="flex-1"
            disabled={isCreating}
          />
          <Button type="submit" disabled={isCreating || !habitName.trim()}>
            {isCreating ? 'Creating...' : 'Add Habit'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
