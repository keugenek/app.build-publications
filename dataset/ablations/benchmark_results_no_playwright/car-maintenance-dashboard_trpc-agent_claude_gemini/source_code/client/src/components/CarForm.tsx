import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/utils/trpc';
import type { Car, CreateCarInput } from '../../../server/src/schema';

interface CarFormProps {
  onCarCreated: (car: Car) => void;
  onCancel: () => void;
}

export function CarForm({ onCarCreated, onCancel }: CarFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCarInput>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: null,
    license_plate: null,
    current_mileage: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await trpc.createCar.mutate(formData);
      onCarCreated(response);
    } catch (error) {
      console.error('Failed to create car:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🚗 Add New Vehicle</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
              <Input
                value={formData.make}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateCarInput) => ({ ...prev, make: e.target.value }))
                }
                placeholder="e.g., Toyota"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <Input
                value={formData.model}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateCarInput) => ({ ...prev, model: e.target.value }))
                }
                placeholder="e.g., Camry"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <Input
              type="number"
              value={formData.year}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateCarInput) => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))
              }
              min="1900"
              max={new Date().getFullYear() + 1}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Mileage</label>
            <Input
              type="number"
              value={formData.current_mileage}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateCarInput) => ({ ...prev, current_mileage: parseInt(e.target.value) || 0 }))
              }
              min="0"
              placeholder="0"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">License Plate (Optional)</label>
            <Input
              value={formData.license_plate || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateCarInput) => ({ ...prev, license_plate: e.target.value || null }))
              }
              placeholder="e.g., ABC-1234"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">VIN (Optional)</label>
            <Input
              value={formData.vin || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateCarInput) => ({ ...prev, vin: e.target.value || null }))
              }
              placeholder="17-character VIN"
              maxLength={17}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? 'Adding...' : 'Add Vehicle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
