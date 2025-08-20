import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { WellnessForm } from '@/components/WellnessForm';
import { WellnessHistory } from '@/components/WellnessHistory';
import { WellnessTrends } from '@/components/WellnessTrends';
import { trpc } from '@/utils/trpc';
import type { WellnessEntry } from '../../server/src/schema';

function App() {
  const [entries, setEntries] = useState<WellnessEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('today');
  
  // Mock user ID for demo purposes
  const userId = 'user-123';

  const loadEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getWellnessEntries.query({
        user_id: userId,
        limit: 30
      });
      setEntries(result);
    } catch (error) {
      console.error('Failed to load wellness entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleNewEntry = useCallback((newEntry: WellnessEntry) => {
    setEntries((prev: WellnessEntry[]) => [newEntry, ...prev]);
  }, []);

  // Get today's entry if it exists
  const todaysEntry = entries.find((entry: WellnessEntry) => {
    const entryDate = new Date(entry.date);
    const today = new Date();
    return entryDate.toDateString() === today.toDateString();
  });

  // Get wellness score color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🌟 Wellness Tracker
          </h1>
          <p className="text-lg text-gray-600">
            Track your daily wellness metrics and monitor your health journey
          </p>
        </div>

        {/* Today's Score Card */}
        {todaysEntry && (
          <Card className="mb-8 border-2 shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl text-gray-700">Today's Wellness Score</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex justify-center mb-4">
                <Badge 
                  className={`text-2xl font-bold py-2 px-4 ${getScoreColor(todaysEntry.wellness_score)}`}
                >
                  {todaysEntry.wellness_score}/100
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-600">😴 Sleep</div>
                  <div>{todaysEntry.sleep_hours}h</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-600">😰 Stress</div>
                  <div>{todaysEntry.stress_level}/10</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-600">☕ Caffeine</div>
                  <div>{todaysEntry.caffeine_intake}mg</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-600">🍷 Alcohol</div>
                  <div>{todaysEntry.alcohol_intake} drinks</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="today">📝 Log Today</TabsTrigger>
            <TabsTrigger value="history">📚 History</TabsTrigger>
            <TabsTrigger value="trends">📊 Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📝 Daily Wellness Entry
                </CardTitle>
                <CardDescription>
                  Log your daily wellness metrics to track your health journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WellnessForm
                  userId={userId}
                  onSuccess={handleNewEntry}
                  existingEntry={todaysEntry}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📚 Wellness History
                </CardTitle>
                <CardDescription>
                  View your past wellness entries and track your progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WellnessHistory 
                  entries={entries} 
                  isLoading={isLoading}
                  onRefresh={loadEntries}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Wellness Trends
                </CardTitle>
                <CardDescription>
                  Visualize your wellness patterns and identify trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WellnessTrends userId={userId} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
