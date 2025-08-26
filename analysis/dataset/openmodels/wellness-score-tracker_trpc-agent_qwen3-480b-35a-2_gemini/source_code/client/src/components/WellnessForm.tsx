import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { CreateWellnessEntryInput } from '../../../server/src/schema';

interface WellnessFormProps {
  onSubmit: (data: CreateWellnessEntryInput) => Promise<void>;
  isLoading?: boolean;
}

export function WellnessForm({ onSubmit, isLoading = false }: WellnessFormProps) {
  const [formData, setFormData] = useState<CreateWellnessEntryInput>({
    date: new Date(),
    sleep_hours: 0,
    stress_level: 5,
    caffeine_intake: 0,
    alcohol_intake: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date instanceof Date ? formData.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateWellnessEntryInput) => ({ 
                ...prev, 
                date: new Date(e.target.value) 
              }))
            }
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="sleep_hours">Sleep Hours: {formData.sleep_hours}</Label>
          <Slider
            id="sleep_hours"
            min={0}
            max={16}
            step={0.5}
            value={[formData.sleep_hours]}
            onValueChange={(value) => 
              setFormData((prev: CreateWellnessEntryInput) => ({ 
                ...prev, 
                sleep_hours: value[0] 
              }))
            }
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0h</span>
            <span>16h</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="stress_level">Stress Level: {formData.stress_level}/10</Label>
          <Slider
            id="stress_level"
            min={1}
            max={10}
            value={[formData.stress_level]}
            onValueChange={(value) => 
              setFormData((prev: CreateWellnessEntryInput) => ({ 
                ...prev, 
                stress_level: value[0] 
              }))
            }
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Low (1)</span>
            <span>High (10)</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="caffeine_intake">Caffeine Intake: {formData.caffeine_intake} servings</Label>
          <Slider
            id="caffeine_intake"
            min={0}
            max={10}
            value={[formData.caffeine_intake]}
            onValueChange={(value) => 
              setFormData((prev: CreateWellnessEntryInput) => ({ 
                ...prev, 
                caffeine_intake: value[0] 
              }))
            }
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>10</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="alcohol_intake">Alcohol Intake: {formData.alcohol_intake} servings</Label>
          <Slider
            id="alcohol_intake"
            min={0}
            max={10}
            value={[formData.alcohol_intake]}
            onValueChange={(value) => 
              setFormData((prev: CreateWellnessEntryInput) => ({ 
                ...prev, 
                alcohol_intake: value[0] 
              }))
            }
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>10</span>
          </div>
        </div>
      </div>
      
      <div className="pt-4">
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Logging...' : 'Log Wellness Entry'}
        </Button>
      </div>
    </form>
  );
}
