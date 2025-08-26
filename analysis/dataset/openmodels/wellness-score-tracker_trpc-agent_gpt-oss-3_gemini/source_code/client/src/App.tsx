import { useEffect, useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import type { WellnessEntry, CreateWellnessEntryInput } from '../../server/src/schema';

function App() {
  // State for wellness entries
  const [entries, setEntries] = useState<WellnessEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateWellnessEntryInput>({
    sleep_hours: 0,
    stress_level: 1,
    caffeine_servings: 0,
    alcohol_servings: 0,
    // wellness_score is optional; we let the server calculate if omitted
  });

  // Load entries from server
  const loadEntries = useCallback(async () => {
    try {
      const data = await trpc.getWellnessEntries.query();
      setEntries(data as WellnessEntry[]);
    } catch (error) {
      console.error('Failed to load wellness entries:', error);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Simple client‑side wellness score calculation (optional)
  const calculateScore = (input: CreateWellnessEntryInput): number => {
    // Basic heuristic: higher sleep and lower stress improve score
    const sleepScore = Math.min(input.sleep_hours * 10, 30); // max 30
    const stressPenalty = (input.stress_level - 1) * 15; // 0‑60
    const caffeinePenalty = input.caffeine_servings * 5;
    const alcoholPenalty = input.alcohol_servings * 5;
    const raw = 100 - stressPenalty - caffeinePenalty - alcoholPenalty + sleepScore;
    return Math.max(0, Math.min(100, Math.round(raw)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload: CreateWellnessEntryInput = {
        ...formData,
        // If we want to let server calculate, omit wellness_score; otherwise include
        wellness_score: calculateScore(formData),
      };
      const newEntry = await trpc.createWellnessEntry.mutate(payload);
      setEntries((prev) => [...prev, newEntry as WellnessEntry]);
      // Reset form
      setFormData({
        sleep_hours: 0,
        stress_level: 1,
        caffeine_servings: 0,
        alcohol_servings: 0,
      });
    } catch (error) {
      console.error('Failed to create wellness entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-4">Daily Wellness Tracker</h1>

      {/* Entry Form */}
      <form onSubmit={handleSubmit} className="grid gap-4">
        <Input
          type="number"
          placeholder="Hours of sleep (e.g., 7.5)"
          value={formData.sleep_hours}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, sleep_hours: parseFloat(e.target.value) || 0 }))
          }
          step="0.1"
          min="0"
          required
        />
        <Input
          type="number"
          placeholder="Stress level (1‑5)"
          value={formData.stress_level}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, stress_level: parseInt(e.target.value) || 1 }))
          }
          min="1"
          max="5"
          required
        />
        <Input
          type="number"
          placeholder="Caffeine servings"
          value={formData.caffeine_servings}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, caffeine_servings: parseInt(e.target.value) || 0 }))
          }
          min="0"
        />
        <Input
          type="number"
          placeholder="Alcohol servings"
          value={formData.alcohol_servings}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, alcohol_servings: parseInt(e.target.value) || 0 }))
          }
          min="0"
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Saving...' : 'Add Entry'}
        </Button>
      </form>

      {/* Entries List */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Previous Entries</h2>
        {entries.length === 0 ? (
          <p className="text-gray-500">No entries yet. Start tracking your wellness!</p>
        ) : (
          <div className="grid gap-2">
            {entries
              .slice()
              .reverse()
              .map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 border rounded-md shadow-sm bg-white dark:bg-gray-800"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Score: {entry.wellness_score}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <ul className="mt-2 text-sm space-y-1">
                    <li>Sleep: {entry.sleep_hours} hrs</li>
                    <li>Stress: {entry.stress_level}/5</li>
                    <li>Caffeine: {entry.caffeine_servings} servings</li>
                    <li>Alcohol: {entry.alcohol_servings} servings</li>
                  </ul>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
