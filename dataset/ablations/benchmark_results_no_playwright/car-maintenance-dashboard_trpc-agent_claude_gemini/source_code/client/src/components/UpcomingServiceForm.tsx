import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import type { Car, UpcomingService, CreateUpcomingServiceInput, ServiceType } from '../../../server/src/schema';

interface UpcomingServiceFormProps {
  cars: Car[];
  preSelectedCarId?: number | null;
  onUpcomingServiceCreated: (service: UpcomingService) => void;
  onCancel: () => void;
}

const serviceTypes: { value: ServiceType; label: string; emoji: string }[] = [
  { value: 'oil_change', label: 'Oil Change', emoji: '🛢️' },
  { value: 'tire_rotation', label: 'Tire Rotation', emoji: '🛞' },
  { value: 'brake_service', label: 'Brake Service', emoji: '🛑' },
  { value: 'engine_tune_up', label: 'Engine Tune-up', emoji: '🔧' },
  { value: 'transmission_service', label: 'Transmission Service', emoji: '⚙️' },
  { value: 'coolant_flush', label: 'Coolant Flush', emoji: '🌊' },
  { value: 'air_filter_replacement', label: 'Air Filter Replacement', emoji: '💨' },
  { value: 'battery_replacement', label: 'Battery Replacement', emoji: '🔋' },
  { value: 'inspection', label: 'Inspection', emoji: '🔍' },
  { value: 'other', label: 'Other', emoji: '🔨' }
];

export function UpcomingServiceForm({ cars, preSelectedCarId, onUpcomingServiceCreated, onCancel }: UpcomingServiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateUpcomingServiceInput>({
    car_id: preSelectedCarId || cars[0]?.id || 0,
    service_type: 'oil_change',
    description: '',
    due_date: new Date(),
    due_mileage: null,
    notes: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await trpc.createUpcomingService.mutate(formData);
      onUpcomingServiceCreated(response);
    } catch (error) {
      console.error('Failed to create upcoming service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };



  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>📅 Schedule Service</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
            <Select 
              value={formData.car_id ? formData.car_id.toString() : cars[0]?.id?.toString() || ""} 
              onValueChange={(value) => setFormData((prev: CreateUpcomingServiceInput) => ({ ...prev, car_id: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
            <Select 
              value={formData.service_type} 
              onValueChange={(value: ServiceType) => setFormData((prev: CreateUpcomingServiceInput) => ({ ...prev, service_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center gap-2">
                      {type.emoji} {type.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Input
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateUpcomingServiceInput) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Brief description of the upcoming service"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <Input
              type="date"
              value={formatDateForInput(formData.due_date)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateUpcomingServiceInput) => ({ ...prev, due_date: new Date(e.target.value) }))
              }
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Mileage (Optional)</label>
            <Input
              type="number"
              value={formData.due_mileage || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateUpcomingServiceInput) => ({ 
                  ...prev, 
                  due_mileage: e.target.value ? parseInt(e.target.value) : null 
                }))
              }
              min="0"
              placeholder="Target mileage for service"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <Input
              value={formData.notes || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateUpcomingServiceInput) => ({ ...prev, notes: e.target.value || null }))
              }
              placeholder="Additional notes or reminders"
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-700">
              {isLoading ? 'Scheduling...' : 'Schedule Service'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
