import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
// Using type-only imports from server schema
import type { 
  CreateRecipeInput, 
  UpdateRecipeInput, 
  RecipeWithUser,
  RecipeCategory 
} from '../../../server/src/schema';

interface RecipeFormProps {
  initialData?: RecipeWithUser;
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
}

const RECIPE_CATEGORIES: RecipeCategory[] = [
  'appetizer',
  'main_course',
  'dessert',
  'beverage',
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'salad',
  'soup',
  'vegetarian',
  'vegan',
  'gluten_free'
];

const formatCategory = (category: string): string => {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function RecipeForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false, 
  isEditing = false 
}: RecipeFormProps) {
  const [formData, setFormData] = useState<CreateRecipeInput>({
    title: initialData?.title || '',
    description: initialData?.description || null,
    ingredients: initialData?.ingredients || [],
    instructions: initialData?.instructions || [],
    prep_time_minutes: initialData?.prep_time_minutes || null,
    cook_time_minutes: initialData?.cook_time_minutes || null,
    servings: initialData?.servings || null,
    category: initialData?.category || 'main_course',
    user_id: initialData?.user_id || 0 // Will be set by parent component
  });

  const [newIngredient, setNewIngredient] = useState('');
  const [newInstruction, setNewInstruction] = useState('');

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setFormData((prev: CreateRecipeInput) => ({
        ...prev,
        ingredients: [...prev.ingredients, newIngredient.trim()]
      }));
      setNewIngredient('');
    }
  };

  const removeIngredient = (index: number) => {
    setFormData((prev: CreateRecipeInput) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i: number) => i !== index)
    }));
  };

  const addInstruction = () => {
    if (newInstruction.trim()) {
      setFormData((prev: CreateRecipeInput) => ({
        ...prev,
        instructions: [...prev.instructions, newInstruction.trim()]
      }));
      setNewInstruction('');
    }
  };

  const removeInstruction = (index: number) => {
    setFormData((prev: CreateRecipeInput) => ({
      ...prev,
      instructions: prev.instructions.filter((_, i: number) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.ingredients.length === 0 || formData.instructions.length === 0) {
      alert('Please add at least one ingredient and one instruction');
      return;
    }

    try {
      if (isEditing && initialData) {
        await onSubmit({ 
          ...formData, 
          id: initialData.id,
          user_id: initialData.user_id
        } as UpdateRecipeInput);
      } else {
        await onSubmit(formData);
      }
      
      // Reset form if not editing
      if (!isEditing) {
        setFormData({
          title: '',
          description: null,
          ingredients: [],
          instructions: [],
          prep_time_minutes: null,
          cook_time_minutes: null,
          servings: null,
          category: 'main_course',
          user_id: 0
        });
      }
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Recipe Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateRecipeInput) => ({ 
                ...prev, 
                title: e.target.value 
              }))
            }
            placeholder="Delicious Chocolate Cake"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value: RecipeCategory) =>
              setFormData((prev: CreateRecipeInput) => ({ 
                ...prev, 
                category: value 
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECIPE_CATEGORIES.map((category: RecipeCategory) => (
                <SelectItem key={category} value={category}>
                  {formatCategory(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateRecipeInput) => ({ 
              ...prev, 
              description: e.target.value || null 
            }))
          }
          placeholder="Tell us about this recipe..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="prep-time">Prep Time (minutes)</Label>
          <Input
            id="prep-time"
            type="number"
            value={formData.prep_time_minutes || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateRecipeInput) => ({ 
                ...prev, 
                prep_time_minutes: parseInt(e.target.value) || null 
              }))
            }
            placeholder="15"
            min="1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cook-time">Cook Time (minutes)</Label>
          <Input
            id="cook-time"
            type="number"
            value={formData.cook_time_minutes || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateRecipeInput) => ({ 
                ...prev, 
                cook_time_minutes: parseInt(e.target.value) || null 
              }))
            }
            placeholder="30"
            min="1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="servings">Servings</Label>
          <Input
            id="servings"
            type="number"
            value={formData.servings || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateRecipeInput) => ({ 
                ...prev, 
                servings: parseInt(e.target.value) || null 
              }))
            }
            placeholder="4"
            min="1"
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label>Ingredients * (at least 1 required)</Label>
        <div className="flex space-x-2">
          <Input
            value={newIngredient}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              setNewIngredient(e.target.value)
            }
            placeholder="2 cups flour"
            onKeyPress={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addIngredient();
              }
            }}
          />
          <Button type="button" onClick={addIngredient} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.ingredients.map((ingredient: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-sm">
              {ingredient}
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="ml-2 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Label>Instructions * (at least 1 required)</Label>
        <div className="flex space-x-2">
          <Textarea
            value={newInstruction}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
              setNewInstruction(e.target.value)
            }
            placeholder="Mix flour and sugar in a large bowl..."
            rows={2}
          />
          <Button type="button" onClick={addInstruction} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {formData.instructions.map((instruction: string, index: number) => (
            <div key={index} className="flex items-start space-x-2 p-3 bg-gray-50 rounded-md">
              <span className="font-medium text-orange-600 min-w-[1.5rem]">
                {index + 1}.
              </span>
              <span className="flex-1">{instruction}</span>
              <button
                type="button"
                onClick={() => removeInstruction(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex space-x-4 pt-4">
        <Button 
          type="submit" 
          className="bg-orange-500 hover:bg-orange-600" 
          disabled={isLoading}
        >
          {isLoading 
            ? (isEditing ? 'Updating...' : 'Creating...') 
            : (isEditing ? '✏️ Update Recipe' : '🎉 Create Recipe')
          }
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
