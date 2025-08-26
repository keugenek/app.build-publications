import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { PlantWithMood, CreatePlantInput } from '../../server/src/schema';

function App() {
  const [plants, setPlants] = useState<PlantWithMood[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWateringDialogOpen, setIsWateringDialogOpen] = useState(false);
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null);
  
  // Form state for adding new plants
  const [newPlantForm, setNewPlantForm] = useState<CreatePlantInput>({
    name: '',
    last_watered: undefined
  });

  // Load plants from API
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

  // Handle creating a new plant
  const handleCreatePlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlantForm.name.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await trpc.createPlant.mutate(newPlantForm);
      
      // Since backend returns Plant but we need PlantWithMood, we'll calculate mood
      const plantWithMood: PlantWithMood = {
        ...response,
        mood: calculateMood(response.last_watered)
      };
      
      setPlants((prev: PlantWithMood[]) => [...prev, plantWithMood]);
      
      // Reset form
      setNewPlantForm({
        name: '',
        last_watered: undefined
      });
    } catch (error) {
      console.error('Failed to create plant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle watering a plant
  const handleWaterPlant = async (plantId: number) => {
    setIsLoading(true);
    try {
      const response = await trpc.updatePlantWatered.mutate({
        id: plantId,
        last_watered: new Date()
      });
      
      // Update the specific plant in our state
      setPlants((prev: PlantWithMood[]) => 
        prev.map((plant: PlantWithMood) => 
          plant.id === plantId 
            ? { ...response, mood: calculateMood(response.last_watered) }
            : plant
        )
      );
      
      setIsWateringDialogOpen(false);
      setSelectedPlantId(null);
    } catch (error) {
      console.error('Failed to water plant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate mood based on last watered date (client-side for immediate feedback)
  const calculateMood = (lastWatered: Date): 'Happy' | 'Thirsty' => {
    const now = new Date();
    const daysSinceWatered = Math.floor((now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceWatered <= 3 ? 'Happy' : 'Thirsty';
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Get days since watered
  const getDaysSinceWatered = (lastWatered: Date) => {
    const now = new Date();
    const days = Math.floor((now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2">
            🌱 Plant Care Tracker
          </h1>
          <p className="text-green-600">Keep your green friends happy and hydrated!</p>
        </div>

        {/* Add New Plant Form */}
        <Card className="mb-8 border-green-200 shadow-lg">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-green-800 flex items-center gap-2">
              <span>🌿</span>
              Add New Plant
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreatePlant} className="space-y-4">
              <div>
                <Label htmlFor="plant-name" className="text-green-700">Plant Name</Label>
                <Input
                  id="plant-name"
                  placeholder="Enter plant name (e.g., Sunny the Sunflower)"
                  value={newPlantForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewPlantForm((prev: CreatePlantInput) => ({ ...prev, name: e.target.value }))
                  }
                  className="border-green-200 focus:border-green-400"
                  required
                />
              </div>
              <div>
                <Label htmlFor="last-watered" className="text-green-700">Last Watered (optional)</Label>
                <Input
                  id="last-watered"
                  type="date"
                  value={newPlantForm.last_watered ? newPlantForm.last_watered.toISOString().split('T')[0] : ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewPlantForm((prev: CreatePlantInput) => ({
                      ...prev,
                      last_watered: e.target.value ? new Date(e.target.value) : undefined
                    }))
                  }
                  className="border-green-200 focus:border-green-400"
                />
                <p className="text-sm text-green-600 mt-1">Leave empty to set as today</p>
              </div>
              <Button 
                type="submit" 
                disabled={isLoading || !newPlantForm.name.trim()}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? 'Adding Plant... 🌱' : 'Add Plant 🌿'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Plants List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-green-800 mb-4">
            Your Plant Family ({plants.length})
          </h2>

          {plants.length === 0 ? (
            <Card className="text-center py-12 border-green-200">
              <CardContent>
                <div className="text-6xl mb-4">🌱</div>
                <h3 className="text-xl font-semibold text-green-700 mb-2">No plants yet!</h3>
                <p className="text-green-600">Add your first plant above to start tracking their care.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plants.map((plant: PlantWithMood) => {
                const daysSince = getDaysSinceWatered(plant.last_watered);
                const moodEmoji = plant.mood === 'Happy' ? '😊' : '😰';
                const moodColor = plant.mood === 'Happy' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-orange-100 text-orange-800 border-orange-200';
                
                return (
                  <Card key={plant.id} className="border-green-200 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-green-800 text-lg">{plant.name}</CardTitle>
                        <Badge className={`${moodColor} font-medium`}>
                          {moodEmoji} {plant.mood}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-green-600">Last Watered</p>
                          <p className="font-medium text-green-800">{formatDate(plant.last_watered)}</p>
                          <p className="text-xs text-green-500">
                            {daysSince === 0 ? 'Today' : `${daysSince} day${daysSince > 1 ? 's' : ''} ago`}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-green-600">Added</p>
                          <p className="text-xs text-green-500">{formatDate(plant.created_at)}</p>
                        </div>

                        <Dialog 
                          open={isWateringDialogOpen && selectedPlantId === plant.id}
                          onOpenChange={(open) => {
                            setIsWateringDialogOpen(open);
                            if (!open) setSelectedPlantId(null);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button 
                              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                              onClick={() => {
                                setSelectedPlantId(plant.id);
                                setIsWateringDialogOpen(true);
                              }}
                            >
                              💧 Water Plant
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="border-green-200">
                            <DialogHeader>
                              <DialogTitle className="text-green-800 flex items-center gap-2">
                                💧 Water {plant.name}?
                              </DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                              <p className="text-green-700 mb-4">
                                Are you sure you want to water {plant.name} now? This will update the "last watered" date to today.
                              </p>
                              <div className="flex gap-3 justify-end">
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setIsWateringDialogOpen(false);
                                    setSelectedPlantId(null);
                                  }}
                                  className="border-green-200 text-green-700 hover:bg-green-50"
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={() => handleWaterPlant(plant.id)}
                                  disabled={isLoading}
                                  className="bg-blue-500 hover:bg-blue-600 text-white"
                                >
                                  {isLoading ? 'Watering... 💧' : 'Yes, Water Now! 💧'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
