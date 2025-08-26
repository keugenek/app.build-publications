import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, X, Filter } from 'lucide-react';
import type { SearchRecipesInput, RecipeCategory } from '../../../server/src/schema';

interface SearchFiltersProps {
  filters: SearchRecipesInput;
  onFiltersChange: (filters: SearchRecipesInput) => void;
  onSearch: () => void;
}

const RECIPE_CATEGORIES: RecipeCategory[] = [
  'breakfast', 'lunch', 'dinner', 'appetizer', 'dessert', 'snack', 'beverage',
  'salad', 'soup', 'main_course', 'side_dish', 'vegetarian', 'vegan',
  'gluten_free', 'low_carb', 'keto', 'healthy', 'comfort_food', 'international'
];

type DifficultyOption = 'easy' | 'medium' | 'hard';

export function SearchFilters({ filters, onFiltersChange, onSearch }: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCategoryName = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const toggleCategory = (category: RecipeCategory) => {
    const categories = filters.categories || [];
    const newCategories = categories.includes(category)
      ? categories.filter((c) => c !== category)
      : [...categories, category];
    
    onFiltersChange({
      ...filters,
      categories: newCategories.length > 0 ? newCategories : undefined
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
    onSearch();
  };

  const hasActiveFilters = () => {
    return !!(
      filters.categories?.length ||
      filters.difficulty ||
      filters.max_prep_time ||
      filters.max_cook_time ||
      filters.author_id
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.categories?.length) count++;
    if (filters.difficulty) count++;
    if (filters.max_prep_time) count++;
    if (filters.max_cook_time) count++;
    if (filters.author_id) count++;
    return count;
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Advanced Filters</span>
            {hasActiveFilters() && (
              <Badge variant="secondary" className="ml-1">
                {getActiveFilterCount()}
              </Badge>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        {hasActiveFilters() && (
          <Button variant="ghost" onClick={clearAllFilters} className="text-sm">
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <CollapsibleContent>
        <Card className="mt-4">
          <CardContent className="pt-6 space-y-6">
            {/* Categories Filter */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Categories</Label>
              <div className="flex flex-wrap gap-2">
                {RECIPE_CATEGORIES.map((category) => (
                  <Badge
                    key={category}
                    variant={filters.categories?.includes(category) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-orange-100 transition-colors"
                    onClick={() => toggleCategory(category)}
                  >
                    {formatCategoryName(category)}
                  </Badge>
                ))}
              </div>
              {filters.categories?.length && (
                <p className="text-sm text-gray-500 mt-2">
                  {filters.categories.length} category(ies) selected
                </p>
              )}
            </div>

            {/* Time and Difficulty Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="difficulty" className="text-sm font-medium">Difficulty</Label>
                <Select
                  value={filters.difficulty || 'all'}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      difficulty: value && value !== 'all' ? value as DifficultyOption : undefined
                    })
                  }
                >
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="Any difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any difficulty</SelectItem>
                    <SelectItem value="easy">🟢 Easy</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="hard">🔴 Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="max_prep" className="text-sm font-medium">Max Prep Time (minutes)</Label>
                <Input
                  id="max_prep"
                  type="number"
                  value={filters.max_prep_time || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onFiltersChange({
                      ...filters,
                      max_prep_time: parseInt(e.target.value) || undefined
                    })
                  }
                  placeholder="e.g. 30"
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="max_cook" className="text-sm font-medium">Max Cook Time (minutes)</Label>
                <Input
                  id="max_cook"
                  type="number"
                  value={filters.max_cook_time || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onFiltersChange({
                      ...filters,
                      max_cook_time: parseInt(e.target.value) || undefined
                    })
                  }
                  placeholder="e.g. 60"
                  min="0"
                />
              </div>
            </div>

            {/* Quick Time Filters */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Quick Time Filters</Label>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-orange-100 transition-colors"
                  onClick={() => onFiltersChange({ ...filters, max_prep_time: 15 })}
                >
                  ⚡ Quick Prep (≤15 min)
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-orange-100 transition-colors"
                  onClick={() => onFiltersChange({ ...filters, max_cook_time: 30 })}
                >
                  🔥 Fast Cook (≤30 min)
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-orange-100 transition-colors"
                  onClick={() => onFiltersChange({ 
                    ...filters, 
                    max_prep_time: 15, 
                    max_cook_time: 30 
                  })}
                >
                  ⏰ Quick Meal (≤45 min total)
                </Badge>
              </div>
            </div>

            {/* Apply Filters Button */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={clearAllFilters} disabled={!hasActiveFilters()}>
                Clear Filters
              </Button>
              <Button onClick={onSearch}>
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
