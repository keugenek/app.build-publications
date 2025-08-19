import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart, Clock, Users, ChefHat, X } from 'lucide-react';
import type { Recipe } from '../../../server/src/schema';

interface RecipeDetailProps {
  recipe: Recipe;
  authorName: string;
  isSaved: boolean;
  onSave?: () => void;
  onUnsave?: () => void;
  onClose: () => void;
  showSaveButton: boolean;
}

export function RecipeDetail({ 
  recipe, 
  authorName, 
  isSaved, 
  onSave, 
  onUnsave, 
  onClose, 
  showSaveButton 
}: RecipeDetailProps) {
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

  const getTotalTime = () => {
    const prep = recipe.prep_time_minutes || 0;
    const cook = recipe.cook_time_minutes || 0;
    return prep + cook;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <ScrollArea className="h-full">
          <div className="p-6">
            <DialogHeader className="space-y-4">
              <div className="flex items-start justify-between">
                <DialogTitle className="text-2xl font-bold text-gray-900 pr-4">
                  {recipe.title}
                </DialogTitle>
                <div className="flex items-center space-x-2 shrink-0">
                  {showSaveButton && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={isSaved ? onUnsave : onSave}
                      className="flex items-center space-x-2"
                    >
                      <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                      <span>{isSaved ? 'Saved' : 'Save'}</span>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Author and Date */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-sm">
                      {authorName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">by {authorName}</p>
                    <p className="text-sm text-gray-500">
                      Created on {recipe.created_at.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {recipe.description && (
                <p className="text-gray-700 leading-relaxed">
                  {recipe.description}
                </p>
              )}
            </DialogHeader>

            <Separator className="my-6" />

            {/* Recipe Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {recipe.prep_time_minutes && (
                <div className="flex items-center space-x-2 p-3 bg-orange-50 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Prep Time</p>
                    <p className="text-sm text-gray-600">{recipe.prep_time_minutes} min</p>
                  </div>
                </div>
              )}
              
              {recipe.cook_time_minutes && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg">
                  <ChefHat className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Cook Time</p>
                    <p className="text-sm text-gray-600">{recipe.cook_time_minutes} min</p>
                  </div>
                </div>
              )}

              {getTotalTime() > 0 && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Total Time</p>
                    <p className="text-sm text-gray-600">{getTotalTime()} min</p>
                  </div>
                </div>
              )}

              {recipe.servings && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Servings</p>
                    <p className="text-sm text-gray-600">{recipe.servings}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Difficulty and Categories */}
            <div className="flex flex-wrap gap-4 items-center mb-6">
              {recipe.difficulty && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Difficulty</p>
                  <Badge className={getDifficultyColor(recipe.difficulty)}>
                    {getDifficultyEmoji(recipe.difficulty)} {recipe.difficulty}
                  </Badge>
                </div>
              )}

              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 mb-2">Categories</p>
                <div className="flex flex-wrap gap-1">
                  {recipe.categories.map((category) => (
                    <Badge key={category} variant="outline">
                      {formatCategoryName(category)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Ingredients and Instructions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Ingredients */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  🥬 Ingredients ({recipe.ingredients.length})
                </h3>
                <div className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-start space-x-3 p-2 bg-gray-50 rounded">
                      <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      </div>
                      <span className="text-gray-700">{ingredient}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  📝 Instructions ({recipe.instructions.length} steps)
                </h3>
                <div className="space-y-4">
                  {recipe.instructions.map((instruction, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-7 h-7 bg-orange-500 text-white text-sm font-semibold rounded-full flex items-center justify-center">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 leading-relaxed pt-1">{instruction}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <Separator className="my-6" />
            <div className="flex items-center justify-between text-sm text-gray-500">
              <p>Last updated: {recipe.updated_at.toLocaleDateString()}</p>
              <div className="flex items-center space-x-4">
                {showSaveButton && (
                  <Button
                    variant="default"
                    onClick={isSaved ? onUnsave : onSave}
                    className="flex items-center space-x-2"
                  >
                    <Heart className={`h-4 w-4 ${isSaved ? 'fill-white' : ''}`} />
                    <span>{isSaved ? 'Remove from Saved' : 'Save Recipe'}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
