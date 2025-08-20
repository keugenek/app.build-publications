import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CalendarIcon, CheckCircle, Circle, Plus, Shuffle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Chore, CreateChoreInput } from '../../server/src/schema';

function App() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [weeklyChores, setWeeklyChores] = useState<Chore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [newChoreName, setNewChoreName] = useState('');

  // Get the start of the current week (Monday)
  const getCurrentWeekStart = useCallback(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(now.setDate(diff));
  }, []);

  const loadAllChores = useCallback(async () => {
    try {
      const result = await trpc.getChores.query();
      setChores(result);
    } catch (error) {
      console.error('Failed to load chores:', error);
    }
  }, []);

  const loadWeeklyChores = useCallback(async () => {
    try {
      const result = await trpc.getWeeklyChores.query({ 
        weekStartDate: getCurrentWeekStart() 
      });
      setWeeklyChores(result);
    } catch (error) {
      console.error('Failed to load weekly chores:', error);
    }
  }, [getCurrentWeekStart]);

  useEffect(() => {
    loadAllChores();
    loadWeeklyChores();
  }, [loadAllChores, loadWeeklyChores]);

  const handleCreateChore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChoreName.trim()) return;

    setIsLoading(true);
    try {
      const choreInput: CreateChoreInput = { name: newChoreName.trim() };
      const newChore = await trpc.createChore.mutate(choreInput);
      setChores((prev: Chore[]) => [newChore, ...prev]);
      setNewChoreName('');
      // Refresh weekly chores in case the new chore was assigned to this week
      await loadWeeklyChores();
    } catch (error) {
      console.error('Failed to create chore:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCompletion = async (chore: Chore) => {
    try {
      const updatedChore = await trpc.updateChoreCompletion.mutate({
        id: chore.id,
        is_completed: !chore.is_completed
      });
      
      // Update both lists
      setChores((prev: Chore[]) => 
        prev.map((c: Chore) => c.id === chore.id ? updatedChore : c)
      );
      setWeeklyChores((prev: Chore[]) => 
        prev.map((c: Chore) => c.id === chore.id ? updatedChore : c)
      );
    } catch (error) {
      console.error('Failed to update chore:', error);
    }
  };

  const handleAssignWeeklyChores = async () => {
    setIsAssigning(true);
    try {
      const weekStart = getCurrentWeekStart();
      const assignedChores = await trpc.assignWeeklyChores.mutate({
        week_start_date: weekStart
      });
      setWeeklyChores(assignedChores);
      // Refresh all chores to include the new assignments
      await loadAllChores();
    } catch (error) {
      console.error('Failed to assign weekly chores:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const completedCount = weeklyChores.filter(chore => chore.is_completed).length;
  const totalCount = weeklyChores.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🏠 Chore Manager
          </h1>
          <p className="text-gray-600">
            Stay organized and keep your home tidy with weekly chore assignments
          </p>
        </div>

        <Tabs defaultValue="weekly" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              This Week
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Circle className="h-4 w-4" />
              All Chores
            </TabsTrigger>
          </TabsList>

          {/* Weekly Chores Tab */}
          <TabsContent value="weekly" className="space-y-6">
            {/* Week Summary Card */}
            <Card className="bg-white shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    Week of {formatDate(getCurrentWeekStart())}
                  </div>
                  <Badge variant={completedCount === totalCount && totalCount > 0 ? "default" : "secondary"}>
                    {completedCount}/{totalCount} Complete
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 mb-4">
                  <Button
                    onClick={handleAssignWeeklyChores}
                    disabled={isAssigning}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Shuffle className="h-4 w-4" />
                    {isAssigning ? 'Assigning...' : 'Randomly Assign Chores'}
                  </Button>
                </div>

                {weeklyChores.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Circle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No chores assigned for this week yet!</p>
                    <p className="text-sm">Click "Randomly Assign Chores" to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {weeklyChores.map((chore: Chore) => (
                      <div
                        key={chore.id}
                        className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                          chore.is_completed
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <Checkbox
                          checked={chore.is_completed}
                          onCheckedChange={() => handleToggleCompletion(chore)}
                          className="h-5 w-5"
                        />
                        <div className="flex-1">
                          <p className={`font-medium ${
                            chore.is_completed 
                              ? 'text-green-800 line-through' 
                              : 'text-gray-800'
                          }`}>
                            {chore.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Assigned: {formatDate(chore.assigned_date)}
                          </p>
                        </div>
                        {chore.is_completed && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Chores Tab */}
          <TabsContent value="all" className="space-y-6">
            {/* Add New Chore */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-indigo-600" />
                  Add New Chore
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateChore} className="flex gap-3">
                  <Input
                    value={newChoreName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setNewChoreName(e.target.value)
                    }
                    placeholder="Enter chore name (e.g., 'Take out trash', 'Vacuum living room')"
                    className="flex-1"
                    required
                  />
                  <Button 
                    type="submit" 
                    disabled={isLoading || !newChoreName.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isLoading ? 'Adding...' : 'Add Chore'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* All Chores List */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>All Chores ({chores.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {chores.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Circle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No chores created yet!</p>
                    <p className="text-sm">Add your first chore above to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chores.map((chore: Chore) => (
                      <div
                        key={chore.id}
                        className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                          chore.is_completed
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <Checkbox
                          checked={chore.is_completed}
                          onCheckedChange={() => handleToggleCompletion(chore)}
                          className="h-5 w-5"
                        />
                        <div className="flex-1">
                          <p className={`font-medium ${
                            chore.is_completed 
                              ? 'text-green-800 line-through' 
                              : 'text-gray-800'
                          }`}>
                            {chore.name}
                          </p>
                          <div className="flex gap-4 text-sm text-gray-500">
                            <span>Assigned: {formatDate(chore.assigned_date)}</span>
                            <span>Created: {formatDate(chore.created_at)}</span>
                          </div>
                        </div>
                        {chore.is_completed && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
