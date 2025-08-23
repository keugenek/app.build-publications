import { useEffect, useState, useCallback } from 'react';
import { trpc } from '@/utils/trpc';

import { Checkbox } from '@/components/ui/checkbox';
import type { Habit } from '../../../server/src/schema';

interface HabitWithStreak extends Habit {
  streak: number;
  // Track if marked today locally
  markedToday?: boolean;
}

export function HabitList() {
  const [habits, setHabits] = useState<HabitWithStreak[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHabits = useCallback(async () => {
    setLoading(true);
    try {
      const fetched = await trpc.getHabits.query();
      // For each habit, fetch its streak
      const habitsWithStreak = await Promise.all(
        fetched.map(async (h) => {
          const streak = await trpc.getHabitStreak.query({ habit_id: h.id });
          return { ...h, streak, markedToday: false } as HabitWithStreak;
        })
      );
      setHabits(habitsWithStreak);
    } catch (e) {
      console.error('Error loading habits', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const handleMark = async (habitId: number) => {
    // Mark completion for today (no date passed defaults to today)
    await trpc.markHabitCompletion.mutate({ habit_id: habitId });
    // After marking, refresh streak for that habit
    const newStreak = await trpc.getHabitStreak.query({ habit_id: habitId });
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habitId ? { ...h, streak: newStreak, markedToday: true } : h
      )
    );
  };

  if (loading) return <p className="text-gray-500">Loading habits...</p>;
  if (habits.length === 0) return <p className="text-gray-500">No habits yet. Add one!</p>;

  return (
    <div className="space-y-4">
      {habits.map((habit) => (
        <div
          key={habit.id}
          className="border p-4 rounded-md bg-white shadow-sm flex items-center justify-between"
        >
          <div>
            <h3 className="text-lg font-medium">{habit.name}</h3>
            {habit.description && (
              <p className="text-sm text-gray-600">{habit.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">Streak: {habit.streak} day(s)</p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Simple checkbox to indicate today marked */}
            <Checkbox
              checked={habit.markedToday}
              onCheckedChange={() => handleMark(habit.id)}
            />
            <span className="text-sm">Today</span>
          </div>
        </div>
      ))}
    </div>
  );
}
