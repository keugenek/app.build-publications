import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import type { CreateHabitInput } from '../../../server/src/schema';

interface CreateHabitFormProps {
  onSubmit: (data: CreateHabitInput) => Promise<void>;
  isLoading?: boolean;
}

export function CreateHabitForm({ onSubmit, isLoading = false }: CreateHabitFormProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateHabitInput>({
    name: '',
    description: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    try {
      await onSubmit(formData);
      // Reset form after successful submission
      setFormData({ name: '', description: null });
      setIsDialogOpen(false);
    } catch (error) {
      // Error handling is done in parent component
      console.error('Form submission failed:', error);
    }
  };

  // Example habit suggestions
  const habitSuggestions = [
    'Drink 8 glasses of water',
    'Read for 30 minutes',
    'Exercise for 20 minutes',
    'Meditate for 10 minutes',
    'Write in journal',
    'Take a walk outside',
    'Practice gratitude',
    'Learn something new'
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setFormData((prev: CreateHabitInput) => ({ ...prev, name: suggestion }));
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200">
          ✨ Create New Habit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Habit</DialogTitle>
          <DialogDescription>
            Add a new habit to start tracking your progress. Be specific and realistic!
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="What habit do you want to build?"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateHabitInput) => ({ ...prev, name: e.target.value }))
              }
              required
              className="text-base"
            />
          </div>
          
          <div>
            <Textarea
              placeholder="Add a description or personal motivation (optional)"
              value={formData.description || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreateHabitInput) => ({
                  ...prev,
                  description: e.target.value || null
                }))
              }
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Habit Suggestions */}
          <div>
            <p className="text-sm text-gray-600 mb-2">💡 Popular habits:</p>
            <div className="flex flex-wrap gap-1">
              {habitSuggestions.slice(0, 4).map((suggestion: string) => (
                <Button
                  key={suggestion}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs h-7 px-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="submit" 
              disabled={isLoading || !formData.name.trim()} 
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                '🚀 Create Habit'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
