import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit2, Trash2, Search, Car as CarIcon, Calendar, Gauge } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { CarForm } from '@/components/CarForm';
import type { Car, UpdateCarInput } from '../../../server/src/schema';

interface CarsViewProps {
  cars: Car[];
  onCarsChange: (cars: Car[]) => void;
  onCarSelect?: (car: Car) => void;
  selectedCar?: Car | null;
}

export function CarsView({ cars, onCarsChange, onCarSelect, selectedCar }: CarsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Filter cars based on search term
  const filteredCars = cars.filter((car) =>
    car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.year.toString().includes(searchTerm)
  );

  // Handle car update
  const handleUpdateCar = async (updateData: Omit<UpdateCarInput, 'id'>) => {
    if (!editingCar) return;

    setIsLoading(true);
    try {
      const updatedCar = await trpc.updateCar.mutate({
        id: editingCar.id,
        ...updateData
      });
      
      const newCars = cars.map((car) =>
        car.id === editingCar.id ? updatedCar : car
      );
      onCarsChange(newCars);
      
      setIsEditDialogOpen(false);
      setEditingCar(null);
    } catch (error) {
      console.error('Failed to update car:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle car deletion
  const handleDeleteCar = async (carId: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteCar.mutate({ id: carId });
      const newCars = cars.filter((car) => car.id !== carId);
      onCarsChange(newCars);
      
      // If deleted car was selected, clear selection
      if (selectedCar?.id === carId) {
        onCarSelect?.(newCars[0] || null);
      }
    } catch (error) {
      console.error('Failed to delete car:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (car: Car) => {
    setEditingCar(car);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <CarIcon className="h-5 w-5 text-blue-600" />
              Cars ({filteredCars.length})
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search cars..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Cars Grid */}
      {filteredCars.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CarIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              {searchTerm ? (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No cars found</h3>
                  <p className="text-gray-500">Try adjusting your search terms</p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No cars yet</h3>
                  <p className="text-gray-500">Add your first car to get started with maintenance tracking</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCars.map((car) => (
            <Card 
              key={car.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedCar?.id === car.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onCarSelect?.(car)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CarIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {car.year} {car.make}
                      </CardTitle>
                      <p className="text-sm text-gray-600 font-medium">{car.model}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(car);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Car</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {car.year} {car.make} {car.model}? 
                            This will also delete all associated maintenance records and service schedules.
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
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono">
                      🚗 {car.license_plate}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Gauge className="h-4 w-4" />
                      {car.current_mileage.toLocaleString()} mi
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Added {car.created_at.toLocaleDateString()}
                    {car.updated_at.toDateString() !== car.created_at.toDateString() && (
                      <span>• Updated {car.updated_at.toLocaleDateString()}</span>
                    )}
                  </div>

                  {selectedCar?.id === car.id && (
                    <div className="pt-2 border-t">
                      <Badge className="bg-blue-600 hover:bg-blue-700">
                        ✨ Selected
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Car Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit {editingCar?.year} {editingCar?.make} {editingCar?.model}
            </DialogTitle>
          </DialogHeader>
          {editingCar && (
            <CarForm
              onSubmit={handleUpdateCar}
              isLoading={isLoading}
              initialData={editingCar}
              submitLabel="Update Car"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
