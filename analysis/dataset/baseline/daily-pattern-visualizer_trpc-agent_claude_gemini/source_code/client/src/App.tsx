import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { DailyLogForm } from '@/components/DailyLogForm';
import { TodaySummary } from '@/components/TodaySummary';
import { WeeklyTrends } from '@/components/WeeklyTrends';
import { BreakSuggestions } from '@/components/BreakSuggestions';
import type { DailyLog } from '../../server/src/schema';

function App() {
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadTodayLog = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getTodayLog.query();
      setTodayLog(result);
    } catch (error) {
      console.error('Failed to load today\'s log:', error);
      setTodayLog(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodayLog();
  }, [loadTodayLog]);

  const handleLogSubmit = async () => {
    await loadTodayLog(); // Refresh today's log after submission
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🌟 Personal Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Track your daily activities and monitor your well-being
          </p>
        </div>

        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="today" className="text-sm font-medium">
              📝 Today's Log
            </TabsTrigger>
            <TabsTrigger value="summary" className="text-sm font-medium">
              📊 Summary
            </TabsTrigger>
            <TabsTrigger value="trends" className="text-sm font-medium">
              📈 Weekly Trends
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="text-sm font-medium">
              💡 Break Suggestions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="text-2xl">Log Today's Activities</CardTitle>
                <CardDescription className="text-blue-100">
                  Record your daily metrics to track your well-being
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <DailyLogForm 
                  existingLog={todayLog} 
                  onSubmit={handleLogSubmit} 
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            <TodaySummary log={todayLog} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <WeeklyTrends />
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-6">
            <BreakSuggestions todayLog={todayLog} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
