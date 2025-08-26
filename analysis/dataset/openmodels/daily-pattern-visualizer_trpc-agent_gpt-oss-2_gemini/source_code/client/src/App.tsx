// client/src/App.tsx
import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import { MetricChart } from '@/components/MetricChart';
import type { DailyMetrics, CreateDailyMetricsInput } from '../../server/src/schema';

function App() {
  // State for metrics list
  const [metrics, setMetrics] = useState<DailyMetrics[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateDailyMetricsInput>({
    date: new Date(),
    sleep_duration: 0,
    work_hours: 0,
    social_time: 0,
    screen_time: 0,
    emotional_energy: 5,
  });

  // Suggestions state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Load metrics
  const loadMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const data = await trpc.getDailyMetrics.query({});
      // Server returns array of DailyMetrics (date may be Date object thanks to superjson)
      setMetrics(data);
    } catch (err) {
      console.error('Error loading metrics', err);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  // Load suggestions
  const loadSuggestions = useCallback(async () => {
    setLoadingSuggestions(true);
    try {
      const data = await trpc.getSuggestions.query({});
      // Expecting an array of strings (backend stub may return something else)
      if (Array.isArray(data)) {
        setSuggestions(data as unknown as string[]);
      } else if (typeof data === 'string') {
        setSuggestions([data]);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error('Error loading suggestions', err);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await trpc.createDailyMetrics.mutate(formData);
      await loadMetrics();
      // Reset form (keep date as today)
      setFormData({
        date: new Date(),
        sleep_duration: 0,
        work_hours: 0,
        social_time: 0,
        screen_time: 0,
        emotional_energy: 5,
      });
    } catch (err) {
      console.error('Error creating metrics', err);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Well‑Being Dashboard</h1>

      {/* Metric Entry Form */}
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Input
          type="date"
          value={
            // Convert Date to YYYY‑MM‑DD for input value
            formData.date instanceof Date
              ? formData.date.toISOString().split('T')[0]
              : ''
          }
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              date: new Date(e.target.value),
            }))
          }
        />
        <Input
          type="number"
          placeholder="Sleep (hrs)"
          value={formData.sleep_duration}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              sleep_duration: parseFloat(e.target.value) || 0,
            }))
          }
          step="0.1"
          min="0"
        />
        <Input
          type="number"
          placeholder="Work (hrs)"
          value={formData.work_hours}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              work_hours: parseFloat(e.target.value) || 0,
            }))
          }
          step="0.1"
          min="0"
        />
        <Input
          type="number"
          placeholder="Social (hrs)"
          value={formData.social_time}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              social_time: parseFloat(e.target.value) || 0,
            }))
          }
          step="0.1"
          min="0"
        />
        <Input
          type="number"
          placeholder="Screen (hrs)"
          value={formData.screen_time}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              screen_time: parseFloat(e.target.value) || 0,
            }))
          }
          step="0.1"
          min="0"
        />
        <Input
          type="number"
          placeholder="Emotional Energy (1‑10)"
          value={formData.emotional_energy}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              emotional_energy: Math.min(
                10,
                Math.max(1, parseInt(e.target.value) || 5)
              ),
            }))
          }
          min="1"
          max="10"
        />
        <Button type="submit" className="col-span-full">
          Add Entry
        </Button>
      </form>

      {/* Suggestions */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Suggestions</h2>
        {loadingSuggestions ? (
          <p className="text-gray-500">Loading suggestions…</p>
        ) : suggestions.length === 0 ? (
          <p className="text-gray-500">No suggestions at the moment.</p>
        ) : (
          <ul className="list-disc pl-5 space-y-1">
            {suggestions.map((s, idx) => (
              <li key={idx} className="text-green-700">
                {s}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Metrics Chart */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Metrics Chart</h2>
        <MetricChart metrics={metrics} />
      </section>

      {/* Metrics Table */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Metrics History</h2>
        {loadingMetrics ? (
          <p className="text-gray-500">Loading metrics…</p>
        ) : metrics.length === 0 ? (
          <p className="text-gray-500">No entries yet. Add some above!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Sleep (h)</th>
                  <th className="p-2 border">Work (h)</th>
                  <th className="p-2 border">Social (h)</th>
                  <th className="p-2 border">Screen (h)</th>
                  <th className="p-2 border">Emotion (1‑10)</th>
                </tr>
              </thead>
              <tbody>
                {metrics
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((m) => (
                    <tr key={m.id} className="odd:bg-white even:bg-gray-50">
                      <td className="p-2 border text-center">
                        {new Date(m.date).toLocaleDateString()}
                      </td>
                      <td className="p-2 border text-center">{m.sleep_duration}</td>
                      <td className="p-2 border text-center">{m.work_hours}</td>
                      <td className="p-2 border text-center">{m.social_time}</td>
                      <td className="p-2 border text-center">{m.screen_time}</td>
                      <td className="p-2 border text-center">{m.emotional_energy}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
