import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Plus } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { User, CreateRecipeInput, RecipeWithDetails, RecipeCategory } from '../../../server/src/schema';

interface CreateRecipeFormProps {
  user: User;
  onRecipeCreated: (recipe: RecipeWithDetails) => void;
}

const RECIPE_CATEGORIES = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Dessert',
  'Appetizer',
  'Main Course',
  'Vegetarian',
  'Vegan',
  'Gluten-Free'
] as const;

export function CreateRecipeForm({ user, onRecipeCreated }: CreateRecipeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<CreateRecipeInput>({
    title: '',
    description: '',
    instructions: '',
    author_id: user.id,
    ingredients: [{ name: '', quantity: '', unit: null }],
    categories: []
  });

  const addIngredient = () => {
    setFormData((prev: CreateRecipeInput) => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', quantity: '', unit: null }]
    }));
  };

  const removeIngredient = (index: number) => {
    if (formData.ingredients.length > 1) {
      setFormData((prev: CreateRecipeInput) => ({
        ...prev,
        ingredients: prev.ingredients.filter((_, i) => i !== index)
      }));
    }
  };

  const updateIngredient = (index: number, field: string, value: string) => {
    setFormData((prev: CreateRecipeInput) => ({
      ...prev,
      ingredients: prev.ingredients.map((ingredient, i) => {
        if (i === index) {
          return {
            ...ingredient,
            [field]: field === 'unit' ? (value || null) : value
          };
        }
        return ingredient;
      })
    }));
  };

  const addCategory = (category: RecipeCategory) => {
    if (!formData.categories.includes(category)) {
      setFormData((prev: CreateRecipeInput) => ({
        ...prev,
        categories: [...prev.categories, category]
      }));
    }
  };

  const removeCategory = (category: RecipeCategory) => {
    setFormData((prev: CreateRecipeInput) => ({
      ...prev,
      categories: prev.categories.filter((c: RecipeCategory) => c !== category)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validate ingredients
    const validIngredients = formData.ingredients.filter(
      (ing) => ing.name.trim() && ing.quantity.trim()
    );

    if (validIngredients.length === 0) {
      setError('Please add at least one complete ingredient.');
      setIsLoading(false);
      return;
    }

    if (formData.categories.length === 0) {
      setError('Please select at least one category.');
      setIsLoading(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        ingredients: validIngredients
      };

      const newRecipe = await trpc.createRecipe.mutate(submitData);
      setSuccess('Recipe created successfully! 🎉');
      onRecipeCreated(newRecipe);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        instructions: '',
        author_id: user.id,
        ingredients: [{ name: '', quantity: '', unit: null }],
        categories: []
      });
    } catch (error) {
      setError('Failed to create recipe. Please try again.');
      console.error('Recipe creation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">✨</span>
          Share Your Recipe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Recipe Title</Label>
              <Input
                id="title"
                placeholder="Delicious Chocolate Cake"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateRecipeInput) => ({ ...prev, title: e.target.value }))
                }
                required
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categories">Categories</Label>
              <Select onValueChange={(value: string) => addCategory(value as RecipeCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select categories..." />
                </SelectTrigger>
                <SelectContent>
                  {RECIPE_CATEGORIES.map((category) => (
                    <SelectItem 
                      key={category} 
                      value={category}
                      disabled={formData.categories.includes(category)}
                    >
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {formData.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.categories.map((category: RecipeCategory) => (
                    <Badge key={category} variant="secondary" className="flex items-center gap-1">
                      {category}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeCategory(category)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of your recipe..."
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreateRecipeInput) => ({ ...prev, description: e.target.value }))
              }
              required
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Ingredients</Label>
              <Button type="button" onClick={addIngredient} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Ingredient
              </Button>
            </div>
            
            <div className="space-y-3">
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder="Ingredient name"
                    value={ingredient.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateIngredient(index, 'name', e.target.value)
                    }
                    className="flex-1"
                  />
                  <Input
                    placeholder="Quantity"
                    value={ingredient.quantity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateIngredient(index, 'quantity', e.target.value)
                    }
                    className="w-24"
                  />
                  <Input
                    placeholder="Unit"
                    value={ingredient.unit || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateIngredient(index, 'unit', e.target.value)
                    }
                    className="w-20"
                  />
                  {formData.ingredients.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      variant="outline"
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Step-by-step cooking instructions..."
              value={formData.instructions}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreateRecipeInput) => ({ ...prev, instructions: e.target.value }))
              }
              required
              rows={6}
            />
          </div>

          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-orange-500 hover:bg-orange-600"
            size="lg"
          >
            {isLoading ? 'Creating Recipe...' : 'Create Recipe'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
