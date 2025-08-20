import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Plant, CreatePlantInput, UpdatePlantInput } from '../../server/src/schema';
import { PlantCard } from '@/components/PlantCard';
import { PlantForm } from '@/components/PlantForm';
import { MoodLegend } from '@/components/MoodLegend';



function App() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form state for creating new plants
  const [newPlantForm, setNewPlantForm] = useState<CreatePlantInput>({
    name: '',
    last_watered: new Date(),
    sunlight_exposure: 'Medium'
  });

  // Form state for editing plants
  const [editForm, setEditForm] = useState<Partial<UpdatePlantInput>>({
    name: '',
    last_watered: new Date(),
    sunlight_exposure: 'Medium'
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

  const handleCreatePlant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createPlant.mutate(newPlantForm);
      setPlants((prev: Plant[]) => [...prev, response]);
      setNewPlantForm({
        name: '',
        last_watered: new Date(),
        sunlight_exposure: 'Medium'
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to create plant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlant) return;

    setIsLoading(true);
    try {
      const updateData: UpdatePlantInput = {
        id: editingPlant.id,
        ...editForm
      };
      const response = await trpc.updatePlant.mutate(updateData);
      setPlants((prev: Plant[]) => 
        prev.map((plant: Plant) => plant.id === response.id ? response : plant)
      );
      setIsEditDialogOpen(false);
      setEditingPlant(null);
    } catch (error) {
      console.error('Failed to update plant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlant = async (plantId: number) => {
    try {
      await trpc.deletePlant.mutate({ id: plantId });
      setPlants((prev: Plant[]) => prev.filter((plant: Plant) => plant.id !== plantId));
    } catch (error) {
      console.error('Failed to delete plant:', error);
    }
  };

  const openEditDialog = (plant: Plant) => {
    setEditingPlant(plant);
    setEditForm({
      name: plant.name,
      last_watered: plant.last_watered,
      sunlight_exposure: plant.sunlight_exposure
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2">
            🌱 Plant Care Tracker 🌿
          </h1>
          <p className="text-gray-600">Keep your green friends happy and healthy!</p>
        </div>

        {/* Add Plant Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mb-6 bg-green-600 hover:bg-green-700">
              ➕ Add New Plant
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-green-800">🌱 Add New Plant</DialogTitle>
            </DialogHeader>
            <PlantForm
              mode="create"
              formData={newPlantForm}
              onFormChange={(data) => setNewPlantForm(data as CreatePlantInput)}
              onSubmit={handleCreatePlant}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Plant Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-green-800">🌿 Edit Plant</DialogTitle>
            </DialogHeader>
            <PlantForm
              mode="edit"
              formData={editForm}
              onFormChange={(data) => setEditForm(data as Partial<UpdatePlantInput>)}
              onSubmit={handleUpdatePlant}
              onCancel={() => setIsEditDialogOpen(false)}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>

        {/* Plants Grid */}
        {plants.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4 plant-bounce">🪴</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No plants yet!</h3>
              <p className="text-gray-500 mb-4">Add your first plant to start tracking its care.</p>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                🌱 Add Your First Plant
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plants.map((plant: Plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onEdit={openEditDialog}
                onDelete={handleDeletePlant}
              />
            ))}
          </div>
        )}

        {/* Footer with mood legend */}
        {plants.length > 0 && <MoodLegend />}
      </div>
    </div>
  );
}

export default App;
