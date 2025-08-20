import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { Car, CreateCarInput, UpdateCarInput } from '../../../server/src/schema';

interface CarManagementProps {
  cars: Car[];
  onCarCreated: (car: Car) => void;
  onCarUpdated: (car: Car) => void;
  onCarDeleted: (carId: number) => void;
}

export function CarManagement({ cars, onCarCreated, onCarUpdated, onCarDeleted }: CarManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [addFormData, setAddFormData] = useState<CreateCarInput>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: ''
  });

  const [editFormData, setEditFormData] = useState<Partial<UpdateCarInput>>({});

  const handleAddCar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newCar = await trpc.createCar.mutate(addFormData);
      onCarCreated(newCar);
      setAddFormData({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        vin: ''
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to create car:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCar) return;

    setIsLoading(true);
    try {
      const updateData = {
        id: editingCar.id,
        ...editFormData
      } as UpdateCarInput;
      
      const updatedCar = await trpc.updateCar.mutate(updateData);
      onCarUpdated(updatedCar);
      setIsEditDialogOpen(false);
      setEditingCar(null);
      setEditFormData({});
    } catch (error) {
      console.error('Failed to update car:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCar = async (carId: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteCar.mutate({ id: carId });
      onCarDeleted(carId);
    } catch (error) {
      console.error('Failed to delete car:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (car: Car) => {
    setEditingCar(car);
    setEditFormData({
      make: car.make,
      model: car.model,
      year: car.year,
      vin: car.vin
    });
    setIsEditDialogOpen(true);
  };

  const getCarAge = (year: number) => {
    const currentYear = new Date().getFullYear();
    return currentYear - year;
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              🚙 Vehicle Management
            </CardTitle>
            <CardDescription>
              Add, edit, and manage your vehicles
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                ➕ Add New Car
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Vehicle</DialogTitle>
                <DialogDescription>
                  Enter the details for your new vehicle
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddCar} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="make">Make</Label>
                    <Input
                      id="make"
                      placeholder="Toyota, Honda, etc."
                      value={addFormData.make}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setAddFormData((prev: CreateCarInput) => ({ ...prev, make: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      placeholder="Camry, Civic, etc."
                      value={addFormData.model}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setAddFormData((prev: CreateCarInput) => ({ ...prev, model: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 2}
                    value={addFormData.year}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAddFormData((prev: CreateCarInput) => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vin">VIN</Label>
                  <Input
                    id="vin"
                    placeholder="17-character VIN"
                    maxLength={17}
                    value={addFormData.vin}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAddFormData((prev: CreateCarInput) => ({ ...prev, vin: e.target.value.toUpperCase() }))
                    }
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Adding...' : 'Add Car'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      {/* Cars List */}
      {cars.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cars.map((car: Car) => (
            <Card key={car.id} className="bg-white/80 backdrop-blur-sm border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {car.year} {car.make} {car.model}
                    </CardTitle>
                    <CardDescription className="text-sm font-mono">
                      VIN: {car.vin}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {getCarAge(car.year)} year{getCarAge(car.year) !== 1 ? 's' : ''} old
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 mb-4">
                  Added: {car.created_at.toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(car)}
                    className="flex-1"
                  >
                    ✏️ Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                        🗑️ Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this {car.year} {car.make} {car.model}? 
                          This action cannot be undone and will also delete all associated maintenance records and reminders.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteCar(car.id)}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12 bg-white/80 backdrop-blur-sm">
          <CardContent>
            <div className="text-4xl mb-4">🚗💭</div>
            <p className="text-gray-500 text-lg">
              No vehicles added yet. Click "Add New Car" to get started!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
            <DialogDescription>
              Update the details for {editingCar?.year} {editingCar?.make} {editingCar?.model}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditCar} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-make">Make</Label>
                <Input
                  id="edit-make"
                  value={editFormData.make || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateCarInput>) => ({ ...prev, make: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-model">Model</Label>
                <Input
                  id="edit-model"
                  value={editFormData.model || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateCarInput>) => ({ ...prev, model: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-year">Year</Label>
              <Input
                id="edit-year"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 2}
                value={editFormData.year || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev: Partial<UpdateCarInput>) => ({ ...prev, year: parseInt(e.target.value) || undefined }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-vin">VIN</Label>
              <Input
                id="edit-vin"
                maxLength={17}
                value={editFormData.vin || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev: Partial<UpdateCarInput>) => ({ ...prev, vin: e.target.value.toUpperCase() }))
                }
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Car'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
