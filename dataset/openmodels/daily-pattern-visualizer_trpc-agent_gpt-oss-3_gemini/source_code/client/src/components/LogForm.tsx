import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/utils/trpc';
import { useState, useCallback } from 'react';
import type { CreateLogInput } from '../../../server/src/schema';

/**
 * LogForm component allows users to create a new wellbeing log entry.
 * It uses radix UI Input and Button components and communicates with the backend via tRPC.
 * All fields are required except date which defaults to today.
 */
export function LogForm({ onSuccess }: { onSuccess?: () => void }) {
  const [formData, setFormData] = useState<CreateLogInput>({
    date: new Date(),
    sleep_duration: 0,
    work_hours: 0,
    social_time: 0,
    screen_time: 0,
    emotional_energy: 5,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => {
        if (name === 'date') {
          return { ...prev, date: new Date(value) };
        }
        if (name === 'emotional_energy') {
          return { ...prev, [name]: parseInt(value, 10) || 0 };
        }
        // numeric fields
        return { ...prev, [name]: parseFloat(value) || 0 };
      });
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await trpc.createLog.mutate(formData);
      if (onSuccess) onSuccess();
      // Reset form to defaults
      setFormData({
        date: new Date(),
        sleep_duration: 0,
        work_hours: 0,
        social_time: 0,
        screen_time: 0,
        emotional_energy: 5,
      });
    } catch (err) {
      console.error('Failed to create log', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md bg-gray-50">
      <h2 className="text-lg font-medium mb-2">New Daily Log</h2>
      <Input
        name="date"
        type="date"
        value={formData.date.toISOString().split('T')[0]}
        onChange={handleChange}
        required
      />
      <Input
        name="sleep_duration"
        type="number"
        placeholder="Sleep duration (hours)"
        value={formData.sleep_duration}
        onChange={handleChange}
        min="0"
        step="0.1"
        required
      />
      <Input
        name="work_hours"
        type="number"
        placeholder="Work hours (hours)"
        value={formData.work_hours}
        onChange={handleChange}
        min="0"
        step="0.1"
        required
      />
      <Input
        name="social_time"
        type="number"
        placeholder="Social time (hours)"
        value={formData.social_time}
        onChange={handleChange}
        min="0"
        step="0.1"
        required
      />
      <Input
        name="screen_time"
        type="number"
        placeholder="Screen time (hours)"
        value={formData.screen_time}
        onChange={handleChange}
        min="0"
        step="0.1"
        required
      />
      <Input
        name="emotional_energy"
        type="number"
        placeholder="Emotional energy (1-10)"
        value={formData.emotional_energy}
        onChange={handleChange}
        min="1"
        max="10"
        required
      />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving...' : 'Save Log'}
      </Button>
    </form>
  );
}
