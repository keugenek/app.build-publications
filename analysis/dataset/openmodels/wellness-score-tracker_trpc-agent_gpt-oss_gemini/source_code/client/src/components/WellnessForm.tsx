import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { CreateWellnessEntryInput } from '../../../server/src/schema';

interface WellnessFormProps {
  onSubmit: (data: CreateWellnessEntryInput) => Promise<void>;
  isLoading?: boolean;
}

export function WellnessForm({ onSubmit, isLoading = false }: WellnessFormProps) {
  const [formData, setFormData] = useState<CreateWellnessEntryInput>({
    // entry_date optional, default to today handled by backend
    sleep_hours: 0,
    stress_level: 0,
    caffeine_intake: 0,
    alcohol_intake: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    // reset form to defaults
    setFormData({
      sleep_hours: 0,
      stress_level: 0,
      caffeine_intake: 0,
      alcohol_intake: 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 max-w-md mx-auto">
      <Input
        type="date"
        placeholder="Entry date (optional)"
        value={formData.entry_date ? (formData.entry_date as unknown as string) : ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setFormData((prev) => ({
            ...prev,
            // Convert empty string to undefined to let backend default to now
            entry_date: e.target.value ? new Date(e.target.value) : undefined,
          }))
        }
      />
      <Input
        type="number"
        placeholder="Sleep hours (0-24)"
        value={formData.sleep_hours}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            sleep_hours: parseFloat(e.target.value) || 0,
          }))
        }
        min="0"
        max="24"
        step="0.1"
        required
      />
      <Input
        type="number"
        placeholder="Stress level (0-10)"
        value={formData.stress_level}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            stress_level: parseInt(e.target.value) || 0,
          }))
        }
        min="0"
        max="10"
        required
      />
      <Input
        type="number"
        placeholder="Caffeine intake (mg)"
        value={formData.caffeine_intake}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            caffeine_intake: parseFloat(e.target.value) || 0,
          }))
        }
        min="0"
        required
      />
      <Input
        type="number"
        placeholder="Alcohol intake (units)"
        value={formData.alcohol_intake}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            alcohol_intake: parseFloat(e.target.value) || 0,
          }))
        }
        min="0"
        required
      />
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Saving...' : 'Add Entry'}
      </Button>
    </form>
  );
}
