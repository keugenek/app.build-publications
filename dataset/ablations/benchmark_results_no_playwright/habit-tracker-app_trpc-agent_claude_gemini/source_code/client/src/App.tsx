import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { HabitCard } from '@/components/HabitCard';
import { HabitStats } from '@/components/HabitStats';
import { EmptyHabits } from '@/components/EmptyHabits';
import { HabitForm } from '@/components/HabitForm';
import { MotivationalQuote } from '@/components/MotivationalQuote';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { HabitWithStreak, CreateHabitInput } from '../../server/src/schema';

function App() {
  const [habits, setHabits] = useState<HabitWithStreak[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  // Handle creating a new habit
  const handleCreateHabit = async (formData: CreateHabitInput) => {
    setIsLoading(true);
    try {
      const newHabit = await trpc.createHabit.mutate(formData);
      // Transform the basic habit to HabitWithStreak format for consistency
      const habitWithStreak: HabitWithStreak = {
        ...newHabit,
        current_streak: 0,
        longest_streak: 0,
        completed_today: false
      };
      setHabits((prev: HabitWithStreak[]) => [...prev, habitWithStreak]);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create habit:', error);
      throw error; // Re-throw to let the form handle the error
    } finally {
      setIsLoading(false);
    }
  };

  // Handle marking habit as complete/incomplete for today
  const handleToggleHabit = async (habitId: number, currentCompleted: boolean) => {
    const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD format
    
    try {
      await trpc.markHabitComplete.mutate({
        habit_id: habitId,
        date: today,
        completed: !currentCompleted
      });
      
      // Update the local state optimistically
      setHabits((prev: HabitWithStreak[]) => 
        prev.map((habit: HabitWithStreak) => 
          habit.id === habitId 
            ? { 
                ...habit, 
                completed_today: !currentCompleted,
                // Optimistically update streak (simplified logic)
                current_streak: !currentCompleted 
                  ? habit.current_streak + 1 
                  : Math.max(0, habit.current_streak - 1)
              }
            : habit
        )
      );
    } catch (error) {
      console.error('Failed to update habit:', error);
    }
  };



  // Get current date information
  const today = new Date();
  const todayString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎯 Habit Tracker
            </h1>
            <p className="text-gray-600 mb-1">Build positive habits, one day at a time</p>
            <p className="text-sm text-blue-600 font-medium">
              📅 {todayString}
            </p>
          </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg">
              ➕ New Habit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">✨ Create New Habit</DialogTitle>
            </DialogHeader>
            <HabitForm 
              onSubmit={handleCreateHabit}
              onCancel={() => setIsDialogOpen(false)}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      {habits.length === 0 ? (
        <EmptyHabits onCreateHabit={() => setIsDialogOpen(true)} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4">
            {habits.map((habit: HabitWithStreak) => (
              <HabitCard 
                key={habit.id} 
                habit={habit} 
                onToggle={handleToggleHabit}
              />
            ))}
          </div>
          
          <HabitStats habits={habits} />
          
          <MotivationalQuote habits={habits} />
        </div>
      )}
      </div>
    </div>
  );
}

export default App;
