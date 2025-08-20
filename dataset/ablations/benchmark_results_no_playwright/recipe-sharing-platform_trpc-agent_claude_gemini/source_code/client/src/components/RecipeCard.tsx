import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, User, Clock } from 'lucide-react';
import type { RecipeWithDetails, User as UserType } from '../../../server/src/schema';

interface RecipeCardProps {
  recipe: RecipeWithDetails;
  isFavorite: boolean;
  onToggleFavorite: (recipe: RecipeWithDetails, isFavorite: boolean) => void;
  currentUser: UserType;
  isOwnRecipe?: boolean;
}

export function RecipeCard({ 
  recipe, 
  isFavorite, 
  onToggleFavorite, 
  isOwnRecipe = false 
}: RecipeCardProps) {
  const handleFavoriteClick = () => {
    onToggleFavorite(recipe, isFavorite);
  };

  return (
    <Card className="h-full flex flex-col transition-all duration-200 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold leading-tight line-clamp-2">
            {recipe.title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFavoriteClick}
            className="shrink-0 h-8 w-8 p-0"
          >
            <Heart 
              className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
            />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <User className="h-3 w-3" />
          <span>
            {isOwnRecipe ? 'You' : recipe.author_username}
          </span>
          <Clock className="h-3 w-3 ml-2" />
          <span>{recipe.created_at.toLocaleDateString()}</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        <p className="text-gray-600 text-sm line-clamp-3 flex-1">
          {recipe.description}
        </p>

        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-sm mb-2 text-gray-700">Categories</h4>
            <div className="flex flex-wrap gap-1">
              {recipe.categories.map((category: string) => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2 text-gray-700">
              Ingredients ({recipe.ingredients.length})
            </h4>
            <div className="text-xs text-gray-600 space-y-1">
              {recipe.ingredients.slice(0, 3).map((ingredient) => (
                <div key={ingredient.id} className="flex justify-between">
                  <span className="truncate">{ingredient.name}</span>
                  <span className="shrink-0 ml-2">
                    {ingredient.quantity} {ingredient.unit || ''}
                  </span>
                </div>
              ))}
              {recipe.ingredients.length > 3 && (
                <div className="text-gray-400 italic">
                  +{recipe.ingredients.length - 3} more ingredients
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
