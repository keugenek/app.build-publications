import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Plus, Edit2, Trash2, Calendar, Clock, Gauge, Car as CarIcon, AlertTriangle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Car, ServiceSchedule, CreateServiceScheduleInput, UpdateServiceScheduleInput } from '../../../server/src/schema';

interface ServiceScheduleViewProps {
  cars: Car[];
  selectedCar?: Car | null;
  onCarSelect?: (car: Car) => void;
}

export function ServiceScheduleView({ cars, selectedCar, onCarSelect }: ServiceScheduleViewProps) {
  const [serviceSchedules, setServiceSchedules] = useState<ServiceSchedule[]>([]);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ServiceSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Common service types with typical intervals
  const serviceTypeTemplates = [
    { type: 'Oil Change', mileageInterval: 5000, timeInterval: 6 },
    { type: 'Tire Rotation', mileageInterval: 7500, timeInterval: 6 },
    { type: 'Brake Inspection', mileageInterval: 15000, timeInterval: 12 },
    { type: 'Air Filter Replacement', mileageInterval: 15000, timeInterval: 12 },
    { type: 'Transmission Service', mileageInterval: 30000, timeInterval: 24 },
    { type: 'Coolant Flush', mileageInterval: 30000, timeInterval: 24 },
    { type: 'Spark Plug Replacement', mileageInterval: 30000, timeInterval: 36 },
    { type: 'Timing Belt', mileageInterval: 60000, timeInterval: 60 },
  ];

  // Load service schedules for selected car
  const loadServiceSchedules = useCallback(async () => {
    if (!selectedCar) {
      setServiceSchedules([]);
      return;
    }

    try {
      const schedules = await trpc.getServiceSchedulesByCarId.query({ carId: selectedCar.id });
      setServiceSchedules(schedules);
    } catch (error) {
      console.error('Failed to load service schedules:', error);
      // Set demo data for development
      const demoSchedules: ServiceSchedule[] = [
        {
          id: 1,
          car_id: selectedCar.id,
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
        },
        {
          id: 2,
          car_id: selectedCar.id,
          service_type: 'Tire Rotation',
          interval_type: 'mileage',
          interval_value: 7500,
          last_service_date: new Date('2023-08-20'),
          last_service_mileage: 38500,
          next_service_date: null,
          next_service_mileage: 46000,
          is_active: true,
          created_at: new Date('2023-02-10'),
          updated_at: new Date('2023-08-20')
        }
      ];
      setServiceSchedules(demoSchedules);
    }
  }, [selectedCar]);

  useEffect(() => {
    loadServiceSchedules();
  }, [loadServiceSchedules]);

  // Handle form submission for create/update
  const handleFormSubmit = async (data: Omit<CreateServiceScheduleInput, 'car_id'> | Omit<UpdateServiceScheduleInput, 'id'>) => {
    if (!selectedCar) return;

    setIsLoading(true);
    try {
      if (editingSchedule) {
        // Update existing schedule
        const updatedSchedule = await trpc.updateServiceSchedule.mutate({
          id: editingSchedule.id,
          ...data
        });
        setServiceSchedules((prev) =>
          prev.map((schedule) => (schedule.id === editingSchedule.id ? updatedSchedule : schedule))
        );
      } else {
        // Create new schedule
        const newSchedule = await trpc.createServiceSchedule.mutate({
          car_id: selectedCar.id,
          ...data as Omit<CreateServiceScheduleInput, 'car_id'>
        });
        setServiceSchedules((prev) => [newSchedule, ...prev]);
      }
      
      setIsFormDialogOpen(false);
      setEditingSchedule(null);
    } catch (error) {
      console.error('Failed to save service schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle schedule deletion
  const handleDeleteSchedule = async (scheduleId: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteServiceSchedule.mutate({ id: scheduleId });
      setServiceSchedules((prev) => prev.filter((schedule) => schedule.id !== scheduleId));
    } catch (error) {
      console.error('Failed to delete service schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Open form dialog
  const openFormDialog = (schedule?: ServiceSchedule) => {
    setEditingSchedule(schedule || null);
    setIsFormDialogOpen(true);
  };

  // Calculate progress for mileage-based schedules
  const calculateProgress = (schedule: ServiceSchedule): number => {
    if (!selectedCar || !schedule.last_service_mileage || !schedule.next_service_mileage) return 0;
    
    const totalInterval = schedule.next_service_mileage - schedule.last_service_mileage;
    const currentProgress = selectedCar.current_mileage - schedule.last_service_mileage;
    
    return Math.min(100, Math.max(0, (currentProgress / totalInterval) * 100));
  };

  // Get schedule status
  const getScheduleStatus = (schedule: ServiceSchedule): 'overdue' | 'due-soon' | 'upcoming' | 'inactive' => {
    if (!schedule.is_active) return 'inactive';
    if (!selectedCar) return 'upcoming';
    
    if (schedule.next_service_mileage) {
      const mileageUntilService = schedule.next_service_mileage - selectedCar.current_mileage;
      if (mileageUntilService <= 0) return 'overdue';
      if (mileageUntilService <= 1000) return 'due-soon';
    }
    
    if (schedule.next_service_date) {
      const daysUntilService = Math.ceil(
        (schedule.next_service_date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilService <= 0) return 'overdue';
      if (daysUntilService <= 30) return 'due-soon';
    }
    
    return 'upcoming';
  };

  return (
    <div className="space-y-6">
      {/* Car Selection and Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Service Schedules
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
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Schedule
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingSchedule ? 'Edit Service Schedule' : 'Add Service Schedule'}
                    </DialogTitle>
                  </DialogHeader>
                  {selectedCar && (
                    <ScheduleForm
                      car={selectedCar}
                      initialData={editingSchedule}
                      onSubmit={handleFormSubmit}
                      isLoading={isLoading}
                      serviceTypeTemplates={serviceTypeTemplates}
                    />
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {selectedCar && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-purple-50 p-3 rounded-lg">
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
              <p className="text-gray-500">Choose a car to view and manage its service schedules</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Service Schedules */}
          {serviceSchedules.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No service schedules</h3>
                  <p className="text-gray-500 mb-4">Set up maintenance schedules to track upcoming services</p>
                  <Button onClick={() => openFormDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {serviceSchedules
                .sort((a, b) => {
                  const statusOrder = { 'overdue': 0, 'due-soon': 1, 'upcoming': 2, 'inactive': 3 };
                  const statusA = getScheduleStatus(a);
                  const statusB = getScheduleStatus(b);
                  
                  if (statusOrder[statusA] !== statusOrder[statusB]) {
                    return statusOrder[statusA] - statusOrder[statusB];
                  }
                  
                  return a.service_type.localeCompare(b.service_type);
                })
                .map((schedule) => {
                  const status = getScheduleStatus(schedule);
                  const progress = calculateProgress(schedule);
                  
                  return (
                    <Card 
                      key={schedule.id} 
                      className={`transition-all duration-200 ${
                        status === 'overdue' 
                          ? 'border-l-4 border-l-red-500 bg-red-50' 
                          : status === 'due-soon'
                          ? 'border-l-4 border-l-orange-500 bg-orange-50'
                          : status === 'inactive'
                          ? 'border-l-4 border-l-gray-300 bg-gray-50'
                          : 'border-l-4 border-l-blue-500 bg-blue-50'
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{schedule.service_type}</h3>
                              <Badge
                                variant={
                                  status === 'overdue'
                                    ? 'destructive'
                                    : status === 'due-soon'
                                    ? 'secondary'
                                    : status === 'inactive'
                                    ? 'outline'
                                    : 'default'
                                }
                              >
                                {status === 'overdue'
                                  ? '🚨 Overdue'
                                  : status === 'due-soon'
                                  ? '⚠️ Due Soon'
                                  : status === 'inactive'
                                  ? '⏸️ Inactive'
                                  : '📅 Scheduled'}
                              </Badge>
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`active-${schedule.id}`} className="text-sm font-normal">
                                  Active
                                </Label>
                                <Switch
                                  id={`active-${schedule.id}`}
                                  checked={schedule.is_active}
                                  onCheckedChange={async (checked) => {
                                    try {
                                      const updatedSchedule = await trpc.updateServiceSchedule.mutate({
                                        id: schedule.id,
                                        is_active: checked
                                      });
                                      setServiceSchedules((prev) =>
                                        prev.map((s) => (s.id === schedule.id ? updatedSchedule : s))
                                      );
                                    } catch (error) {
                                      console.error('Failed to update schedule:', error);
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex items-center gap-6 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  {schedule.interval_type === 'mileage' ? (
                                    <Gauge className="h-4 w-4" />
                                  ) : (
                                    <Clock className="h-4 w-4" />
                                  )}
                                  <span>
                                    Every {schedule.interval_value.toLocaleString()} {
                                      schedule.interval_type === 'mileage' ? 'miles' : 'months'
                                    }
                                  </span>
                                </div>
                              </div>

                              {schedule.last_service_date && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">Last service:</span> {schedule.last_service_date.toLocaleDateString()}
                                  {schedule.last_service_mileage && (
                                    <span> at {schedule.last_service_mileage.toLocaleString()} miles</span>
                                  )}
                                </div>
                              )}

                              {schedule.is_active && selectedCar && (
                                <>
                                  {schedule.next_service_mileage && (
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm">
                                        <span>Progress to next service</span>
                                        <span>
                                          {selectedCar.current_mileage.toLocaleString()} / {schedule.next_service_mileage.toLocaleString()} miles
                                        </span>
                                      </div>
                                      <Progress value={progress} className="h-2" />
                                      <p className="text-xs text-gray-500">
                                        {schedule.next_service_mileage - selectedCar.current_mileage > 0
                                          ? `${(schedule.next_service_mileage - selectedCar.current_mileage).toLocaleString()} miles remaining`
                                          : `${(selectedCar.current_mileage - schedule.next_service_mileage).toLocaleString()} miles overdue`}
                                      </p>
                                    </div>
                                  )}

                                  {schedule.next_service_date && !schedule.next_service_mileage && (
                                    <div className="text-sm text-gray-600">
                                      <span className="font-medium">Next service:</span> {schedule.next_service_date.toLocaleDateString()}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-1 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openFormDialog(schedule)}
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
                                  <AlertDialogTitle>Delete Service Schedule</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the {schedule.service_type} schedule? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteSchedule(schedule.id)}
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
                  );
                })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Schedule Form Component
interface ScheduleFormProps {
  car: Car;
  initialData?: ServiceSchedule | null;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
  serviceTypeTemplates: Array<{ type: string; mileageInterval: number; timeInterval: number }>;
}

function ScheduleForm({ car, initialData, onSubmit, isLoading, serviceTypeTemplates }: ScheduleFormProps) {
  const [formData, setFormData] = useState({
    service_type: initialData?.service_type || '',
    interval_type: initialData?.interval_type || 'mileage',
    interval_value: initialData?.interval_value || 5000,
    last_service_date: initialData?.last_service_date ? initialData.last_service_date.toISOString().split('T')[0] : '',
    last_service_mileage: initialData?.last_service_mileage || null,
    is_active: initialData?.is_active ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      service_type: formData.service_type,
      interval_type: formData.interval_type as 'mileage' | 'time',
      interval_value: formData.interval_value,
      last_service_date: formData.last_service_date ? new Date(formData.last_service_date) : null,
      last_service_mileage: formData.last_service_mileage,
      is_active: formData.is_active
    });
  };

  const handleServiceTypeChange = (serviceType: string) => {
    const template = serviceTypeTemplates.find(t => t.type === serviceType);
    if (template && formData.interval_type === 'mileage') {
      setFormData(prev => ({ 
        ...prev, 
        service_type: serviceType,
        interval_value: template.mileageInterval 
      }));
    } else if (template && formData.interval_type === 'time') {
      setFormData(prev => ({ 
        ...prev, 
        service_type: serviceType,
        interval_value: template.timeInterval 
      }));
    } else {
      setFormData(prev => ({ ...prev, service_type: serviceType }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="service_type">Service Type *</Label>
        <Select
          value={formData.service_type}
          onValueChange={handleServiceTypeChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select service type..." />
          </SelectTrigger>
          <SelectContent>
            {serviceTypeTemplates.map((template) => (
              <SelectItem key={template.type} value={template.type}>
                {template.type}
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="interval_type">Interval Type *</Label>
          <Select
            value={formData.interval_type}
            onValueChange={(value: 'mileage' | 'time') => {
              const template = serviceTypeTemplates.find(t => t.type === formData.service_type);
              const defaultValue = value === 'mileage' 
                ? template?.mileageInterval || 5000
                : template?.timeInterval || 6;
              
              setFormData((prev) => ({ 
                ...prev, 
                interval_type: value,
                interval_value: defaultValue
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mileage">Mileage Based</SelectItem>
              <SelectItem value="time">Time Based</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="interval_value">
            Interval ({formData.interval_type === 'mileage' ? 'Miles' : 'Months'}) *
          </Label>
          <Input
            id="interval_value"
            type="number"
            min="1"
            value={formData.interval_value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({ ...prev, interval_value: parseInt(e.target.value) || 1 }))
            }
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="last_service_date">Last Service Date</Label>
          <Input
            id="last_service_date"
            type="date"
            value={formData.last_service_date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({ ...prev, last_service_date: e.target.value }))
            }
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="last_service_mileage">Last Service Mileage</Label>
          <Input
            id="last_service_mileage"
            type="number"
            min="0"
            value={formData.last_service_mileage || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({ 
                ...prev, 
                last_service_mileage: e.target.value ? parseInt(e.target.value) : null 
              }))
            }
            placeholder={`Current: ${car.current_mileage.toLocaleString()}`}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
        />
        <Label htmlFor="is_active">Schedule is active</Label>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Saving...' : initialData ? 'Update Schedule' : 'Add Schedule'}
      </Button>
    </form>
  );
}
