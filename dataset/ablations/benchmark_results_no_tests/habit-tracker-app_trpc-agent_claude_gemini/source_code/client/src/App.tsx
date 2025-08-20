import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HabitCard } from '@/components/HabitCard';
import { StatsCard } from '@/components/StatsCard';
import { WelcomeMessage } from '@/components/WelcomeMessage';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { HabitWithStreak, CreateHabitInput } from '../../server/src/schema';

function App() {
  const [habits, setHabits] = useState<HabitWithStreak[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Form state for creating new habits
  const [formData, setFormData] = useState<CreateHabitInput>({
    name: '',
    description: null
  });

  const loadHabits = useCallback(async () => {
    try {
      const result = await trpc.getHabitsWithStreaks.query();
      setHabits(result);
    } catch (error) {
      console.error('Failed to load habits:', error);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsCreating(true);
    try {
      const newHabit = await trpc.createHabit.mutate(formData);
      // Add the new habit with 0 streak to the list
      const habitWithStreak: HabitWithStreak = {
        ...newHabit,
        current_streak: 0
      };
      setHabits((prev: HabitWithStreak[]) => [...prev, habitWithStreak]);
      
      // Reset form
      setFormData({
        name: '',
        description: null
      });
    } catch (error) {
      console.error('Failed to create habit:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleTrackingUpdate = useCallback(() => {
    loadHabits();
  }, [loadHabits]);

  const handleHabitDeleted = useCallback(() => {
    loadHabits();
  }, [loadHabits]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎯 Habit Tracker
          </h1>
          <p className="text-gray-600 text-lg">
            Build better habits, one day at a time
          </p>
        </div>

        {/* Create New Habit Form */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              ➕ Create New Habit
            </CardTitle>
            <CardDescription className="text-indigo-100">
              Start tracking a new positive habit today
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div>
                <Input
                  placeholder="What habit do you want to build? (e.g., Read for 30 minutes)"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateHabitInput) => ({ ...prev, name: e.target.value }))
                  }
                  className="text-lg"
                  required
                />
              </div>
              <div>
                <Textarea
                  placeholder="Why is this habit important to you? (optional)"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateHabitInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  rows={3}
                />
              </div>
              <Button 
                type="submit" 
                disabled={isCreating || !formData.name.trim()}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              >
                {isCreating ? '✨ Creating...' : '🚀 Start This Habit'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Today's Date */}
        <div className="text-center mb-6">
          <Badge variant="outline" className="text-lg px-4 py-2">
            📅 Today: {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Badge>
        </div>

        {/* Stats Overview */}
        <StatsCard habits={habits} />

        {/* Habits List */}
        {isInitialLoading ? (
          <Card className="text-center py-12 border-0 shadow-lg">
            <CardContent>
              <div className="text-4xl mb-4 animate-spin">⏳</div>
              <h2 className="text-xl font-medium text-gray-600">
                Loading your habits...
              </h2>
            </CardContent>
          </Card>
        ) : habits.length === 0 ? (
          <WelcomeMessage />
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              📋 Your Habits ({habits.length})
            </h2>
            
            {habits.map((habit: HabitWithStreak) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onTrackingUpdate={handleTrackingUpdate}
                onHabitDeleted={handleHabitDeleted}
                isLoading={isLoading}
              />
            ))}
          </div>
        )}

        {/* Motivational Footer */}
        <div className="text-center mt-12 py-8">
          <p className="text-gray-500 italic">
            "We are what we repeatedly do. Excellence, then, is not an act, but a habit." - Aristotle
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
