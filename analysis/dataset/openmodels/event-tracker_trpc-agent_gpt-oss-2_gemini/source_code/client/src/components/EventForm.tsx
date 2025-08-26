import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import type { CreateEventInput, Event } from '../../../server/src/schema';

interface EventFormProps {
  onEventCreated: (event: Event) => void;
}

export function EventForm({ onEventCreated }: EventFormProps) {
  const [formData, setFormData] = useState<CreateEventInput>({
    title: '',
    description: null,
    event_date: new Date(),
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const created = await trpc.createEvent.mutate(formData);
      onEventCreated(created);
      // Reset form
      setFormData({
        title: '',
        description: null,
        event_date: new Date(),
      });
    } catch (error) {
      console.error('Failed to create event', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to format date for input value (yyyy-MM-dd)
  const formatDate = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000; // offset in ms
    const local = new Date(date.getTime() - tzOffset);
    return local.toISOString().split('T')[0];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <Input
        placeholder="Event title"
        value={formData.title}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, title: e.target.value }))
        }
        required
      />
      <Input
        placeholder="Description (optional)"
        value={formData.description || ''}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            description: e.target.value || null,
          }))
        }
      />
      <Input
        type="date"
        value={formatDate(formData.event_date)}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            event_date: e.target.value ? new Date(e.target.value) : new Date(),
          }))
        }
        required
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Add Event'}
      </Button>
    </form>
  );
}
