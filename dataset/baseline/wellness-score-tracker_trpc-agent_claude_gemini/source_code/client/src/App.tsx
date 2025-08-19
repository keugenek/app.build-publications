import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { WellnessEntry, CreateWellnessEntryInput, WellnessTrends } from '../../server/src/schema';

function App() {
  const [entries, setEntries] = useState<WellnessEntry[]>([]);
  const [trends, setTrends] = useState<WellnessTrends | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateWellnessEntryInput>({
    sleep_hours: 8,
    stress_level: 5,
    caffeine_intake: 100,
    alcohol_intake: 0,
    entry_date: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [entriesResult, trendsResult] = await Promise.all([
        trpc.getWellnessEntries.query({ limit: 30 }), // Last 30 entries
        trpc.getWellnessTrends.query()
      ]);
      setEntries(entriesResult);
      setTrends(trendsResult);
    } catch (error) {
      console.error('Failed to load wellness data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newEntry = await trpc.createWellnessEntry.mutate(formData);
      setEntries((prev: WellnessEntry[]) => [newEntry, ...prev].slice(0, 30)); // Keep only latest 30
      
      // Refresh trends after adding new entry
      const updatedTrends = await trpc.getWellnessTrends.query();
      setTrends(updatedTrends);

      // Reset form to today's date but keep other values for convenience
      setFormData((prev: CreateWellnessEntryInput) => ({
        ...prev,
        entry_date: new Date().toISOString().split('T')[0]
      }));
    } catch (error) {
      console.error('Failed to create wellness entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🌟 Wellness Tracker
          </h1>
          <p className="text-lg text-gray-600">
            Track your daily wellness metrics and discover patterns in your health journey
          </p>
        </div>

        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">📝 Today's Entry</TabsTrigger>
            <TabsTrigger value="history">📊 History</TabsTrigger>
            <TabsTrigger value="trends">📈 Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ✨ Log Today's Wellness
                </CardTitle>
                <CardDescription>
                  Record your sleep, stress, caffeine, and alcohol intake to calculate your wellness score
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="sleep">🛏️ Sleep Hours</Label>
                      <Input
                        id="sleep"
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        value={formData.sleep_hours}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateWellnessEntryInput) => ({
                            ...prev,
                            sleep_hours: parseFloat(e.target.value) || 0
                          }))
                        }
                        required
                      />
                      <p className="text-sm text-gray-500">Optimal: 7-9 hours</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stress">😰 Stress Level (1-10)</Label>
                      <Input
                        id="stress"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.stress_level}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateWellnessEntryInput) => ({
                            ...prev,
                            stress_level: parseInt(e.target.value) || 1
                          }))
                        }
                        required
                      />
                      <p className="text-sm text-gray-500">1 = Very relaxed, 10 = Very stressed</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="caffeine">☕ Caffeine Intake (mg)</Label>
                      <Input
                        id="caffeine"
                        type="number"
                        min="0"
                        value={formData.caffeine_intake}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateWellnessEntryInput) => ({
                            ...prev,
                            caffeine_intake: parseFloat(e.target.value) || 0
                          }))
                        }
                        required
                      />
                      <p className="text-sm text-gray-500">1 cup coffee ≈ 95mg</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alcohol">🍷 Alcohol Intake (units)</Label>
                      <Input
                        id="alcohol"
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.alcohol_intake}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateWellnessEntryInput) => ({
                            ...prev,
                            alcohol_intake: parseFloat(e.target.value) || 0
                          }))
                        }
                        required
                      />
                      <p className="text-sm text-gray-500">1 unit = 1 beer, 1 glass wine</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">📅 Entry Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.entry_date}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateWellnessEntryInput) => ({
                          ...prev,
                          entry_date: e.target.value
                        }))
                      }
                      required
                    />
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? '⏳ Calculating...' : '✨ Calculate Wellness Score'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>📊 Wellness History</CardTitle>
                <CardDescription>Your recent wellness entries and scores</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">⏳ Loading your wellness history...</p>
                  </div>
                ) : entries.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">📝 No entries yet. Start by logging today's wellness!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {entries.map((entry: WellnessEntry) => (
                      <div key={entry.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {entry.entry_date.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </h3>
                          </div>
                          <Badge variant={getScoreBadgeVariant(entry.wellness_score)} className="text-lg px-3 py-1">
                            {entry.wellness_score}/100
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span>🛏️</span>
                            <span>{entry.sleep_hours}h sleep</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>😰</span>
                            <span>{entry.stress_level}/10 stress</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>☕</span>
                            <span>{entry.caffeine_intake}mg caffeine</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>🍷</span>
                            <span>{entry.alcohol_intake} alcohol units</span>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Wellness Score</span>
                            <span>{entry.wellness_score}/100</span>
                          </div>
                          <Progress value={entry.wellness_score} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle>📈 Wellness Trends</CardTitle>
                <CardDescription>Your overall wellness patterns and averages</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">⏳ Analyzing your wellness trends...</p>
                  </div>
                ) : !trends ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">📊 No trend data available yet. Add more entries to see patterns!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-2xl font-bold ${getScoreColor(trends.average_wellness_score)}`}>
                        {Math.round(trends.average_wellness_score)}
                      </div>
                      <h3 className="text-2xl font-semibold mt-2">Average Wellness Score</h3>
                      <p className="text-gray-600">Based on {trends.total_entries} entries</p>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg">📊 Average Metrics</h4>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                              <span>🛏️</span>
                              <span>Sleep Hours</span>
                            </span>
                            <span className="font-semibold">{trends.average_sleep_hours.toFixed(1)}h</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                              <span>😰</span>
                              <span>Stress Level</span>
                            </span>
                            <span className="font-semibold">{trends.average_stress_level.toFixed(1)}/10</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                              <span>☕</span>
                              <span>Caffeine Intake</span>
                            </span>
                            <span className="font-semibold">{Math.round(trends.average_caffeine_intake)}mg</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                              <span>🍷</span>
                              <span>Alcohol Intake</span>
                            </span>
                            <span className="font-semibold">{trends.average_alcohol_intake.toFixed(1)} units</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg">💡 Insights</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          {trends.average_sleep_hours >= 7 && trends.average_sleep_hours <= 9 ? (
                            <p className="flex items-center gap-2">
                              <span className="text-green-500">✅</span>
                              Great sleep habits! You're getting optimal rest.
                            </p>
                          ) : (
                            <p className="flex items-center gap-2">
                              <span className="text-yellow-500">⚠️</span>
                              Consider aiming for 7-9 hours of sleep nightly.
                            </p>
                          )}
                          
                          {trends.average_stress_level <= 4 ? (
                            <p className="flex items-center gap-2">
                              <span className="text-green-500">✅</span>
                              You're managing stress well!
                            </p>
                          ) : (
                            <p className="flex items-center gap-2">
                              <span className="text-yellow-500">⚠️</span>
                              Consider stress management techniques.
                            </p>
                          )}
                          
                          {trends.average_caffeine_intake <= 200 ? (
                            <p className="flex items-center gap-2">
                              <span className="text-green-500">✅</span>
                              Moderate caffeine intake - well done!
                            </p>
                          ) : (
                            <p className="flex items-center gap-2">
                              <span className="text-yellow-500">⚠️</span>
                              Consider reducing caffeine intake.
                            </p>
                          )}
                          
                          {trends.average_alcohol_intake <= 1 ? (
                            <p className="flex items-center gap-2">
                              <span className="text-green-500">✅</span>
                              Low alcohol consumption - great for health!
                            </p>
                          ) : (
                            <p className="flex items-center gap-2">
                              <span className="text-yellow-500">⚠️</span>
                              Consider moderating alcohol intake.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
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
