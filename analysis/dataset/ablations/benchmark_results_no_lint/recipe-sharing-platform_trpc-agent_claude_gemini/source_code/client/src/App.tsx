import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { AuthForm } from './components/AuthForm';
import { RecipeForm } from './components/RecipeForm';
import { RecipeCard } from './components/RecipeCard';
import { SearchForm } from './components/SearchForm';
// Using type-only imports for TypeScript compliance
import type { 
  User, 
  RecipeWithUser, 
  CreateRecipeInput, 
  UpdateRecipeInput, 
  SearchRecipesInput 
} from '../../server/src/schema';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [recipes, setRecipes] = useState<RecipeWithUser[]>([]);
  const [userRecipes, setUserRecipes] = useState<RecipeWithUser[]>([]);
  const [favorites, setFavorites] = useState<RecipeWithUser[]>([]);
  const [activeTab, setActiveTab] = useState<string>('browse');
  const [isLoading, setIsLoading] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<RecipeWithUser | null>(null);

  // Load recipes with proper dependency management
  const loadRecipes = useCallback(async () => {
    try {
      const result = await trpc.getRecipes.query({ 
        userId: currentUser?.id 
      });
      setRecipes(result);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    }
  }, [currentUser?.id]);

  const loadUserRecipes = useCallback(async () => {
    if (!currentUser) return;
    try {
      const result = await trpc.getUserRecipes.query({ 
        userId: currentUser.id 
      });
      // Transform Recipe[] to RecipeWithUser[] by adding user information
      const recipesWithUser = result.map((recipe: any) => ({
        ...recipe,
        user_name: currentUser.name,
        is_favorite: false // User's own recipes, favorite status not relevant here
      }));
      setUserRecipes(recipesWithUser);
    } catch (error) {
      console.error('Failed to load user recipes:', error);
    }
  }, [currentUser]);

  const loadFavorites = useCallback(async () => {
    if (!currentUser) return;
    try {
      const result = await trpc.getUserFavorites.query({ 
        userId: currentUser.id 
      });
      setFavorites(result);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadRecipes();
      loadUserRecipes();
      loadFavorites();
    }
  }, [currentUser, loadRecipes, loadUserRecipes, loadFavorites]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveTab('browse');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setRecipes([]);
    setUserRecipes([]);
    setFavorites([]);
    setActiveTab('browse');
  };

  const handleCreateRecipe = async (recipeData: any) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const newRecipeData = { ...recipeData, user_id: currentUser.id };
      await trpc.createRecipe.mutate(newRecipeData);
      await loadRecipes();
      await loadUserRecipes();
      setActiveTab('my-recipes');
    } catch (error) {
      console.error('Failed to create recipe:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRecipe = async (recipeData: any) => {
    if (!currentUser || !editingRecipe) return;
    
    setIsLoading(true);
    try {
      await trpc.updateRecipe.mutate(recipeData);
      await loadRecipes();
      await loadUserRecipes();
      setEditingRecipe(null);
    } catch (error) {
      console.error('Failed to update recipe:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRecipe = async (recipeId: number) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      await trpc.deleteRecipe.mutate({ 
        recipeId, 
        userId: currentUser.id 
      });
      await loadRecipes();
      await loadUserRecipes();
      await loadFavorites();
    } catch (error) {
      console.error('Failed to delete recipe:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (searchData: SearchRecipesInput) => {
    setIsLoading(true);
    try {
      const result = await trpc.searchRecipes.query({
        ...searchData,
        currentUserId: currentUser?.id
      });
      setRecipes(result);
    } catch (error) {
      console.error('Failed to search recipes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async (recipeId: number, isFavorite: boolean) => {
    if (!currentUser) return;
    
    try {
      if (isFavorite) {
        await trpc.removeFavorite.mutate({ 
          user_id: currentUser.id, 
          recipe_id: recipeId 
        });
      } else {
        await trpc.addFavorite.mutate({ 
          user_id: currentUser.id, 
          recipe_id: recipeId 
        });
      }
      await loadRecipes();
      await loadFavorites();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">🍳 RecipeShare</h1>
            <p className="text-gray-600">Share and discover amazing recipes</p>
          </div>
          <AuthForm onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <header className="bg-white shadow-sm border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900">🍳 RecipeShare</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {currentUser.name}! 👋</span>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="browse">🌟 Browse Recipes</TabsTrigger>
            <TabsTrigger value="my-recipes">📝 My Recipes</TabsTrigger>
            <TabsTrigger value="favorites">❤️ Favorites</TabsTrigger>
            <TabsTrigger value="create">➕ Create Recipe</TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>🔍 Search Recipes</CardTitle>
                </CardHeader>
                <CardContent>
                  <SearchForm 
                    onSearch={handleSearch} 
                    isLoading={isLoading}
                    onReset={loadRecipes}
                  />
                </CardContent>
              </Card>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recipes.map((recipe: RecipeWithUser) => (
                  <RecipeCard 
                    key={recipe.id} 
                    recipe={recipe}
                    currentUser={currentUser}
                    onToggleFavorite={handleToggleFavorite}
                    showAuthor={true}
                  />
                ))}
              </div>
              
              {recipes.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-gray-500 text-lg">
                      🔍 No recipes found. Try adjusting your search or browse all recipes!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="my-recipes">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">📝 My Recipes</h2>
                <Button 
                  onClick={() => setActiveTab('create')}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  ➕ Create New Recipe
                </Button>
              </div>
              
              {editingRecipe && (
                <Card>
                  <CardHeader>
                    <CardTitle>✏️ Edit Recipe</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RecipeForm
                      initialData={editingRecipe}
                      onSubmit={handleUpdateRecipe}
                      onCancel={() => setEditingRecipe(null)}
                      isLoading={isLoading}
                      isEditing={true}
                    />
                  </CardContent>
                </Card>
              )}
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {userRecipes.map((recipe: RecipeWithUser) => (
                  <RecipeCard 
                    key={recipe.id} 
                    recipe={recipe}
                    currentUser={currentUser}
                    onToggleFavorite={handleToggleFavorite}
                    onEdit={setEditingRecipe}
                    onDelete={handleDeleteRecipe}
                    showAuthor={false}
                    showActions={true}
                  />
                ))}
              </div>
              
              {userRecipes.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-gray-500 text-lg">
                      📝 You haven't created any recipes yet. Share your first recipe!
                    </p>
                    <Button 
                      className="mt-4 bg-orange-500 hover:bg-orange-600" 
                      onClick={() => setActiveTab('create')}
                    >
                      ➕ Create Your First Recipe
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="favorites">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">❤️ Favorite Recipes</h2>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {favorites.map((recipe: RecipeWithUser) => (
                  <RecipeCard 
                    key={recipe.id} 
                    recipe={recipe}
                    currentUser={currentUser}
                    onToggleFavorite={handleToggleFavorite}
                    showAuthor={true}
                  />
                ))}
              </div>
              
              {favorites.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-gray-500 text-lg">
                      ❤️ No favorite recipes yet. Start exploring and save recipes you love!
                    </p>
                    <Button 
                      className="mt-4 bg-orange-500 hover:bg-orange-600" 
                      onClick={() => setActiveTab('browse')}
                    >
                      🌟 Browse Recipes
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>➕ Create New Recipe</CardTitle>
              </CardHeader>
              <CardContent>
                <RecipeForm
                  onSubmit={handleCreateRecipe}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
