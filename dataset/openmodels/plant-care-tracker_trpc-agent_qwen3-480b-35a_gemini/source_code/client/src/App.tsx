import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { Plant, CreatePlantInput } from '../../server/src/schema';

function App() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePlantInput>({ name: '' });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await trpc.createPlant.mutate(formData);
      setPlants((prev: Plant[]) => [...prev, response]);
      setFormData({ name: '' });
    } catch (error) {
      console.error('Failed to create plant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWaterPlant = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await trpc.waterPlant.mutate({ id });
      setPlants((prev: Plant[]) => 
        prev.map((plant: Plant) => 
          plant.id === id ? response : plant
        )
      );
    } catch (error) {
      console.error('Failed to water plant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate days since last watered
  const daysSinceWatered = (lastWateredDate: Date) => {
    const diffTime = Math.abs(new Date().getTime() - new Date(lastWateredDate).getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12 pt-8">
          <h1 className="text-3xl md:text-4xl font-bold text-green-800 mb-2">🌱 Plant Tracker</h1>
          <p className="text-green-600">Keep your plants happy and healthy</p>
        </header>

        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle>Add New Plant</CardTitle>
            <CardDescription>Enter the name of your new plant</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                placeholder="Plant name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreatePlantInput) => ({ ...prev, name: e.target.value }))
                }
                required
              />
              <Button type="submit" disabled={isLoading} className="whitespace-nowrap">
                {isLoading ? 'Adding...' : 'Add Plant'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-green-800 mb-4">Your Plants</h2>
          
          {plants.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-green-600 mb-4">No plants yet. Add your first plant above!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plants.map((plant: Plant) => (
                <Card key={plant.id} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {plant.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Created {new Date(plant.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={plant.mood === 'Happy' ? 'default' : 'destructive'}
                        className="text-xs px-2 py-1"
                      >
                        {plant.mood}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Last watered: {new Date(plant.lastWateredDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {daysSinceWatered(plant.lastWateredDate)} days ago
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => handleWaterPlant(plant.id)} 
                      disabled={isLoading}
                      className="w-full"
                      variant={plant.mood === 'Thirsty' ? 'default' : 'outline'}
                    >
                      💧 Water Plant
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
