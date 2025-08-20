import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import type { CreateHabitInput } from '../../../server/src/schema';

interface HabitFormProps {
  onSubmit: (data: CreateHabitInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function HabitForm({ onSubmit, onCancel, isLoading = false }: HabitFormProps) {
  const [formData, setFormData] = useState<CreateHabitInput>({
    name: '',
    description: null
  });

  const [errors, setErrors] = useState<{ name?: string }>({});

  const validateForm = () => {
    const newErrors: { name?: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Habit name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Habit name must be at least 2 characters';
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
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description?.trim() || null
      });
      // Reset form after successful submission
      setFormData({ name: '', description: null });
      setErrors({});
    } catch (error) {
      console.error('Failed to create habit:', error);
    }
  };

  const habitExamples = [
    'Drink 8 glasses of water',
    'Read for 30 minutes',
    'Exercise for 20 minutes',
    'Practice gratitude',
    'Take a 10-minute walk',
    'Write in a journal'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name" className="text-sm font-medium">
          Habit Name *
        </Label>
        <Input
          id="name"
          placeholder="e.g., Drink 8 glasses of water"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setFormData((prev: CreateHabitInput) => ({ ...prev, name: e.target.value }));
            if (errors.name) {
              setErrors((prev) => ({ ...prev, name: undefined }));
            }
          }}
          className={`mt-1 ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
          required
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name}</p>
        )}
        
        {/* Quick examples */}
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-2">Quick examples:</p>
          <div className="flex flex-wrap gap-1">
            {habitExamples.slice(0, 3).map((example, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setFormData((prev: CreateHabitInput) => ({ ...prev, name: example }))}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="description" className="text-sm font-medium">
          Description <span className="text-gray-400">(Optional)</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Why is this habit important to you? What benefits do you hope to gain?"
          value={formData.description || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateHabitInput) => ({
              ...prev,
              description: e.target.value || null
            }))
          }
          rows={3}
          className="mt-1 resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          Adding a description helps you stay motivated by reminding you why this habit matters
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="flex-1"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !formData.name.trim()} 
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Creating...
            </>
          ) : (
            <>
              <span className="mr-2">✨</span>
              Create Habit
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
