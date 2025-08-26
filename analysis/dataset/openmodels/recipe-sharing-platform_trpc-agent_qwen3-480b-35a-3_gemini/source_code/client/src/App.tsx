import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RecipeCard } from '@/components/RecipeCard';
import { RecipeForm } from '@/components/RecipeForm';
import { trpc } from '@/utils/trpc';
import type { Recipe, Category, CreateRecipeInput, SearchRecipesInput } from '../../server/src/schema';

// Extended recipe type to include category IDs for display purposes
interface RecipeWithCategoryIds extends Recipe {
  categoryIds?: number[];
}

function App() {
  const [recipes, setRecipes] = useState<RecipeWithCategoryIds[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadRecipes = useCallback(async () => {
    try {
      const result = await trpc.getRecipes.query();
      // Since recipes don't have categoryIds in the schema, we'll add an empty array
      // In a real implementation, this would be populated from the database
      const recipesWithCategoryIds = result.map(recipe => ({
        ...recipe,
        categoryIds: [] // Placeholder - would be populated in real implementation
      }));
      setRecipes(recipesWithCategoryIds);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.getCategories.query();
      setCategories(result);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  useEffect(() => {
    loadRecipes();
    loadCategories();
  }, [loadRecipes, loadCategories]);

  const handleSearch = async () => {
    try {
      const searchParams: SearchRecipesInput = {
        query: searchQuery || undefined,
        categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined
      };
      const result = await trpc.searchRecipes.query(searchParams);
      // Add categoryIds placeholder for display
      const recipesWithCategoryIds = result.map(recipe => ({
        ...recipe,
        categoryIds: selectedCategoryIds // Use the searched categories for display
      }));
      setRecipes(recipesWithCategoryIds);
    } catch (error) {
      console.error('Failed to search recipes:', error);
    }
  };

  const handleCreateRecipe = async (data: CreateRecipeInput) => {
    try {
      setIsLoading(true);
      const result = await trpc.createRecipe.mutate(data);
      // Add categoryIds for display
      const recipeWithCategoryIds = {
        ...result,
        categoryIds: data.categoryIds
      };
      setRecipes(prev => [...prev, recipeWithCategoryIds]);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create recipe:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 py-8">
      <div className="container mx-auto px-4">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-amber-800 mb-2">Community Recipe Book</h1>
          <p className="text-lg text-amber-600">Share and discover delicious recipes from our community</p>
        </header>

        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search recipes by title, description, or ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="w-full md:w-64">
            <Select
              onValueChange={(value) => {
                if (value === 'all') {
                  setSelectedCategoryIds([]);
                } else {
                  setSelectedCategoryIds([parseInt(value)]);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSearch} className="bg-amber-600 hover:bg-amber-700">
            Search
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700">Add Recipe</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Recipe</DialogTitle>
              </DialogHeader>
              <RecipeForm onSubmit={handleCreateRecipe} isLoading={isLoading} categories={categories} />
            </DialogContent>
          </Dialog>
        </div>

        {recipes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-amber-600 text-lg">No recipes found. Be the first to share one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} categories={categories} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
