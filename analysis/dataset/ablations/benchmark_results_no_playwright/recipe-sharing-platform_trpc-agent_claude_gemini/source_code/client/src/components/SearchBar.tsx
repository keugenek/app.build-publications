import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Filter } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SearchBarProps {
  onSearch: (query: string, categories: string[], ingredients: string[]) => void;
  isLoading: boolean;
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

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const handleSearch = () => {
    onSearch(query.trim(), selectedCategories, selectedIngredients);
  };

  const handleClearAll = () => {
    setQuery('');
    setSelectedCategories([]);
    setSelectedIngredients([]);
    setIngredientInput('');
    onSearch('', [], []);
  };

  const addCategory = (category: string) => {
    if (!selectedCategories.includes(category)) {
      const newCategories = [...selectedCategories, category];
      setSelectedCategories(newCategories);
    }
  };

  const removeCategory = (category: string) => {
    const newCategories = selectedCategories.filter((c: string) => c !== category);
    setSelectedCategories(newCategories);
  };

  const addIngredient = () => {
    const ingredient = ingredientInput.trim();
    if (ingredient && !selectedIngredients.includes(ingredient)) {
      setSelectedIngredients((prev: string[]) => [...prev, ingredient]);
      setIngredientInput('');
    }
  };

  const removeIngredient = (ingredient: string) => {
    setSelectedIngredients((prev: string[]) => prev.filter((ing: string) => ing !== ingredient));
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: 'search' | 'ingredient') => {
    if (e.key === 'Enter') {
      if (action === 'search') {
        handleSearch();
      } else if (action === 'ingredient') {
        addIngredient();
      }
    }
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedIngredients.length > 0 || query.trim();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Main search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search recipes by title or description..."
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyPress(e, 'search')}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading} className="bg-orange-500 hover:bg-orange-600">
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
            <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                      !
                    </Badge>
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
            {hasActiveFilters && (
              <Button onClick={handleClearAll} variant="outline" size="sm">
                Clear All
              </Button>
            )}
          </div>

          {/* Advanced filters */}
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <CollapsibleContent className="space-y-4 pt-2 border-t">
              {/* Categories filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Categories</label>
                <div className="flex flex-wrap gap-2">
                  <Select onValueChange={addCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Add category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {RECIPE_CATEGORIES.map((category) => (
                        <SelectItem 
                          key={category} 
                          value={category}
                          disabled={selectedCategories.includes(category)}
                        >
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedCategories.map((category: string) => (
                    <Badge key={category} variant="secondary" className="flex items-center gap-1">
                      {category}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeCategory(category)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Ingredients filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Ingredients</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add ingredient..."
                    value={ingredientInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIngredientInput(e.target.value)}
                    onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyPress(e, 'ingredient')}
                    className="flex-1"
                  />
                  <Button onClick={addIngredient} variant="outline" size="sm">
                    Add
                  </Button>
                </div>
                
                {selectedIngredients.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedIngredients.map((ingredient: string) => (
                      <Badge key={ingredient} variant="secondary" className="flex items-center gap-1">
                        {ingredient}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeIngredient(ingredient)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Active filters summary */}
          {hasActiveFilters && (
            <div className="text-sm text-gray-600">
              {query && <span>Searching for "{query}" • </span>}
              {selectedCategories.length > 0 && <span>{selectedCategories.length} categories • </span>}
              {selectedIngredients.length > 0 && <span>{selectedIngredients.length} ingredients • </span>}
              <button 
                onClick={handleSearch}
                className="text-orange-600 hover:text-orange-700 underline ml-1"
              >
                Update results
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
