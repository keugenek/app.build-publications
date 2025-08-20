import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { ChoreList } from '@/components/ChoreList';
import { WeeklyAssignments } from '@/components/WeeklyAssignments';
import { CreateChoreDialog } from '@/components/CreateChoreDialog';
import { GenerateAssignmentsDialog } from '@/components/GenerateAssignmentsDialog';
// Using type-only imports for better TypeScript compliance
import type { Chore, ChoreAssignmentView } from '../../server/src/schema';

function App() {
  // Explicit typing with interface
  const [chores, setChores] = useState<Chore[]>([]);
  const [currentWeekAssignments, setCurrentWeekAssignments] = useState<ChoreAssignmentView[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // useCallback to memoize functions used in useEffect
  const loadChores = useCallback(async () => {
    try {
      const result = await trpc.getChores.query();
      setChores(result);
    } catch (error) {
      console.error('Failed to load chores:', error);
    }
  }, []);

  const loadCurrentWeekAssignments = useCallback(async () => {
    try {
      const result = await trpc.getCurrentWeekAssignments.query();
      setCurrentWeekAssignments(result);
    } catch (error) {
      console.error('Failed to load current week assignments:', error);
    }
  }, []);

  // useEffect with proper dependencies
  useEffect(() => {
    loadChores();
    loadCurrentWeekAssignments();
  }, [loadChores, loadCurrentWeekAssignments]);

  const handleChoreCreated = useCallback((newChore: Chore) => {
    setChores((prev: Chore[]) => [...prev, newChore]);
  }, []);

  const handleChoreUpdated = useCallback((updatedChore: Chore) => {
    setChores((prev: Chore[]) => 
      prev.map((chore: Chore) => chore.id === updatedChore.id ? updatedChore : chore)
    );
  }, []);

  const handleChoreDeleted = useCallback((choreId: number) => {
    setChores((prev: Chore[]) => prev.filter((chore: Chore) => chore.id !== choreId));
  }, []);

  const handleAssignmentsGenerated = useCallback(() => {
    // Reload current week assignments after generation
    loadCurrentWeekAssignments();
  }, [loadCurrentWeekAssignments]);

  const handleChoreCompleted = useCallback(async (assignmentId: number) => {
    setIsLoading(true);
    try {
      await trpc.markChoreComplete.mutate({ assignment_id: assignmentId });
      // Update the assignment in state
      setCurrentWeekAssignments((prev: ChoreAssignmentView[]) =>
        prev.map((assignment: ChoreAssignmentView) =>
          assignment.assignment_id === assignmentId
            ? { ...assignment, is_completed: true, completed_at: new Date() }
            : assignment
        )
      );
    } catch (error) {
      console.error('Failed to mark chore as complete:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completedCount = currentWeekAssignments.filter(assignment => assignment.is_completed).length;
  const totalCount = currentWeekAssignments.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🏠 Chore Manager
          </h1>
          <p className="text-lg text-gray-600">
            Keep your household organized with weekly chore assignments
          </p>
        </div>

        {/* Weekly Progress Card */}
        <Card className="mb-6 border-2 border-indigo-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-center text-xl">
              📅 This Week's Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-2">
                {completedCount} / {totalCount}
              </div>
              <div className="text-sm text-gray-600 mb-4">Chores Completed</div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="assignments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white shadow-md">
            <TabsTrigger 
              value="assignments" 
              className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
            >
              📋 Current Week
            </TabsTrigger>
            <TabsTrigger 
              value="chores" 
              className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
            >
              ⚙️ Manage Chores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-4">
            <Card className="shadow-lg border-2 border-indigo-100">
              <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-t-lg">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">📋 Weekly Assignments</CardTitle>
                  <GenerateAssignmentsDialog onAssignmentsGenerated={handleAssignmentsGenerated} />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <WeeklyAssignments
                  assignments={currentWeekAssignments}
                  onMarkComplete={handleChoreCompleted}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chores" className="space-y-4">
            <Card className="shadow-lg border-2 border-indigo-100">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">⚙️ Chore Management</CardTitle>
                  <CreateChoreDialog onChoreCreated={handleChoreCreated} />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ChoreList
                  chores={chores}
                  onChoreUpdated={handleChoreUpdated}
                  onChoreDeleted={handleChoreDeleted}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
