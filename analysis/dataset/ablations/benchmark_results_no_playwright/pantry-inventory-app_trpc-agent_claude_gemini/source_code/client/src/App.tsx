import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { PantryItem, CreatePantryItemInput, Notification, Recipe, CreateRecipeInput } from '../../server/src/schema';

function App() {
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeSuggestions, setRecipeSuggestions] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Pantry item form state
  const [pantryFormData, setPantryFormData] = useState<CreatePantryItemInput>({
    name: '',
    quantity: 1,
    unit: '',
    expiry_date: new Date()
  });

  // Recipe form state
  const [recipeFormData, setRecipeFormData] = useState<CreateRecipeInput>({
    title: '',
    description: '',
    ingredients: [''],
    instructions: '',
    prep_time_minutes: 0,
    cook_time_minutes: 0,
    servings: 1
  });

  // Load data functions
  const loadPantryItems = useCallback(async () => {
    try {
      const result = await trpc.getPantryItems.query();
      setPantryItems(result);
    } catch (error) {
      console.error('Failed to load pantry items:', error);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const result = await trpc.getExpiryNotifications.query({
        days_ahead: 7,
        include_expired: true
      });
      setNotifications(result);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, []);

  const loadRecipes = useCallback(async () => {
    try {
      const result = await trpc.getRecipes.query();
      setRecipes(result);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    }
  }, []);

  const loadRecipeSuggestions = useCallback(async () => {
    try {
      const result = await trpc.getRecipeSuggestions.query({
        max_suggestions: 10
      });
      setRecipeSuggestions(result);
    } catch (error) {
      console.error('Failed to load recipe suggestions:', error);
    }
  }, []);

  useEffect(() => {
    loadPantryItems();
    loadNotifications();
    loadRecipes();
    loadRecipeSuggestions();
  }, [loadPantryItems, loadNotifications, loadRecipes, loadRecipeSuggestions]);

  // Handle pantry item submission
  const handlePantrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createPantryItem.mutate(pantryFormData);
      setPantryItems((prev: PantryItem[]) => [...prev, response]);
      setPantryFormData({
        name: '',
        quantity: 1,
        unit: '',
        expiry_date: new Date()
      });
      // Refresh notifications and suggestions
      loadNotifications();
      loadRecipeSuggestions();
    } catch (error) {
      console.error('Failed to create pantry item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle recipe submission
  const handleRecipeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const cleanedIngredients = recipeFormData.ingredients.filter((ing: string) => ing.trim() !== '');
      const response = await trpc.createRecipe.mutate({
        ...recipeFormData,
        ingredients: cleanedIngredients
      });
      setRecipes((prev: Recipe[]) => [...prev, response]);
      setRecipeFormData({
        title: '',
        description: '',
        ingredients: [''],
        instructions: '',
        prep_time_minutes: 0,
        cook_time_minutes: 0,
        servings: 1
      });
      loadRecipeSuggestions();
    } catch (error) {
      console.error('Failed to create recipe:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting pantry item
  const handleDeleteItem = async (id: number) => {
    try {
      await trpc.deletePantryItem.mutate({ id });
      setPantryItems((prev: PantryItem[]) => prev.filter((item: PantryItem) => item.id !== id));
      loadNotifications();
      loadRecipeSuggestions();
    } catch (error) {
      console.error('Failed to delete pantry item:', error);
    }
  };

  // Get expiry status
  const getExpiryStatus = (expiryDate: Date) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'expired', text: 'Expired', variant: 'destructive' as const };
    } else if (diffDays <= 3) {
      return { status: 'expiring', text: `Expires in ${diffDays} days`, variant: 'secondary' as const };
    } else if (diffDays <= 7) {
      return { status: 'warning', text: `Expires in ${diffDays} days`, variant: 'outline' as const };
    }
    return { status: 'fresh', text: `Expires in ${diffDays} days`, variant: 'default' as const };
  };

  // Add ingredient input
  const addIngredientInput = () => {
    setRecipeFormData((prev: CreateRecipeInput) => ({
      ...prev,
      ingredients: [...prev.ingredients, '']
    }));
  };

  // Remove ingredient input
  const removeIngredientInput = (index: number) => {
    setRecipeFormData((prev: CreateRecipeInput) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  // Update ingredient
  const updateIngredient = (index: number, value: string) => {
    setRecipeFormData((prev: CreateRecipeInput) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => i === index ? value : ing)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🥬 Smart Pantry Manager</h1>
          <p className="text-lg text-gray-600">Reduce food waste, discover recipes, and keep track of your ingredients</p>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertDescription className="text-orange-800">
              <strong>⚠️ Expiry Alerts:</strong> You have {notifications.length} item(s) expiring soon or expired.
              Check your pantry items below!
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="pantry" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/70 backdrop-blur">
            <TabsTrigger value="pantry" className="text-sm">🥫 My Pantry</TabsTrigger>
            <TabsTrigger value="add-item" className="text-sm">➕ Add Item</TabsTrigger>
            <TabsTrigger value="recipes" className="text-sm">📖 My Recipes</TabsTrigger>
            <TabsTrigger value="suggestions" className="text-sm">💡 Suggestions</TabsTrigger>
          </TabsList>

          {/* Pantry Items Tab */}
          <TabsContent value="pantry" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🏪 Your Pantry Items
                  <Badge variant="secondary">{pantryItems.length} items</Badge>
                </CardTitle>
                <CardDescription>
                  Keep track of your ingredients and their expiry dates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pantryItems.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🍽️</div>
                    <p className="text-gray-500 text-lg">Your pantry is empty!</p>
                    <p className="text-gray-400">Add some items to get started with smart food management.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pantryItems.map((item: PantryItem) => {
                      const expiryStatus = getExpiryStatus(item.expiry_date);
                      return (
                        <Card key={item.id} className="bg-white border-l-4 border-l-green-400">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{item.name}</CardTitle>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteItem(item.id)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                🗑️
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-2xl">{item.quantity}</span>
                              <span className="text-gray-600">{item.unit}</span>
                            </div>
                            <Badge variant={expiryStatus.variant} className="w-full justify-center">
                              {expiryStatus.text}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-2">
                              Added: {new Date(item.added_date).toLocaleDateString()}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Item Tab */}
          <TabsContent value="add-item">
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle>➕ Add New Pantry Item</CardTitle>
                <CardDescription>
                  Keep your pantry organized by adding new ingredients with their details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePantrySubmit} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Item Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Tomatoes, Rice, Milk"
                        value={pantryFormData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setPantryFormData((prev: CreatePantryItemInput) => ({ ...prev, name: e.target.value }))
                        }
                        required
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Select
                        value={pantryFormData.unit}
                        onValueChange={(value: string) =>
                          setPantryFormData((prev: CreatePantryItemInput) => ({ ...prev, unit: value }))
                        }
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pieces">Pieces</SelectItem>
                          <SelectItem value="cups">Cups</SelectItem>
                          <SelectItem value="grams">Grams</SelectItem>
                          <SelectItem value="kg">Kilograms</SelectItem>
                          <SelectItem value="ml">Milliliters</SelectItem>
                          <SelectItem value="liters">Liters</SelectItem>
                          <SelectItem value="tbsp">Tablespoons</SelectItem>
                          <SelectItem value="tsp">Teaspoons</SelectItem>
                          <SelectItem value="cans">Cans</SelectItem>
                          <SelectItem value="bottles">Bottles</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={pantryFormData.quantity}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setPantryFormData((prev: CreatePantryItemInput) => ({ 
                            ...prev, 
                            quantity: parseFloat(e.target.value) || 1 
                          }))
                        }
                        required
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input
                        id="expiry"
                        type="date"
                        value={pantryFormData.expiry_date.toISOString().split('T')[0]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setPantryFormData((prev: CreatePantryItemInput) => ({ 
                            ...prev, 
                            expiry_date: new Date(e.target.value) 
                          }))
                        }
                        required
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isLoading ? 'Adding...' : '🛒 Add to Pantry'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Recipes Tab */}
          <TabsContent value="recipes" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Recipe List */}
              <Card className="bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📖 My Recipe Collection
                    <Badge variant="secondary">{recipes.length} recipes</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recipes.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">👨‍🍳</div>
                      <p className="text-gray-500">No recipes yet!</p>
                      <p className="text-sm text-gray-400">Add your first recipe to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {recipes.map((recipe: Recipe) => (
                        <Card key={recipe.id} className="bg-gradient-to-r from-yellow-50 to-orange-50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">{recipe.title}</CardTitle>
                            <CardDescription className="text-sm">{recipe.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex gap-4 text-sm text-gray-600 mb-2">
                              <span>⏱️ {recipe.prep_time_minutes + recipe.cook_time_minutes}min</span>
                              <span>👥 {recipe.servings} servings</span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {recipe.ingredients.length} ingredients
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Add Recipe Form */}
              <Card className="bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>➕ Add New Recipe</CardTitle>
                  <CardDescription>Share your favorite recipes</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRecipeSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Recipe Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Spaghetti Bolognese"
                        value={recipeFormData.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setRecipeFormData((prev: CreateRecipeInput) => ({ ...prev, title: e.target.value }))
                        }
                        required
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Brief description of your recipe..."
                        value={recipeFormData.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setRecipeFormData((prev: CreateRecipeInput) => ({ ...prev, description: e.target.value }))
                        }
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Ingredients</Label>
                      {recipeFormData.ingredients.map((ingredient: string, index: number) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="e.g., 2 cups flour"
                            value={ingredient}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              updateIngredient(index, e.target.value)
                            }
                            className="bg-white"
                          />
                          {recipeFormData.ingredients.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeIngredientInput(index)}
                            >
                              ✕
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addIngredientInput}
                        className="w-full"
                      >
                        + Add Ingredient
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instructions">Instructions</Label>
                      <Textarea
                        id="instructions"
                        placeholder="Step by step cooking instructions..."
                        value={recipeFormData.instructions}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setRecipeFormData((prev: CreateRecipeInput) => ({ ...prev, instructions: e.target.value }))
                        }
                        required
                        className="bg-white min-h-24"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="prep">Prep (min)</Label>
                        <Input
                          id="prep"
                          type="number"
                          min="0"
                          value={recipeFormData.prep_time_minutes}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setRecipeFormData((prev: CreateRecipeInput) => ({ 
                              ...prev, 
                              prep_time_minutes: parseInt(e.target.value) || 0 
                            }))
                          }
                          className="bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cook">Cook (min)</Label>
                        <Input
                          id="cook"
                          type="number"
                          min="0"
                          value={recipeFormData.cook_time_minutes}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setRecipeFormData((prev: CreateRecipeInput) => ({ 
                              ...prev, 
                              cook_time_minutes: parseInt(e.target.value) || 0 
                            }))
                          }
                          className="bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="servings">Servings</Label>
                        <Input
                          id="servings"
                          type="number"
                          min="1"
                          value={recipeFormData.servings}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setRecipeFormData((prev: CreateRecipeInput) => ({ 
                              ...prev, 
                              servings: parseInt(e.target.value) || 1 
                            }))
                          }
                          className="bg-white"
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {isLoading ? 'Adding...' : '👨‍🍳 Add Recipe'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Recipe Suggestions Tab */}
          <TabsContent value="suggestions">
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  💡 Recipe Suggestions
                  <Badge variant="secondary">{recipeSuggestions.length} suggestions</Badge>
                </CardTitle>
                <CardDescription>
                  Smart recipe suggestions based on your current pantry items
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recipeSuggestions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🤖</div>
                    <p className="text-gray-500 text-lg">No recipe suggestions yet!</p>
                    <p className="text-gray-400">Add some pantry items and recipes to get AI-powered suggestions.</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {recipeSuggestions.map((recipe: Recipe) => (
                      <Card key={recipe.id} className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <span>✨</span>
                            {recipe.title}
                          </CardTitle>
                          <CardDescription>{recipe.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex gap-4 text-sm text-gray-600">
                            <span>⏱️ {recipe.prep_time_minutes + recipe.cook_time_minutes}min</span>
                            <span>👥 {recipe.servings} servings</span>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Ingredients:</h4>
                            <div className="flex flex-wrap gap-1">
                              {recipe.ingredients.slice(0, 3).map((ingredient: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {ingredient}
                                </Badge>
                              ))}
                              {recipe.ingredients.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{recipe.ingredients.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>

                          <Separator />
                          
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Instructions:</h4>
                            <p className="text-xs text-gray-600 line-clamp-3">
                              {recipe.instructions}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
