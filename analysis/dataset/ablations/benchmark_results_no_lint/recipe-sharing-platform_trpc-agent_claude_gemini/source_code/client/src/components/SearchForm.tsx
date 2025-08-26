import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Search, RotateCcw } from 'lucide-react';
// Using type-only imports from server schema
import type { SearchRecipesInput, RecipeCategory } from '../../../server/src/schema';

interface SearchFormProps {
  onSearch: (searchData: SearchRecipesInput) => void;
  onReset: () => void;
  isLoading?: boolean;
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

const getCategoryEmoji = (category: string): string => {
  const emojiMap: Record<string, string> = {
    appetizer: '🥗',
    main_course: '🍽️',
    dessert: '🍰',
    beverage: '🥤',
    breakfast: '🍳',
    lunch: '🥙',
    dinner: '🍲',
    snack: '🍪',
    salad: '🥬',
    soup: '🍜',
    vegetarian: '🥕',
    vegan: '🌱',
    gluten_free: '🌾'
  };
  return emojiMap[category] || '🍽️';
};

export function SearchForm({ onSearch, onReset, isLoading = false }: SearchFormProps) {
  const [searchData, setSearchData] = useState<SearchRecipesInput>({
    query: '',
    ingredients: [],
    categories: []
  });
  
  const [newIngredient, setNewIngredient] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const addIngredient = () => {
    if (newIngredient.trim() && !searchData.ingredients?.includes(newIngredient.trim())) {
      setSearchData((prev: SearchRecipesInput) => ({
        ...prev,
        ingredients: [...(prev.ingredients || []), newIngredient.trim()]
      }));
      setNewIngredient('');
    }
  };

  const removeIngredient = (ingredient: string) => {
    setSearchData((prev: SearchRecipesInput) => ({
      ...prev,
      ingredients: prev.ingredients?.filter((ing: string) => ing !== ingredient) || []
    }));
  };

  const addCategory = (category: RecipeCategory) => {
    if (!searchData.categories?.includes(category)) {
      setSearchData((prev: SearchRecipesInput) => ({
        ...prev,
        categories: [...(prev.categories || []), category]
      }));
    }
    setSelectedCategory('');
  };

  const removeCategory = (category: RecipeCategory) => {
    setSearchData((prev: SearchRecipesInput) => ({
      ...prev,
      categories: prev.categories?.filter((cat: RecipeCategory) => cat !== category) || []
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create clean search data without empty arrays
    const cleanSearchData: SearchRecipesInput = {};
    
    if (searchData.query && searchData.query.trim()) {
      cleanSearchData.query = searchData.query.trim();
    }
    
    if (searchData.ingredients && searchData.ingredients.length > 0) {
      cleanSearchData.ingredients = searchData.ingredients;
    }
    
    if (searchData.categories && searchData.categories.length > 0) {
      cleanSearchData.categories = searchData.categories;
    }
    
    onSearch(cleanSearchData);
  };

  const handleReset = () => {
    setSearchData({
      query: '',
      ingredients: [],
      categories: []
    });
    setNewIngredient('');
    setSelectedCategory('');
    onReset();
  };

  const hasActiveFilters = 
    (searchData.query && searchData.query.trim()) ||
    (searchData.ingredients && searchData.ingredients.length > 0) ||
    (searchData.categories && searchData.categories.length > 0);

  return (
    <form onSubmit={handleSearch} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="search-query">Search by Recipe Name</Label>
        <Input
          id="search-query"
          value={searchData.query || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchData((prev: SearchRecipesInput) => ({ 
              ...prev, 
              query: e.target.value 
            }))
          }
          placeholder="Enter recipe name (e.g., chocolate cake)"
        />
      </div>

      <div className="space-y-2">
        <Label>Filter by Ingredients</Label>
        <div className="flex space-x-2">
          <Input
            value={newIngredient}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              setNewIngredient(e.target.value)
            }
            placeholder="Enter ingredient (e.g., chicken, tomatoes)"
            onKeyPress={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addIngredient();
              }
            }}
          />
          <Button type="button" onClick={addIngredient} size="icon" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {searchData.ingredients && searchData.ingredients.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {searchData.ingredients.map((ingredient: string) => (
              <Badge key={ingredient} variant="secondary" className="text-sm">
                🥘 {ingredient}
                <button
                  type="button"
                  onClick={() => removeIngredient(ingredient)}
                  className="ml-2 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Filter by Categories</Label>
        <Select value={selectedCategory} onValueChange={(value: string) => {
          if (value) {
            addCategory(value as RecipeCategory);
          }
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Select category to add" />
          </SelectTrigger>
          <SelectContent>
            {RECIPE_CATEGORIES
              .filter((category: RecipeCategory) => 
                !searchData.categories?.includes(category)
              )
              .map((category: RecipeCategory) => (
                <SelectItem key={category} value={category}>
                  {getCategoryEmoji(category)} {formatCategory(category)}
                </SelectItem>
              ))
            }
          </SelectContent>
        </Select>
        {searchData.categories && searchData.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {searchData.categories.map((category: RecipeCategory) => (
              <Badge key={category} variant="secondary" className="text-sm">
                {getCategoryEmoji(category)} {formatCategory(category)}
                <button
                  type="button"
                  onClick={() => removeCategory(category)}
                  className="ml-2 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex space-x-2 pt-4">
        <Button 
          type="submit" 
          className="bg-orange-500 hover:bg-orange-600 flex-1" 
          disabled={isLoading}
        >
          <Search className="h-4 w-4 mr-2" />
          {isLoading ? 'Searching...' : 'Search Recipes'}
        </Button>
        
        {hasActiveFilters && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="text-sm text-gray-600 bg-orange-50 p-3 rounded-md">
          <strong>Active filters:</strong>
          <ul className="mt-1 space-y-1">
            {searchData.query && (
              <li>• Recipe name contains: "{searchData.query}"</li>
            )}
            {searchData.ingredients && searchData.ingredients.length > 0 && (
              <li>• Must contain ingredients: {searchData.ingredients.join(', ')}</li>
            )}
            {searchData.categories && searchData.categories.length > 0 && (
              <li>
                • Categories: {searchData.categories.map(formatCategory).join(', ')}
              </li>
            )}
          </ul>
        </div>
      )}
    </form>
  );
}
