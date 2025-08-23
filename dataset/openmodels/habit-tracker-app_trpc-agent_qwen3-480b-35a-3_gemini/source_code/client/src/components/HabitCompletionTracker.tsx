import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import type { HabitWithStreak } from '../../../server/src/schema';

interface HabitCompletionTrackerProps {
  habit: HabitWithStreak;
  onCompletionChange: () => void;
}

export function HabitCompletionTracker({ habit, onCompletionChange }: HabitCompletionTrackerProps) {
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if the habit is completed for today
  useEffect(() => {
    const checkCompletionStatus = async () => {
      try {
        // This is a simplified approach since we don't have a specific endpoint
        // In a real implementation, we would check the actual completion status
        setIsChecked(false); // Default to not completed
      } catch (error) {
        console.error('Failed to check completion status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkCompletionStatus();
  }, [habit.id]);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const input = {
        habit_id: habit.id,
        date: new Date(),
        completed: !isChecked
      };
      await trpc.markHabitCompletion.mutate(input);
      setIsChecked(!isChecked);
      onCompletionChange(); // Refresh the habit list to update streaks
    } catch (error) {
      console.error('Failed to mark habit completion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />;
  }

  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={`habit-${habit.id}`}
        checked={isChecked}
        onCheckedChange={handleToggle}
        disabled={isLoading}
        className="completion-checkbox"
      />
      <Label htmlFor={`habit-${habit.id}`} className="text-sm">
        Completed Today
      </Label>
    </div>
  );
}
