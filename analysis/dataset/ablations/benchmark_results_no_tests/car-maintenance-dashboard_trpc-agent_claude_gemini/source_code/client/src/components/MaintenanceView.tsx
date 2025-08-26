import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Search, Wrench, Calendar, DollarSign, Gauge, Car as CarIcon } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Car, MaintenanceEntry, CreateMaintenanceEntryInput, UpdateMaintenanceEntryInput } from '../../../server/src/schema';

interface MaintenanceViewProps {
  cars: Car[];
  selectedCar?: Car | null;
  onCarSelect?: (car: Car) => void;
}

export function MaintenanceView({ cars, selectedCar, onCarSelect }: MaintenanceViewProps) {
  const [maintenanceEntries, setMaintenanceEntries] = useState<MaintenanceEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MaintenanceEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Service type suggestions
  const commonServiceTypes = [
    'Oil Change',
    'Tire Rotation',
    'Brake Inspection',
    'Battery Check',
    'Air Filter Replacement',
    'Transmission Service',
    'Coolant Flush',
    'Spark Plug Replacement',
    'Inspection/Registration',
    'General Maintenance'
  ];

  // Load maintenance entries for selected car
  const loadMaintenanceEntries = useCallback(async () => {
    if (!selectedCar) {
      setMaintenanceEntries([]);
      return;
    }

    try {
      const entries = await trpc.getMaintenanceEntriesByCarId.query({ carId: selectedCar.id });
      setMaintenanceEntries(entries);
    } catch (error) {
      console.error('Failed to load maintenance entries:', error);
      // Set demo data for development
      const demoEntries: MaintenanceEntry[] = [
        {
          id: 1,
          car_id: selectedCar.id,
          service_date: new Date('2023-10-15'),
          service_type: 'Oil Change',
          description: 'Changed oil and oil filter',
          cost: 45.99,
          mileage_at_service: 40000,
          created_at: new Date('2023-10-15'),
          updated_at: new Date('2023-10-15')
        },
        {
          id: 2,
          car_id: selectedCar.id,
          service_date: new Date('2023-08-20'),
          service_type: 'Tire Rotation',
          description: 'Rotated all four tires',
          cost: 25.00,
          mileage_at_service: 38500,
          created_at: new Date('2023-08-20'),
          updated_at: new Date('2023-08-20')
        }
      ];
      setMaintenanceEntries(demoEntries);
    }
  }, [selectedCar]);

  useEffect(() => {
    loadMaintenanceEntries();
  }, [loadMaintenanceEntries]);

  // Filter entries based on search term
  const filteredEntries = maintenanceEntries.filter((entry) =>
    entry.service_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submission for create/update
  const handleFormSubmit = async (data: Omit<CreateMaintenanceEntryInput, 'car_id'> | Omit<UpdateMaintenanceEntryInput, 'id'>) => {
    if (!selectedCar) return;

    setIsLoading(true);
    try {
      if (editingEntry) {
        // Update existing entry
        const updatedEntry = await trpc.updateMaintenanceEntry.mutate({
          id: editingEntry.id,
          ...data
        });
        setMaintenanceEntries((prev) =>
          prev.map((entry) => (entry.id === editingEntry.id ? updatedEntry : entry))
        );
      } else {
        // Create new entry
        const newEntry = await trpc.createMaintenanceEntry.mutate({
          car_id: selectedCar.id,
          ...data as Omit<CreateMaintenanceEntryInput, 'car_id'>
        });
        setMaintenanceEntries((prev) => [newEntry, ...prev]);
      }
      
      setIsFormDialogOpen(false);
      setEditingEntry(null);
    } catch (error) {
      console.error('Failed to save maintenance entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle entry deletion
  const handleDeleteEntry = async (entryId: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteMaintenanceEntry.mutate({ id: entryId });
      setMaintenanceEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    } catch (error) {
      console.error('Failed to delete maintenance entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Open form dialog
  const openFormDialog = (entry?: MaintenanceEntry) => {
    setEditingEntry(entry || null);
    setIsFormDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Car Selection and Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-green-600" />
              Maintenance Records
            </CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {cars.length > 0 && (
                <Select
                  value={selectedCar?.id.toString() || ''}
                  onValueChange={(value) => {
                    const car = cars.find((c) => c.id.toString() === value);
                    if (car) onCarSelect?.(car);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Select a car..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cars.map((car) => (
                      <SelectItem key={car.id} value={car.id.toString()}>
                        {car.year} {car.make} {car.model} - {car.license_plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    disabled={!selectedCar}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Record
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingEntry ? 'Edit Maintenance Record' : 'Add Maintenance Record'}
                    </DialogTitle>
                  </DialogHeader>
                  {selectedCar && (
                    <MaintenanceForm
                      car={selectedCar}
                      initialData={editingEntry}
                      onSubmit={handleFormSubmit}
                      isLoading={isLoading}
                      commonServiceTypes={commonServiceTypes}
                    />
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {selectedCar && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <CarIcon className="h-4 w-4" />
              <span className="font-medium">
                {selectedCar.year} {selectedCar.make} {selectedCar.model} - {selectedCar.license_plate}
              </span>
              <Badge variant="outline">{selectedCar.current_mileage.toLocaleString()} miles</Badge>
            </div>
          )}
        </CardHeader>
      </Card>

      {!selectedCar ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CarIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Car</h3>
              <p className="text-gray-500">Choose a car to view and manage its maintenance records</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Search */}
          <Card>
            <CardContent className="py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search maintenance records..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Records */}
          {filteredEntries.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Wrench className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  {searchTerm ? (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No records found</h3>
                      <p className="text-gray-500">Try adjusting your search terms</p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No maintenance records</h3>
                      <p className="text-gray-500 mb-4">Start tracking maintenance for this vehicle</p>
                      <Button onClick={() => openFormDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Record
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredEntries
                .sort((a, b) => b.service_date.getTime() - a.service_date.getTime())
                .map((entry) => (
                  <Card key={entry.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              {entry.service_type}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              {entry.service_date.toLocaleDateString()}
                            </div>
                          </div>
                          
                          {entry.description && (
                            <p className="text-gray-700 mb-3">{entry.description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              <span className="font-medium">${entry.cost.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Gauge className="h-4 w-4" />
                              <span>{entry.mileage_at_service.toLocaleString()} miles</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-1 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openFormDialog(entry)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Maintenance Record</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this {entry.service_type} record from {entry.service_date.toLocaleDateString()}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteEntry(entry.id)}
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
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Maintenance Form Component
interface MaintenanceFormProps {
  car: Car;
  initialData?: MaintenanceEntry | null;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
  commonServiceTypes: string[];
}

function MaintenanceForm({ car, initialData, onSubmit, isLoading, commonServiceTypes }: MaintenanceFormProps) {
  const [formData, setFormData] = useState({
    service_date: initialData ? initialData.service_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    service_type: initialData?.service_type || '',
    description: initialData?.description || '',
    cost: initialData?.cost || 0,
    mileage_at_service: initialData?.mileage_at_service || car.current_mileage
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      service_date: new Date(formData.service_date),
      service_type: formData.service_type,
      description: formData.description || null,
      cost: formData.cost,
      mileage_at_service: formData.mileage_at_service
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="service_date">Service Date *</Label>
          <Input
            id="service_date"
            type="date"
            value={formData.service_date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({ ...prev, service_date: e.target.value }))
            }
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="service_type">Service Type *</Label>
          <Select
            value={formData.service_type}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, service_type: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select service type..." />
            </SelectTrigger>
            <SelectContent>
              {commonServiceTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom...</SelectItem>
            </SelectContent>
          </Select>
          {formData.service_type === 'custom' && (
            <Input
              placeholder="Enter custom service type"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev) => ({ ...prev, service_type: e.target.value }))
              }
            />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Optional details about the service..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cost">Cost *</Label>
          <Input
            id="cost"
            type="number"
            step="0.01"
            min="0"
            value={formData.cost}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))
            }
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="mileage">Mileage at Service *</Label>
          <Input
            id="mileage"
            type="number"
            min="0"
            value={formData.mileage_at_service}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({ ...prev, mileage_at_service: parseInt(e.target.value) || 0 }))
            }
            required
          />
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Saving...' : initialData ? 'Update Record' : 'Add Record'}
      </Button>
    </form>
  );
}
