import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { TodayView } from '@/components/TodayView';
import { HistoryView } from '@/components/HistoryView';
// Using type-only import for better TypeScript compliance
import type { DailyEntryWithTasks, DailyEntry } from '../../server/src/schema';

function App() {
  const [todayEntry, setTodayEntry] = useState<DailyEntryWithTasks | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get today's date at midnight for consistent date handling
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const loadTodayEntry = useCallback(async () => {
    try {
      setIsLoading(true);
      const entry = await trpc.getDailyEntryByDate.query({ date: today });
      setTodayEntry(entry);
    } catch (error) {
      console.error('Failed to load today entry:', error);
      setTodayEntry(null);
    } finally {
      setIsLoading(false);
    }
  }, [today]);

  useEffect(() => {
    loadTodayEntry();
  }, [loadTodayEntry]);

  const createTodayEntry = async () => {
    try {
      const newEntry = await trpc.createDailyEntry.mutate({
        date: today,
        mood: null,
        notes: null
      });
      // Transform to DailyEntryWithTasks format
      const entryWithTasks: DailyEntryWithTasks = {
        ...newEntry,
        tasks: []
      };
      setTodayEntry(entryWithTasks);
    } catch (error) {
      console.error('Failed to create today entry:', error);
    }
  };

  const updateTodayEntry = (updatedEntry: DailyEntryWithTasks) => {
    setTodayEntry(updatedEntry);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your journal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4 max-w-6xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📖 Daily Journal
          </h1>
          <p className="text-lg text-gray-600">
            Track your tasks and mood every day
          </p>
        </header>

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="today" className="text-lg py-3">
              🌟 Today
            </TabsTrigger>
            <TabsTrigger value="history" className="text-lg py-3">
              📚 History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6">
            {todayEntry ? (
              <TodayView 
                entry={todayEntry} 
                onUpdate={updateTodayEntry}
              />
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="text-6xl mb-4">📝</div>
                  <CardTitle className="mb-4">No entry for today yet!</CardTitle>
                  <p className="text-gray-600 mb-6">
                    Start your day by creating a new journal entry
                  </p>
                  <Button onClick={createTodayEntry} size="lg">
                    Create Today's Entry
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <HistoryView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
