import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ClockIcon, ChefHatIcon } from 'lucide-react';
import type { RecipeSuggestion } from '../../../server/src/schema';

interface RecipeSuggestionsProps {
  recipes: RecipeSuggestion[];
  isLoading: boolean;
  onGenerate: () => void;
  pantryItems: string[];
}

export function RecipeSuggestions({ recipes, isLoading, onGenerate, pantryItems }: RecipeSuggestionsProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <ChefHatIcon className="mr-2 h-5 w-5" />
          Recipe Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-8">
            <ChefHatIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No recipes yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Based on your pantry items, we can suggest recipes.
            </p>
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Your pantry items:</h4>
              <div className="flex flex-wrap gap-2 justify-center">
                {pantryItems.map((item, i) => (
                  <Badge key={i} variant="secondary">
                    {item}
                  </Badge>
                ))}
              </div>
              <Button 
                className="w-full mt-4" 
                onClick={onGenerate}
              >
                Generate Recipes
              </Button>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-4">
              {recipes.map((recipe) => (
                <Card key={recipe.id} className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{recipe.title}</h3>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-3">
                    <ClockIcon className="mr-1 h-4 w-4" />
                    <span>{recipe.preparation_time} mins</span>
                  </div>
                  <div className="mb-3">
                    <h4 className="text-sm font-medium mb-1">Ingredients:</h4>
                    <ul className="text-sm list-disc pl-5 space-y-1">
                      {recipe.ingredients.map((ingredient, i) => (
                        <li key={i}>{ingredient}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Instructions:</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {recipe.instructions}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
