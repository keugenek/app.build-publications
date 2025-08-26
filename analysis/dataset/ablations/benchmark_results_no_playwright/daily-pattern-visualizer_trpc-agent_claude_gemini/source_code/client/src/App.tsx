import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityLogger } from '@/components/ActivityLogger';
import { ActivityCharts } from '@/components/ActivityCharts';
import { InsightsDashboard } from '@/components/InsightsDashboard';
import { trpc } from '@/utils/trpc';
import type { ActivityLog, ActivityPattern, BreakSuggestion } from '../../server/src/schema';

function App() {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [patterns, setPatterns] = useState<ActivityPattern | null>(null);
  const [breakSuggestions, setBreakSuggestions] = useState<BreakSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // User ID - in a production app, this would come from authentication system
  const userId = 'user123';

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load activity logs for the past 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const [logs, userPatterns, suggestions] = await Promise.all([
        trpc.getActivityLogs.query({
          user_id: userId,
          start_date: startDate,
          end_date: endDate,
          limit: 30
        }),
        trpc.getActivityPatterns.query({ userId }),
        trpc.getBreakSuggestions.query({ userId })
      ]);
      
      setActivityLogs(logs);
      setPatterns(userPatterns);
      setBreakSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleNewLog = async (newLog: ActivityLog) => {
    setActivityLogs((prev: ActivityLog[]) => [newLog, ...prev]);
    // Refresh patterns and suggestions after new log
    try {
      const [userPatterns, suggestions] = await Promise.all([
        trpc.getActivityPatterns.query({ userId }),
        trpc.getBreakSuggestions.query({ userId })
      ]);
      setPatterns(userPatterns);
      setBreakSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to refresh insights:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-7xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📊 Personal Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Track your daily activities and discover patterns to optimize your well-being
          </p>
        </header>

        <Tabs defaultValue="logger" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="logger" className="flex items-center gap-2">
              ✏️ Log Activity
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex items-center gap-2">
              📈 View Trends
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              🧠 Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="logger" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📝 Daily Activity Logger
                </CardTitle>
                <CardDescription>
                  Record your daily activities to track patterns and improve your well-being
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityLogger userId={userId} onLogCreated={handleNewLog} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charts" className="space-y-6">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading charts...</span>
                </CardContent>
              </Card>
            ) : (
              <ActivityCharts activityLogs={activityLogs} />
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading insights...</span>
                </CardContent>
              </Card>
            ) : (
              <InsightsDashboard 
                patterns={patterns} 
                breakSuggestions={breakSuggestions}
                activityLogs={activityLogs}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
