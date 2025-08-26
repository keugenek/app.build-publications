import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Plus } from 'lucide-react';
import { PlantCard } from '@/components/PlantCard';
import { PlantStats } from '@/components/PlantStats';
import { PlantFilters } from '@/components/PlantFilters';
import { QuickActions } from '@/components/QuickActions';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { PlantWithMood, CreatePlantInput, LightExposure, UpdatePlantInput, PlantMood } from '../../server/src/schema';

function App() {
  const [plants, setPlants] = useState<PlantWithMood[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [moodFilter, setMoodFilter] = useState<PlantMood | 'all'>('all');
  const [lightFilter, setLightFilter] = useState<LightExposure | 'all'>('all');

  const [formData, setFormData] = useState<CreatePlantInput>({
    name: '',
    type: '',
    last_watered_date: new Date(),
    light_exposure: 'medium' as LightExposure
  });

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
    setIsLoading(true);
    try {
      const response = await trpc.createPlant.mutate(formData);
      setPlants((prev: PlantWithMood[]) => [...prev, response]);
      setFormData({
        name: '',
        type: '',
        last_watered_date: new Date(),
        light_exposure: 'medium' as LightExposure
      });
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create plant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWaterPlant = async (plantId: number) => {
    setIsLoading(true);
    try {
      const updatedPlant = await trpc.updatePlant.mutate({
        id: plantId,
        last_watered_date: new Date()
      });
      if (updatedPlant) {
        setPlants((prev: PlantWithMood[]) =>
          prev.map((plant: PlantWithMood) =>
            plant.id === plantId ? updatedPlant : plant
          )
        );
      }
    } catch (error) {
      console.error('Failed to water plant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePlant = async (plantId: number, updates: Partial<UpdatePlantInput>) => {
    setIsLoading(true);
    try {
      const updatedPlant = await trpc.updatePlant.mutate({
        id: plantId,
        ...updates
      });
      if (updatedPlant) {
        setPlants((prev: PlantWithMood[]) =>
          prev.map((plant: PlantWithMood) =>
            plant.id === plantId ? updatedPlant : plant
          )
        );
      }
    } catch (error) {
      console.error('Failed to update plant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlant = async (plantId: number) => {
    setIsLoading(true);
    try {
      await trpc.deletePlant.mutate({ id: plantId });
      setPlants((prev: PlantWithMood[]) =>
        prev.filter((plant: PlantWithMood) => plant.id !== plantId)
      );
    } catch (error) {
      console.error('Failed to delete plant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered plants based on search and filters
  const filteredPlants = useMemo(() => {
    return plants.filter((plant: PlantWithMood) => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plant.type.toLowerCase().includes(searchTerm.toLowerCase());

      // Mood filter
      const matchesMood = moodFilter === 'all' || plant.mood === moodFilter;

      // Light filter
      const matchesLight = lightFilter === 'all' || plant.light_exposure === lightFilter;

      return matchesSearch && matchesMood && matchesLight;
    });
  }, [plants, searchTerm, moodFilter, lightFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setMoodFilter('all');
    setLightFilter('all');
  };

  const hasActiveFilters = searchTerm !== '' || moodFilter !== 'all' || lightFilter !== 'all';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2 flex items-center justify-center gap-2">
            <Leaf className="h-8 w-8" />
            🌿 Plant Care Tracker 🌿
          </h1>
          <p className="text-green-600 text-lg">Keep your green friends happy and healthy!</p>
        </div>

        {/* Add Plant Button */}
        <div className="mb-6 text-center">
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 floating-leaf"
            size="lg"
          >
            {showForm ? (
              <>
                <Leaf className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                🌱 Add New Plant
              </>
            )}
          </Button>
        </div>

        {/* Add Plant Form */}
        {showForm && (
          <Card className="mb-8 shadow-lg border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-800 flex items-center gap-2">
                <Leaf className="h-5 w-5" />
                Add a New Plant Friend 🌱
              </CardTitle>
              <CardDescription>Give your plant some love by adding its details</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">
                      Plant Name 🏷️
                    </label>
                    <Input
                      placeholder="e.g., Sunny the Sunflower"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreatePlantInput) => ({ ...prev, name: e.target.value }))
                      }
                      className="border-green-200 focus:border-green-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">
                      Plant Type 🌿
                    </label>
                    <Input
                      placeholder="e.g., Sunflower, Rose, Cactus"
                      value={formData.type}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreatePlantInput) => ({ ...prev, type: e.target.value }))
                      }
                      className="border-green-200 focus:border-green-400"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">
                      Last Watered Date 💧
                    </label>
                    <Input
                      type="date"
                      value={formData.last_watered_date.toISOString().split('T')[0]}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreatePlantInput) => ({
                          ...prev,
                          last_watered_date: new Date(e.target.value)
                        }))
                      }
                      className="border-green-200 focus:border-green-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">
                      Light Exposure ☀️
                    </label>
                    <Select
                      value={formData.light_exposure || 'medium'}
                      onValueChange={(value: LightExposure) =>
                        setFormData((prev: CreatePlantInput) => ({ ...prev, light_exposure: value }))
                      }
                    >
                      <SelectTrigger className="border-green-200 focus:border-green-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">🌑 Low Light</SelectItem>
                        <SelectItem value="medium">🌤️ Medium Light</SelectItem>
                        <SelectItem value="high">☀️ High Light</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2"
                >
                  {isLoading ? 'Adding Plant...' : '🌱 Add My Plant Friend'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Plant Statistics */}
        <PlantStats plants={plants} />

        {/* Quick Actions */}
        <QuickActions 
          plants={plants}
          onWaterPlant={handleWaterPlant}
          isLoading={isLoading}
        />

        {/* Plant Filters */}
        {plants.length > 0 && (
          <PlantFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            moodFilter={moodFilter}
            onMoodFilterChange={setMoodFilter}
            lightFilter={lightFilter}
            onLightFilterChange={setLightFilter}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        )}

        {/* Plants Grid */}
        {plants.length === 0 ? (
          <Card className="text-center p-12 shadow-lg border-green-200">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">No plants yet!</h3>
            <p className="text-green-600 mb-4">
              Start your plant care journey by adding your first green friend above.
            </p>
          </Card>
        ) : (
          <>
            {filteredPlants.length === 0 ? (
              <Card className="text-center p-12 shadow-lg border-green-200">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-green-800 mb-2">No plants match your filters</h3>
                <p className="text-green-600 mb-4">
                  Try adjusting your search terms or filters to find your plants.
                </p>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  Clear All Filters
                </Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlants.map((plant: PlantWithMood) => (
                  <div key={plant.id} className="plant-grow">
                    <PlantCard
                      plant={plant}
                      onWater={handleWaterPlant}
                      onUpdate={handleUpdatePlant}
                      onDelete={handleDeletePlant}
                      isLoading={isLoading}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
