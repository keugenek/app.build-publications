import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, BookOpen, Heart, ChefHat, Users } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Recipe, User, CreateRecipeInput, SearchRecipesInput } from '../../server/src/schema';

// Import components
import { RecipeForm } from '@/components/RecipeForm';
import { RecipeCard } from '@/components/RecipeCard';
import { RecipeDetail } from '@/components/RecipeDetail';
import { SearchFilters } from '@/components/SearchFilters';
import { UserSelector } from '@/components/UserSelector';

function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchRecipesInput>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');

  // Load initial data
  const loadRecipes = useCallback(async () => {
    try {
      const result = await trpc.getAllRecipes.query();
      setRecipes(result);
    } catch (error) {
      console.error('Failed to load recipes:', error);
      // STUB: Show placeholder data when backend is not implemented
      setRecipes([]);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const result = await trpc.getUsers.query();
      setUsers(result);
    } catch (error) {
      console.error('Failed to load users:', error);
      // STUB: Show placeholder data when backend is not implemented  
      setUsers([]);
    }
  }, []);

  const loadSavedRecipes = useCallback(async () => {
    if (!currentUser) return;
    try {
      const result = await trpc.getSavedRecipes.query({ user_id: currentUser.id });
      setSavedRecipes(result);
    } catch (error) {
      console.error('Failed to load saved recipes:', error);
      setSavedRecipes([]);
    }
  }, [currentUser]);

  useEffect(() => {
    loadRecipes();
    loadUsers();
  }, [loadRecipes, loadUsers]);

  useEffect(() => {
    loadSavedRecipes();
  }, [loadSavedRecipes]);

  const handleSearch = async () => {
    if (!searchQuery.trim() && Object.keys(searchFilters).length === 0) {
      loadRecipes();
      return;
    }

    setIsLoading(true);
    try {
      const searchParams: SearchRecipesInput = {
        ...searchFilters,
        query: searchQuery.trim() || undefined
      };
      const results = await trpc.searchRecipes.query(searchParams);
      setRecipes(results);
    } catch (error) {
      console.error('Failed to search recipes:', error);
      setRecipes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRecipe = async (data: CreateRecipeInput) => {
    if (!currentUser) {
      alert('Please select a user first!');
      return;
    }

    setIsLoading(true);
    try {
      const newRecipe = await trpc.createRecipe.mutate({
        ...data,
        author_id: currentUser.id
      });
      setRecipes((prev: Recipe[]) => [newRecipe, ...prev]);
      setActiveTab('browse');
    } catch (error) {
      console.error('Failed to create recipe:', error);
      alert('Failed to create recipe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRecipe = async (recipeId: number) => {
    if (!currentUser) {
      alert('Please select a user first!');
      return;
    }

    try {
      await trpc.saveRecipe.mutate({
        user_id: currentUser.id,
        recipe_id: recipeId
      });
      loadSavedRecipes();
    } catch (error) {
      console.error('Failed to save recipe:', error);
      alert('Failed to save recipe. Please try again.');
    }
  };

  const handleUnsaveRecipe = async (recipeId: number) => {
    if (!currentUser) return;

    try {
      await trpc.unsaveRecipe.mutate({
        user_id: currentUser.id,
        recipe_id: recipeId
      });
      loadSavedRecipes();
    } catch (error) {
      console.error('Failed to unsave recipe:', error);
      alert('Failed to unsave recipe. Please try again.');
    }
  };

  const isRecipeSaved = (recipeId: number) => {
    return savedRecipes.some((r: Recipe) => r.id === recipeId);
  };

  const getAuthorName = (authorId: number) => {
    const author = users.find((u: User) => u.id === authorId);
    return author?.username || 'Unknown Author';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-orange-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ChefHat className="h-8 w-8 text-orange-500" />
              <h1 className="text-2xl font-bold text-gray-900">🍳 Recipe Community</h1>
            </div>
            <UserSelector 
              users={users}
              currentUser={currentUser}
              onUserChange={setCurrentUser}
            />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="browse" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Browse Recipes</span>
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Recipe</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center space-x-2">
              <Heart className="h-4 w-4" />
              <span>My Saved</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Search Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Find Recipes</span>
                </CardTitle>
                <CardDescription>
                  Search through our community's delicious recipes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search recipes, ingredients, or descriptions..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} disabled={isLoading}>
                    {isLoading ? 'Searching...' : 'Search'}
                  </Button>
                </div>
                <SearchFilters 
                  filters={searchFilters}
                  onFiltersChange={setSearchFilters}
                  onSearch={handleSearch}
                />
              </CardContent>
            </Card>

            {/* Recipe Grid */}
            {recipes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <ChefHat className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Recipes Yet</h3>
                  <p className="text-gray-500 mb-4">
                    {/* STUB: Backend handlers are placeholder implementations */}
                    Be the first to share a delicious recipe with the community!
                  </p>
                  <Button onClick={() => setActiveTab('create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Recipe
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((recipe: Recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    authorName={getAuthorName(recipe.author_id)}
                    isSaved={isRecipeSaved(recipe.id)}
                    onSave={() => handleSaveRecipe(recipe.id)}
                    onUnsave={() => handleUnsaveRecipe(recipe.id)}
                    onClick={() => setSelectedRecipe(recipe)}
                    showSaveButton={!!currentUser}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Share Your Recipe</span>
                </CardTitle>
                <CardDescription>
                  Add your favorite recipe to share with the community
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentUser ? (
                  <RecipeForm 
                    onSubmit={handleCreateRecipe}
                    isLoading={isLoading}
                  />
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Please select a user to create recipes</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saved" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5" />
                  <span>My Saved Recipes</span>
                </CardTitle>
                <CardDescription>
                  Your personal collection of favorite recipes
                </CardDescription>
              </CardHeader>
            </Card>

            {!currentUser ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a User</h3>
                  <p className="text-gray-500">
                    Please select a user to view saved recipes
                  </p>
                </CardContent>
              </Card>
            ) : savedRecipes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Heart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Saved Recipes</h3>
                  <p className="text-gray-500 mb-4">
                    Start saving recipes you love to build your personal collection!
                  </p>
                  <Button onClick={() => setActiveTab('browse')}>
                    <Search className="h-4 w-4 mr-2" />
                    Browse Recipes
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedRecipes.map((recipe: Recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    authorName={getAuthorName(recipe.author_id)}
                    isSaved={true}
                    onUnsave={() => handleUnsaveRecipe(recipe.id)}
                    onClick={() => setSelectedRecipe(recipe)}
                    showSaveButton={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          authorName={getAuthorName(selectedRecipe.author_id)}
          isSaved={isRecipeSaved(selectedRecipe.id)}
          onSave={() => handleSaveRecipe(selectedRecipe.id)}
          onUnsave={() => handleUnsaveRecipe(selectedRecipe.id)}
          onClose={() => setSelectedRecipe(null)}
          showSaveButton={!!currentUser}
        />
      )}
    </div>
  );
}

export default App;
