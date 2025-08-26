import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { WellnessEntry, CreateWellnessEntryInput } from '../../server/src/schema';
import type { WellnessTrendsResponse } from '../../server/src/handlers/get_wellness_trends';

function App() {
  const [entries, setEntries] = useState<WellnessEntry[]>([]);
  const [trends, setTrends] = useState<WellnessTrendsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for new wellness entry
  const [formData, setFormData] = useState<CreateWellnessEntryInput>({
    user_id: 'demo_user', // Using demo user for now
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    sleep_hours: 8,
    stress_level: 5,
    caffeine_intake: 0,
    alcohol_intake: 0
  });

  const loadWellnessData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [entriesResult, trendsResult] = await Promise.all([
        trpc.getWellnessEntries.query({ user_id: 'demo_user' }),
        trpc.getWellnessTrends.query({ user_id: 'demo_user' })
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
    loadWellnessData();
  }, [loadWellnessData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newEntry = await trpc.createWellnessEntry.mutate(formData);
      setEntries((prev: WellnessEntry[]) => [newEntry, ...prev]);
      // Refresh trends data
      const updatedTrends = await trpc.getWellnessTrends.query({ user_id: 'demo_user' });
      setTrends(updatedTrends);
      
      // Reset form to next day
      const nextDay = new Date();
      nextDay.setDate(nextDay.getDate() + 1);
      setFormData((prev: CreateWellnessEntryInput) => ({
        ...prev,
        date: nextDay.toISOString().split('T')[0],
        sleep_hours: 8,
        stress_level: 5,
        caffeine_intake: 0,
        alcohol_intake: 0
      }));
    } catch (error) {
      console.error('Failed to create wellness entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWellnessColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getWellnessBadge = (score: number): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
    if (score >= 80) return { label: 'Excellent', variant: 'default' };
    if (score >= 60) return { label: 'Good', variant: 'secondary' };
    if (score >= 40) return { label: 'Fair', variant: 'outline' };
    return { label: 'Poor', variant: 'destructive' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🌟 Wellness Tracker</h1>
          <p className="text-lg text-gray-600">Track your daily wellness and see your progress over time</p>
        </div>

        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="daily">📝 Daily Entry</TabsTrigger>
            <TabsTrigger value="history">📊 History</TabsTrigger>
            <TabsTrigger value="trends">📈 Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-6">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ✨ Daily Wellness Entry
                </CardTitle>
                <CardDescription>
                  Record your daily wellness metrics to track your overall well-being
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="date">📅 Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateWellnessEntryInput) => ({ ...prev, date: e.target.value }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sleep">😴 Sleep Hours</Label>
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
                        placeholder="8"
                        required
                      />
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
                        placeholder="5"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="caffeine">☕ Caffeine Intake (mg)</Label>
                      <Input
                        id="caffeine"
                        type="number"
                        min="0"
                        max="2000"
                        value={formData.caffeine_intake}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateWellnessEntryInput) => ({ 
                            ...prev, 
                            caffeine_intake: parseInt(e.target.value) || 0 
                          }))
                        }
                        placeholder="0"
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="alcohol">🍷 Alcohol Intake (units/drinks)</Label>
                      <Input
                        id="alcohol"
                        type="number"
                        min="0"
                        max="50"
                        value={formData.alcohol_intake}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateWellnessEntryInput) => ({ 
                            ...prev, 
                            alcohol_intake: parseInt(e.target.value) || 0 
                          }))
                        }
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? '✨ Calculating...' : '🚀 Track My Wellness'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Wellness History
                </CardTitle>
                <CardDescription>
                  Your recent wellness entries and scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center text-gray-500 py-8">Loading your wellness data... ⏳</p>
                ) : entries.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No wellness entries yet! Start by recording your first daily entry. 🌱
                  </p>
                ) : (
                  <div className="space-y-4">
                    {entries.map((entry: WellnessEntry) => {
                      const badge = getWellnessBadge(entry.wellness_score);
                      return (
                        <div key={entry.id} className="border rounded-lg p-4 bg-white shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {entry.date.toLocaleDateString('en-US', { 
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-2xl font-bold ${getWellnessColor(entry.wellness_score)}`}>
                                  {entry.wellness_score}
                                </span>
                                <Badge variant={badge.variant}>{badge.label}</Badge>
                              </div>
                            </div>
                            <Progress value={entry.wellness_score} className="w-24" />
                          </div>
                          
                          <Separator className="my-3" />
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span>😴</span>
                              <span>{entry.sleep_hours}h sleep</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>😰</span>
                              <span>Stress: {entry.stress_level}/10</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>☕</span>
                              <span>{entry.caffeine_intake}mg caffeine</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>🍷</span>
                              <span>{entry.alcohol_intake} drinks</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📈 Wellness Trends
                </CardTitle>
                <CardDescription>
                  Your wellness patterns and averages over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center text-gray-500 py-8">Loading your trends... ⏳</p>
                ) : !trends || trends.summary.total_entries === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Not enough data for trends yet. Keep logging your daily wellness! 📊
                  </p>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                        <div className="text-sm text-purple-600 font-medium">Avg. Wellness</div>
                        <div className="text-2xl font-bold text-purple-900">
                          {trends.averages.wellness_score.toFixed(1)}
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                        <div className="text-sm text-blue-600 font-medium">Avg. Sleep</div>
                        <div className="text-2xl font-bold text-blue-900">
                          {trends.averages.sleep_hours.toFixed(1)}h
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
                        <div className="text-sm text-orange-600 font-medium">Avg. Stress</div>
                        <div className="text-2xl font-bold text-orange-900">
                          {trends.averages.stress_level.toFixed(1)}/10
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                        <div className="text-sm text-green-600 font-medium">Avg. Caffeine</div>
                        <div className="text-2xl font-bold text-green-900">
                          {trends.averages.caffeine_intake.toFixed(0)}mg
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg">
                        <div className="text-sm text-red-600 font-medium">Avg. Alcohol</div>
                        <div className="text-2xl font-bold text-red-900">
                          {trends.averages.alcohol_intake.toFixed(1)} drinks
                        </div>
                      </div>
                    </div>

                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">
                        📊 You have <strong>{trends.summary.total_entries}</strong> wellness entries
                      </p>
                      {trends.summary.date_range.start && trends.summary.date_range.end && (
                        <p className="text-sm text-gray-500 mt-1">
                          From {new Date(trends.summary.date_range.start).toLocaleDateString()} to{' '}
                          {new Date(trends.summary.date_range.end).toLocaleDateString()}
                        </p>
                      )}
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
