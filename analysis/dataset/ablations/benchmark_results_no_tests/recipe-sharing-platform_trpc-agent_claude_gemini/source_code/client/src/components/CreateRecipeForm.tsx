import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Clock, Users } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { CreateRecipeInput, User, Category, RecipeWithDetails } from '../../../server/src/schema';

interface CreateRecipeFormProps {
  currentUser: User;
  categories: Category[];
  onRecipeCreated: (recipe: RecipeWithDetails) => void;
}

export function CreateRecipeForm({ currentUser, categories, onRecipeCreated }: CreateRecipeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateRecipeInput>({
    title: '',
    description: null,
    ingredients: [''],
    instructions: [''],
    prep_time_minutes: null,
    cook_time_minutes: null,
    servings: null,
    user_id: currentUser.id,
    category_ids: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Filter out empty ingredients and instructions
      const cleanedData = {
        ...formData,
        ingredients: formData.ingredients.filter(item => item.trim() !== ''),
        instructions: formData.instructions.filter(item => item.trim() !== ''),
        user_id: currentUser.id
      };

      const recipe = await trpc.createRecipe.mutate(cleanedData);
      
      // Transform Recipe to RecipeWithDetails
      const recipeWithDetails: RecipeWithDetails = {
        ...recipe,
        user: currentUser,
        categories: categories.filter(cat => cleanedData.category_ids?.includes(cat.id)) || [],
        is_favorite: false
      };
      
      onRecipeCreated(recipeWithDetails);

      // Reset form
      setFormData({
        title: '',
        description: null,
        ingredients: [''],
        instructions: [''],
        prep_time_minutes: null,
        cook_time_minutes: null,
        servings: null,
        user_id: currentUser.id,
        category_ids: []
      });
    } catch (error) {
      console.error('Failed to create recipe:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, '']
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((item, i) => i === index ? value : item)
    }));
  };

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const removeInstruction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const updateInstruction = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.map((item, i) => i === index ? value : item)
    }));
  };

  const toggleCategory = (categoryId: number) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids?.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...(prev.category_ids || []), categoryId]
    }));
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Share Your Recipe 👨‍🍳</CardTitle>
        <CardDescription>
          Share your amazing recipe with the community! Include all the details to help others recreate your dish.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Recipe Title *</label>
              <Input
                placeholder="e.g., Grandma's Famous Chocolate Chip Cookies"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData(prev => ({ ...prev, title: e.target.value }))
                }
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                placeholder="Tell us about your recipe... What makes it special?"
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData(prev => ({ ...prev, description: e.target.value || null }))
                }
                rows={3}
              />
            </div>
          </div>

          {/* Recipe Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Prep Time (minutes)
              </label>
              <Input
                type="number"
                placeholder="15"
                value={formData.prep_time_minutes || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData(prev => ({ ...prev, prep_time_minutes: parseInt(e.target.value) || null }))
                }
                min="0"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Cook Time (minutes)
              </label>
              <Input
                type="number"
                placeholder="30"
                value={formData.cook_time_minutes || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData(prev => ({ ...prev, cook_time_minutes: parseInt(e.target.value) || null }))
                }
                min="0"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Servings
              </label>
              <Input
                type="number"
                placeholder="4"
                value={formData.servings || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData(prev => ({ ...prev, servings: parseInt(e.target.value) || null }))
                }
                min="1"
              />
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="text-sm font-medium mb-2 block">Categories</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category: Category) => (
                <Badge
                  key={category.id}
                  variant={formData.category_ids?.includes(category.id) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-orange-100"
                  onClick={() => toggleCategory(category.id)}
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Ingredients *</label>
              <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                <Plus className="h-4 w-4 mr-1" />
                Add Ingredient
              </Button>
            </div>
            <div className="space-y-2">
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    placeholder="e.g., 2 cups all-purpose flour"
                    value={ingredient}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateIngredient(index, e.target.value)
                    }
                    className="flex-1"
                  />
                  {formData.ingredients.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeIngredient(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Instructions *</label>
              <Button type="button" variant="outline" size="sm" onClick={addInstruction}>
                <Plus className="h-4 w-4 mr-1" />
                Add Step
              </Button>
            </div>
            <div className="space-y-2">
              {formData.instructions.map((instruction, index) => (
                <div key={index} className="flex space-x-2">
                  <div className="flex items-start space-x-2 flex-1">
                    <Badge variant="outline" className="mt-2 min-w-fit">
                      {index + 1}
                    </Badge>
                    <Textarea
                      placeholder="Describe this step in detail..."
                      value={instruction}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        updateInstruction(index, e.target.value)
                      }
                      className="flex-1"
                      rows={2}
                    />
                  </div>
                  {formData.instructions.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeInstruction(index)}
                      className="mt-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Creating Recipe...' : 'Share Recipe 🎉'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
