import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Heart, Clock, Users, ChefHat, Edit, Trash2 } from 'lucide-react';
// Using type-only imports from server schema
import type { RecipeWithUser, User } from '../../../server/src/schema';

interface RecipeCardProps {
  recipe: RecipeWithUser;
  currentUser: User;
  onToggleFavorite: (recipeId: number, isFavorite: boolean) => void;
  onEdit?: (recipe: RecipeWithUser) => void;
  onDelete?: (recipeId: number) => void;
  showAuthor?: boolean;
  showActions?: boolean;
}

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

export function RecipeCard({ 
  recipe, 
  currentUser, 
  onToggleFavorite, 
  onEdit, 
  onDelete, 
  showAuthor = false,
  showActions = false 
}: RecipeCardProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const isFavorite = recipe.is_favorite === true;
  const isOwner = recipe.user_id === currentUser.id;
  
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  const truncateDescription = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-2 flex-1">
            {recipe.title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleFavorite(recipe.id, isFavorite)}
            className={`ml-2 ${
              isFavorite 
                ? 'text-red-500 hover:text-red-600' 
                : 'text-gray-400 hover:text-red-500'
            }`}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Badge variant="outline" className="text-xs">
            {getCategoryEmoji(recipe.category)} {formatCategory(recipe.category)}
          </Badge>
          {showAuthor && (
            <span className="text-xs">by {recipe.user_name}</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-3">
        {recipe.description && (
          <div>
            <p className="text-sm text-gray-600">
              {showFullDescription 
                ? recipe.description 
                : truncateDescription(recipe.description, 100)
              }
              {recipe.description.length > 100 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="ml-1 text-orange-500 hover:text-orange-600 text-xs font-medium"
                >
                  {showFullDescription ? 'show less' : 'read more'}
                </button>
              )}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          {recipe.prep_time_minutes && (
            <div className="flex items-center space-x-1">
              <ChefHat className="h-3 w-3" />
              <span>Prep: {recipe.prep_time_minutes}min</span>
            </div>
          )}
          {recipe.cook_time_minutes && (
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Cook: {recipe.cook_time_minutes}min</span>
            </div>
          )}
          {recipe.servings && (
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>Serves {recipe.servings}</span>
            </div>
          )}
          {totalTime > 0 && (
            <div className="flex items-center space-x-1 font-medium text-orange-600">
              <Clock className="h-3 w-3" />
              <span>Total: {totalTime}min</span>
            </div>
          )}
        </div>

        <div className="space-y-2 flex-1">
          <div>
            <button
              onClick={() => setShowIngredients(!showIngredients)}
              className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
            >
              🥘 Ingredients ({recipe.ingredients.length}) 
              <span className="ml-1">
                {showIngredients ? '▼' : '▶'}
              </span>
            </button>
            {showIngredients && (
              <ul className="mt-2 text-xs text-gray-600 space-y-1 max-h-24 overflow-y-auto">
                {recipe.ingredients.map((ingredient: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    {ingredient}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
            >
              📝 Instructions ({recipe.instructions.length} steps)
              <span className="ml-1">
                {showInstructions ? '▼' : '▶'}
              </span>
            </button>
            {showInstructions && (
              <ol className="mt-2 text-xs text-gray-600 space-y-2 max-h-32 overflow-y-auto">
                {recipe.instructions.map((instruction: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-orange-500 font-medium mr-2 min-w-[1rem]">
                      {index + 1}.
                    </span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {showActions && isOwner && (
          <div className="flex space-x-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(recipe)}
              className="flex-1"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{recipe.title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete?.(recipe.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        <div className="text-xs text-gray-400 pt-2 border-t">
          Created {recipe.created_at.toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}
