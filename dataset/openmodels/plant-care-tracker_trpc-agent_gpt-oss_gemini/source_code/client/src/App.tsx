import './App.css';

import { useEffect, useCallback, useState } from 'react';
import { trpc } from '@/utils/trpc';
// Button import removed as it's unused from '@/components/ui/button';
import { PlantForm, PlantEditForm } from '@/components/PlantForm';
import type { Plant, CreatePlantInput, UpdatePlantInput } from '../../server/src/schema';

function App() {
  const [plants, setPlants] = useState<Plant[]>([]);
  // const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadPlants = useCallback(async () => {
    try {
      const data = await trpc.getPlants.query();
      setPlants(data);
    } catch (err) {
      console.error('Failed to load plants', err);
    }
  }, []);

  useEffect(() => {
    loadPlants();
  }, [loadPlants]);

  const handleCreate = async (input: CreatePlantInput) => {
    setCreating(true);
    try {
      const newPlant = await trpc.createPlant.mutate(input);
      setPlants((prev) => [...prev, newPlant]);
    } catch (err) {
      console.error('Create plant error', err);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (input: UpdatePlantInput) => {
    try {
      const updated = await trpc.updatePlant.mutate(input);
      setPlants((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );
    } catch (err) {
      console.error('Update plant error', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Plant Tracker</h1>
      <PlantForm onSubmit={handleCreate} isLoading={creating} />
      {plants.length === 0 ? (
        <p className="text-gray-500 mt-4">No plants yet. Add one above.</p>
      ) : (
        <div className="grid gap-4 mt-4">
          {plants.map((plant) => (
            <div key={plant.id} className="border rounded-md p-4 shadow-sm">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">{plant.name}</h2>
                <span className={`px-2 py-1 rounded text-sm ${plant.mood === 'happy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {plant.mood}
                </span>
              </div>
              <p className="text-gray-600">Species: {plant.species}</p>
              <p className="text-gray-600">Last watered: {new Date(plant.last_watered_at).toLocaleDateString()}</p>
              <p className="text-gray-600">Created: {new Date(plant.created_at).toLocaleDateString()}</p>
              <PlantEditForm plant={plant} onSubmit={handleUpdate} isLoading={updatingId === plant.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
