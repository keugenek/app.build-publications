import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Calendar, Trophy } from 'lucide-react';
import { HabitForm } from '@/components/HabitForm';
import { HabitStats } from '@/components/HabitStats';
import { HabitCard } from '@/components/HabitCard';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { HabitWithStreak, CreateHabitInput, Habit } from '../../server/src/schema';

function App() {
  const [habits, setHabits] = useState<HabitWithStreak[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

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
    setIsLoading(true);
    try {
      const newHabit = await trpc.createHabit.mutate(formData);
      
      // Convert Habit to HabitWithStreak format for display
      const habitWithStreak: HabitWithStreak = {
        ...newHabit,
        current_streak: 0,
        last_completed: null
      };

      setHabits((prev: HabitWithStreak[]) => [...prev, habitWithStreak]);
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to create habit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check in a habit
  const handleCheckIn = async (habitId: number) => {
    setIsCheckingIn(habitId);
    try {
      await trpc.checkInHabit.mutate({
        habit_id: habitId,
        completed_at: new Date()
      });

      // Refresh habits to update streak information
      await loadHabits();
    } catch (error) {
      console.error('Failed to check in habit:', error);
    } finally {
      setIsCheckingIn(null);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Habit Tracker
          </h1>
          <p className="text-gray-600">Build lasting habits, track your progress, and celebrate your streaks! 🎯</p>
        </div>

        {/* Statistics Dashboard */}
        <HabitStats habits={habits} />

        {/* Add Habit Button */}
        <div className="flex justify-center mb-6">
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-2 btn-gradient-hover"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showAddForm ? 'Cancel' : 'Add New Habit'}
          </Button>
        </div>

        {/* Add Habit Form */}
        {showAddForm && (
          <HabitForm
            onSubmit={handleCreateHabit}
            onCancel={() => setShowAddForm(false)}
            isLoading={isLoading}
          />
        )}

        {/* Habits List */}
        {habits.length === 0 ? (
          <Card className="text-center py-12 border-dashed border-2 border-purple-200">
            <CardContent>
              <Calendar className="h-16 w-16 text-purple-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No habits yet!</h3>
              <p className="text-gray-500 mb-4">
                Start building amazing habits today. Every expert was once a beginner! 🌟
              </p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Habit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {habits.map((habit: HabitWithStreak) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onCheckIn={handleCheckIn}
                isCheckingIn={isCheckingIn === habit.id}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-purple-200">
          <p className="text-gray-500 text-sm">
            💡 <strong>Tip:</strong> Consistency beats perfection. Even one day at a time builds lasting change!
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
