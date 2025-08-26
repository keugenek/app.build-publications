import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CarManagement } from './components/CarManagement';
import { MaintenanceTracking } from './components/MaintenanceTracking';
import { ServiceReminders } from './components/ServiceReminders';
import { Dashboard } from './components/Dashboard';
import { trpc } from '@/utils/trpc';
import type { Car } from '../../server/src/schema';

function App() {
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoadingCars, setIsLoadingCars] = useState(false);

  const loadCars = useCallback(async () => {
    setIsLoadingCars(true);
    try {
      const result = await trpc.getCars.query();
      setCars(result);
    } catch (error) {
      console.error('Failed to load cars:', error);
    } finally {
      setIsLoadingCars(false);
    }
  }, []);

  useEffect(() => {
    loadCars();
  }, [loadCars]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🚗 Car Maintenance Tracker</h1>
          <p className="text-gray-600">Keep your vehicles in perfect condition with smart maintenance tracking</p>
        </header>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-md mx-auto mb-8">
            <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
            <TabsTrigger value="cars">🚙 Cars</TabsTrigger>
            <TabsTrigger value="maintenance">🔧 Maintenance</TabsTrigger>
            <TabsTrigger value="reminders">⏰ Reminders</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard cars={cars} isLoadingCars={isLoadingCars} />
          </TabsContent>

          <TabsContent value="cars">
            <CarManagement 
              cars={cars} 
              setCars={setCars}
              isLoadingCars={isLoadingCars}
            />
          </TabsContent>

          <TabsContent value="maintenance">
            <MaintenanceTracking cars={cars} />
          </TabsContent>

          <TabsContent value="reminders">
            <ServiceReminders cars={cars} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
