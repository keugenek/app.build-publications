import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { PlantForm } from '@/components/PlantForm';
import { PlantCard } from '@/components/PlantCard';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import type { CreatePlantInput, PlantWithMood } from '../../server/src/schema';

function App() {
  const [plants, setPlants] = useState<PlantWithMood[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  const loadPlants = useCallback(async () => {
    try {
      const result = await trpc.getPlants.query();
      setPlants(result);
    } catch (error) {
      console.error('Failed to load plants:', error);
    }
  }, []);

  useEffect(() => {
    loadPlants();
  }, [loadPlants]);

  const handleCreatePlant = async (data: CreatePlantInput) => {
    setIsLoading(true);
    try {
      await trpc.createPlant.mutate(data);
      // Refresh the plant list
      await loadPlants();
    } catch (error) {
      console.error('Failed to create plant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWaterPlant = async (id: number) => {
    setIsUpdating(id);
    try {
      await trpc.updatePlant.mutate({ 
        id, 
        lastWatered: new Date() 
      });
      // Refresh the plant list to get updated moods
      await loadPlants();
    } catch (error) {
      console.error('Failed to water plant:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8">
      <div className="container mx-auto px-4">
        <header className="text-center mb-12">
          <h1 className="text-3xl font-bold text-green-800 mb-2">Plant Tracker</h1>
          <p className="text-muted-foreground">Keep your plants happy and healthy</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <PlantForm onSubmit={handleCreatePlant} isLoading={isLoading} />
          </div>
          
          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Your Plants</h2>
              <Button 
                onClick={loadPlants} 
                variant="outline" 
                size="sm"
              >
                Refresh
              </Button>
            </div>
            
            {plants.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No plants yet. Add your first plant to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plants.map((plant) => (
                  <PlantCard 
                    key={plant.id} 
                    plant={plant} 
                    onWater={handleWaterPlant}
                    isUpdating={isUpdating === plant.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
