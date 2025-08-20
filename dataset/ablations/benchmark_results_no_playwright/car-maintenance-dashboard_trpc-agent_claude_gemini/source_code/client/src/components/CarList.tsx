import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { Trash2, RotateCcw, Car as CarIcon } from 'lucide-react';
import type { Car } from '../../../server/src/schema';

interface CarListProps {
  cars: Car[];
  selectedCarId: number | null;
  onCarSelect: (carId: number | null) => void;
  onRefresh: () => void;
}

export function CarList({ cars, selectedCarId, onCarSelect, onRefresh }: CarListProps) {
  const handleDeleteCar = async (carId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this vehicle? This will also delete all associated maintenance records and upcoming services.')) {
      try {
        await trpc.deleteCar.mutate({ id: carId });
        if (selectedCarId === carId) {
          onCarSelect(null);
        }
        onRefresh();
      } catch (error) {
        console.error('Failed to delete car:', error);
      }
    }
  };

  if (cars.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="text-center py-12">
          <CarIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-700 mb-2">No vehicles added yet</p>
          <p className="text-gray-500">Add your first vehicle to start tracking maintenance</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Your Vehicles</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={selectedCarId === null ? "default" : "outline"}
            size="sm"
            onClick={() => onCarSelect(null)}
            className={selectedCarId === null ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            All Vehicles
          </Button>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cars.map((car: Car) => (
          <Card 
            key={car.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedCarId === car.id 
                ? 'ring-2 ring-blue-500 bg-blue-50/80 backdrop-blur-sm' 
                : 'bg-white/80 backdrop-blur-sm hover:bg-white/90'
            }`}
            onClick={() => onCarSelect(car.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    🚙 {car.year} {car.make} {car.model}
                  </h3>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>📊 {car.current_mileage.toLocaleString()} miles</p>
                    {car.license_plate && (
                      <p>🆔 {car.license_plate}</p>
                    )}
                  </div>
                  
                  <div className="mt-3">
                    <Badge variant="secondary" className="text-xs">
                      Added {car.created_at.toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => handleDeleteCar(car.id, e)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
