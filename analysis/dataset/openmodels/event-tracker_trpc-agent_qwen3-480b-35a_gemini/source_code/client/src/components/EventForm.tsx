import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import type { CreateEventInput } from '../../../server/src/schema';

interface EventFormProps {
  onSubmit: (data: CreateEventInput) => Promise<void>;
  isLoading?: boolean;
}

export function EventForm({ onSubmit, isLoading = false }: EventFormProps) {
  const [formData, setFormData] = useState<CreateEventInput>({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    // Reset form after successful submission
    setFormData({
      title: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Event</h2>
      
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Event Title
        </label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder="Enter event title"
          required
          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
        />
      </div>
      
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Event Date
        </label>
        <div className="relative">
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({ ...prev, date: e.target.value }))
            }
            required
            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 pl-10"
          />
          <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description (Optional)
        </label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev) => ({
              ...prev,
              description: e.target.value || null
            }))
          }
          placeholder="Enter event description"
          rows={3}
          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
        />
      </div>
      
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Creating...' : 'Create Event'}
      </Button>
    </form>
  );
}
