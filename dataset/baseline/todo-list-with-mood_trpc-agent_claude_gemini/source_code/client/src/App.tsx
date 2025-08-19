import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskManager } from '@/components/TaskManager';
import { MoodTracker } from '@/components/MoodTracker';
import { DailySummary } from '@/components/DailySummary';
import { trpc } from '@/utils/trpc';
import type { Task, MoodEntry, DailySummary as DailySummaryType } from '../../server/src/schema';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummaryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all data on component mount
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [tasksResult, moodEntriesResult, summariesResult] = await Promise.all([
        trpc.getTasks.query(),
        trpc.getMoodEntries.query(),
        trpc.getDailySummaries.query()
      ]);
      
      setTasks(tasksResult);
      setMoodEntries(moodEntriesResult);
      setDailySummaries(summariesResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh data when tasks or mood entries are updated
  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading your journal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4 max-w-6xl">
        <header className="text-center mb-8 pt-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📖 Daily Journal
          </h1>
          <p className="text-gray-600 text-lg">
            Track your tasks and mood to build better habits
          </p>
        </header>

        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-96 mx-auto">
            <TabsTrigger value="today" className="text-sm">
              📋 Today
            </TabsTrigger>
            <TabsTrigger value="mood" className="text-sm">
              😊 Mood
            </TabsTrigger>
            <TabsTrigger value="history" className="text-sm">
              📊 History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    ✅ Task Management
                  </CardTitle>
                  <CardDescription>
                    Organize your daily tasks and stay productive
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TaskManager 
                    tasks={tasks} 
                    onTasksChange={refreshData}
                  />
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    💭 Mood Tracker
                  </CardTitle>
                  <CardDescription>
                    Log your daily mood and thoughts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MoodTracker 
                    moodEntries={moodEntries}
                    onMoodChange={refreshData}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="mood" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📈 Mood History
                </CardTitle>
                <CardDescription>
                  Review your mood patterns over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MoodTracker 
                  moodEntries={moodEntries}
                  onMoodChange={refreshData}
                  showHistory={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📅 Daily Summaries
                </CardTitle>
                <CardDescription>
                  View your daily progress and mood trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DailySummary 
                  summaries={dailySummaries}
                  onRefresh={refreshData}
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
