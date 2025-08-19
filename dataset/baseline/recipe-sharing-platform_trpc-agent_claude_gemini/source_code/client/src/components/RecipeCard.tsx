import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, Clock, Users, ChefHat, Eye } from 'lucide-react';
import type { Recipe } from '../../../server/src/schema';

interface RecipeCardProps {
  recipe: Recipe;
  authorName: string;
  isSaved: boolean;
  onSave?: () => void;
  onUnsave?: () => void;
  onClick: () => void;
  showSaveButton: boolean;
}

export function RecipeCard({ 
  recipe, 
  authorName, 
  isSaved, 
  onSave, 
  onUnsave, 
  onClick, 
  showSaveButton 
}: RecipeCardProps) {
  const formatCategoryName = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyEmoji = (difficulty: string | null) => {
    switch (difficulty) {
      case 'easy': return '🟢';
      case 'medium': return '🟡';
      case 'hard': return '🔴';
      default: return '⚪';
    }
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved) {
      onUnsave?.();
    } else {
      onSave?.();
    }
  };

  return (
    <Card className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2 group-hover:text-orange-600 transition-colors">
            {recipe.title}
          </CardTitle>
          {showSaveButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveClick}
              className="shrink-0 ml-2"
            >
              <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {authorName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span>by {authorName}</span>
        </div>
      </CardHeader>

      <CardContent onClick={onClick} className="space-y-4">
        {recipe.description && (
          <p className="text-gray-600 text-sm line-clamp-2">
            {recipe.description}
          </p>
        )}

        {/* Recipe Stats */}
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          {recipe.prep_time_minutes && (
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Prep: {recipe.prep_time_minutes}m</span>
            </div>
          )}
          {recipe.cook_time_minutes && (
            <div className="flex items-center space-x-1">
              <ChefHat className="h-4 w-4" />
              <span>Cook: {recipe.cook_time_minutes}m</span>
            </div>
          )}
          {recipe.servings && (
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{recipe.servings}</span>
            </div>
          )}
        </div>

        {/* Difficulty */}
        {recipe.difficulty && (
          <div className="flex items-center space-x-2">
            <Badge className={getDifficultyColor(recipe.difficulty)}>
              {getDifficultyEmoji(recipe.difficulty)} {recipe.difficulty}
            </Badge>
          </div>
        )}

        {/* Categories */}
        <div className="flex flex-wrap gap-1">
          {recipe.categories.slice(0, 3).map((category) => {
            return (
              <Badge key={category} variant="outline" className="text-xs">
                {formatCategoryName(category)}
              </Badge>
            );
          })}
          {recipe.categories.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{recipe.categories.length - 3} more
            </Badge>
          )}
        </div>

        {/* View Details Button */}
        <div className="pt-2 border-t">
          <Button variant="outline" size="sm" className="w-full group-hover:bg-orange-50">
            <Eye className="h-4 w-4 mr-2" />
            View Recipe
          </Button>
        </div>

        {/* Created Date */}
        <div className="text-xs text-gray-400">
          Created {recipe.created_at.toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}
