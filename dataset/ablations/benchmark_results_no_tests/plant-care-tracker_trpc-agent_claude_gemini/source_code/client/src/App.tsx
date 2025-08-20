import { Card, CardContent } from '@/components/ui/card';
import { Leaf } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { AddPlantForm } from '@/components/AddPlantForm';
import { PlantCard } from '@/components/PlantCard';
import type { PlantWithMood, CreatePlantInput } from '../../server/src/schema';

function App() {
  const [plants, setPlants] = useState<PlantWithMood[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Calculate plant mood based on last watered date
  const calculateMood = useCallback((lastWatered: Date): 'Happy' | 'Thirsty' => {
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 3 ? 'Happy' : 'Thirsty';
  }, []);

  // Load plants from API
  const loadPlants = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getPlants.query();
      // Since the API stub returns empty array, we'll add mood calculation here
      const plantsWithMood = result.map(plant => ({
        ...plant,
        mood: calculateMood(plant.last_watered)
      }));
      setPlants(plantsWithMood);
    } catch (error) {
      console.error('Failed to load plants:', error);
    } finally {
      setIsLoading(false);
    }
  }, [calculateMood]);

  useEffect(() => {
    loadPlants();
  }, [loadPlants]);

  // Handle form submission for new plants
  const handleCreatePlant = async (formData: CreatePlantInput) => {
    setIsCreating(true);
    try {
      const newPlant = await trpc.createPlant.mutate(formData);
      const plantWithMood: PlantWithMood = {
        ...newPlant,
        mood: calculateMood(newPlant.last_watered)
      };
      setPlants((prev: PlantWithMood[]) => [...prev, plantWithMood]);
    } catch (error) {
      console.error('Failed to create plant:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle watering a plant (updating last watered date)
  const handleWaterPlant = async (plantId: number) => {
    try {
      const now = new Date();
      const updatedPlant = await trpc.updatePlantWatered.mutate({
        id: plantId,
        last_watered: now
      });
      
      // Update the plant in our state
      setPlants((prev: PlantWithMood[]) => prev.map(plant => 
        plant.id === plantId 
          ? { ...updatedPlant, mood: calculateMood(now) }
          : plant
      ));
    } catch (error) {
      console.error('Failed to water plant:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="h-8 w-8 text-green-600" />
            <h1 className="text-4xl font-bold text-green-800">🌱 Plant Care Tracker</h1>
          </div>
          <p className="text-green-700 text-lg">Keep your green friends happy and hydrated!</p>
        </div>

        {/* Add New Plant Form */}
        <AddPlantForm onSubmit={handleCreatePlant} isCreating={isCreating} />

        {/* Plants List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-green-800 mb-4">Your Plants</h2>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 loading-spinner"></div>
              <p className="mt-2 text-green-600">Loading your plants...</p>
            </div>
          ) : plants.length === 0 ? (
            <Card className="border-dashed border-2 border-green-300">
              <CardContent className="text-center py-12">
                <Leaf className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No plants yet!</h3>
                <p className="text-gray-500">Add your first plant above to start tracking. 🌱</p>
                <div className="mt-4 text-sm text-gray-400">
                  <p>🌿 Note: This demo uses stub data from the backend.</p>
                  <p>In a real application, plants would persist in a database.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plants.map((plant: PlantWithMood) => (
                <PlantCard 
                  key={plant.id} 
                  plant={plant} 
                  onWater={handleWaterPlant}
                />
              ))}
            </div>
          )}
        </div>

        {/* Stats Section */}
        {plants.length > 0 && (
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <Card className="text-center p-4 border-green-200 bg-green-50">
              <div className="text-2xl font-bold text-green-700">{plants.length}</div>
              <div className="text-sm text-green-600">Total Plants</div>
            </Card>
            <Card className="text-center p-4 border-green-200 bg-green-50">
              <div className="text-2xl font-bold text-green-700">
                {plants.filter(p => p.mood === 'Happy').length}
              </div>
              <div className="text-sm text-green-600">Happy Plants 😊</div>
            </Card>
            <Card className="text-center p-4 border-amber-200 bg-amber-50">
              <div className="text-2xl font-bold text-amber-700">
                {plants.filter(p => p.mood === 'Thirsty').length}
              </div>
              <div className="text-sm text-amber-600">Thirsty Plants 😢</div>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p className="text-sm">
            💡 Tip: Plants are happy when watered within the last 3 days!
          </p>
          <p className="text-xs mt-2 text-gray-400">
            This application uses stub backend implementations for demonstration.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
