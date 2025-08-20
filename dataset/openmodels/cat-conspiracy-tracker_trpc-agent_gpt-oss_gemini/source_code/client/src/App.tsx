import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/components/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import type { Cat, Activity, DailyConspiracy, CreateCatInput, CreateActivityInput } from '../../server/src/schema';

function App() {
  // Cats
  const [cats, setCats] = useState<Cat[]>([]);
  const [catForm, setCatForm] = useState<CreateCatInput>({ name: '', owner_name: null });
  const [loadingCats, setLoadingCats] = useState(false);

  // Activities
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityForm, setActivityForm] = useState<CreateActivityInput>({
    cat_id: 0,
    description: '',
    suspicion_score: 0,
    activity_date: new Date()
  });
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Daily conspiracy
  const [daily, setDaily] = useState<DailyConspiracy[]>([]);

  const loadCats = useCallback(async () => {
    setLoadingCats(true);
    try {
      const result = await trpc.getCats.query();
      setCats(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCats(false);
    }
  }, []);

  const loadActivities = useCallback(async () => {
    setLoadingActivities(true);
    try {
      const result = await trpc.getActivities.query();
      setActivities(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingActivities(false);
    }
  }, []);

  const loadDaily = useCallback(async () => {
    try {
      const result = await trpc.getDailyConspiracy.query();
      setDaily(result);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadCats();
    loadActivities();
    loadDaily();
  }, [loadCats, loadActivities, loadDaily]);

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newCat = await trpc.createCat.mutate(catForm);
      setCats((prev) => [...prev, newCat]);
      setCatForm({ name: '', owner_name: null });
    } catch (e) {
      console.error(e);
    }
  };

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newAct = await trpc.createActivity.mutate(activityForm);
      setActivities((prev) => [...prev, newAct]);
      // refresh daily conspiracy as it may affect totals
      await loadDaily();
      // reset form (keep cat selection)
      setActivityForm((prev) => ({
        ...prev,
        description: '',
        suspicion_score: 0,
        activity_date: new Date()
      }));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-6">Paranoid Cat Owner Dashboard</h1>

      {/* Cat Management */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Cats</h2>
        <form onSubmit={handleCatSubmit} className="flex flex-col sm:flex-row gap-2 mb-4">
          <Input
            placeholder="Cat name"
            value={catForm.name}
            onChange={(e) => setCatForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <Input
            placeholder="Owner name (optional)"
            value={catForm.owner_name || ''}
            onChange={(e) =>
              setCatForm((prev) => ({ ...prev, owner_name: e.target.value || null }))
            }
          />
          <Button type="submit" disabled={loadingCats} className="whitespace-nowrap">
            Add Cat
          </Button>
        </form>
        {loadingCats ? (
          <p>Loading cats...</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cats.map((cat) => (
              <Card key={cat.id} className="p-4">
                <h3 className="text-xl font-medium">{cat.name}</h3>
                {cat.owner_name && <p className="text-gray-600">Owner: {cat.owner_name}</p>}
                <p className="text-sm text-gray-500">Created: {new Date(cat.created_at).toLocaleDateString()}</p>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Activity Logging */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Log Suspicious Activity</h2>
        <form onSubmit={handleActivitySubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Select
            value={activityForm.cat_id?.toString() || ''}
            onValueChange={(val) => setActivityForm((prev) => ({ ...prev, cat_id: Number(val) }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select cat" />
            </SelectTrigger>
            <SelectContent>
              {cats.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Description"
            value={activityForm.description}
            onChange={(e) => setActivityForm((prev) => ({ ...prev, description: e.target.value }))}
            required
          />
          <Input
            type="number"
            placeholder="Suspicion score"
            value={activityForm.suspicion_score}
            onChange={(e) =>
              setActivityForm((prev) => ({ ...prev, suspicion_score: Number(e.target.value) }))
            }
            min="0"
            required
          />
          <Input
            type="date"
            value={new Date(activityForm.activity_date).toISOString().split('T')[0]}
            onChange={(e) =>
              setActivityForm((prev) => ({ ...prev, activity_date: new Date(e.target.value) }))
            }
            required
          />
          <Button type="submit" disabled={loadingActivities || cats.length === 0} className="col-span-full">
            Log Activity
          </Button>
        </form>
      </section>

      {/* Activity History */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Activity History</h2>
        {loadingActivities ? (
          <p>Loading activities...</p>
        ) : activities.length === 0 ? (
          <p className="text-gray-500">No activities logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Cat</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-left">Score</th>
                  <th className="px-4 py-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((act) => {
                  const cat = cats.find((c) => c.id === act.cat_id);
                  return (
                    <tr key={act.id} className="border-t">
                      <td className="px-4 py-2">{cat?.name ?? 'Unknown'}</td>
                      <td className="px-4 py-2">{act.description}</td>
                      <td className="px-4 py-2">{act.suspicion_score}</td>
                      <td className="px-4 py-2">{new Date(act.activity_date).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Daily Conspiracy Levels */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Daily Conspiracy Levels</h2>
        {daily.length === 0 ? (
          <p className="text-gray-500">No conspiracy data yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {daily.map((d) => {
              const cat = cats.find((c) => c.id === d.cat_id);
              return (
                <Card key={`${d.cat_id}-${d.date.toISOString()}`} className="p-4">
                  <h3 className="font-medium">{cat?.name ?? 'Unknown Cat'}</h3>
                  <p className="text-sm text-gray-600">Date: {new Date(d.date).toLocaleDateString()}</p>
                  <p className="mt-2 text-lg font-bold">Total Score: {d.total_score}</p>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
