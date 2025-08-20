import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { trpc } from '@/utils/trpc';
import type { WellnessEntry, CreateWellnessEntryInput } from '../../server/src/schema';

function App() {
  const [entries, setEntries] = useState<WellnessEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId] = useState('user-1'); // In a real app, this would come from auth

  const [formData, setFormData] = useState<Omit<CreateWellnessEntryInput, 'user_id'>>({
    sleep_hours: 8,
    stress_level: 5,
    caffeine_intake: 1,
    alcohol_intake: 0
  });

  const loadEntries = useCallback(async () => {
    try {
      const result = await trpc.getWellnessEntries.query({ userId });
      setEntries(result);
    } catch (error) {
      console.error('Failed to load entries:', error);
    }
  }, [userId]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const input: CreateWellnessEntryInput = {
        ...formData,
        user_id: userId
      };
      const response = await trpc.createWellnessEntry.mutate(input);
      setEntries((prev: WellnessEntry[]) => [response, ...prev]);
      // Reset form to defaults
      setFormData({
        sleep_hours: 8,
        stress_level: 5,
        caffeine_intake: 1,
        alcohol_intake: 0
      });
    } catch (error) {
      console.error('Failed to create entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-green-800 mb-2">Wellness Tracker</h1>
          <p className="text-lg text-green-600">Track your daily wellness and discover patterns in your well-being</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-green-800">Today's Wellness Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Sleep Hours */}
                <div className="space-y-2">
                  <Label htmlFor="sleep" className="text-green-700">
                    Hours of Sleep: {formData.sleep_hours} hours
                  </Label>
                  <Slider
                    id="sleep"
                    min={0}
                    max={16}
                    step={0.5}
                    value={[formData.sleep_hours]}
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, sleep_hours: value[0] }))
                    }
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0h</span>
                    <span>4h</span>
                    <span>8h</span>
                    <span>12h</span>
                    <span>16h</span>
                  </div>
                </div>

                {/* Stress Level */}
                <div className="space-y-2">
                  <Label htmlFor="stress" className="text-green-700">
                    Stress Level: {formData.stress_level}/10
                  </Label>
                  <Slider
                    id="stress"
                    min={1}
                    max={10}
                    step={1}
                    value={[formData.stress_level]}
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, stress_level: value[0] }))
                    }
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1</span>
                    <span>Relaxed</span>
                    <span>5</span>
                    <span>Stressed</span>
                    <span>10</span>
                  </div>
                </div>

                {/* Caffeine Intake */}
                <div className="space-y-2">
                  <Label htmlFor="caffeine" className="text-green-700">
                    Caffeine Intake: {formData.caffeine_intake} serving(s)
                  </Label>
                  <div className="flex items-center gap-4">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        caffeine_intake: Math.max(0, prev.caffeine_intake - 1) 
                      }))}
                      disabled={formData.caffeine_intake <= 0}
                    >
                      -
                    </Button>
                    <span className="text-lg font-medium w-8 text-center">{formData.caffeine_intake}</span>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        caffeine_intake: prev.caffeine_intake + 1 
                      }))}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Alcohol Intake */}
                <div className="space-y-2">
                  <Label htmlFor="alcohol" className="text-green-700">
                    Alcohol Intake: {formData.alcohol_intake} unit(s)
                  </Label>
                  <div className="flex items-center gap-4">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        alcohol_intake: Math.max(0, prev.alcohol_intake - 1) 
                      }))}
                      disabled={formData.alcohol_intake <= 0}
                    >
                      -
                    </Button>
                    <span className="text-lg font-medium w-8 text-center">{formData.alcohol_intake}</span>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        alcohol_intake: prev.alcohol_intake + 1 
                      }))}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Wellness Entry'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Wellness History */}
          <div className="space-y-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-green-800">Wellness Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {entries.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No entries yet. Add your first wellness entry!</p>
                ) : (
                  <div className="space-y-4">
                    {entries.map((entry) => (
                      <div key={entry.id} className="border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold">
                            {entry.created_at.toLocaleDateString()}
                          </h3>
                          <span className={`text-lg font-bold ${
                            entry.wellness_score >= 70 ? 'text-green-600' : 
                            entry.wellness_score >= 40 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {entry.wellness_score.toFixed(0)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center">
                            <span className="w-24 text-gray-600">Sleep:</span>
                            <span>{entry.sleep_hours}h</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-24 text-gray-600">Stress:</span>
                            <span>{entry.stress_level}/10</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-24 text-gray-600">Caffeine:</span>
                            <span>{entry.caffeine_intake}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-24 text-gray-600">Alcohol:</span>
                            <span>{entry.alcohol_intake}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Wellness Score Explanation */}
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800 text-lg">Your Wellness Score</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700">
                  Your wellness score is calculated based on your sleep, stress levels, and substance intake. 
                  Higher scores indicate better overall well-being.
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="h-3 bg-red-500 rounded-full mb-1"></div>
                    <span className="text-xs">0-39</span>
                  </div>
                  <div>
                    <div className="h-3 bg-yellow-500 rounded-full mb-1"></div>
                    <span className="text-xs">40-69</span>
                  </div>
                  <div>
                    <div className="h-3 bg-green-500 rounded-full mb-1"></div>
                    <span className="text-xs">70-100</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
