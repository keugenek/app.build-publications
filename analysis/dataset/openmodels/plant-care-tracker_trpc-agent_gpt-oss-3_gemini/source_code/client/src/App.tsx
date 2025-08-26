import './App.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useCallback } from 'react';
import type { Plant, CreatePlantInput } from '../../server/src/schema';

function App() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state for creating a plant
  const [newPlant, setNewPlant] = useState<{ name: string; type: string; last_watered: string }>({
    name: '',
    type: '',
    last_watered: '',
  });

  // Load plants from localStorage on mount
  const loadPlants = useCallback(() => {
    try {
      const stored = localStorage.getItem('plants');
      if (stored) {
        const parsed: Plant[] = JSON.parse(stored);
        setPlants(parsed);
      }
    } catch (error) {
      console.error('Failed to load plants from localStorage', error);
    }
  }, []);

  useEffect(() => {
    loadPlants();
  }, [loadPlants]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const input: CreatePlantInput = {
        name: newPlant.name,
        type: newPlant.type,
        ...(newPlant.last_watered ? { last_watered: new Date(newPlant.last_watered) } : {}),
      };
      // Generate a unique local id (timestamp + random fraction)
      const localId = Date.now() + Math.random();
      const now = input.last_watered ?? new Date();
      const mood: Plant['mood'] = now.getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000 ? 'Thirsty' : 'Happy';
      const created: Plant = {
        id: localId,
        name: input.name,
        type: input.type,
        last_watered: now,
        mood,
      };
      // Update state and persist
      setPlants((prev) => {
        const updated = [...prev, created];
        localStorage.setItem('plants', JSON.stringify(updated));
        return updated;
      });
      setNewPlant({ name: '', type: '', last_watered: '' });
    } catch (error) {
      console.error('Error creating plant', error);
    } finally {
      setCreating(false);
    }
  };

  const handleWaterNow = async (plantId: number) => {
    setLoading(true);
    try {
      setPlants((prev) => {
        const updated = prev.map((p) => {
          if (p.id === plantId) {
            const newDate = new Date();
            const mood: Plant['mood'] = newDate.getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000 ? 'Thirsty' : 'Happy';
            return { ...p, last_watered: newDate, mood };
          }
          return p;
        });
        localStorage.setItem('plants', JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Error updating plant', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">My Plant Tracker</h1>

      {/* Add Plant Form */}
      <form onSubmit={handleCreate} className="space-y-4 mb-8 border p-4 rounded-md shadow-sm">
        <h2 className="text-xl font-semibold">Add a New Plant</h2>
        <Input
          placeholder="Plant name"
          value={newPlant.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setNewPlant((prev) => ({ ...prev, name: e.target.value }))
          }
          required
        />
        <Input
          placeholder="Plant type"
          value={newPlant.type}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setNewPlant((prev) => ({ ...prev, type: e.target.value }))
          }
          required
        />
        <Input
          type="date"
          placeholder="Last watered (optional)"
          value={newPlant.last_watered}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setNewPlant((prev) => ({ ...prev, last_watered: e.target.value }))
          }
        />
        <Button type="submit" disabled={creating}>
          {creating ? 'Adding...' : 'Add Plant'}
        </Button>
      </form>

      {/* Plant List */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Your Plants</h2>
        {plants.length === 0 ? (
          <p className="text-gray-500">No plants added yet.</p>
        ) : (
          <ul className="space-y-4">
            {plants.map((plant) => (
              <li
                key={plant.id}
                className="border p-4 rounded-md flex flex-col md:flex-row md:justify-between items-start md:items-center"
              >
                <div className="flex-1">
                  <h3 className="text-xl font-medium">{plant.name}</h3>
                  <p className="text-sm text-gray-600">Type: {plant.type}</p>
                  <p className="text-sm text-gray-600">
                    Last watered: {new Date(plant.last_watered).toLocaleDateString()}
                  </p>
                  <p className="text-sm mt-1">
                    Mood: <span className={plant.mood === 'Happy' ? 'text-green-600' : 'text-red-600'}>{plant.mood}</span>
                  </p>
                </div>
                <Button
                  className="mt-2 md:mt-0"
                  disabled={loading}
                  onClick={() => handleWaterNow(plant.id)}
                >
                  {loading ? 'Updating...' : 'Water Now'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default App;
