import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { X, Plus, Clock, Users, ChefHat } from 'lucide-react';
import type { CreateRecipeInput, RecipeCategory } from '../../../server/src/schema';

interface RecipeFormProps {
  onSubmit: (data: CreateRecipeInput) => Promise<void>;
  isLoading?: boolean;
}

const RECIPE_CATEGORIES: RecipeCategory[] = [
  'breakfast', 'lunch', 'dinner', 'appetizer', 'dessert', 'snack', 'beverage',
  'salad', 'soup', 'main_course', 'side_dish', 'vegetarian', 'vegan',
  'gluten_free', 'low_carb', 'keto', 'healthy', 'comfort_food', 'international'
];

type DifficultyOption = 'easy' | 'medium' | 'hard';

export function RecipeForm({ onSubmit, isLoading = false }: RecipeFormProps) {
  const [formData, setFormData] = useState<CreateRecipeInput>({
    title: '',
    description: null,
    ingredients: [''],
    instructions: [''],
    categories: [],
    prep_time_minutes: undefined,
    cook_time_minutes: undefined,
    servings: undefined,
    difficulty: undefined,
    author_id: 0 // This will be set by the parent component
  });

  const [newIngredient, setNewIngredient] = useState('');
  const [newInstruction, setNewInstruction] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty ingredients and instructions
    const cleanedData: CreateRecipeInput = {
      ...formData,
      ingredients: formData.ingredients.filter((i: string) => i.trim() !== ''),
      instructions: formData.instructions.filter((i: string) => i.trim() !== ''),
      description: formData.description?.trim() || null
    };

    // Validation
    if (!cleanedData.title.trim()) {
      alert('Please enter a recipe title');
      return;
    }
    if (cleanedData.ingredients.length === 0) {
      alert('Please add at least one ingredient');
      return;
    }
    if (cleanedData.instructions.length === 0) {
      alert('Please add at least one instruction');
      return;
    }
    if (cleanedData.categories.length === 0) {
      alert('Please select at least one category');
      return;
    }

    await onSubmit(cleanedData);
    
    // Reset form
    setFormData({
      title: '',
      description: null,
      ingredients: [''],
      instructions: [''],
      categories: [],
      prep_time_minutes: undefined,
      cook_time_minutes: undefined,
      servings: undefined,
      difficulty: undefined,
      author_id: 0
    });
    setNewIngredient('');
    setNewInstruction('');
  };

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
      ingredients: prev.ingredients.filter((_, i) => i !== index)
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
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const toggleCategory = (category: RecipeCategory) => {
    setFormData((prev: CreateRecipeInput) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category]
    }));
  };

  const formatCategoryName = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ChefHat className="h-5 w-5" />
            <span>Recipe Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Recipe Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateRecipeInput) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter a delicious recipe title..."
              required
            />
          </div>

          <div>
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
              placeholder="Tell us about your recipe..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="prep_time">Prep Time (minutes)</Label>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <Input
                  id="prep_time"
                  type="number"
                  value={formData.prep_time_minutes || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateRecipeInput) => ({ 
                      ...prev, 
                      prep_time_minutes: parseInt(e.target.value) || undefined 
                    }))
                  }
                  placeholder="30"
                  min="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cook_time">Cook Time (minutes)</Label>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <Input
                  id="cook_time"
                  type="number"
                  value={formData.cook_time_minutes || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateRecipeInput) => ({ 
                      ...prev, 
                      cook_time_minutes: parseInt(e.target.value) || undefined 
                    }))
                  }
                  placeholder="45"
                  min="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="servings">Servings</Label>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-400" />
                <Input
                  id="servings"
                  type="number"
                  value={formData.servings || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateRecipeInput) => ({ 
                      ...prev, 
                      servings: parseInt(e.target.value) || undefined 
                    }))
                  }
                  placeholder="4"
                  min="1"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select
              value={formData.difficulty || ''}
              onValueChange={(value) =>
                setFormData((prev: CreateRecipeInput) => ({ 
                  ...prev, 
                  difficulty: value as DifficultyOption || undefined 
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">🟢 Easy</SelectItem>
                <SelectItem value="medium">🟡 Medium</SelectItem>
                <SelectItem value="hard">🔴 Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Categories *</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {RECIPE_CATEGORIES.map((category) => (
              <Badge
                key={category}
                variant={formData.categories.includes(category) ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-orange-100 transition-colors"
                onClick={() => toggleCategory(category)}
              >
                {formatCategoryName(category)}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ingredients */}
      <Card>
        <CardHeader>
          <CardTitle>Ingredients *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={newIngredient}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewIngredient(e.target.value)}
              placeholder="Add an ingredient..."
              onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
            />
            <Button type="button" onClick={addIngredient} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {formData.ingredients.length > 0 && (
            <div className="space-y-2">
              {formData.ingredients.map((ingredient, index) => (
                ingredient.trim() && (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span>• {ingredient}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIngredient(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Textarea
              value={newInstruction}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewInstruction(e.target.value)}
              placeholder="Add a cooking step..."
              rows={2}
            />
            <Button type="button" onClick={addInstruction} variant="outline" className="self-start">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {formData.instructions.length > 0 && (
            <div className="space-y-3">
              {formData.instructions.map((instruction, index) => (
                instruction.trim() && (
                  <div key={index} className="flex items-start space-x-3 bg-gray-50 p-3 rounded">
                    <div className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white text-sm font-semibold rounded-full flex items-center justify-center">
                      {index + 1}
                    </div>
                    <span className="flex-1">{instruction}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeInstruction(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Creating Recipe...' : 'Share Recipe 🍳'}
      </Button>
    </form>
  );
}
