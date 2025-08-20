import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import type { Car, MaintenanceRecord, CreateMaintenanceRecordInput, ServiceType } from '../../../server/src/schema';

interface MaintenanceFormProps {
  cars: Car[];
  preSelectedCarId?: number | null;
  onMaintenanceCreated: (record: MaintenanceRecord) => void;
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

export function MaintenanceForm({ cars, preSelectedCarId, onMaintenanceCreated, onCancel }: MaintenanceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateMaintenanceRecordInput>({
    car_id: preSelectedCarId || cars[0]?.id || 0,
    service_date: new Date(),
    service_type: 'oil_change',
    description: '',
    cost: 0,
    mileage: 0,
    notes: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await trpc.createMaintenanceRecord.mutate(formData);
      onMaintenanceCreated(response);
    } catch (error) {
      console.error('Failed to create maintenance record:', error);
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
          <DialogTitle>🔧 Record Maintenance</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
            <Select 
              value={formData.car_id ? formData.car_id.toString() : cars[0]?.id?.toString() || ""} 
              onValueChange={(value) => setFormData((prev: CreateMaintenanceRecordInput) => ({ ...prev, car_id: parseInt(value) }))}
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
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Date</label>
              <Input
                type="date"
                value={formatDateForInput(formData.service_date)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateMaintenanceRecordInput) => ({ ...prev, service_date: new Date(e.target.value) }))
                }
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mileage</label>
              <Input
                type="number"
                value={formData.mileage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateMaintenanceRecordInput) => ({ ...prev, mileage: parseInt(e.target.value) || 0 }))
                }
                min="0"
                placeholder="Current mileage"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
            <Select 
              value={formData.service_type} 
              onValueChange={(value: ServiceType) => setFormData((prev: CreateMaintenanceRecordInput) => ({ ...prev, service_type: value }))}
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
                setFormData((prev: CreateMaintenanceRecordInput) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Brief description of the service"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
            <Input
              type="number"
              value={formData.cost}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateMaintenanceRecordInput) => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))
              }
              min="0"
              step="0.01"
              placeholder="0.00"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <Input
              value={formData.notes || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateMaintenanceRecordInput) => ({ ...prev, notes: e.target.value || null }))
              }
              placeholder="Additional notes"
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
              {isLoading ? 'Recording...' : 'Record Maintenance'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
