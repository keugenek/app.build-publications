import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Habit, CreateHabitInput, HabitCheck } from '../../server/src/schema';

function App() {
  // State
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checks, setChecks] = useState<HabitCheck[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateHabitInput>({
    name: '',
    description: null,
  });

  // Load habits
  const loadHabits = useCallback(async () => {
    try {
      const data = await trpc.getHabits.query();
      setHabits(data);
    } catch (err) {
      console.error('Failed to load habits', err);
    }
  }, []);

  // Load habit checks
  const loadChecks = useCallback(async () => {
    try {
      const data = await trpc.getHabitChecks.query();
      setChecks(data);
    } catch (err) {
      console.error('Failed to load habit checks', err);
    }
  }, []);

  useEffect(() => {
    loadHabits();
    loadChecks();
  }, [loadHabits, loadChecks]);

  // Helper: is habit checked today?
  const isCheckedToday = (habitId: number) => {
    const today = new Date();
    return checks.some(
      (c) =>
        c.habit_id === habitId &&
        new Date(c.check_date).toDateString() === today.toDateString()
    );
  };

  // Compute streak of consecutive days (including today if checked)
  const computeStreak = (habitId: number) => {
    // Get checks for this habit, sort descending
    const habitChecks = checks
      .filter((c) => c.habit_id === habitId)
      .map((c) => new Date(c.check_date))
      .sort((a, b) => b.getTime() - a.getTime());
    if (habitChecks.length === 0) return 0;
    let streak = 0;
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    for (const checkDate of habitChecks) {
      const checkDay = new Date(checkDate);
      checkDay.setHours(0, 0, 0, 0);
      if (checkDay.getTime() === day.getTime()) {
        streak++;
        day.setDate(day.getDate() - 1);
      } else {
        // Stop at first missing day
        break;
      }
    }
    return streak;
  };

  // Create habit handler
  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newHabit = await trpc.createHabit.mutate(formData);
      setHabits((prev) => [...prev, newHabit]);
      setFormData({ name: '', description: null });
    } catch (err) {
      console.error('Failed to create habit', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Check today handler
  const handleCheckToday = async (habitId: number) => {
    try {
      await trpc.createHabitCheck.mutate({ habit_id: habitId });
      await loadChecks();
    } catch (err) {
      console.error('Failed to check habit', err);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Habit Tracker</h1>

      {/* Habit creation form */}
      <form onSubmit={handleCreateHabit} className="space-y-4 mb-8 border p-4 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Add a New Habit</h2>
        <Input
          placeholder="Habit name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          required
        />
        <Input
          placeholder="Description (optional)"
          value={formData.description ?? ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value || null }))}
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Creating...' : 'Create Habit'}
        </Button>
      </form>

      {/* Habit list */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Your Habits</h2>
        {habits.length === 0 ? (
          <p className="text-gray-500">No habits yet. Add one above!</p>
        ) : (
          <ul className="space-y-4">
            {habits.map((habit) => (
              <li
                key={habit.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-white shadow"
              >
                <div>
                  <p className="text-lg font-medium">{habit.name}</p>
                  {habit.description && (
                    <p className="text-sm text-gray-600">{habit.description}</p>
                  )}
                </div>
                <div className="flex flex-col items-start space-y-1">
                  <div className="flex items-center space-x-2">
                    {isCheckedToday(habit.id) ? (
                      <Badge variant="secondary" className="bg-green-500 text-white">
                        Checked Today
                      </Badge>
                    ) : (
                      <Button size="sm" onClick={() => handleCheckToday(habit.id)}>
                        Check Today
                      </Button>
                    )}
                  </div>
                  <Badge variant="default" className="bg-blue-500 text-white mt-1">
                    Streak: {computeStreak(habit.id)} day{computeStreak(habit.id) !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default App;
