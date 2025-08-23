import { useState, useEffect, useCallback } from 'react';
// Habit tracking application with tRPC backend integration
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import type { CreateHabitInput, HabitWithStreak, TrackHabitInput } from '../../server/src/schema';

function App() {
  const [habits, setHabits] = useState<HabitWithStreak[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddHabitDialog, setShowAddHabitDialog] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<CreateHabitInput>({
    name: '',
    description: null
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createHabit.mutate(formData);
      setFormData({ name: '', description: null });
      setShowAddHabitDialog(false);
      loadHabits();
    } catch (error) {
      console.error('Failed to create habit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrackHabit = async (habitId: number, completed: boolean) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const trackData: TrackHabitInput = {
        habit_id: habitId,
        date: today,
        completed
      };
      
      await trpc.trackHabit.mutate(trackData);
      loadHabits(); // Refresh to update streaks
    } catch (error) {
      console.error('Failed to track habit:', error);
    }
  };

  const handleDeleteHabit = async () => {
    if (habitToDelete === null) return;
    
    try {
      await trpc.deleteHabit.mutate(habitToDelete);
      loadHabits();
      setHabitToDelete(null);
    } catch (error) {
      console.error('Failed to delete habit:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">Habit Tracker</h1>
          <p className="text-lg text-indigo-700">Build better habits, one day at a time</p>
        </div>

        <div className="flex justify-center mb-8">
          <Dialog open={showAddHabitDialog} onOpenChange={setShowAddHabitDialog}>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full shadow-lg"
              >
                + Add New Habit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Habit</DialogTitle>
                <DialogDescription>
                  Add a new habit you want to track daily.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateHabitInput) => ({ ...prev, name: e.target.value }))
                      }
                      className="col-span-3"
                      placeholder="e.g. Drink 8 glasses of water"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setFormData((prev: CreateHabitInput) => ({
                          ...prev,
                          description: e.target.value || null
                        }))
                      }
                      className="col-span-3"
                      placeholder="Optional details about your habit..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Habit'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {habits.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-5xl mb-4">🌱</div>
              <h3 className="text-xl font-semibold mb-2">No habits yet</h3>
              <p className="text-gray-600 mb-4">Start building better habits by adding your first one!</p>
              <Button 
                onClick={() => setShowAddHabitDialog(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Create Your First Habit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {habits.map((habit: HabitWithStreak) => (
              <Card key={habit.id} className="flex flex-col border-indigo-100 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-indigo-900">{habit.name}</CardTitle>
                      {habit.description && (
                        <CardDescription className="mt-2 text-gray-600">{habit.description}</CardDescription>
                      )}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setHabitToDelete(habit.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          ×
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete your habit and all its tracking data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDeleteHabit}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox
                      id={`habit-${habit.id}`}
                      checked={false} // In a real app, this would check today's tracking status
                      onCheckedChange={(checked) => handleTrackHabit(habit.id, !!checked)}
                      className="h-5 w-5"
                    />
                    <label
                      htmlFor={`habit-${habit.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Mark as completed today
                    </label>
                  </div>
                  
                  <div className="flex space-x-4 mt-6">
                    <div className="text-center bg-indigo-50 rounded-lg p-3 flex-1">
                      <div className="text-2xl font-bold text-indigo-700">{habit.current_streak}</div>
                      <div className="text-xs text-gray-500">Current Streak</div>
                    </div>
                    <div className="text-center bg-indigo-50 rounded-lg p-3 flex-1">
                      <div className="text-2xl font-bold text-indigo-700">{habit.longest_streak}</div>
                      <div className="text-xs text-gray-500">Longest Streak</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{habit.current_streak} days</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, habit.current_streak * 10)}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
