import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Heart, Clock, Users, User, Calendar } from 'lucide-react';
import type { RecipeWithDetails, User as UserType } from '../../../server/src/schema';

interface RecipeDetailProps {
  recipe: RecipeWithDetails;
  currentUser: UserType | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onBack: () => void;
}

export function RecipeDetail({ recipe, currentUser, isFavorite, onToggleFavorite, onBack }: RecipeDetailProps) {
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Back Button */}
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Recipes
        </Button>

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{recipe.title}</CardTitle>
                <CardDescription className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>by {recipe.user.username}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{recipe.created_at.toLocaleDateString()}</span>
                  </div>
                </CardDescription>
              </div>
              {currentUser && (
                <Button
                  variant="outline"
                  onClick={onToggleFavorite}
                  className={`${isFavorite ? 'text-red-500 border-red-200 bg-red-50' : 'text-gray-500'}`}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </Button>
              )}
            </div>

            {recipe.description && (
              <p className="text-gray-700 text-lg leading-relaxed">
                {recipe.description}
              </p>
            )}

            {/* Recipe Stats */}
            <div className="flex flex-wrap items-center gap-6 text-sm">
              {recipe.prep_time_minutes && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">Prep:</span>
                  <span>{recipe.prep_time_minutes}m</span>
                </div>
              )}
              {recipe.cook_time_minutes && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-red-500" />
                  <span className="font-medium">Cook:</span>
                  <span>{recipe.cook_time_minutes}m</span>
                </div>
              )}
              {totalTime > 0 && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Total:</span>
                  <span>{totalTime}m</span>
                </div>
              )}
              {recipe.servings && (
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Serves:</span>
                  <span>{recipe.servings}</span>
                </div>
              )}
            </div>

            {/* Categories */}
            {recipe.categories && recipe.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recipe.categories.map((category) => (
                  <Badge key={category.id} variant="secondary">
                    {category.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Ingredients */}
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  🥘 Ingredients
                </h3>
                <Card>
                  <CardContent className="pt-4">
                    <ul className="space-y-2">
                      {recipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-sm flex items-center justify-center font-medium mt-0.5">
                            {index + 1}
                          </span>
                          <span className="text-gray-700">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Instructions */}
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  📋 Instructions
                </h3>
                <Card>
                  <CardContent className="pt-4">
                    <ol className="space-y-4">
                      {recipe.instructions.map((instruction, index) => (
                        <li key={index} className="flex items-start space-x-4">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-gray-700 leading-relaxed">{instruction}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator />

            {/* Recipe Footer */}
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">
                Enjoy your cooking! 👨‍🍳 Share your results with the community!
              </p>
              {currentUser && (
                <Button
                  onClick={onToggleFavorite}
                  className={`${isFavorite ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'}`}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? 'Remove from Favorites' : 'Save to Favorites'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
