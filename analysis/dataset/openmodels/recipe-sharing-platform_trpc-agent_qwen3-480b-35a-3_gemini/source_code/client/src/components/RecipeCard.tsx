import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookmarkButton } from '@/components/BookmarkButton';
import type { Recipe } from '../../../server/src/schema';
import type { Category } from '../../../server/src/schema';

interface RecipeWithCategoryIds extends Recipe {
  categoryIds?: number[];
}

interface RecipeCardProps {
  recipe: RecipeWithCategoryIds;
  categories: Category[];
}

export function RecipeCard({ recipe, categories }: RecipeCardProps) {
  const recipeCategories = categories.filter(cat => 
    recipe.categoryIds?.includes(cat.id)
  );

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {recipe.imageUrl && (
        <div className="h-48 overflow-hidden">
          <img 
            src={recipe.imageUrl} 
            alt={recipe.title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl text-amber-800">{recipe.title}</CardTitle>
          <BookmarkButton recipeId={recipe.id} userId="user123" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-amber-700 mb-4">{recipe.description}</p>
        
        <div className="mb-4">
          <h3 className="font-semibold text-amber-800 mb-2">Ingredients:</h3>
          <ul className="list-disc pl-5 space-y-1">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index} className="text-amber-700">{ingredient}</li>
            ))}
          </ul>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {recipeCategories.map(category => (
            <Badge key={category.id} variant="secondary" className="bg-amber-100 text-amber-800">
              {category.name}
            </Badge>
          ))}
        </div>
        
        <div>
          <h3 className="font-semibold text-amber-800 mb-2">Instructions:</h3>
          <p className="text-amber-700 whitespace-pre-line">{recipe.instructions}</p>
        </div>
      </CardContent>
    </Card>
  );
}
