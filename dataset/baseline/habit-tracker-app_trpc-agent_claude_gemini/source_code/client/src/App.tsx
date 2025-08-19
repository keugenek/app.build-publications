import { CreateHabitForm } from '@/components/CreateHabitForm';
import { HabitCard } from '@/components/HabitCard';
import { OverallStats } from '@/components/OverallStats';
import { AppHeader } from '@/components/AppHeader';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { HabitWithStreak, CreateHabitInput } from '../../server/src/schema';
import './App.css';

function App() {
  const [habits, setHabits] = useState<HabitWithStreak[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Load habits with streak information
  const loadHabits = useCallback(async () => {
    try {
      const result = await trpc.getHabitsWithStreaks.query();
      setHabits(result);
    } catch (error) {
      console.error('Failed to load habits:', error);
    }
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  // Create new habit
  const handleCreateHabit = async (formData: CreateHabitInput) => {
    setIsCreating(true);
    try {
      const newHabit = await trpc.createHabit.mutate(formData);
      // Transform the basic habit to HabitWithStreak format for consistency
      const habitWithStreak: HabitWithStreak = {
        ...newHabit,
        current_streak: 0,
        longest_streak: 0,
        total_completions: 0,
        is_completed_today: false
      };
      
      setHabits((prev: HabitWithStreak[]) => [...prev, habitWithStreak]);
    } catch (error) {
      console.error('Failed to create habit:', error);
      throw error; // Re-throw to let form handle the error
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle habit completion for today
  const handleToggleCompletion = async (habitId: number, isCompleted: boolean) => {
    try {
      if (isCompleted) {
        // Remove completion
        await trpc.removeHabitCompletion.mutate({
          habit_id: habitId,
          completed_at: new Date()
        });
      } else {
        // Mark as completed
        await trpc.markHabitCompleted.mutate({
          habit_id: habitId,
          completed_at: new Date()
        });
      }
      
      // Refresh habits to get updated streak information
      await loadHabits();
    } catch (error) {
      console.error('Failed to toggle habit completion:', error);
    }
  };

  // Delete habit
  const handleDeleteHabit = async (habitId: number) => {
    try {
      await trpc.deleteHabit.mutate({ id: habitId });
      setHabits((prev: HabitWithStreak[]) => prev.filter((h: HabitWithStreak) => h.id !== habitId));
    } catch (error) {
      console.error('Failed to delete habit:', error);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <AppHeader />

        {/* Overall Statistics */}
        <OverallStats habits={habits} />

        {/* Create Habit Form */}
        <div className="mb-8 flex justify-center">
          <CreateHabitForm 
            onSubmit={handleCreateHabit} 
            isLoading={isCreating} 
          />
        </div>

        {/* Habits List */}
        {habits.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-6 animate-bounce">🌱</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Your Habit Journey Starts Here!</h3>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Ready to build life-changing habits? Start with just one small, achievable goal.
            </p>
            <div className="bg-indigo-50 rounded-lg p-6 max-w-lg mx-auto border border-indigo-100">
              <h4 className="font-semibold text-indigo-800 mb-3">💡 Tips for Success:</h4>
              <ul className="text-sm text-indigo-700 space-y-2 text-left">
                <li>• Start small (e.g., "Read 5 minutes" not "Read 2 hours")</li>
                <li>• Be specific (e.g., "Drink water after breakfast")</li>
                <li>• Focus on consistency over intensity</li>
                <li>• Celebrate small wins! 🎉</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {habits.map((habit: HabitWithStreak) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onToggleCompletion={handleToggleCompletion}
                onDelete={handleDeleteHabit}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        {habits.length > 0 && (
          <div className="text-center mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Keep going! 💪 You're building amazing habits, one day at a time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
