import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { PlantWithMood, CreatePlantInput, UpdatePlantInput, LightLevel, Humidity } from '../../server/src/schema';

function App() {
  const [plants, setPlants] = useState<PlantWithMood[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<PlantWithMood | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<number | null>(null);

  const [formData, setFormData] = useState<CreatePlantInput>({
    name: '',
    lastWateredDate: new Date().toISOString().split('T')[0],
    lightLevel: 'medium',
    humidity: 'medium'
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
      await trpc.createPlant.mutate(formData);
      // Reload all plants to get the proper mood calculation
      loadPlants();
      setFormData({
        name: '',
        lastWateredDate: new Date().toISOString().split('T')[0],
        lightLevel: 'medium',
        humidity: 'medium'
      });
    } catch (error) {
      console.error('Failed to create plant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (data: UpdatePlantInput) => {
    try {
      await trpc.updatePlant.mutate(data);
      // Reload all plants to get the proper mood calculation
      loadPlants();
      setIsEditDialogOpen(false);
      setEditingPlant(null);
    } catch (error) {
      console.error('Failed to update plant:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deletePlant.mutate(id);
      setPlants(prev => prev.filter(plant => plant.id !== id));
      setDeleteConfirmationId(null);
    } catch (error) {
      console.error('Failed to delete plant:', error);
    }
  };

  const openEditDialog = (plant: PlantWithMood) => {
    setEditingPlant(plant);
    setIsEditDialogOpen(true);
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case "Thirsty Leaf":
        return "😢";
      case "Overwatered and Sad":
        return "😵";
      case "Happy Sprout":
        return "😊";
      default:
        return "🌱";
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-green-700 mb-2">Plant Tracker</h1>
        <p className="text-gray-600">Keep your plants happy and healthy</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add New Plant</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Plant Name</Label>
              <Input
                id="name"
                placeholder="e.g., Fern, Cactus..."
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreatePlantInput) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            
            <div>
              <Label htmlFor="lastWateredDate">Last Watered Date</Label>
              <Input
                id="lastWateredDate"
                type="date"
                value={formData.lastWateredDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreatePlantInput) => ({ ...prev, lastWateredDate: e.target.value }))
                }
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lightLevel">Light Level</Label>
                <Select 
                  value={formData.lightLevel} 
                  onValueChange={(value: LightLevel) =>
                    setFormData((prev: CreatePlantInput) => ({ ...prev, lightLevel: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select light level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="humidity">Humidity</Label>
                <Select 
                  value={formData.humidity} 
                  onValueChange={(value: Humidity) =>
                    setFormData((prev: CreatePlantInput) => ({ ...prev, humidity: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select humidity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Adding...' : 'Add Plant'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Your Plants</h2>
        <p className="text-gray-600">{plants.length} plant{plants.length !== 1 ? 's' : ''}</p>
      </div>

      {plants.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-5xl mb-4">🌱</div>
            <h3 className="text-xl font-semibold mb-2">No plants yet</h3>
            <p className="text-gray-600">Add your first plant to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plants.map((plant: PlantWithMood) => (
            <Card key={plant.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{plant.name}</CardTitle>
                  <span className="text-2xl">{getMoodEmoji(plant.mood)}</span>
                </div>
                <p className="text-sm text-gray-500">Mood: {plant.mood}</p>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Watered:</span>
                    <span>{new Date(plant.lastWateredDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Light Level:</span>
                    <span className="capitalize">{plant.lightLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Humidity:</span>
                    <span className="capitalize">{plant.humidity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Added:</span>
                    <span>{plant.created_at.toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
              <div className="px-6 pb-6 flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-grow"
                  onClick={() => openEditDialog(plant)}
                >
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="flex-grow"
                  onClick={() => setDeleteConfirmationId(plant.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Plant Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Plant</DialogTitle>
          </DialogHeader>
          {editingPlant && (
            <EditPlantForm 
              plant={editingPlant} 
              onSubmit={handleEdit} 
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingPlant(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmationId !== null} onOpenChange={() => setDeleteConfirmationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the plant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteConfirmationId && handleDelete(deleteConfirmationId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface EditPlantFormProps {
  plant: PlantWithMood;
  onSubmit: (data: UpdatePlantInput) => Promise<void>;
  onCancel: () => void;
}

function EditPlantForm({ plant, onSubmit, onCancel }: EditPlantFormProps) {
  const [formData, setFormData] = useState<UpdatePlantInput>({
    id: plant.id,
    name: plant.name,
    lastWateredDate: plant.lastWateredDate,
    lightLevel: plant.lightLevel,
    humidity: plant.humidity
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to update plant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-name">Plant Name</Label>
        <Input
          id="edit-name"
          value={formData.name || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: UpdatePlantInput) => ({ ...prev, name: e.target.value }))
          }
          required
        />
      </div>
      
      <div>
        <Label htmlFor="edit-lastWateredDate">Last Watered Date</Label>
        <Input
          id="edit-lastWateredDate"
          type="date"
          value={formData.lastWateredDate || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: UpdatePlantInput) => ({ ...prev, lastWateredDate: e.target.value }))
          }
          required
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-lightLevel">Light Level</Label>
          <Select 
            value={formData.lightLevel || plant.lightLevel || 'medium'} 
            onValueChange={(value: LightLevel) =>
              setFormData((prev: UpdatePlantInput) => ({ ...prev, lightLevel: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select light level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="edit-humidity">Humidity</Label>
          <Select 
            value={formData.humidity || plant.humidity || 'medium'} 
            onValueChange={(value: Humidity) =>
              setFormData((prev: UpdatePlantInput) => ({ ...prev, humidity: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select humidity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-grow">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-grow">
          {isLoading ? 'Updating...' : 'Update Plant'}
        </Button>
      </div>
    </form>
  );
}

export default App;
