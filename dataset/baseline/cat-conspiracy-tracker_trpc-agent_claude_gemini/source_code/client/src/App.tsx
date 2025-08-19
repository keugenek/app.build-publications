import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import { ActivityLogger } from '@/components/ActivityLogger';
import { BehaviorTypeManager } from '@/components/BehaviorTypeManager';
import { ActivityHistory } from '@/components/ActivityHistory';
import { ConspiracyHistory } from '@/components/ConspiracyHistory';
import type { BehaviorType, ActivityWithBehaviorType, DailyConspiracyLevel } from '../../server/src/schema';

function App() {
  const [behaviorTypes, setBehaviorTypes] = useState<BehaviorType[]>([]);
  const [activities, setActivities] = useState<ActivityWithBehaviorType[]>([]);
  const [todayConspiracy, setTodayConspiracy] = useState<DailyConspiracyLevel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [behaviorTypesData, activitiesData, todayData] = await Promise.all([
        trpc.getBehaviorTypes.query(),
        trpc.getCatActivities.query(),
        trpc.getCurrentDayConspiracyLevel.query()
      ]);
      
      setBehaviorTypes(behaviorTypesData);
      setActivities(activitiesData);
      setTodayConspiracy(todayData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const seedDefaultBehaviors = async () => {
    try {
      await trpc.seedDefaultBehaviorTypes.mutate();
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Failed to seed default behaviors:', error);
    }
  };

  const handleActivityAdded = (newActivity: ActivityWithBehaviorType) => {
    setActivities((prev: ActivityWithBehaviorType[]) => [newActivity, ...prev]);
    // Refresh today's conspiracy level
    trpc.getCurrentDayConspiracyLevel.query().then(setTodayConspiracy);
  };

  const handleBehaviorTypeAdded = (newBehaviorType: BehaviorType) => {
    setBehaviorTypes((prev: BehaviorType[]) => [...prev, newBehaviorType]);
  };

  const getThreatLevel = (score: number): { level: string; color: string; emoji: string } => {
    if (score === 0) return { level: 'Suspiciously Calm', color: 'bg-gray-500', emoji: '😴' };
    if (score <= 10) return { level: 'Mildly Sus', color: 'bg-green-500', emoji: '🤔' };
    if (score <= 25) return { level: 'Plotting Something', color: 'bg-yellow-500', emoji: '😼' };
    if (score <= 50) return { level: 'Definitely Scheming', color: 'bg-orange-500', emoji: '😾' };
    if (score <= 75) return { level: 'Full Conspiracy Mode', color: 'bg-red-500', emoji: '🙀' };
    return { level: 'WORLD DOMINATION IMMINENT', color: 'bg-purple-500', emoji: '😈' };
  };

  const todayThreat = getThreatLevel(todayConspiracy?.total_conspiracy_score || 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">🐱</div>
          <p className="text-lg">Loading Catspiracy Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4 paw-pattern">
      <div className="container mx-auto max-w-6xl custom-scrollbar">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold text-purple-800 mb-2 flex items-center justify-center gap-3">
            🐱 Catspiracy Tracker 🕵️‍♂️
          </h1>
          <p className="text-lg text-gray-600">
            Monitor your feline overlord's suspicious activities
          </p>
        </header>

        {/* Today's Conspiracy Level */}
        <Card className="mb-8 border-2 border-purple-200 shadow-lg conspiracy-pulse">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Today's Threat Level</CardTitle>
            <CardDescription>Current conspiracy assessment</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-6xl">{todayThreat.emoji}</div>
              <div>
                <Badge className={`${todayThreat.color} text-white text-lg px-4 py-2`}>
                  {todayThreat.level}
                </Badge>
                <p className="text-3xl font-bold text-purple-800 mt-2">
                  Score: {todayConspiracy?.total_conspiracy_score || 0}
                </p>
                <p className="text-gray-600">
                  {todayConspiracy?.activity_count || 0} suspicious activities today
                </p>
              </div>
            </div>
            {behaviorTypes.length === 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 mb-2">
                  No behavior types found! Seed some default behaviors to get started.
                </p>
                <Button onClick={seedDefaultBehaviors} className="bg-yellow-600 hover:bg-yellow-700">
                  🌱 Seed Default Behaviors
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="log" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-md">
            <TabsTrigger value="log" className="flex items-center gap-2">
              📝 Log Activity
            </TabsTrigger>
            <TabsTrigger value="behaviors" className="flex items-center gap-2">
              🎭 Behaviors
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              📚 Activity History
            </TabsTrigger>
            <TabsTrigger value="conspiracy" className="flex items-center gap-2">
              📊 Conspiracy Levels
            </TabsTrigger>
          </TabsList>

          <TabsContent value="log">
            <ActivityLogger
              behaviorTypes={behaviorTypes}
              onActivityAdded={handleActivityAdded}
            />
          </TabsContent>

          <TabsContent value="behaviors">
            <BehaviorTypeManager
              behaviorTypes={behaviorTypes}
              onBehaviorTypeAdded={handleBehaviorTypeAdded}
              onBehaviorTypesChanged={setBehaviorTypes}
            />
          </TabsContent>

          <TabsContent value="history">
            <ActivityHistory activities={activities} />
          </TabsContent>

          <TabsContent value="conspiracy">
            <ConspiracyHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
