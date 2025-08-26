import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import type { User, RecipeWithDetails, RecipeCategory } from '../../server/src/schema';
import { AuthForm } from '@/components/AuthForm';
import { RecipeCard } from '@/components/RecipeCard';
import { CreateRecipeForm } from '@/components/CreateRecipeForm';
import { SearchBar } from '@/components/SearchBar';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [recipes, setRecipes] = useState<RecipeWithDetails[]>([]);
  const [favorites, setFavorites] = useState<RecipeWithDetails[]>([]);
  const [userRecipes, setUserRecipes] = useState<RecipeWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');

  // Load all recipes
  const loadRecipes = useCallback(async () => {
    try {
      const result = await trpc.getRecipes.query();
      setRecipes(result);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    }
  }, []);

  // Load user's recipes
  const loadUserRecipes = useCallback(async (userId: number) => {
    try {
      const result = await trpc.getUserRecipes.query({ userId });
      setUserRecipes(result);
    } catch (error) {
      console.error('Failed to load user recipes:', error);
    }
  }, []);

  // Load user's favorites
  const loadFavorites = useCallback(async (userId: number) => {
    try {
      const result = await trpc.getUserFavorites.query({ user_id: userId });
      setFavorites(result);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // Load user-specific data when user changes
  useEffect(() => {
    if (user) {
      loadUserRecipes(user.id);
      loadFavorites(user.id);
    }
  }, [user, loadUserRecipes, loadFavorites]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
    setFavorites([]);
    setUserRecipes([]);
    setActiveTab('browse');
  };

  const handleRecipeCreated = (newRecipe: RecipeWithDetails) => {
    setRecipes(prev => [newRecipe, ...prev]);
    setUserRecipes(prev => [newRecipe, ...prev]);
    setActiveTab('browse');
  };

  const handleSearch = async (query: string, categories: string[], ingredients: string[]) => {
    setIsLoading(true);
    try {
      const searchInput = {
        query: query || undefined,
        categories: categories.length > 0 ? categories as RecipeCategory[] : undefined,
        ingredients: ingredients.length > 0 ? ingredients : undefined
      };
      
      const results = await trpc.searchRecipes.query(searchInput);
      setRecipes(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async (recipe: RecipeWithDetails, isFavorite: boolean) => {
    if (!user) return;

    try {
      if (isFavorite) {
        await trpc.removeFromFavorites.mutate({ user_id: user.id, recipe_id: recipe.id });
        setFavorites(prev => prev.filter((fav: RecipeWithDetails) => fav.id !== recipe.id));
      } else {
        await trpc.addToFavorites.mutate({ user_id: user.id, recipe_id: recipe.id });
        setFavorites(prev => [...prev, recipe]);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-orange-600">
              🍳 Recipe Community
            </CardTitle>
            <p className="text-gray-600 mt-2">Share and discover amazing recipes</p>
          </CardHeader>
          <CardContent>
            <AuthForm onLogin={handleLogin} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🍳</span>
              <h1 className="text-2xl font-bold text-orange-600">Recipe Community</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Welcome, {user.username}!</span>
              <Button onClick={handleLogout} variant="outline">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="browse">🔍 Browse</TabsTrigger>
            <TabsTrigger value="favorites">❤️ Favorites ({favorites.length})</TabsTrigger>
            <TabsTrigger value="my-recipes">📝 My Recipes ({userRecipes.length})</TabsTrigger>
            <TabsTrigger value="create">➕ Create</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />
            
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                Discover Recipes {recipes.length > 0 && `(${recipes.length})`}
              </h2>
              
              {recipes.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <p className="text-gray-500 text-lg">No recipes found. Try adjusting your search!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {recipes.map((recipe: RecipeWithDetails) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      isFavorite={favorites.some((fav: RecipeWithDetails) => fav.id === recipe.id)}
                      onToggleFavorite={handleToggleFavorite}
                      currentUser={user}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="favorites" className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Your Favorite Recipes ❤️
            </h2>
            
            {favorites.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-gray-500 text-lg">
                    No favorites yet. Start exploring recipes and save your favorites! 
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {favorites.map((recipe: RecipeWithDetails) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    isFavorite={true}
                    onToggleFavorite={handleToggleFavorite}
                    currentUser={user}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-recipes" className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Your Recipes 📝
            </h2>
            
            {userRecipes.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-gray-500 text-lg">
                    You haven't created any recipes yet. Share your first recipe!
                  </p>
                  <Button 
                    onClick={() => setActiveTab('create')} 
                    className="mt-4 bg-orange-500 hover:bg-orange-600"
                  >
                    Create Your First Recipe
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {userRecipes.map((recipe: RecipeWithDetails) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    isFavorite={favorites.some((fav: RecipeWithDetails) => fav.id === recipe.id)}
                    onToggleFavorite={handleToggleFavorite}
                    currentUser={user}
                    isOwnRecipe={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Create New Recipe ✨
            </h2>
            <CreateRecipeForm user={user} onRecipeCreated={handleRecipeCreated} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
