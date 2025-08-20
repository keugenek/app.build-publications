import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { CarManagement } from '@/components/CarManagement';
import { MaintenanceHistory } from '@/components/MaintenanceHistory';
import { ServiceReminders } from '@/components/ServiceReminders';
import type { Car } from '../../server/src/schema';

function App() {
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('cars');

  const loadCars = useCallback(async () => {
    try {
      const result = await trpc.getCars.query();
      setCars(result);
      // Auto-select first car if none selected and cars exist
      if (result.length > 0 && !selectedCarId) {
        setSelectedCarId(result[0].id);
      }
    } catch (error) {
      console.error('Failed to load cars:', error);
    }
  }, [selectedCarId]);

  useEffect(() => {
    loadCars();
  }, [loadCars]);

  const handleCarCreated = (newCar: Car) => {
    setCars((prev: Car[]) => [...prev, newCar]);
    setSelectedCarId(newCar.id);
  };

  const handleCarUpdated = (updatedCar: Car) => {
    setCars((prev: Car[]) => 
      prev.map((car: Car) => car.id === updatedCar.id ? updatedCar : car)
    );
  };

  const handleCarDeleted = (deletedCarId: number) => {
    setCars((prev: Car[]) => prev.filter((car: Car) => car.id !== deletedCarId));
    if (selectedCarId === deletedCarId) {
      const remainingCars = cars.filter((car: Car) => car.id !== deletedCarId);
      setSelectedCarId(remainingCars.length > 0 ? remainingCars[0].id : null);
    }
  };

  const selectedCar = cars.find((car: Car) => car.id === selectedCarId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            🚗 Car Maintenance Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Keep track of your vehicles, maintenance history, and upcoming service reminders
          </p>
        </div>

        {/* Car Selection */}
        {cars.length > 0 && (
          <Card className="mb-6 bg-white/80 backdrop-blur-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                🔧 Select Vehicle
              </CardTitle>
              <CardDescription>
                Choose a car to view its maintenance details and reminders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {cars.map((car: Car) => (
                  <button
                    key={car.id}
                    onClick={() => setSelectedCarId(car.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedCarId === car.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">
                        {car.year} {car.make} {car.model}
                      </div>
                      <div className="text-sm text-gray-500">VIN: {car.vin}</div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="cars" className="flex items-center gap-2">
              🚙 My Cars
              <Badge variant="secondary" className="ml-1">
                {cars.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2" disabled={!selectedCar}>
              🔧 Maintenance History
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-2" disabled={!selectedCar}>
              ⏰ Service Reminders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cars" className="space-y-6">
            <CarManagement
              cars={cars}
              onCarCreated={handleCarCreated}
              onCarUpdated={handleCarUpdated}
              onCarDeleted={handleCarDeleted}
            />
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            {selectedCar ? (
              <MaintenanceHistory car={selectedCar} />
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  <p className="text-lg">Please select a car to view maintenance history</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reminders" className="space-y-6">
            {selectedCar ? (
              <ServiceReminders car={selectedCar} />
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  <p className="text-lg">Please select a car to view service reminders</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Empty State */}
        {cars.length === 0 && (
          <Card className="text-center py-12 bg-white/80 backdrop-blur-sm">
            <CardContent>
              <div className="text-6xl mb-4">🚗</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Welcome to Your Car Maintenance Dashboard
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start by adding your first vehicle to track maintenance history and set service reminders.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;
