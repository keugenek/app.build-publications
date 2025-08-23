import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { ActivityEntry, CreateActivityEntryInput, Suggestion } from '../../server/src/schema';
import type { Statistics } from '../../server/src/handlers/get_statistics';

// Define chart data type
type ChartDataPoint = {
  day: string;
  sleep: number;
  work: number;
  social: number;
  screen: number;
  energy: number;
};

function App() {
  const [userId] = useState('user1'); // In a real app, this would come from auth
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [formData, setFormData] = useState<CreateActivityEntryInput>({
    user_id: 'user1',
    date: new Date(),
    sleep_hours: 8,
    work_hours: 8,
    social_time: 2,
    screen_time: 4,
    emotional_energy: 5
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Fetch data
  const loadEntries = useCallback(async () => {
    try {
      const result = await trpc.getActivityEntries.query({ userId });
      setEntries(result);
    } catch (error) {
      console.error('Failed to load entries:', error);
    }
  }, [userId]);

  const loadStatistics = useCallback(async () => {
    try {
      const result = await trpc.getStatistics.query({ userId });
      setStatistics(result);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  }, [userId]);

  const loadSuggestions = useCallback(async () => {
    try {
      const result = await trpc.getSuggestions.query({ userId });
      setSuggestions(result);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  }, [userId]);

  useEffect(() => {
    loadEntries();
    loadStatistics();
    loadSuggestions();
  }, [loadEntries, loadStatistics, loadSuggestions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createActivityEntry.mutate(formData);
      await loadEntries();
      await loadStatistics();
      await loadSuggestions();
      
      // Reset form
      setFormData({
        user_id: 'user1',
        date: new Date(),
        sleep_hours: 8,
        work_hours: 8,
        social_time: 2,
        screen_time: 4,
        emotional_energy: 5
      });
    } catch (error) {
      console.error('Failed to create entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getChartData = (): ChartDataPoint[] => {
    if (!statistics || !statistics.weeklyPattern.length) return [];
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return statistics.weeklyPattern[0].sleepHours.map((_: number, index: number) => ({
      day: days[index],
      sleep: statistics.weeklyPattern[0].sleepHours[index],
      work: statistics.weeklyPattern[0].workHours[index],
      social: statistics.weeklyPattern[0].socialTime[index],
      screen: statistics.weeklyPattern[0].screenTime[index],
      energy: statistics.weeklyPattern[0].emotionalEnergy[index]
    }));
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'break': return 'bg-blue-100 text-blue-800';
      case 'rest': return 'bg-green-100 text-green-800';
      case 'social': return 'bg-purple-100 text-purple-800';
      case 'sleep': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Simple bar chart component using CSS
  const SimpleBarChart = ({ data }: { data: ChartDataPoint[] }) => {
    if (!data.length) return <div className="text-center py-8 text-muted-foreground">No data available</div>;
    
    const maxValue = Math.max(
      ...data.flatMap(d => [d.sleep, d.work, d.social])
    );
    
    return (
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-end space-x-2">
            <div className="w-12 text-sm text-muted-foreground">{item.day}</div>
            <div className="flex-1 flex items-end space-x-1 h-32">
              <div className="flex flex-col items-center flex-1">
                <div 
                  className="w-full bg-blue-500 rounded-t" 
                  style={{ height: `${(item.sleep / maxValue) * 100}%` }}
                ></div>
                <div className="text-xs mt-1 text-muted-foreground">Sleep</div>
              </div>
              <div className="flex flex-col items-center flex-1">
                <div 
                  className="w-full bg-green-500 rounded-t" 
                  style={{ height: `${(item.work / maxValue) * 100}%` }}
                ></div>
                <div className="text-xs mt-1 text-muted-foreground">Work</div>
              </div>
              <div className="flex flex-col items-center flex-1">
                <div 
                  className="w-full bg-purple-500 rounded-t" 
                  style={{ height: `${(item.social / maxValue) * 100}%` }}
                ></div>
                <div className="text-xs mt-1 text-muted-foreground">Social</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Simple line chart for emotional energy
  const SimpleLineChart = ({ data }: { data: ChartDataPoint[] }) => {
    if (!data.length) return <div className="text-center py-8 text-muted-foreground">No data available</div>;
    
    return (
      <div className="h-64 flex flex-col">
        <div className="flex-1 relative border-b border-l">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground">
            <span>10</span>
            <span>5</span>
            <span>0</span>
          </div>
          
          {/* Chart area */}
          <div className="ml-8 h-full flex items-end">
            {data.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-3/4 bg-orange-500 rounded-t" 
                  style={{ height: `${(item.energy / 10) * 100}%` }}
                ></div>
                <div className="text-xs mt-1 text-muted-foreground">{item.day}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Activity Dashboard</h1>
          <p className="text-muted-foreground">Track your daily activities and get personalized suggestions</p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="log">Log Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 overflow-y-auto">
                    <SimpleBarChart data={getChartData()} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Emotional Energy Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <SimpleLineChart data={getChartData()} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {statistics && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-center">Daily Averages</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Sleep</span>
                            <span className="text-sm font-medium">{statistics.dailyAverage.sleepHours.toFixed(1)} hrs</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(statistics.dailyAverage.sleepHours / 12) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Work</span>
                            <span className="text-sm font-medium">{statistics.dailyAverage.workHours.toFixed(1)} hrs</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${(statistics.dailyAverage.workHours / 12) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Social</span>
                            <span className="text-sm font-medium">{statistics.dailyAverage.socialTime.toFixed(1)} hrs</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full" 
                              style={{ width: `${(statistics.dailyAverage.socialTime / 8) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Suggestions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {suggestions.length > 0 ? (
                        <div className="space-y-3">
                          {suggestions.map((suggestion) => (
                            <div 
                              key={suggestion.id} 
                              className={`p-4 rounded-lg ${getSuggestionColor(suggestion.suggestion_type)}`}
                            >
                              <div className="flex justify-between items-start">
                                <p>{suggestion.message}</p>
                                <Badge variant="secondary" className="ml-2">
                                  {suggestion.suggestion_type}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          No suggestions available. Log more activities to get personalized recommendations.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Entries</CardTitle>
              </CardHeader>
              <CardContent>
                {entries.length > 0 ? (
                  <div className="space-y-4">
                    {entries.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">
                            {new Date(entry.date).toLocaleDateString()}
                          </h3>
                          <span className="text-sm text-muted-foreground">
                            Energy: {entry.emotional_energy}/10
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2 text-sm">
                          <div className="bg-blue-50 p-2 rounded text-center">
                            <div className="font-medium">{entry.sleep_hours}</div>
                            <div className="text-muted-foreground">Sleep</div>
                          </div>
                          <div className="bg-green-50 p-2 rounded text-center">
                            <div className="font-medium">{entry.work_hours}</div>
                            <div className="text-muted-foreground">Work</div>
                          </div>
                          <div className="bg-purple-50 p-2 rounded text-center">
                            <div className="font-medium">{entry.social_time}</div>
                            <div className="text-muted-foreground">Social</div>
                          </div>
                          <div className="bg-yellow-50 p-2 rounded text-center">
                            <div className="font-medium">{entry.screen_time}</div>
                            <div className="text-muted-foreground">Screen</div>
                          </div>
                          <div className="bg-pink-50 p-2 rounded text-center">
                            <div className="font-medium">{entry.emotional_energy}</div>
                            <div className="text-muted-foreground">Energy</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No activity entries yet. Log your first activity!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="log">
            <Card>
              <CardHeader>
                <CardTitle>Log Daily Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date.toISOString().split('T')[0]}
                        onChange={(e) => 
                          setFormData({ ...formData, date: new Date(e.target.value) })
                        }
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="sleep_hours">Sleep Hours</Label>
                      <Slider
                        id="sleep_hours"
                        min={0}
                        max={24}
                        step={0.5}
                        value={[formData.sleep_hours]}
                        onValueChange={(value) => 
                          setFormData({ ...formData, sleep_hours: value[0] })
                        }
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>0h</span>
                        <span className="font-medium">{formData.sleep_hours}h</span>
                        <span>24h</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="work_hours">Work Hours</Label>
                      <Slider
                        id="work_hours"
                        min={0}
                        max={24}
                        step={0.5}
                        value={[formData.work_hours]}
                        onValueChange={(value) => 
                          setFormData({ ...formData, work_hours: value[0] })
                        }
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>0h</span>
                        <span className="font-medium">{formData.work_hours}h</span>
                        <span>24h</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="social_time">Social Time (hours)</Label>
                      <Slider
                        id="social_time"
                        min={0}
                        max={24}
                        step={0.5}
                        value={[formData.social_time]}
                        onValueChange={(value) => 
                          setFormData({ ...formData, social_time: value[0] })
                        }
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>0h</span>
                        <span className="font-medium">{formData.social_time}h</span>
                        <span>24h</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="screen_time">Screen Time (hours)</Label>
                      <Slider
                        id="screen_time"
                        min={0}
                        max={24}
                        step={0.5}
                        value={[formData.screen_time]}
                        onValueChange={(value) => 
                          setFormData({ ...formData, screen_time: value[0] })
                        }
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>0h</span>
                        <span className="font-medium">{formData.screen_time}h</span>
                        <span>24h</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="emotional_energy">Emotional Energy (1-10)</Label>
                      <Slider
                        id="emotional_energy"
                        min={1}
                        max={10}
                        step={1}
                        value={[formData.emotional_energy]}
                        onValueChange={(value) => 
                          setFormData({ ...formData, emotional_energy: value[0] })
                        }
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>1</span>
                        <span className="font-medium">{formData.emotional_energy}</span>
                        <span>10</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Logging...' : 'Log Activity'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>Activity Dashboard • Track your well-being</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
