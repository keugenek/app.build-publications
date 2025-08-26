import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Using type-only imports
import type { CreateDailyMetricsInput, DailyMetrics } from '../../../server/src/schema';

interface MetricsFormProps {
  onSubmit: (data: CreateDailyMetricsInput) => Promise<void>;
  isLoading?: boolean;
  initialData?: DailyMetrics | null;
  date: string;
}

export function MetricsForm({ onSubmit, isLoading = false, initialData, date }: MetricsFormProps) {
  const [formData, setFormData] = useState<CreateDailyMetricsInput>({
    date: date,
    sleep_duration: 8,
    work_hours: 8,
    social_interaction_time: 2,
    screen_time: 6,
    emotional_energy_level: 7,
    notes: null
  });

  // Update form when initial data changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        date: date,
        sleep_duration: initialData.sleep_duration,
        work_hours: initialData.work_hours,
        social_interaction_time: initialData.social_interaction_time,
        screen_time: initialData.screen_time,
        emotional_energy_level: initialData.emotional_energy_level,
        notes: initialData.notes
      });
    }
  }, [initialData, date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const getEnergyLabel = (level: number) => {
    if (level >= 9) return { text: 'Excellent! 🚀', color: 'bg-green-500' };
    if (level >= 7) return { text: 'Good 😊', color: 'bg-blue-500' };
    if (level >= 5) return { text: 'Okay 😐', color: 'bg-yellow-500' };
    if (level >= 3) return { text: 'Low 😞', color: 'bg-orange-500' };
    return { text: 'Very Low 😴', color: 'bg-red-500' };
  };

  const energyLabel = getEnergyLabel(formData.emotional_energy_level);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sleep Duration */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="sleep">😴 Sleep Duration</Label>
          <Badge variant="outline">{formData.sleep_duration}h</Badge>
        </div>
        <Slider
          id="sleep"
          min={0}
          max={12}
          step={0.5}
          value={[formData.sleep_duration]}
          onValueChange={(value: number[]) =>
            setFormData((prev: CreateDailyMetricsInput) => ({ ...prev, sleep_duration: value[0] }))
          }
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0h</span>
          <span>12h</span>
        </div>
      </div>

      {/* Work Hours */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="work">💼 Work Hours</Label>
          <Badge variant="outline">{formData.work_hours}h</Badge>
        </div>
        <Slider
          id="work"
          min={0}
          max={16}
          step={0.5}
          value={[formData.work_hours]}
          onValueChange={(value: number[]) =>
            setFormData((prev: CreateDailyMetricsInput) => ({ ...prev, work_hours: value[0] }))
          }
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0h</span>
          <span>16h</span>
        </div>
      </div>

      {/* Social Interaction Time */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="social">👥 Social Interaction</Label>
          <Badge variant="outline">{formData.social_interaction_time}h</Badge>
        </div>
        <Slider
          id="social"
          min={0}
          max={12}
          step={0.5}
          value={[formData.social_interaction_time]}
          onValueChange={(value: number[]) =>
            setFormData((prev: CreateDailyMetricsInput) => ({ ...prev, social_interaction_time: value[0] }))
          }
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0h</span>
          <span>12h</span>
        </div>
      </div>

      {/* Screen Time */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="screen">📱 Screen Time</Label>
          <Badge variant="outline">{formData.screen_time}h</Badge>
        </div>
        <Slider
          id="screen"
          min={0}
          max={18}
          step={0.5}
          value={[formData.screen_time]}
          onValueChange={(value: number[]) =>
            setFormData((prev: CreateDailyMetricsInput) => ({ ...prev, screen_time: value[0] }))
          }
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0h</span>
          <span>18h</span>
        </div>
      </div>

      {/* Emotional Energy Level */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="energy">⚡ Energy Level</Label>
          <Badge className={energyLabel.color + ' text-white'}>
            {formData.emotional_energy_level}/10 - {energyLabel.text}
          </Badge>
        </div>
        <Slider
          id="energy"
          min={1}
          max={10}
          step={1}
          value={[formData.emotional_energy_level]}
          onValueChange={(value: number[]) =>
            setFormData((prev: CreateDailyMetricsInput) => ({ ...prev, emotional_energy_level: value[0] }))
          }
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>1 (Very Low)</span>
          <span>10 (Excellent)</span>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">📝 Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="How was your day? Any observations or thoughts..."
          value={formData.notes || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateDailyMetricsInput) => ({
              ...prev,
              notes: e.target.value || null
            }))
          }
          className="min-h-[80px] resize-none"
        />
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Saving...
          </>
        ) : (
          <>
            💾 {initialData ? 'Update' : 'Save'} Today's Metrics
          </>
        )}
      </Button>

      {initialData && (
        <p className="text-xs text-center text-gray-500">
          Last updated: {initialData.updated_at.toLocaleString()}
        </p>
      )}
    </form>
  );
}
