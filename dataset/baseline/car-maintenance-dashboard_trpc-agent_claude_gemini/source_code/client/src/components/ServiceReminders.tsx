import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { trpc } from '@/utils/trpc';
import type { 
  Car, 
  ServiceReminder, 
  CreateServiceReminderInput, 
  ServiceType, 
  ReminderType 
} from '../../../server/src/schema';

interface ServiceRemindersProps {
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

export function ServiceReminders({ cars }: ServiceRemindersProps) {
  const [reminders, setReminders] = useState<ServiceReminder[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCarFilter, setSelectedCarFilter] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [formData, setFormData] = useState<CreateServiceReminderInput>({
    car_id: 0,
    service_type: 'oil_change',
    reminder_type: 'date_based',
    due_date: null,
    due_mileage: null,
    notes: null
  });

  const loadReminders = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getAllServiceReminders.query();
      setReminders(result);
    } catch (error) {
      console.error('Failed to load service reminders:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.car_id === 0) return;
    
    // Validation based on reminder type
    if (formData.reminder_type === 'date_based' && !formData.due_date) {
      alert('Please set a due date for date-based reminders');
      return;
    }
    if (formData.reminder_type === 'mileage_based' && !formData.due_mileage) {
      alert('Please set a due mileage for mileage-based reminders');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await trpc.createServiceReminder.mutate(formData);
      setReminders((prev: ServiceReminder[]) => [...prev, response]);
      setFormData({
        car_id: 0,
        service_type: 'oil_change',
        reminder_type: 'date_based',
        due_date: null,
        due_mileage: null,
        notes: null
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create service reminder:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async (reminderId: number, isCompleted: boolean) => {
    try {
      await trpc.updateServiceReminder.mutate({ 
        id: reminderId, 
        is_completed: !isCompleted 
      });
      setReminders((prev: ServiceReminder[]) => 
        prev.map((reminder: ServiceReminder) => 
          reminder.id === reminderId 
            ? { ...reminder, is_completed: !isCompleted }
            : reminder
        )
      );
    } catch (error) {
      console.error('Failed to update service reminder:', error);
    }
  };

  const handleDelete = async (reminderId: number) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) {
      return;
    }
    
    try {
      await trpc.deleteServiceReminder.mutate({ id: reminderId });
      setReminders((prev: ServiceReminder[]) => 
        prev.filter((reminder: ServiceReminder) => reminder.id !== reminderId)
      );
    } catch (error) {
      console.error('Failed to delete service reminder:', error);
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

  const isOverdue = (reminder: ServiceReminder) => {
    if (reminder.is_completed) return false;
    
    if (reminder.reminder_type === 'date_based' && reminder.due_date) {
      return new Date(reminder.due_date) < new Date();
    }
    
    // For mileage-based, we can't determine without current mileage
    // In a real app, you'd track current mileage per car
    return false;
  };

  const filteredReminders = reminders.filter((reminder: ServiceReminder) => {
    const carMatch = selectedCarFilter === 'all' || reminder.car_id === parseInt(selectedCarFilter);
    const statusMatch = showCompleted || !reminder.is_completed;
    return carMatch && statusMatch;
  });

  const sortedReminders = filteredReminders.sort((a: ServiceReminder, b: ServiceReminder) => {
    // Sort by completion status first (incomplete first), then by due date/mileage
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1;
    }
    
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    
    if (a.due_mileage && b.due_mileage) {
      return a.due_mileage - b.due_mileage;
    }
    
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">⏰ Service Reminders</h2>
          <p className="text-gray-600">Set and manage upcoming maintenance reminders</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-orange-600 hover:bg-orange-700"
              disabled={cars.length === 0}
            >
              ➕ Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Service Reminder</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Car *
                </label>
                <Select 
                  value={formData.car_id.toString()} 
                  onValueChange={(value: string) => 
                    setFormData((prev: CreateServiceReminderInput) => ({ ...prev, car_id: parseInt(value) }))
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
                  Service Type *
                </label>
                <Select 
                  value={formData.service_type} 
                  onValueChange={(value: ServiceType) => 
                    setFormData((prev: CreateServiceReminderInput) => ({ ...prev, service_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
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
                  Reminder Type *
                </label>
                <Select 
                  value={formData.reminder_type} 
                  onValueChange={(value: ReminderType) => 
                    setFormData((prev: CreateServiceReminderInput) => ({ 
                      ...prev, 
                      reminder_type: value,
                      due_date: value === 'date_based' ? new Date() : null,
                      due_mileage: value === 'mileage_based' ? 0 : null
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reminder type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date_based">Date Based</SelectItem>
                    <SelectItem value="mileage_based">Mileage Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.reminder_type === 'date_based' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.due_date ? formData.due_date.toISOString().split('T')[0] : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateServiceReminderInput) => ({ 
                        ...prev, 
                        due_date: new Date(e.target.value) 
                      }))
                    }
                    required
                  />
                </div>
              )}
              
              {formData.reminder_type === 'mileage_based' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Mileage *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Mileage when service is due"
                    value={formData.due_mileage || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateServiceReminderInput) => ({ 
                        ...prev, 
                        due_mileage: parseInt(e.target.value) || null 
                      }))
                    }
                    required
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <Input
                  placeholder="Additional notes or reminders"
                  value={formData.notes || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateServiceReminderInput) => ({ 
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
                  {isSubmitting ? 'Adding...' : 'Add Reminder'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
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
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Show completed:</label>
          <Switch checked={showCompleted} onCheckedChange={setShowCompleted} />
        </div>
      </div>

      {cars.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No cars available</h3>
            <p className="text-gray-600">
              Please add a car first before setting up service reminders
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading service reminders...</div>
        </div>
      ) : sortedReminders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">⏰</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {showCompleted || selectedCarFilter !== 'all' ? 'No reminders match your filters' : 'No service reminders yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {showCompleted || selectedCarFilter !== 'all' 
                ? 'Try adjusting your filters to see more reminders'
                : 'Stay on top of your vehicle maintenance with reminders'
              }
            </p>
            {!showCompleted && selectedCarFilter === 'all' && (
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Add First Reminder
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedReminders.map((reminder: ServiceReminder) => (
            <Card key={reminder.id} className={isOverdue(reminder) ? 'border-red-300 bg-red-50' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{getCarName(reminder.car_id)}</h3>
                      <Badge variant="outline">{getServiceTypeDisplay(reminder.service_type)}</Badge>
                      <Badge variant={reminder.reminder_type === 'date_based' ? 'default' : 'secondary'}>
                        {reminder.reminder_type === 'date_based' ? '📅 Date Based' : '🛣️ Mileage Based'}
                      </Badge>
                      {reminder.is_completed && (
                        <Badge className="bg-green-100 text-green-800">✅ Completed</Badge>
                      )}
                      {isOverdue(reminder) && (
                        <Badge className="bg-red-100 text-red-800">🚨 Overdue</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                      {reminder.due_date && (
                        <div>
                          <span className="text-gray-600">Due Date:</span>
                          <p className="font-medium">{reminder.due_date.toLocaleDateString()}</p>
                        </div>
                      )}
                      {reminder.due_mileage && (
                        <div>
                          <span className="text-gray-600">Due Mileage:</span>
                          <p className="font-medium">{reminder.due_mileage.toLocaleString()} miles</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600">Created:</span>
                        <p className="font-medium">{reminder.created_at.toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    {reminder.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <span className="text-sm text-gray-600">Notes:</span>
                        <p className="text-sm mt-1">{reminder.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant={reminder.is_completed ? "secondary" : "default"}
                      size="sm"
                      onClick={() => handleToggleComplete(reminder.id, reminder.is_completed)}
                    >
                      {reminder.is_completed ? '↩️ Undo' : '✅ Complete'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(reminder.id)}
                    >
                      🗑️
                    </Button>
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
