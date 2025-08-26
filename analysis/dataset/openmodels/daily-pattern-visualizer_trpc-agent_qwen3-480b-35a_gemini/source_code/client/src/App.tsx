import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { trpc } from '@/utils/trpc';
import type { DailyMetrics, CreateDailyMetricsInput } from '../../server/src/schema';
import type { BreakSuggestion } from '../../server/src/handlers/get_break_suggestions';
import { format } from 'date-fns';
import { MetricsChart } from '@/components/metrics-chart';
import { BreakSuggestions } from '@/components/break-suggestions';
import { MetricsSummary } from '@/components/metrics-summary';

function App() {
  const [metrics, setMetrics] = useState<DailyMetrics[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState<CreateDailyMetricsInput>({
    date: new Date(),
    sleep_duration: 0,
    work_hours: 0,
    social_time: 0,
    screen_time: 0,
    emotional_energy: 5
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<BreakSuggestion[]>([]);

  const loadMetrics = useCallback(async () => {
    try {
      const result = await trpc.getDailyMetrics.query();
      setMetrics(result);
    } catch (err) {
      console.error('Failed to load metrics:', err);
      setError('Failed to load metrics');
    }
  }, []);

  const loadSuggestions = useCallback(async () => {
    try {
      const result = await trpc.getBreakSuggestions.query();
      setSuggestions(result);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
    loadSuggestions();
  }, [loadMetrics, loadSuggestions]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setFormData(prev => ({ ...prev, date }));
  };

  const handleInputChange = (field: keyof CreateDailyMetricsInput, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const existingMetric = metrics.find(m => 
        format(new Date(m.date), 'yyyy-MM-dd') === format(formData.date, 'yyyy-MM-dd')
      );
      
      if (existingMetric) {
        // Update existing metric
        const updated = await trpc.updateDailyMetrics.mutate({
          id: existingMetric.id,
          ...formData
        });
        setMetrics(prev => prev.map(m => m.id === updated.id ? updated : m));
      } else {
        // Create new metric
        const newMetric = await trpc.createDailyMetrics.mutate(formData);
        setMetrics(prev => [...prev, newMetric]);
      }
      
      loadSuggestions();
    } catch (err) {
      console.error('Failed to save metrics:', err);
      setError('Failed to save metrics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteDailyMetrics.mutate(id);
      setMetrics(prev => prev.filter(m => m.id !== id));
      loadSuggestions();
    } catch (err) {
      console.error('Failed to delete metric:', err);
      setError('Failed to delete metric');
    }
  };

  // Get metrics for the selected date
  const selectedMetric = metrics.find(m => 
    format(new Date(m.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );

  // Update form when selected date changes
  useEffect(() => {
    if (selectedMetric) {
      setFormData({
        date: selectedMetric.date,
        sleep_duration: selectedMetric.sleep_duration,
        work_hours: selectedMetric.work_hours,
        social_time: selectedMetric.social_time,
        screen_time: selectedMetric.screen_time,
        emotional_energy: selectedMetric.emotional_energy
      });
    } else {
      setFormData({
        date: selectedDate,
        sleep_duration: 0,
        work_hours: 0,
        social_time: 0,
        screen_time: 0,
        emotional_energy: 5
      });
    }
  }, [selectedDate, selectedMetric]);

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-indigo-800">Personal Wellness Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your daily habits and get personalized break suggestions</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Data Entry */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sleep">Sleep Duration (hours)</Label>
                      <Input
                        id="sleep"
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.sleep_duration}
                        onChange={(e) => handleInputChange('sleep_duration', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="work">Work Hours</Label>
                      <Input
                        id="work"
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.work_hours}
                        onChange={(e) => handleInputChange('work_hours', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="social">Social Time (hours)</Label>
                      <Input
                        id="social"
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.social_time}
                        onChange={(e) => handleInputChange('social_time', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="screen">Screen Time (hours)</Label>
                      <Input
                        id="screen"
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.screen_time}
                        onChange={(e) => handleInputChange('screen_time', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="energy" className="block mb-2">
                      Emotional Energy: {formData.emotional_energy}/10
                    </Label>
                    <Input
                      id="energy"
                      type="range"
                      min="1"
                      max="10"
                      value={formData.emotional_energy}
                      onChange={(e) => handleInputChange('emotional_energy', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-500 text-sm">{error}</div>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Metrics'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            <MetricsSummary metric={selectedMetric} onDelete={handleDelete} />
          </div>

          {/* Right Column - Visualizations and Suggestions */}
          <div className="lg:col-span-2 space-y-6">
            <MetricsChart metrics={metrics} />

            <BreakSuggestions suggestions={suggestions} hasMetrics={metrics.length > 0} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
