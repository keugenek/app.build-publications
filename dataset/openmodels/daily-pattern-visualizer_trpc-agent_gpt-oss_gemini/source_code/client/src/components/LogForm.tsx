// LogForm component for entering daily metrics
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import type { CreateDailyLogInput } from '../../../server/src/schema';

export function LogForm({ onCreated }: { onCreated: () => void }) {
  const [formData, setFormData] = useState<CreateDailyLogInput>({
    logged_at: new Date(),
    sleep_hours: 0,
    work_hours: 0,
    social_hours: 0,
    screen_hours: 0,
    emotional_energy: 5,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createDailyLog.mutate(formData);
      onCreated();
      // reset form
      setFormData({
        logged_at: new Date(),
        sleep_hours: 0,
        work_hours: 0,
        social_hours: 0,
        screen_hours: 0,
        emotional_energy: 5,
      });
    } catch (err) {
      console.error('Failed to create log', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Input
        type="date"
        value={(formData.logged_at as Date).toISOString().slice(0, 10)}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, logged_at: new Date(e.target.value) }))
        }
        required
      />
      <Input
        type="number"
        placeholder="Sleep hours"
        value={formData.sleep_hours}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, sleep_hours: parseFloat(e.target.value) || 0 }))
        }
        min="0"
        step="0.1"
        required
      />
      <Input
        type="number"
        placeholder="Work hours"
        value={formData.work_hours}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, work_hours: parseFloat(e.target.value) || 0 }))
        }
        min="0"
        step="0.1"
        required
      />
      <Input
        type="number"
        placeholder="Social hours"
        value={formData.social_hours}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, social_hours: parseFloat(e.target.value) || 0 }))
        }
        min="0"
        step="0.1"
        required
      />
      <Input
        type="number"
        placeholder="Screen hours"
        value={formData.screen_hours}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, screen_hours: parseFloat(e.target.value) || 0 }))
        }
        min="0"
        step="0.1"
        required
      />
      <Input
        type="number"
        placeholder="Emotional energy (1-10)"
        value={formData.emotional_energy}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, emotional_energy: parseInt(e.target.value) || 5 }))
        }
        min="1"
        max="10"
        required
      />
      <Button type="submit" className="col-span-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Add Log'}
      </Button>
    </form>
  );
}
