import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Car as CarIcon, Wrench, Calendar, AlertTriangle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CarsView } from '@/components/CarsView';
import { MaintenanceView } from '@/components/MaintenanceView';
import { ServiceScheduleView } from '@/components/ServiceScheduleView';
import { DashboardView } from '@/components/DashboardView';
import { CarForm } from '@/components/CarForm';
// Using type-only imports for better TypeScript compliance
import type { Car, CreateCarInput, ServiceSchedule } from '../../server/src/schema';

function App() {
  // State management
  const [cars, setCars] = useState<Car[]>([]);
  const [upcomingServices, setUpcomingServices] = useState<ServiceSchedule[]>([]);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCarFormOpen, setIsCarFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cars data
  const loadCars = useCallback(async () => {
    try {
      setError(null);
      const result = await trpc.getCars.query();
      setCars(result);
      // Set first car as selected if none is selected
      if (!selectedCar && result.length > 0) {
        setSelectedCar(result[0]);
      }
    } catch (error) {
      console.error('Failed to load cars:', error);
      setError('Failed to load cars. Using demo data.');
      // Set demo data for development
      const demoData: Car[] = [
        {
          id: 1,
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          license_plate: 'ABC123',
          current_mileage: 45000,
          created_at: new Date('2023-01-15'),
          updated_at: new Date('2023-12-01')
        },
        {
          id: 2,
          make: 'Honda',
          model: 'Civic',
          year: 2019,
          license_plate: 'XYZ789',
          current_mileage: 52000,
          created_at: new Date('2023-02-20'),
          updated_at: new Date('2023-11-15')
        }
      ];
      setCars(demoData);
      if (!selectedCar) {
        setSelectedCar(demoData[0]);
      }
    }
  }, [selectedCar]);

  // Load upcoming services for dashboard
  const loadUpcomingServices = useCallback(async () => {
    try {
      const result = await trpc.getUpcomingServices.query();
      setUpcomingServices(result);
    } catch (error) {
      console.error('Failed to load upcoming services:', error);
      // Set demo data for development
      const demoServices: ServiceSchedule[] = [
        {
          id: 1,
          car_id: 1,
          service_type: 'Oil Change',
          interval_type: 'mileage',
          interval_value: 5000,
          last_service_date: new Date('2023-10-15'),
          last_service_mileage: 40000,
          next_service_date: null,
          next_service_mileage: 45000,
          is_active: true,
          created_at: new Date('2023-01-15'),
          updated_at: new Date('2023-10-15')
        }
      ];
      setUpcomingServices(demoServices);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    loadCars();
    loadUpcomingServices();
  }, [loadCars, loadUpcomingServices]);

  // Handle car creation
  const handleCreateCar = async (data: CreateCarInput) => {
    setIsLoading(true);
    try {
      const newCar = await trpc.createCar.mutate(data);
      setCars((prev: Car[]) => [...prev, newCar]);
      setIsCarFormOpen(false);
      setError(null);
    } catch (error) {
      console.error('Failed to create car:', error);
      setError('Failed to create car. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle car selection change
  const handleCarChange = (car: Car) => {
    setSelectedCar(car);
  };

  // Handle data refresh
  const handleRefresh = () => {
    loadCars();
    loadUpcomingServices();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <CarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">🚗 Car Maintenance Dashboard</h1>
                <p className="text-gray-600">Keep your vehicles running smoothly</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRefresh} variant="outline" size="sm">
                Refresh Data
              </Button>
              <Dialog open={isCarFormOpen} onOpenChange={setIsCarFormOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Car
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Car</DialogTitle>
                  </DialogHeader>
                  <CarForm onSubmit={handleCreateCar} isLoading={isLoading} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="cars" className="flex items-center gap-2">
              <CarIcon className="h-4 w-4" />
              Cars
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Maintenance
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardView 
              cars={cars}
              upcomingServices={upcomingServices}
              onRefresh={handleRefresh}
            />
          </TabsContent>

          <TabsContent value="cars">
            <CarsView 
              cars={cars}
              onCarsChange={setCars}
              onCarSelect={handleCarChange}
              selectedCar={selectedCar}
            />
          </TabsContent>

          <TabsContent value="maintenance">
            <MaintenanceView 
              cars={cars}
              selectedCar={selectedCar}
              onCarSelect={handleCarChange}
            />
          </TabsContent>

          <TabsContent value="schedule">
            <ServiceScheduleView 
              cars={cars}
              selectedCar={selectedCar}
              onCarSelect={handleCarChange}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
