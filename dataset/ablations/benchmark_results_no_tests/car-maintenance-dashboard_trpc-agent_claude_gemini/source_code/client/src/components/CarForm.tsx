import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { CreateCarInput } from '../../../server/src/schema';

interface CarFormProps {
  onSubmit: (data: CreateCarInput) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<CreateCarInput>;
  submitLabel?: string;
}

export function CarForm({ 
  onSubmit, 
  isLoading = false, 
  initialData = {},
  submitLabel = 'Add Car' 
}: CarFormProps) {
  const currentYear = new Date().getFullYear();
  
  const [formData, setFormData] = useState<CreateCarInput>({
    make: initialData.make || '',
    model: initialData.model || '',
    year: initialData.year || currentYear,
    license_plate: initialData.license_plate || '',
    current_mileage: initialData.current_mileage || 0
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateCarInput, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateCarInput, string>> = {};

    if (!formData.make.trim()) {
      newErrors.make = 'Make is required';
    }
    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }
    if (formData.year < 1900 || formData.year > currentYear + 1) {
      newErrors.year = `Year must be between 1900 and ${currentYear + 1}`;
    }
    if (!formData.license_plate.trim()) {
      newErrors.license_plate = 'License plate is required';
    }
    if (formData.current_mileage < 0) {
      newErrors.current_mileage = 'Mileage cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form on successful submission
      setFormData({
        make: '',
        model: '',
        year: currentYear,
        license_plate: '',
        current_mileage: 0
      });
      setErrors({});
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  const updateFormData = <K extends keyof CreateCarInput>(
    field: K,
    value: CreateCarInput[K]
  ) => {
    setFormData((prev: CreateCarInput) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="make">Make *</Label>
          <Input
            id="make"
            value={formData.make}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateFormData('make', e.target.value)
            }
            placeholder="e.g., Toyota"
            className={errors.make ? 'border-red-500' : ''}
          />
          {errors.make && (
            <p className="text-sm text-red-600">{errors.make}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model *</Label>
          <Input
            id="model"
            value={formData.model}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateFormData('model', e.target.value)
            }
            placeholder="e.g., Camry"
            className={errors.model ? 'border-red-500' : ''}
          />
          {errors.model && (
            <p className="text-sm text-red-600">{errors.model}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year">Year *</Label>
          <Input
            id="year"
            type="number"
            value={formData.year}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateFormData('year', parseInt(e.target.value) || currentYear)
            }
            min="1900"
            max={currentYear + 1}
            className={errors.year ? 'border-red-500' : ''}
          />
          {errors.year && (
            <p className="text-sm text-red-600">{errors.year}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="license_plate">License Plate *</Label>
          <Input
            id="license_plate"
            value={formData.license_plate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateFormData('license_plate', e.target.value.toUpperCase())
            }
            placeholder="e.g., ABC123"
            className={errors.license_plate ? 'border-red-500' : ''}
          />
          {errors.license_plate && (
            <p className="text-sm text-red-600">{errors.license_plate}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="current_mileage">Current Mileage *</Label>
        <Input
          id="current_mileage"
          type="number"
          value={formData.current_mileage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateFormData('current_mileage', parseInt(e.target.value) || 0)
          }
          min="0"
          placeholder="e.g., 50000"
          className={errors.current_mileage ? 'border-red-500' : ''}
        />
        {errors.current_mileage && (
          <p className="text-sm text-red-600">{errors.current_mileage}</p>
        )}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}
