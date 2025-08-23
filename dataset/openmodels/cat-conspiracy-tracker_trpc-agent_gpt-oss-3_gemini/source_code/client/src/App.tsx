import './App.css';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
// Type‑only imports from the server schema
import type { Activity, DailyConspiracy, LogActivityInput } from '../../server/src/schema';

// List of activity types – kept in sync with the server enum
const activityTypes: LogActivityInput['type'][] = [
  'PROLONGED_STARING',
  'DEAD_INSECT_GIFT',
  'LIVE_ANIMAL_GIFT',
  'MIDNIGHT_ZOOMIES',
  'IGNORING_COMMANDS',
  'INTENSE_GROOMING_GLANCE',
];

function App() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [daily, setDaily] = useState<DailyConspiracy | null>(null);
  const [selectedType, setSelectedType] = useState<LogActivityInput['type']>(activityTypes[0]);
  const [isLogging, setIsLogging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load activities from the server
  const loadActivities = useCallback(async () => {
    try {
      const data = await trpc.getActivities.query();
      setActivities(data);
    } catch (error) {
      console.error('Failed to fetch activities', error);
    }
  }, []);

  // Load daily conspiracy summary and pick today’s entry
  const loadDaily = useCallback(async () => {
    try {
      const data = await trpc.getDailyConspiracy.query();
      // Find entry for today (ignoring time component)
      const today = new Date();
      const todayEntry = data.find((d) => {
        const dDate = new Date(d.date);
        return (
          dDate.getFullYear() === today.getFullYear() &&
          dDate.getMonth() === today.getMonth() &&
          dDate.getDate() === today.getDate()
        );
      }) ?? null;
      setDaily(todayEntry);
    } catch (error) {
      console.error('Failed to fetch daily conspiracy', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      await Promise.all([loadActivities(), loadDaily()]);
      setIsLoading(false);
    };
    fetchAll();
  }, [loadActivities, loadDaily]);

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);
    try {
      await trpc.logActivity.mutate({ type: selectedType });
      // Refresh data after logging
      await Promise.all([loadActivities(), loadDaily()]);
    } catch (error) {
      console.error('Failed to log activity', error);
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">🐾 Cat Conspiracy Tracker</h1>
        {/* Log Activity Form */}
        <form onSubmit={handleLog} className="flex items-center gap-4 mb-8">
          <Select value={selectedType} onValueChange={(value) => setSelectedType(value as LogActivityInput['type'])}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Select activity..." />
            </SelectTrigger>
            <SelectContent>
              {activityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={isLogging}>
            {isLogging ? 'Logging…' : 'Log Activity'}
          </Button>
        </form>

        {/* Daily Conspiracy Level */}
        <section className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Today's Conspiracy Level</h2>
          {isLoading ? (
            <p className="text-gray-500">Loading…</p>
          ) : daily ? (
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{daily.totalPoints} pts</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(daily.date).toLocaleDateString()}
              </span>
            </div>
          ) : (
            <p className="text-gray-500">No activity logged today.</p>
          )}
        </section>

        {/* Activity List */}
        <section className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Logged Activities</h2>
          {isLoading ? (
            <p className="text-gray-500">Loading…</p>
          ) : activities.length === 0 ? (
            <p className="text-gray-500">No activities logged yet.</p>
          ) : (
            <ul className="space-y-3">
              {activities.map((act) => (
                <li key={act.id} className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium">
                    {act.type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>{act.points} pts</span>
                    <span>{new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
