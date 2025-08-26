import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { Car, MaintenanceEntry, CreateMaintenanceEntryInput, ServiceType } from '../../../server/src/schema';

interface MaintenanceTrackingProps {
  cars: Car[];
}

const SERVICE_TYPES: ServiceType[] = [
  'oil_change',
  'tire_rotation',
  'brake_service',
  'transmission_service',
  'engine_tune_up',
  'air_filter_replacement',
  'battery_replacement',
  'coolant_service',
  'inspection',
  'other'
];

export function MaintenanceTracking({ cars }: MaintenanceTrackingProps) {
  const [maintenanceEntries, setMaintenanceEntries] = useState<MaintenanceEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCarFilter, setSelectedCarFilter] = useState<string>('all');
  const [formData, setFormData] = useState<CreateMaintenanceEntryInput>({
    car_id: 0,
    service_date: new Date(),
    mileage: 0,
    service_type: 'oil_change',
    cost: 0,
    notes: null
  });

  const loadMaintenanceEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getAllMaintenanceEntries.query();
      setMaintenanceEntries(result);
    } catch (error) {
      console.error('Failed to load maintenance entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMaintenanceEntries();
  }, [loadMaintenanceEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.car_id === 0) return;
    
    setIsSubmitting(true);
    try {
      const response = await trpc.createMaintenanceEntry.mutate(formData);
      setMaintenanceEntries((prev: MaintenanceEntry[]) => [...prev, response]);
      setFormData({
        car_id: 0,
        service_date: new Date(),
        mileage: 0,
        service_type: 'oil_change',
        cost: 0,
        notes: null
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create maintenance entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (entryId: number) => {
    if (!window.confirm('Are you sure you want to delete this maintenance record?')) {
      return;
    }
    
    try {
      await trpc.deleteMaintenanceEntry.mutate({ id: entryId });
      setMaintenanceEntries((prev: MaintenanceEntry[]) => 
        prev.filter((entry: MaintenanceEntry) => entry.id !== entryId)
      );
    } catch (error) {
      console.error('Failed to delete maintenance entry:', error);
    }
  };

  const getCarName = (carId: number) => {
    const car = cars.find((c: Car) => c.id === carId);
    return car ? `${car.year} ${car.make} ${car.model}` : 'Unknown Car';
  };

  const getServiceTypeDisplay = (serviceType: string) => {
    return serviceType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const filteredEntries = selectedCarFilter === 'all' 
    ? maintenanceEntries 
    : maintenanceEntries.filter((entry: MaintenanceEntry) => entry.car_id === parseInt(selectedCarFilter));

  const sortedEntries = filteredEntries.sort((a: MaintenanceEntry, b: MaintenanceEntry) => 
    new Date(b.service_date).getTime() - new Date(a.service_date).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🔧 Maintenance Tracking</h2>
          <p className="text-gray-600">Record and track all maintenance activities</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              disabled={cars.length === 0}
            >
              ➕ Add Maintenance Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Maintenance Record</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Car *
                </label>
                <Select 
                  value={formData.car_id.toString()} 
                  onValueChange={(value: string) => 
                    setFormData((prev: CreateMaintenanceEntryInput) => ({ ...prev, car_id: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a car" />
                  </SelectTrigger>
                  <SelectContent>
                    {cars.map((car: Car) => (
                      <SelectItem key={car.id} value={car.id.toString()}>
                        {car.year} {car.make} {car.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Date *
                </label>
                <Input
                  type="date"
                  value={formData.service_date.toISOString().split('T')[0]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateMaintenanceEntryInput) => ({ 
                      ...prev, 
                      service_date: new Date(e.target.value) 
                    }))
                  }
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mileage *
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Current mileage"
                  value={formData.mileage}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateMaintenanceEntryInput) => ({ 
                      ...prev, 
                      mileage: parseInt(e.target.value) || 0 
                    }))
                  }
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type *
                </label>
                <Select 
                  value={formData.service_type} 
                  onValueChange={(value: ServiceType) => 
                    setFormData((prev: CreateMaintenanceEntryInput) => ({ ...prev, service_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((type: ServiceType) => (
                      <SelectItem key={type} value={type}>
                        {getServiceTypeDisplay(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.cost}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateMaintenanceEntryInput) => ({ 
                      ...prev, 
                      cost: parseFloat(e.target.value) || 0 
                    }))
                  }
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <Input
                  placeholder="Additional notes or observations"
                  value={formData.notes || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateMaintenanceEntryInput) => ({ 
                      ...prev, 
                      notes: e.target.value || null 
                    }))
                  }
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
                  {isSubmitting ? 'Adding...' : 'Add Record'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Filter by car:</label>
        <Select value={selectedCarFilter} onValueChange={setSelectedCarFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select car filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cars</SelectItem>
            {cars.map((car: Car) => (
              <SelectItem key={car.id} value={car.id.toString()}>
                {car.year} {car.make} {car.model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {cars.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No cars available</h3>
            <p className="text-gray-600">
              Please add a car first before recording maintenance activities
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading maintenance records...</div>
        </div>
      ) : sortedEntries.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🔧</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No maintenance records yet</h3>
            <p className="text-gray-600 mb-4">
              Start tracking your vehicle maintenance history
            </p>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              Add First Record
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedEntries.map((entry: MaintenanceEntry) => (
            <Card key={entry.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{getCarName(entry.car_id)}</h3>
                      <Badge variant="outline">{getServiceTypeDisplay(entry.service_type)}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Date:</span>
                        <p className="font-medium">{entry.service_date.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Mileage:</span>
                        <p className="font-medium">{entry.mileage.toLocaleString()} miles</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Cost:</span>
                        <p className="font-medium text-green-600">${entry.cost.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Added:</span>
                        <p className="font-medium">{entry.created_at.toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    {entry.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <span className="text-sm text-gray-600">Notes:</span>
                        <p className="text-sm mt-1">{entry.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(entry.id)}
                    className="ml-4"
                  >
                    🗑️
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
