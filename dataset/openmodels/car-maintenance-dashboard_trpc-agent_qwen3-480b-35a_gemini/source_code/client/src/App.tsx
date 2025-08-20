import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Car as CarIcon,
  Wrench,
  Calendar,
  Plus,
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react';

// Import types from the server schema
import type { Car, MaintenanceRecord, UpcomingService, CreateCarInput, CreateMaintenanceRecordInput, CreateUpcomingServiceInput } from '../../server/src/schema';

function App() {
  // State for cars
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  
  // State for maintenance records
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  
  // State for upcoming services
  const [upcomingServices, setUpcomingServices] = useState<UpcomingService[]>([]);
  
  // State for forms
  const [carForm, setCarForm] = useState<CreateCarInput>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    vin: ''
  });
  
  const [maintenanceForm, setMaintenanceForm] = useState<CreateMaintenanceRecordInput>({
    car_id: 0,
    service_type: '',
    date: new Date(),
    mileage: 0,
    cost: 0,
    notes: null
  });
  
  const [serviceForm, setServiceForm] = useState<CreateUpcomingServiceInput>({
    car_id: 0,
    service_type: '',
    due_date: null,
    due_mileage: null,
    notes: null
  });
  
  // State for dialogs
  const [isAddCarDialogOpen, setIsAddCarDialogOpen] = useState(false);
  const [isEditCarDialogOpen, setIsEditCarDialogOpen] = useState(false);
  const [isAddMaintenanceDialogOpen, setIsAddMaintenanceDialogOpen] = useState(false);
  const [isAddServiceDialogOpen, setIsAddServiceDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteItemType, setDeleteItemType] = useState<'car' | 'maintenance' | 'service'>('car');
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isCarsLoading, setIsCarsLoading] = useState(true);

  // Load all cars
  const loadCars = useCallback(async () => {
    setIsCarsLoading(true);
    try {
      const result = await trpc.getCars.query();
      setCars(result);
      if (result.length > 0 && !selectedCar) {
        setSelectedCar(result[0]);
      }
    } catch (error) {
      console.error('Failed to load cars:', error);
    } finally {
      setIsCarsLoading(false);
    }
  }, [selectedCar]);

  // Load maintenance records for a car
  const loadMaintenanceRecords = async (carId: number) => {
    try {
      const result = await trpc.getMaintenanceRecords.query(carId);
      setMaintenanceRecords(result);
    } catch (error) {
      console.error('Failed to load maintenance records:', error);
    }
  };

  // Load upcoming services for a car
  const loadUpcomingServices = async (carId: number) => {
    try {
      const result = await trpc.getUpcomingServices.query(carId);
      setUpcomingServices(result);
    } catch (error) {
      console.error('Failed to load upcoming services:', error);
    }
  };

  // Load cars on initial render
  useEffect(() => {
    loadCars();
  }, [loadCars]);

  // Load maintenance records and upcoming services when a car is selected
  useEffect(() => {
    if (selectedCar) {
      loadMaintenanceRecords(selectedCar.id);
      loadUpcomingServices(selectedCar.id);
    }
  }, [selectedCar]);

  // Handle adding a new car
  const handleAddCar = async () => {
    setIsLoading(true);
    try {
      const newCar = await trpc.createCar.mutate(carForm);
      setCars([...cars, newCar]);
      setCarForm({ make: '', model: '', year: new Date().getFullYear(), license_plate: '', vin: '' });
      setIsAddCarDialogOpen(false);
      if (!selectedCar) {
        setSelectedCar(newCar);
      }
    } catch (error) {
      console.error('Failed to add car:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle updating a car
  const handleUpdateCar = async () => {
    if (!selectedCar) return;
    
    setIsLoading(true);
    try {
      await trpc.updateCar.mutate({
        id: selectedCar.id,
        make: carForm.make || undefined,
        model: carForm.model || undefined,
        year: carForm.year || undefined,
        license_plate: carForm.license_plate || undefined,
        vin: carForm.vin || undefined
      });
      
      // Update local state
      const updatedCars = cars.map(car => 
        car.id === selectedCar.id ? { ...car, ...carForm } : car
      );
      setCars(updatedCars);
      
      if (selectedCar.id === selectedCar?.id) {
        setSelectedCar({ ...selectedCar, ...carForm });
      }
      
      setIsEditCarDialogOpen(false);
    } catch (error) {
      console.error('Failed to update car:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting a car
  const handleDeleteCar = async () => {
    if (!deleteItemId) return;
    
    setIsLoading(true);
    try {
      await trpc.deleteCar.mutate(deleteItemId);
      
      // Update local state
      const updatedCars = cars.filter(car => car.id !== deleteItemId);
      setCars(updatedCars);
      
      if (selectedCar?.id === deleteItemId) {
        setSelectedCar(updatedCars.length > 0 ? updatedCars[0] : null);
      }
      
      setIsDeleteDialogOpen(false);
      setDeleteItemId(null);
    } catch (error) {
      console.error('Failed to delete car:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding a maintenance record
  const handleAddMaintenanceRecord = async () => {
    if (!selectedCar) return;
    
    setIsLoading(true);
    try {
      const newRecord = await trpc.createMaintenanceRecord.mutate({
        ...maintenanceForm,
        car_id: selectedCar.id
      });
      
      setMaintenanceRecords([...maintenanceRecords, newRecord]);
      setMaintenanceForm({
        car_id: selectedCar.id,
        service_type: '',
        date: new Date(),
        mileage: 0,
        cost: 0,
        notes: null
      });
      setIsAddMaintenanceDialogOpen(false);
    } catch (error) {
      console.error('Failed to add maintenance record:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting a maintenance record
  const handleDeleteMaintenanceRecord = async () => {
    if (!deleteItemId) return;
    
    setIsLoading(true);
    try {
      await trpc.deleteMaintenanceRecord.mutate(deleteItemId);
      
      // Update local state
      const updatedRecords = maintenanceRecords.filter(record => record.id !== deleteItemId);
      setMaintenanceRecords(updatedRecords);
      
      setIsDeleteDialogOpen(false);
      setDeleteItemId(null);
    } catch (error) {
      console.error('Failed to delete maintenance record:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding an upcoming service
  const handleAddUpcomingService = async () => {
    if (!selectedCar) return;
    
    setIsLoading(true);
    try {
      const newService = await trpc.createUpcomingService.mutate({
        ...serviceForm,
        car_id: selectedCar.id
      });
      
      setUpcomingServices([...upcomingServices, newService]);
      setServiceForm({
        car_id: selectedCar.id,
        service_type: '',
        due_date: null,
        due_mileage: null,
        notes: null
      });
      setIsAddServiceDialogOpen(false);
    } catch (error) {
      console.error('Failed to add upcoming service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting an upcoming service
  const handleDeleteUpcomingService = async () => {
    if (!deleteItemId) return;
    
    setIsLoading(true);
    try {
      await trpc.deleteUpcomingService.mutate(deleteItemId);
      
      // Update local state
      const updatedServices = upcomingServices.filter(service => service.id !== deleteItemId);
      setUpcomingServices(updatedServices);
      
      setIsDeleteDialogOpen(false);
      setDeleteItemId(null);
    } catch (error) {
      console.error('Failed to delete upcoming service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if a service is overdue
  const isServiceOverdue = (service: UpcomingService) => {
    if (service.due_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(service.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    }
    return false;
  };

  // Check if a service is due soon (within 30 days)
  const isServiceDueSoon = (service: UpcomingService) => {
    if (service.due_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(service.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30 && diffDays >= 0;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Car Maintenance Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your vehicle maintenance history and upcoming services</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cars List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CarIcon className="h-5 w-5" />
                  Your Vehicles
                </CardTitle>
                <Dialog open={isAddCarDialogOpen} onOpenChange={setIsAddCarDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Car
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Car</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="make" className="text-right">
                          Make
                        </Label>
                        <Input
                          id="make"
                          value={carForm.make}
                          onChange={(e) => setCarForm({...carForm, make: e.target.value})}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="model" className="text-right">
                          Model
                        </Label>
                        <Input
                          id="model"
                          value={carForm.model}
                          onChange={(e) => setCarForm({...carForm, model: e.target.value})}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="year" className="text-right">
                          Year
                        </Label>
                        <Input
                          id="year"
                          type="number"
                          value={carForm.year}
                          onChange={(e) => setCarForm({...carForm, year: parseInt(e.target.value) || new Date().getFullYear()})}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="license_plate" className="text-right">
                          License Plate
                        </Label>
                        <Input
                          id="license_plate"
                          value={carForm.license_plate}
                          onChange={(e) => setCarForm({...carForm, license_plate: e.target.value})}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="vin" className="text-right">
                          VIN
                        </Label>
                        <Input
                          id="vin"
                          value={carForm.vin}
                          onChange={(e) => setCarForm({...carForm, vin: e.target.value})}
                          className="col-span-3"
                        />
                      </div>
                      <Button onClick={handleAddCar} disabled={isLoading}>
                        {isLoading ? 'Adding...' : 'Add Car'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isCarsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : cars.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No cars added yet</p>
                ) : (
                  <div className="space-y-2">
                    {cars.map((car) => (
                      <div 
                        key={car.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedCar?.id === car.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedCar(car)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{car.make} {car.model}</h3>
                            <p className="text-sm text-gray-500">{car.year} • {car.license_plate}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setCarForm({
                                  make: car.make,
                                  model: car.model,
                                  year: car.year,
                                  license_plate: car.license_plate,
                                  vin: car.vin
                                });
                                setIsEditCarDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteItemType('car');
                                setDeleteItemId(car.id);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Car Details */}
          <div className="lg:col-span-2">
            {selectedCar ? (
              <div className="space-y-6">
                {/* Car Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{selectedCar.make} {selectedCar.model} ({selectedCar.year})</span>
                      <span className="text-sm font-normal text-gray-500">#{selectedCar.license_plate}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">VIN</p>
                        <p>{selectedCar.vin}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Added</p>
                        <p>{new Date(selectedCar.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Maintenance Records */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5" />
                      Maintenance History
                    </CardTitle>
                    <Dialog open={isAddMaintenanceDialogOpen} onOpenChange={setIsAddMaintenanceDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Record
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Maintenance Record</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="service_type" className="text-right">
                              Service Type
                            </Label>
                            <Input
                              id="service_type"
                              value={maintenanceForm.service_type}
                              onChange={(e) => setMaintenanceForm({...maintenanceForm, service_type: e.target.value})}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right">
                              Date
                            </Label>
                            <Input
                              id="date"
                              type="date"
                              value={maintenanceForm.date instanceof Date ? maintenanceForm.date.toISOString().split('T')[0] : ''}
                              onChange={(e) => setMaintenanceForm({...maintenanceForm, date: new Date(e.target.value)})}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="mileage" className="text-right">
                              Mileage
                            </Label>
                            <Input
                              id="mileage"
                              type="number"
                              value={maintenanceForm.mileage}
                              onChange={(e) => setMaintenanceForm({...maintenanceForm, mileage: parseInt(e.target.value) || 0})}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cost" className="text-right">
                              Cost
                            </Label>
                            <Input
                              id="cost"
                              type="number"
                              step="0.01"
                              value={maintenanceForm.cost}
                              onChange={(e) => setMaintenanceForm({...maintenanceForm, cost: parseFloat(e.target.value) || 0})}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="notes" className="text-right">
                              Notes
                            </Label>
                            <Textarea
                              id="notes"
                              value={maintenanceForm.notes || ''}
                              onChange={(e) => setMaintenanceForm({...maintenanceForm, notes: e.target.value || null})}
                              className="col-span-3"
                            />
                          </div>
                          <Button onClick={handleAddMaintenanceRecord} disabled={isLoading}>
                            {isLoading ? 'Adding...' : 'Add Record'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    {maintenanceRecords.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No maintenance records yet</p>
                    ) : (
                      <div className="space-y-3">
                        {maintenanceRecords.map((record) => (
                          <div key={record.id} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{record.service_type}</h3>
                                <p className="text-sm text-gray-500">
                                  {new Date(record.date).toLocaleDateString()} • {record.mileage.toLocaleString()} miles
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setDeleteItemType('maintenance');
                                    setDeleteItemId(record.id);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-2 flex justify-between">
                              <span className="font-medium">${record.cost.toFixed(2)}</span>
                              {record.notes && (
                                <span className="text-sm text-gray-600">{record.notes}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Upcoming Services */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Upcoming Services
                    </CardTitle>
                    <Dialog open={isAddServiceDialogOpen} onOpenChange={setIsAddServiceDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Service
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Upcoming Service</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="upcoming_service_type" className="text-right">
                              Service Type
                            </Label>
                            <Input
                              id="upcoming_service_type"
                              value={serviceForm.service_type}
                              onChange={(e) => setServiceForm({...serviceForm, service_type: e.target.value})}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="due_date" className="text-right">
                              Due Date
                            </Label>
                            <Input
                              id="due_date"
                              type="date"
                              value={serviceForm.due_date instanceof Date ? serviceForm.due_date.toISOString().split('T')[0] : ''}
                              onChange={(e) => setServiceForm({...serviceForm, due_date: e.target.value ? new Date(e.target.value) : null})}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="due_mileage" className="text-right">
                              Due Mileage
                            </Label>
                            <Input
                              id="due_mileage"
                              type="number"
                              value={serviceForm.due_mileage || ''}
                              onChange={(e) => setServiceForm({...serviceForm, due_mileage: e.target.value ? parseInt(e.target.value) : null})}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="upcoming_notes" className="text-right">
                              Notes
                            </Label>
                            <Textarea
                              id="upcoming_notes"
                              value={serviceForm.notes || ''}
                              onChange={(e) => setServiceForm({...serviceForm, notes: e.target.value || null})}
                              className="col-span-3"
                            />
                          </div>
                          <Button onClick={handleAddUpcomingService} disabled={isLoading}>
                            {isLoading ? 'Adding...' : 'Add Service'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    {upcomingServices.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No upcoming services scheduled</p>
                    ) : (
                      <div className="space-y-3">
                        {upcomingServices.map((service) => (
                          <div 
                            key={service.id} 
                            className={`p-4 border rounded-lg ${
                              isServiceOverdue(service) 
                                ? 'border-red-500 bg-red-50' 
                                : isServiceDueSoon(service) 
                                  ? 'border-yellow-500 bg-yellow-50' 
                                  : 'border-gray-200'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{service.service_type}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  {isServiceOverdue(service) && (
                                    <span className="flex items-center text-red-600 text-sm">
                                      <AlertTriangle className="h-4 w-4 mr-1" />
                                      Overdue
                                    </span>
                                  )}
                                  {isServiceDueSoon(service) && !isServiceOverdue(service) && (
                                    <span className="flex items-center text-yellow-600 text-sm">
                                      <AlertTriangle className="h-4 w-4 mr-1" />
                                      Due Soon
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setDeleteItemType('service');
                                    setDeleteItemId(service.id);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              {service.due_date && (
                                <div>
                                  <p className="text-sm text-gray-500">Due Date</p>
                                  <p>{new Date(service.due_date).toLocaleDateString()}</p>
                                </div>
                              )}
                              {service.due_mileage && (
                                <div>
                                  <p className="text-sm text-gray-500">Due Mileage</p>
                                  <p>{service.due_mileage.toLocaleString()} miles</p>
                                </div>
                              )}
                              {service.notes && (
                                <div className="col-span-2">
                                  <p className="text-sm text-gray-500">Notes</p>
                                  <p>{service.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <CarIcon className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No Car Selected</h3>
                  <p className="mt-2 text-gray-500">Select a car from the list or add a new one to get started</p>
                  <Button className="mt-4" onClick={() => setIsAddCarDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Car
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteItemType === 'car' 
                  ? "This will permanently delete this car and all its associated records. This action cannot be undone."
                  : deleteItemType === 'maintenance'
                  ? "This will permanently delete this maintenance record. This action cannot be undone."
                  : "This will permanently delete this upcoming service. This action cannot be undone."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  if (deleteItemType === 'car') {
                    handleDeleteCar();
                  } else if (deleteItemType === 'maintenance') {
                    handleDeleteMaintenanceRecord();
                  } else if (deleteItemType === 'service') {
                    handleDeleteUpcomingService();
                  }
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Car Dialog */}
        <Dialog open={isEditCarDialogOpen} onOpenChange={setIsEditCarDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Car</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_make" className="text-right">
                  Make
                </Label>
                <Input
                  id="edit_make"
                  value={carForm.make}
                  onChange={(e) => setCarForm({...carForm, make: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_model" className="text-right">
                  Model
                </Label>
                <Input
                  id="edit_model"
                  value={carForm.model}
                  onChange={(e) => setCarForm({...carForm, model: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_year" className="text-right">
                  Year
                </Label>
                <Input
                  id="edit_year"
                  type="number"
                  value={carForm.year}
                  onChange={(e) => setCarForm({...carForm, year: parseInt(e.target.value) || new Date().getFullYear()})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_license_plate" className="text-right">
                  License Plate
                </Label>
                <Input
                  id="edit_license_plate"
                  value={carForm.license_plate}
                  onChange={(e) => setCarForm({...carForm, license_plate: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_vin" className="text-right">
                  VIN
                </Label>
                <Input
                  id="edit_vin"
                  value={carForm.vin}
                  onChange={(e) => setCarForm({...carForm, vin: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <Button onClick={handleUpdateCar} disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Car'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
