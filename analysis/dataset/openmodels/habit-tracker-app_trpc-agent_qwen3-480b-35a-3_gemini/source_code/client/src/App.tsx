import { useState, useEffect, useCallback } from 'react';
import { HabitCard } from '@/components/HabitCard';
import { HabitForm } from '@/components/HabitForm';
import { AppHeader } from '@/components/AppHeader';
import { trpc } from '@/utils/trpc';
import './App.css';
import type { HabitWithStreak, CreateHabitInput } from '../../server/src/schema';

function App() {
  const [habits, setHabits] = useState<HabitWithStreak[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadHabits = useCallback(async () => {
    try {
      const result = await trpc.getHabits.query();
      setHabits(result);
    } catch (error) {
      console.error('Failed to load habits:', error);
    }
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const handleCreateHabit = async (data: CreateHabitInput) => {
    setIsLoading(true);
    try {
      await trpc.createHabit.mutate(data);
      // Reload habits to get the new habit with proper streak data
      loadHabits();
    } catch (error) {
      console.error('Failed to create habit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompletionChange = useCallback(() => {
    // Refresh habits to get updated streaks
    loadHabits();
  }, [loadHabits]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <AppHeader />

        <div className="mb-8">
          <HabitForm onSubmit={handleCreateHabit} isLoading={isLoading} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {habits.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-5xl mb-4">🌟</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No habits yet. Add your first habit above!
              </p>
            </div>
          ) : (
            habits.map((habit) => (
              <HabitCard 
                key={habit.id} 
                habit={habit} 
                onCompletionChange={handleCompletionChange} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
