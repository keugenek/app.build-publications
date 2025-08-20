import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Loader2 } from 'lucide-react';
import type { CreateEventInput } from '../../../server/src/schema';

interface EventFormProps {
  onSubmit: (data: CreateEventInput) => Promise<void>;
  isLoading?: boolean;
}

export function EventForm({ onSubmit, isLoading = false }: EventFormProps) {
  const [formData, setFormData] = useState<CreateEventInput>({
    title: '',
    description: '',
    date: new Date()
  });

  const [errors, setErrors] = useState<Partial<CreateEventInput>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateEventInput> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
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
      // Reset form after successful submission
      setFormData({
        title: '',
        description: '',
        date: new Date()
      });
      setErrors({});
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  // Format date for HTML input (YYYY-MM-DDTHH:MM)
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title Input */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium text-gray-700">
          Event Title *
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateEventInput) => ({ ...prev, title: e.target.value }))
          }
          placeholder="Enter event title..."
          className={`${errors.title ? 'border-red-500' : ''}`}
          disabled={isLoading}
        />
        {errors.title && (
          <p className="text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      {/* Date Input */}
      <div className="space-y-2">
        <Label htmlFor="date" className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          Event Date & Time *
        </Label>
        <Input
          id="date"
          type="datetime-local"
          value={formatDateForInput(formData.date)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateEventInput) => ({ 
              ...prev, 
              date: new Date(e.target.value) 
            }))
          }
          className="cursor-pointer"
          disabled={isLoading}
        />
      </div>

      {/* Description Textarea */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium text-gray-700">
          Description *
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateEventInput) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Describe your event..."
          rows={4}
          className={`resize-none ${errors.description ? 'border-red-500' : ''}`}
          disabled={isLoading}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Event...
          </>
        ) : (
          'Create Event'
        )}
      </Button>
    </form>
  );
}
