import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { CreateRecipeInput } from '../../../server/src/schema';
import type { Category } from '../../../server/src/schema';

interface RecipeFormProps {
  onSubmit: (data: CreateRecipeInput) => void;
  isLoading: boolean;
  categories: Category[];
}

export function RecipeForm({ onSubmit, isLoading, categories }: RecipeFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState(['']);
  const [instructions, setInstructions] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  const addIngredientField = () => {
    setIngredients([...ingredients, '']);
  };

  const updateIngredient = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      const newIngredients = [...ingredients];
      newIngredients.splice(index, 1);
      setIngredients(newIngredients);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty ingredients
    const validIngredients = ingredients.filter(ing => ing.trim() !== '');
    
    if (validIngredients.length === 0) {
      alert('Please add at least one ingredient');
      return;
    }
    
    if (selectedCategoryIds.length === 0) {
      alert('Please select at least one category');
      return;
    }
    
    onSubmit({
      title,
      description,
      ingredients: validIngredients,
      instructions,
      categoryIds: selectedCategoryIds,
      imageUrl: imageUrl || null
    });
    
    // Reset form
    setTitle('');
    setDescription('');
    setIngredients(['']);
    setInstructions('');
    setImageUrl('');
    setSelectedCategoryIds([]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Recipe Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter recipe title"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of your recipe"
          required
        />
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium">Ingredients</label>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addIngredientField}
            className="text-xs"
          >
            + Add Ingredient
          </Button>
        </div>
        <div className="space-y-2">
          {ingredients.map((ingredient, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={ingredient}
                onChange={(e) => updateIngredient(index, e.target.value)}
                placeholder={`Ingredient ${index + 1}`}
                required={index === 0} // First ingredient is required
              />
              {ingredients.length > 1 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => removeIngredient(index)}
                  className="text-destructive hover:text-destructive"
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Instructions</label>
        <Textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Step-by-step instructions"
          rows={5}
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Image URL (optional)</label>
        <Input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Categories</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center space-x-1 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCategoryIds.includes(category.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedCategoryIds([...selectedCategoryIds, category.id]);
                  } else {
                    setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== category.id));
                  }
                }}
                className="rounded text-amber-600"
              />
              <span className="text-sm">{category.name}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            // Reset form
            setTitle('');
            setDescription('');
            setIngredients(['']);
            setInstructions('');
            setImageUrl('');
            setSelectedCategoryIds([]);
          }}
        >
          Reset
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-amber-600 hover:bg-amber-700"
        >
          {isLoading ? 'Creating...' : 'Create Recipe'}
        </Button>
      </div>
    </form>
  );
}
