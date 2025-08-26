import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardAction } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import type { Car, CreateCarInput } from '../../../server/src/schema';

interface CarManagementProps {
  cars: Car[];
  setCars: React.Dispatch<React.SetStateAction<Car[]>>;
  isLoadingCars: boolean;
}

export function CarManagement({ cars, setCars, isLoadingCars }: CarManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateCarInput>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await trpc.createCar.mutate(formData);
      setCars((prev: Car[]) => [...prev, response]);
      setFormData({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        license_plate: ''
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create car:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (carId: number) => {
    if (!window.confirm('Are you sure you want to delete this car? This will also delete all associated maintenance records and reminders.')) {
      return;
    }
    
    try {
      await trpc.deleteCar.mutate({ id: carId });
      setCars((prev: Car[]) => prev.filter((car: Car) => car.id !== carId));
    } catch (error) {
      console.error('Failed to delete car:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🚙 Car Management</h2>
          <p className="text-gray-600">Add and manage your vehicles</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              ➕ Add New Car
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Car</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Make *
                </label>
                <Input
                  placeholder="e.g., Toyota, Honda, Ford"
                  value={formData.make}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateCarInput) => ({ ...prev, make: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model *
                </label>
                <Input
                  placeholder="e.g., Camry, Civic, F-150"
                  value={formData.model}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateCarInput) => ({ ...prev, model: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year *
                </label>
                <Input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateCarInput) => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))
                  }
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Plate *
                </label>
                <Input
                  placeholder="e.g., ABC-1234"
                  value={formData.license_plate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateCarInput) => ({ ...prev, license_plate: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Car'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingCars ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading cars...</div>
        </div>
      ) : cars.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No cars registered yet</h3>
            <p className="text-gray-600 mb-4">
              Start by adding your first vehicle to begin tracking maintenance
            </p>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Your First Car
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car: Car) => (
            <Card key={car.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{car.year} {car.make} {car.model}</span>
                  <CardAction>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(car.id)}
                      className="h-8 w-8 p-0"
                    >
                      🗑️
                    </Button>
                  </CardAction>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">License Plate:</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                      {car.license_plate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Year:</span>
                    <span className="text-sm">{car.year}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <span className="text-xs text-gray-500">
                      Added: {car.created_at.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
