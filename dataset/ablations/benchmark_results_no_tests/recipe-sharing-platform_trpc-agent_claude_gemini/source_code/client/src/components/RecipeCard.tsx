import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Clock, Users, User, Eye } from 'lucide-react';
import type { RecipeWithDetails } from '../../../server/src/schema';

interface RecipeCardProps {
  recipe: RecipeWithDetails;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onViewDetails: () => void;
}

export function RecipeCard({ recipe, isFavorite, onToggleFavorite, onViewDetails }: RecipeCardProps) {
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  return (
    <Card className="recipe-card-hover cursor-pointer group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg group-hover:text-orange-600 transition-colors">
              {recipe.title}
            </CardTitle>
            <CardDescription className="flex items-center space-x-2 mt-1">
              <User className="h-3 w-3" />
              <span>by {recipe.user.username}</span>
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 favorite-btn"
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {recipe.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {recipe.description}
          </p>
        )}

        {/* Recipe Stats */}
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          {totalTime > 0 && (
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{totalTime}m</span>
            </div>
          )}
          {recipe.servings && (
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{recipe.servings} servings</span>
            </div>
          )}
        </div>

        {/* Categories */}
        {recipe.categories && recipe.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.categories.map((category) => (
              <Badge key={category.id} variant="secondary" className="text-xs">
                {category.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Ingredients Preview */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-700">Ingredients ({recipe.ingredients.length}):</p>
          <p className="text-xs text-gray-600 line-clamp-2">
            {recipe.ingredients.slice(0, 3).join(', ')}
            {recipe.ingredients.length > 3 && '...'}
          </p>
        </div>

        <Button 
          variant="outline" 
          className="w-full group-hover:bg-orange-50 group-hover:border-orange-200"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          View Recipe
        </Button>
      </CardContent>
    </Card>
  );
}
