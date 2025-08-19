import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import { Tag, Plus } from 'lucide-react';
import type { Category, CreateCategoryInput } from '../../../server/src/schema';

interface CategoryFormProps {
  onCategoryCreated: (category: Category) => void;
}

export function CategoryForm({ onCategoryCreated }: CategoryFormProps) {
  const [formData, setFormData] = useState<CreateCategoryInput>({
    name: '',
    description: null
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await trpc.createCategory.mutate(formData);
      onCategoryCreated(response);
      
      // Reset form
      setFormData({
        name: '',
        description: null
      });
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Predefined category suggestions
  const categoryPresets = [
    { name: 'Food & Dining', description: 'Restaurants, groceries, and meal expenses', emoji: '🍽️' },
    { name: 'Transportation', description: 'Gas, public transport, rideshares', emoji: '🚗' },
    { name: 'Shopping', description: 'Clothing, electronics, and personal items', emoji: '🛍️' },
    { name: 'Entertainment', description: 'Movies, games, subscriptions', emoji: '🎬' },
    { name: 'Bills & Utilities', description: 'Rent, electricity, internet, phone', emoji: '⚡' },
    { name: 'Healthcare', description: 'Medical expenses, insurance, pharmacy', emoji: '🏥' },
    { name: 'Education', description: 'Books, courses, training', emoji: '📚' },
    { name: 'Travel', description: 'Vacation, hotels, flights', emoji: '✈️' },
  ];

  const handlePresetSelect = (preset: typeof categoryPresets[0]) => {
    setFormData({
      name: preset.name,
      description: preset.description
    });
  };

  return (
    <div className="space-y-6">
      {/* Quick Presets */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          💡 Quick Category Presets
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {categoryPresets.map((preset, index) => (
            <Button
              key={index}
              type="button"
              variant="outline"
              size="sm"
              className="h-auto p-3 flex flex-col items-center gap-1 hover:bg-blue-50 hover:border-blue-300"
              onClick={() => handlePresetSelect(preset)}
            >
              <span className="text-lg">{preset.emoji}</span>
              <span className="text-xs text-center leading-tight">
                {preset.name}
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Custom Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Name */}
          <div className="space-y-3">
            <Label htmlFor="name" className="text-sm font-medium">
              Category Name *
            </Label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                id="name"
                placeholder="e.g., Food & Dining"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateCategoryInput) => ({ 
                    ...prev, 
                    name: e.target.value 
                  }))
                }
                className="pl-10 h-12"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-sm font-medium">
              Description (optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Brief description of what this category includes..."
              value={formData.description || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreateCategoryInput) => ({ 
                  ...prev, 
                  description: e.target.value || null 
                }))
              }
              className="min-h-[48px] max-h-24 resize-none"
            />
          </div>
        </div>

        {/* Preview Card */}
        {formData.name && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Category Preview:
              </h3>
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium">Name:</span> 
                  <span className="ml-2 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                    {formData.name}
                  </span>
                </p>
                {formData.description && (
                  <p>
                    <span className="font-medium">Description:</span> 
                    <span className="ml-2 text-gray-600">{formData.description}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <Button 
          type="submit" 
          disabled={isLoading || !formData.name.trim()}
          className="w-full h-12 text-lg font-medium bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            'Creating Category...'
          ) : (
            <>
              <Plus className="w-5 h-5 mr-2" />
              Create Category
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
