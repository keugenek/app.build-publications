import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { CarForm } from '@/components/CarForm';
import { MaintenanceForm } from '@/components/MaintenanceForm';
import { UpcomingServiceForm } from '@/components/UpcomingServiceForm';
import { CarList } from '@/components/CarList';
import { MaintenanceHistory } from '@/components/MaintenanceHistory';
import { UpcomingServices } from '@/components/UpcomingServices';
import { Plus, Car as CarIcon, Wrench, Calendar } from 'lucide-react';
import type { Car as CarType, MaintenanceRecord, UpcomingService } from '../../server/src/schema';

function App() {
  const [cars, setCars] = useState<CarType[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [upcomingServices, setUpcomingServices] = useState<UpcomingService[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Form visibility states
  const [showCarForm, setShowCarForm] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [showUpcomingServiceForm, setShowUpcomingServiceForm] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [carsResult, maintenanceResult, servicesResult] = await Promise.all([
        trpc.getCars.query(),
        trpc.getMaintenanceRecords.query(),
        trpc.getUpcomingServices.query()
      ]);
      
      setCars(carsResult);
      setMaintenanceRecords(maintenanceResult);
      setUpcomingServices(servicesResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter data by selected car
  const filteredMaintenanceRecords = selectedCarId 
    ? maintenanceRecords.filter((record: MaintenanceRecord) => record.car_id === selectedCarId)
    : maintenanceRecords;

  const filteredUpcomingServices = selectedCarId
    ? upcomingServices.filter((service: UpcomingService) => service.car_id === selectedCarId)
    : upcomingServices;

  const selectedCar = selectedCarId ? cars.find((car: CarType) => car.id === selectedCarId) : null;

  // Get upcoming services that are due soon (within 30 days)
  const urgentServices = upcomingServices.filter((service: UpcomingService) => {
    const dueDate = new Date(service.due_date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return !service.is_completed && dueDate <= thirtyDaysFromNow;
  });

  const handleCarCreated = (newCar: CarType) => {
    setCars((prev: CarType[]) => [...prev, newCar]);
    setShowCarForm(false);
  };

  const handleMaintenanceCreated = (newRecord: MaintenanceRecord) => {
    setMaintenanceRecords((prev: MaintenanceRecord[]) => [...prev, newRecord]);
    setShowMaintenanceForm(false);
  };

  const handleUpcomingServiceCreated = (newService: UpcomingService) => {
    setUpcomingServices((prev: UpcomingService[]) => [...prev, newService]);
    setShowUpcomingServiceForm(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <CarIcon className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-lg font-medium text-gray-700">Loading your garage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <CarIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🚗 Car Maintenance Dashboard</h1>
              <p className="text-gray-600">Keep track of your vehicle maintenance and upcoming services</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="bg-white/70 backdrop-blur-sm border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CarIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{cars.length}</p>
                    <p className="text-sm text-gray-600">Vehicles Tracked</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/70 backdrop-blur-sm border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Wrench className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{maintenanceRecords.length}</p>
                    <p className="text-sm text-gray-600">Service Records</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{urgentServices.length}</p>
                    <p className="text-sm text-gray-600">Due Soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Car Selection */}
        <div className="mb-6">
          <CarList
            cars={cars}
            selectedCarId={selectedCarId}
            onCarSelect={setSelectedCarId}
            onRefresh={loadData}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button 
            onClick={() => setShowCarForm(true)} 
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
          
          <Button 
            onClick={() => setShowMaintenanceForm(true)} 
            disabled={cars.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Wrench className="w-4 h-4 mr-2" />
            Record Maintenance
          </Button>
          
          <Button 
            onClick={() => setShowUpcomingServiceForm(true)} 
            disabled={cars.length === 0}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Service
          </Button>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance History</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Services</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {selectedCar && (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🚙 {selectedCar.year} {selectedCar.make} {selectedCar.model}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Current Mileage</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedCar.current_mileage.toLocaleString()}</p>
                    </div>
                    {selectedCar.license_plate && (
                      <div>
                        <p className="text-sm text-gray-600">License Plate</p>
                        <p className="text-lg font-medium text-gray-900">{selectedCar.license_plate}</p>
                      </div>
                    )}
                    {selectedCar.vin && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">VIN</p>
                        <p className="text-sm font-mono text-gray-900">{selectedCar.vin}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Recent Maintenance</CardTitle>
                </CardHeader>
                <CardContent>
                  <MaintenanceHistory 
                    records={filteredMaintenanceRecords.slice(0, 5)} 
                    cars={cars}
                    showCarInfo={!selectedCarId}
                    onRecordUpdated={loadData}
                  />
                </CardContent>
              </Card>
              
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Upcoming Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <UpcomingServices 
                    services={filteredUpcomingServices.slice(0, 5)} 
                    cars={cars}
                    showCarInfo={!selectedCarId}
                    onServiceUpdated={loadData}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="maintenance">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>
                  {selectedCar 
                    ? `Maintenance History - ${selectedCar.year} ${selectedCar.make} ${selectedCar.model}`
                    : 'All Maintenance Records'
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MaintenanceHistory 
                  records={filteredMaintenanceRecords} 
                  cars={cars}
                  showCarInfo={!selectedCarId}
                  onRecordUpdated={loadData}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>
                  {selectedCar 
                    ? `Upcoming Services - ${selectedCar.year} ${selectedCar.make} ${selectedCar.model}`
                    : 'All Upcoming Services'
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UpcomingServices 
                  services={filteredUpcomingServices} 
                  cars={cars}
                  showCarInfo={!selectedCarId}
                  onServiceUpdated={loadData}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Forms */}
        {showCarForm && (
          <CarForm 
            onCarCreated={handleCarCreated}
            onCancel={() => setShowCarForm(false)}
          />
        )}
        
        {showMaintenanceForm && (
          <MaintenanceForm 
            cars={cars}
            preSelectedCarId={selectedCarId}
            onMaintenanceCreated={handleMaintenanceCreated}
            onCancel={() => setShowMaintenanceForm(false)}
          />
        )}
        
        {showUpcomingServiceForm && (
          <UpcomingServiceForm 
            cars={cars}
            preSelectedCarId={selectedCarId}
            onUpcomingServiceCreated={handleUpcomingServiceCreated}
            onCancel={() => setShowUpcomingServiceForm(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
