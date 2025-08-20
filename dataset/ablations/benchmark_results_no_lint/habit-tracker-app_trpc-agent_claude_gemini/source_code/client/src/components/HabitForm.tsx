import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { CreateHabitInput } from '../../../server/src/schema';

interface HabitFormProps {
  onSubmit: (data: CreateHabitInput) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function HabitForm({ onSubmit, onCancel, isLoading }: HabitFormProps) {
  const [formData, setFormData] = useState<CreateHabitInput>({
    name: '',
    description: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    await onSubmit(formData);
    
    // Reset form after successful submission
    setFormData({
      name: '',
      description: null
    });
  };

  // Suggested habit examples
  const habitExamples = [
    "Read 30 minutes daily 📚",
    "Exercise for 20 minutes 💪",
    "Meditate 10 minutes 🧘",
    "Drink 8 glasses of water 💧",
    "Write in journal 📝",
    "Practice gratitude ✨"
  ];

  return (
    <Card className="mb-8 border-purple-200 shadow-lg card-shadow-hover">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
        <CardTitle className="text-purple-700 flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Create New Habit
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="habit-name" className="text-sm font-medium text-gray-700">
              Habit Name *
            </label>
            <Input
              id="habit-name"
              placeholder="What habit would you like to build?"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateHabitInput) => ({ ...prev, name: e.target.value }))
              }
              required
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="habit-description" className="text-sm font-medium text-gray-700">
              Description (Optional)
            </label>
            <Textarea
              id="habit-description"
              placeholder="Why is this habit important to you? How will it improve your life?"
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

          {/* Habit Examples */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
            <h4 className="text-sm font-semibold text-indigo-700 mb-2">💡 Popular Habits</h4>
            <div className="flex flex-wrap gap-2">
              {habitExamples.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setFormData((prev: CreateHabitInput) => ({ 
                    ...prev, 
                    name: example.replace(/\s[^\s]*$/, '') // Remove emoji for cleaner input
                  }))}
                  className="text-xs px-3 py-1 bg-white border border-indigo-300 rounded-full text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-200"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              type="submit" 
              disabled={isLoading || !formData.name.trim()}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Creating...
                </>
              ) : (
                '🚀 Create Habit'
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isLoading}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
