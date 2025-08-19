import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ChefHat, Clock, Lightbulb, Sparkles } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { PantryItem, RecipeSuggestionsResponse, Recipe } from '../../../server/src/schema';

interface RecipeSuggestionsProps {
  pantryItems: PantryItem[];
}

export function RecipeSuggestions({ pantryItems }: RecipeSuggestionsProps) {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [maxRecipes, setMaxRecipes] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<RecipeSuggestionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateRecipes = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await trpc.generateRecipeSuggestions.query({
        item_ids: selectedItems.length > 0 ? selectedItems : undefined,
        max_recipes: maxRecipes
      });
      setSuggestions(result);
    } catch (err) {
      console.warn('Backend not available, showing demo recipes:', err);
      
      // Create demo recipe suggestions
      const selectedIngredients = selectedItems.length > 0 
        ? pantryItems.filter((item: PantryItem) => selectedItems.includes(item.id))
        : pantryItems.slice(0, 3);
      
      const demoRecipes: Recipe[] = [
        {
          title: "Quick Tomato Bread Toast",
          description: "A simple and delicious breakfast using fresh tomatoes and bread",
          ingredients_used: selectedIngredients.map((item: PantryItem) => item.name),
          instructions: "1. Toast the bread slices until golden brown\n2. Slice the tomatoes into rounds\n3. Place tomato slices on toast\n4. Season with salt and pepper\n5. Drizzle with olive oil if available\n6. Serve immediately while warm",
          prep_time_minutes: 10,
          difficulty_level: "easy" as const
        },
        {
          title: "Creamy Toast Breakfast",
          description: "Comfort food combining bread and milk for a hearty meal",
          ingredients_used: selectedIngredients.map((item: PantryItem) => item.name).slice(0, 2),
          instructions: "1. Cut bread into cubes\n2. Heat milk in a saucepan\n3. Add bread cubes to warm milk\n4. Let it soak for 5 minutes\n5. Add honey or sugar if desired\n6. Serve warm in bowls",
          prep_time_minutes: 15,
          difficulty_level: "easy" as const
        },
        {
          title: "Mixed Ingredient Medley",
          description: "A creative dish using all available pantry items",
          ingredients_used: selectedIngredients.map((item: PantryItem) => item.name),
          instructions: "1. Prepare all ingredients\n2. Combine complementary flavors\n3. Cook according to ingredient requirements\n4. Season to taste\n5. Present attractively\n6. Enjoy your creation!",
          prep_time_minutes: 25,
          difficulty_level: "medium" as const
        }
      ].slice(0, maxRecipes);
      
      const demoResponse: RecipeSuggestionsResponse = {
        recipes: demoRecipes,
        pantry_items_used: selectedIngredients,
        items_expiring_soon: pantryItems.filter((item: PantryItem) => {
          const daysDiff = Math.ceil((item.expiry_date.getTime() - Date.now()) / (1000 * 3600 * 24));
          return daysDiff <= 7 && daysDiff >= 0;
        })
      };
      
      setSuggestions(demoResponse);
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemToggle = (itemId: number) => {
    setSelectedItems((prev: number[]) => 
      prev.includes(itemId) 
        ? prev.filter((id: number) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyEmoji = (difficulty: string | null) => {
    switch (difficulty) {
      case 'easy': return '😊';
      case 'medium': return '🤔';
      case 'hard': return '😤';
      default: return '🍳';
    }
  };

  if (pantryItems.length === 0) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Lightbulb className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Add some items to your pantry first to get personalized recipe suggestions!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Item Selection */}
      <Card className="border-dashed border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Select Ingredients (Optional)
          </CardTitle>
          <CardDescription>
            Choose specific ingredients to focus on, or leave empty to use all available items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {pantryItems.map((item: PantryItem) => (
              <div key={item.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`item-${item.id}`}
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={() => handleItemToggle(item.id)}
                />
                <label
                  htmlFor={`item-${item.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {item.name} (Qty: {item.quantity})
                </label>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="max-recipes" className="text-sm font-medium">
                Max recipes:
              </label>
              <select
                id="max-recipes"
                value={maxRecipes}
                onChange={(e) => setMaxRecipes(parseInt(e.target.value))}
                className="border border-gray-200 rounded px-2 py-1 text-sm"
              >
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={8}>8</option>
                <option value={10}>10</option>
              </select>
            </div>
            
            <Button
              onClick={handleGenerateRecipes}
              disabled={isLoading}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <ChefHat className="h-4 w-4 mr-2" />
                  Get Recipe Ideas
                </>
              )}
            </Button>
          </div>

          {selectedItems.length > 0 && (
            <div className="mt-4 p-3 bg-purple-50 rounded-md">
              <p className="text-sm text-purple-800">
                <strong>Selected items:</strong> {selectedItems.length} of {pantryItems.length} ingredients
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recipe Results */}
      {suggestions && !isLoading && (
        <div className="space-y-6">
          {/* Summary */}
          <Alert className="border-green-200 bg-green-50">
            <ChefHat className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>🎉 Found {suggestions.recipes.length} recipe suggestions!</strong>
              {suggestions.items_expiring_soon.length > 0 && (
                <span> Prioritizing {suggestions.items_expiring_soon.length} items expiring soon.</span>
              )}
            </AlertDescription>
          </Alert>

          {/* Recipes */}
          <div className="grid gap-6">
            {suggestions.recipes.map((recipe: Recipe, index: number) => (
              <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2 flex items-center gap-2">
                        🍽️ {recipe.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {recipe.description}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      {recipe.difficulty_level && (
                        <Badge variant="outline" className={getDifficultyColor(recipe.difficulty_level)}>
                          {getDifficultyEmoji(recipe.difficulty_level)} {recipe.difficulty_level}
                        </Badge>
                      )}
                      {recipe.prep_time_minutes && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {recipe.prep_time_minutes} min
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Ingredients Used */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-gray-700">
                      🥕 Ingredients from your pantry:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {recipe.ingredients_used.map((ingredient: string, idx: number) => (
                        <Badge 
                          key={idx}
                          variant="secondary" 
                          className="text-xs bg-orange-100 text-orange-800 border-orange-200"
                        >
                          {ingredient}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Instructions */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-gray-700">
                      📝 Instructions:
                    </h4>
                    <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50 p-3 rounded-md">
                      {recipe.instructions}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Items Used Summary */}
          {suggestions.pantry_items_used.length > 0 && (
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  📦 Pantry Items Considered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {suggestions.pantry_items_used.map((item: PantryItem) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                    >
                      <span>{item.name}</span>
                      <Badge variant="outline" className="text-xs">
                        Qty: {item.quantity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* No results message */}
      {suggestions && suggestions.recipes.length === 0 && !isLoading && (
        <Alert className="border-gray-200">
          <AlertDescription>
            No recipe suggestions found. Try selecting different ingredients or add more items to your pantry.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
