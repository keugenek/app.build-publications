import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import { CreateRecipeForm } from '@/components/CreateRecipeForm';
import { RecipeCard } from '@/components/RecipeCard';
import { RecipeDetail } from '@/components/RecipeDetail';
import { UserSelector } from '@/components/UserSelector';
import { Search, Heart, ChefHat, Plus } from 'lucide-react';
import type { RecipeWithDetails, User, Category } from '../../server/src/schema';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recipes, setRecipes] = useState<RecipeWithDetails[]>([]);
  const [favorites, setFavorites] = useState<RecipeWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithDetails | null>(null);
  const [activeTab, setActiveTab] = useState('browse');
  const [isLoading, setIsLoading] = useState(false);

  // Load initial data
  const loadUsers = useCallback(async () => {
    try {
      const result = await trpc.getUsers.query();
      setUsers(result);
      // Auto-select first user if none selected
      if (result.length > 0 && !currentUser) {
        setCurrentUser(result[0]);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, [currentUser]);

  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.getCategories.query();
      setCategories(result);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  const loadRecipes = useCallback(async () => {
    try {
      setIsLoading(true);
      const categoryIds = selectedCategory === 'all' ? undefined : [parseInt(selectedCategory)];
      const result = await trpc.searchRecipes.query({
        query: searchQuery || undefined,
        category_ids: categoryIds,
        limit: 50
      });
      setRecipes(result);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  const loadFavorites = useCallback(async () => {
    if (!currentUser) return;
    try {
      const result = await trpc.getUserFavorites.query({
        user_id: currentUser.id,
        limit: 50
      });
      setFavorites(result);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    loadUsers();
    loadCategories();
  }, [loadUsers, loadCategories]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleToggleFavorite = async (recipe: RecipeWithDetails) => {
    if (!currentUser) return;

    try {
      const isFavorite = favorites.some(fav => fav.id === recipe.id);
      
      if (isFavorite) {
        await trpc.removeFavorite.mutate({
          user_id: currentUser.id,
          recipe_id: recipe.id
        });
        setFavorites(prev => prev.filter(fav => fav.id !== recipe.id));
      } else {
        await trpc.addFavorite.mutate({
          user_id: currentUser.id,
          recipe_id: recipe.id
        });
        // Reload favorites to get the complete recipe data
        loadFavorites();
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleRecipeCreated = (newRecipe: RecipeWithDetails) => {
    setRecipes(prev => [newRecipe, ...prev]);
    setActiveTab('browse');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadRecipes();
  };

  const isFavorite = (recipeId: number) => {
    return favorites.some(fav => fav.id === recipeId);
  };

  if (selectedRecipe) {
    return (
      <RecipeDetail
        recipe={selectedRecipe}
        currentUser={currentUser}
        isFavorite={isFavorite(selectedRecipe.id)}
        onToggleFavorite={() => handleToggleFavorite(selectedRecipe)}
        onBack={() => setSelectedRecipe(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <ChefHat className="h-8 w-8 text-orange-500" />
              <h1 className="text-4xl font-bold text-gray-800">
                Recipe Community 👨‍🍳
              </h1>
            </div>
            <UserSelector
              users={users}
              currentUser={currentUser}
              onUserChange={setCurrentUser}
            />
          </div>
          <p className="text-gray-600 text-lg">
            Discover amazing recipes, share your culinary creations, and build your favorite collection! 🍽️
          </p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="browse" className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Browse Recipes</span>
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Share Recipe</span>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center space-x-2">
              <Heart className="h-4 w-4" />
              <span>My Favorites ({favorites.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Browse Recipes Tab */}
          <TabsContent value="browse" className="space-y-6">
            {/* Search and Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Find Recipes</span>
                </CardTitle>
                <CardDescription>
                  Search by ingredients, recipe names, or browse by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
                    <Input
                      placeholder="Search recipes, ingredients..."
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="md:w-48">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category: Category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Searching...' : 'Search'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Recipe Results */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recipes.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No recipes found</p>
                  <p className="text-gray-400">Try adjusting your search or filters</p>
                </div>
              ) : (
                recipes.map((recipe: RecipeWithDetails) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    isFavorite={isFavorite(recipe.id)}
                    onToggleFavorite={() => handleToggleFavorite(recipe)}
                    onViewDetails={() => setSelectedRecipe(recipe)}
                  />
                ))
              )}
            </div>
          </TabsContent>

          {/* Create Recipe Tab */}
          <TabsContent value="create">
            {currentUser ? (
              <CreateRecipeForm
                currentUser={currentUser}
                categories={categories}
                onRecipeCreated={handleRecipeCreated}
              />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">Please select a user to create recipes</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-6">
            {!currentUser ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">Please select a user to view favorites</p>
                </CardContent>
              </Card>
            ) : favorites.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No favorite recipes yet</p>
                <p className="text-gray-400">Browse recipes and click the heart icon to save your favorites! ❤️</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {favorites.map((recipe: RecipeWithDetails) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    isFavorite={true}
                    onToggleFavorite={() => handleToggleFavorite(recipe)}
                    onViewDetails={() => setSelectedRecipe(recipe)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
