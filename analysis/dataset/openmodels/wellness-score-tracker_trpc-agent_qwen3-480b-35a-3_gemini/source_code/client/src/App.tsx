import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { WellnessTrendsChart, WellnessInsights } from '@/components';
import type { WellnessEntry, CreateWellnessEntryInput } from '../../server/src/schema';

function App() {
  const [entries, setEntries] = useState<WellnessEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEntriesLoading, setIsEntriesLoading] = useState(true);
  const [formData, setFormData] = useState<CreateWellnessEntryInput>({
    date: new Date(),
    sleep_hours: 0,
    stress_level: 1,
    caffeine_intake: 0,
    alcohol_intake: 0
  });

  const loadEntries = useCallback(async () => {
    try {
      setIsEntriesLoading(true);
      const result = await trpc.getWellnessEntries.query();
      setEntries(result);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setIsEntriesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createWellnessEntry.mutate(formData);
      setEntries((prev: WellnessEntry[]) => [response, ...prev]);
      setFormData({
        date: new Date(),
        sleep_hours: 0,
        stress_level: 1,
        caffeine_intake: 0,
        alcohol_intake: 0
      });
    } catch (error) {
      console.error('Failed to create entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate wellness score using the same formula as the server
  const calculateWellnessScore = (entry: {
    sleep_hours: number;
    stress_level: number;
    caffeine_intake: number;
    alcohol_intake: number;
  }) => {
    const sleepScore = Math.min(10, (entry.sleep_hours / 24) * 10);
    const stressScore = 11 - entry.stress_level; // 1-10 becomes 10-1
    const caffeineScore = Math.max(0, 10 - entry.caffeine_intake);
    const alcoholScore = Math.max(0, 10 - entry.alcohol_intake);
    
    const wellnessScore = (sleepScore + stressScore + caffeineScore + alcoholScore) / 4;
    return Math.round(wellnessScore * 100) / 100; // Round to 2 decimal places
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <span>🌱</span>
          Daily Wellness Tracker
          <span>🌿</span>
        </h1>
        <p className="text-muted-foreground">Track your daily habits and monitor your wellness trends</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Today's Wellness Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date.toISOString().split('T')[0]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateWellnessEntryInput) => ({ ...prev, date: new Date(e.target.value) }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sleep_hours">Sleep Hours (0-24)</Label>
                <Input
                  id="sleep_hours"
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={formData.sleep_hours}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateWellnessEntryInput) => ({ ...prev, sleep_hours: parseFloat(e.target.value) || 0 }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stress_level">Stress Level (1-10)</Label>
                <Input
                  id="stress_level"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.stress_level}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateWellnessEntryInput) => ({ ...prev, stress_level: parseInt(e.target.value) || 1 }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="caffeine_intake">Caffeine Intake (cups)</Label>
                <Input
                  id="caffeine_intake"
                  type="number"
                  min="0"
                  value={formData.caffeine_intake}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateWellnessEntryInput) => ({ ...prev, caffeine_intake: parseInt(e.target.value) || 0 }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alcohol_intake">Alcohol Intake (drinks)</Label>
                <Input
                  id="alcohol_intake"
                  type="number"
                  min="0"
                  value={formData.alcohol_intake}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateWellnessEntryInput) => ({ ...prev, alcohol_intake: parseInt(e.target.value) || 0 }))
                  }
                  required
                />
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Entry'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wellness Score Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative">
                <div className="text-6xl font-bold mb-2">
                  {calculateWellnessScore(formData)}
                </div>
                <div className="absolute -top-2 -right-6">
                  {calculateWellnessScore(formData) >= 70 ? (
                    <span className="text-green-500">😊</span>
                  ) : calculateWellnessScore(formData) >= 40 ? (
                    <span className="text-yellow-500">😐</span>
                  ) : (
                    <span className="text-red-500">😞</span>
                  )}
                </div>
              </div>
              <div className="text-muted-foreground mb-6">Today's Wellness Score</div>
              
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-primary/10 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Sleep</div>
                  <div className="font-medium">{formData.sleep_hours} hours</div>
                </div>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Stress</div>
                  <div className="font-medium">Level {formData.stress_level}</div>
                </div>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Caffeine</div>
                  <div className="font-medium">{formData.caffeine_intake} drinks</div>
                </div>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Alcohol</div>
                  <div className="font-medium">{formData.alcohol_intake} drinks</div>
                </div>
              </div>
              
              <div className="mt-6 text-sm text-muted-foreground text-center">
                <p>Wellness Score Calculation:</p>
                <p className="text-xs">Sleep: {Math.min(10, (formData.sleep_hours / 24) * 10).toFixed(1)} pts</p>
                <p className="text-xs">Stress: {11 - formData.stress_level} pts</p>
                <p className="text-xs">Caffeine: {Math.max(0, 10 - formData.caffeine_intake)} pts</p>
                <p className="text-xs">Alcohol: {Math.max(0, 10 - formData.alcohol_intake)} pts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8">
        <WellnessTrendsChart />
        <WellnessInsights entries={entries} />
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Wellness History</CardTitle>
        </CardHeader>
        <CardContent>
          {isEntriesLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading entries...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No entries yet. Add your first wellness entry above!
            </div>
          ) : (
            <div className="border rounded-md">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Sleep</TableHead>
                      <TableHead>Stress</TableHead>
                      <TableHead>Caffeine</TableHead>
                      <TableHead>Alcohol</TableHead>
                      <TableHead className="text-right">Wellness Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry: WellnessEntry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.date.toLocaleDateString()}</TableCell>
                        <TableCell>{entry.sleep_hours} hrs</TableCell>
                        <TableCell>{entry.stress_level}/10</TableCell>
                        <TableCell>{entry.caffeine_intake}</TableCell>
                        <TableCell>{entry.alcohol_intake}</TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant={
                              entry.wellness_score >= 70 ? "default" : 
                              entry.wellness_score >= 40 ? "secondary" : "destructive"
                            }
                            className="text-sm"
                          >
                            {entry.wellness_score.toFixed(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        Track your daily habits to improve your overall wellness
      </div>
    </div>
  );
}

export default App;
