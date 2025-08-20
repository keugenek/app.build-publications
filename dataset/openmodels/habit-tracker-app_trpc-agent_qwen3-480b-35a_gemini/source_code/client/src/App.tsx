import { useState, useEffect, useCallback } from 'react';
import { HabitForm } from '@/components/HabitForm';
import { HabitItem } from '@/components/HabitItem';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import type { HabitWithStreak, CreateHabitInput } from '../../server/src/schema';

function App() {
  const [habits, setHabits] = useState<HabitWithStreak[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const loadHabits = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getHabits.query();
      setHabits(result);
    } catch (error) {
      console.error('Failed to load habits:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const handleCreateHabit = async (input: CreateHabitInput) => {
    setIsCreating(true);
    try {
      await trpc.createHabit.mutate(input);
      await loadHabits(); // Refresh the list
    } catch (error) {
      console.error('Failed to create habit:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleHabit = async (habit: HabitWithStreak) => {
    try {
      await trpc.updateHabit.mutate({
        id: habit.id,
        is_completed_today: !habit.is_completed_today
      });
      await loadHabits(); // Refresh the list
    } catch (error) {
      console.error('Failed to update habit:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">Habit Tracker</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Build positive habits, one day at a time
          </p>
        </header>

        <HabitForm onCreateHabit={handleCreateHabit} isCreating={isCreating} />

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Your Habits</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {habits.length} {habits.length === 1 ? 'habit' : 'habits'}
            </span>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading your habits...</p>
            </div>
          ) : habits.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-5xl mb-4">🏆</div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No habits yet</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Start by adding your first habit above
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {habits.map((habit) => (
                <HabitItem 
                  key={habit.id} 
                  habit={habit} 
                  onToggle={handleToggleHabit} 
                />
              ))}
            </div>
          )}
        </div>

        <footer className="text-center mt-12 text-gray-600 dark:text-gray-400 text-sm">
          <p>Built with ❤️ to help you build better habits</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
