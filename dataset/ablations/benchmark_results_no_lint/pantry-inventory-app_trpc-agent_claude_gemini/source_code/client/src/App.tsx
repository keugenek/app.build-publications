import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CalendarDays, ChefHat, Package, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { PantryItem, CreatePantryItemInput, RecipeSuggestion } from '../../server/src/schema';

// Unit options for pantry items
const UNIT_OPTIONS = ['pieces', 'cups', 'lbs', 'oz', 'kg', 'g', 'ml', 'l', 'tbsp', 'tsp'];
const CATEGORY_OPTIONS = ['dairy', 'vegetables', 'fruits', 'meat', 'grains', 'spices', 'condiments', 'beverages', 'snacks', 'frozen'];

function App() {
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [expiringItems, setExpiringItems] = useState<PantryItem[]>([]);
  const [recipeSuggestions, setRecipeSuggestions] = useState<RecipeSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form state for adding new items
  const [formData, setFormData] = useState<CreatePantryItemInput>({
    name: '',
    quantity: 1,
    unit: 'pieces',
    expiration_date: new Date(),
    category: null,
    notes: null
  });

  // Load all data
  const loadPantryItems = useCallback(async () => {
    try {
      const result = await trpc.getPantryItems.query();
      setPantryItems(result);
    } catch (error) {
      console.error('Failed to load pantry items:', error);
    }
  }, []);

  const loadExpiringItems = useCallback(async () => {
    try {
      const result = await trpc.getExpiringItems.query({ days_ahead: 7 });
      setExpiringItems(result);
    } catch (error) {
      console.error('Failed to load expiring items:', error);
    }
  }, []);

  const loadRecipeSuggestions = useCallback(async () => {
    try {
      const result = await trpc.getRecipeSuggestions.query({ min_matching_ingredients: 2 });
      setRecipeSuggestions(result);
    } catch (error) {
      console.error('Failed to load recipe suggestions:', error);
    }
  }, []);

  useEffect(() => {
    loadPantryItems();
    loadExpiringItems();
    loadRecipeSuggestions();
  }, [loadPantryItems, loadExpiringItems, loadRecipeSuggestions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createPantryItem.mutate(formData);
      setPantryItems((prev: PantryItem[]) => [...prev, response]);
      // Reset form
      setFormData({
        name: '',
        quantity: 1,
        unit: 'pieces',
        expiration_date: new Date(),
        category: null,
        notes: null
      });
      // Refresh other data
      loadExpiringItems();
      loadRecipeSuggestions();
    } catch (error) {
      console.error('Failed to create pantry item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deletePantryItem.mutate({ id });
      setPantryItems((prev: PantryItem[]) => prev.filter(item => item.id !== id));
      // Refresh other data
      loadExpiringItems();
      loadRecipeSuggestions();
    } catch (error) {
      console.error('Failed to delete pantry item:', error);
    }
  };

  const isExpiringSoon = (expirationDate: Date) => {
    const today = new Date();
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  const isExpired = (expirationDate: Date) => {
    const today = new Date();
    return expirationDate < today;
  };

  const getBadgeVariant = (item: PantryItem) => {
    if (isExpired(item.expiration_date)) return 'destructive';
    if (isExpiringSoon(item.expiration_date)) return 'secondary';
    return 'outline';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            🥗 Smart Pantry Manager
          </h1>
          <p className="text-lg text-gray-600">Keep track of your pantry, get expiration alerts, and discover recipes!</p>
        </div>

        {/* Expiring Items Alert */}
        {expiringItems.length > 0 && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800">Items Expiring Soon!</AlertTitle>
            <AlertDescription className="text-orange-700">
              You have {expiringItems.length} item(s) expiring within the next 7 days. Check the "Expiring Soon" tab to see details.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="pantry" className="w-full">
          <TabsList className="grid grid-cols-4 w-full mb-6">
            <TabsTrigger value="pantry" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              My Pantry ({pantryItems.length})
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </TabsTrigger>
            <TabsTrigger value="expiring" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Expiring Soon ({expiringItems.length})
            </TabsTrigger>
            <TabsTrigger value="recipes" className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              Recipe Ideas ({recipeSuggestions.length})
            </TabsTrigger>
          </TabsList>

          {/* My Pantry Tab */}
          <TabsContent value="pantry">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Your Pantry Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pantryItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Your pantry is empty! Add some items to get started.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pantryItems.map((item: PantryItem) => (
                      <Card key={item.id} className="relative">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{item.name}</CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="font-medium">Quantity:</span>
                              <span>{item.quantity} {item.unit}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Expires:</span>
                              <Badge variant={getBadgeVariant(item)}>
                                {formatDate(item.expiration_date)}
                              </Badge>
                            </div>
                            {item.category && (
                              <div className="flex justify-between">
                                <span className="font-medium">Category:</span>
                                <Badge variant="outline" className="capitalize">
                                  {item.category}
                                </Badge>
                              </div>
                            )}
                            {item.notes && (
                              <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                                <strong>Notes:</strong> {item.notes}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Item Tab */}
          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Pantry Item
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Item Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g. Milk, Carrots, Rice"
                        value={formData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreatePantryItemInput) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category || 'none'}
                        onValueChange={(value: string) =>
                          setFormData((prev: CreatePantryItemInput) => ({
                            ...prev,
                            category: value === 'none' ? null : value
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No category</SelectItem>
                          {CATEGORY_OPTIONS.map(category => (
                            <SelectItem key={category} value={category} className="capitalize">
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={formData.quantity}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreatePantryItemInput) => ({ ...prev, quantity: parseFloat(e.target.value) || 1 }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit *</Label>
                      <Select
                        value={formData.unit}
                        onValueChange={(value: string) =>
                          setFormData((prev: CreatePantryItemInput) => ({ ...prev, unit: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIT_OPTIONS.map(unit => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiration">Expiration Date *</Label>
                      <Input
                        id="expiration"
                        type="date"
                        value={formData.expiration_date.toISOString().split('T')[0]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreatePantryItemInput) => ({ ...prev, expiration_date: new Date(e.target.value) }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      placeholder="Optional notes about this item"
                      value={formData.notes || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreatePantryItemInput) => ({
                          ...prev,
                          notes: e.target.value || null
                        }))
                      }
                    />
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Adding Item...' : '🥕 Add to Pantry'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expiring Soon Tab */}
          <TabsContent value="expiring">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Items Expiring Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expiringItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Great! No items are expiring soon.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expiringItems.map((item: PantryItem) => (
                      <Card key={item.id} className={`border-l-4 ${
                        isExpired(item.expiration_date) ? 'border-l-red-500 bg-red-50' : 'border-l-orange-500 bg-orange-50'
                      }`}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">{item.name}</h3>
                              <p className="text-sm text-gray-600">
                                {item.quantity} {item.unit}
                                {item.category && ` • ${item.category}`}
                              </p>
                            </div>
                            <Badge variant={getBadgeVariant(item)} className="ml-4">
                              {isExpired(item.expiration_date) ? '⚠️ Expired' : '⏰ Expires'} {formatDate(item.expiration_date)}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recipe Suggestions Tab */}
          <TabsContent value="recipes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-green-600" />
                  Recipe Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recipeSuggestions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Add more items to your pantry to get recipe suggestions!</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {recipeSuggestions.map((suggestion: RecipeSuggestion) => (
                      <Card key={suggestion.recipe.id} className="border-green-200">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-xl">{suggestion.recipe.name}</CardTitle>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {Math.round(suggestion.match_percentage)}% match
                            </Badge>
                          </div>
                          {suggestion.recipe.description && (
                            <p className="text-gray-600">{suggestion.recipe.description}</p>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex gap-4 text-sm text-gray-500">
                            {suggestion.recipe.prep_time_minutes && (
                              <span>⏰ Prep: {suggestion.recipe.prep_time_minutes}min</span>
                            )}
                            {suggestion.recipe.cook_time_minutes && (
                              <span>🔥 Cook: {suggestion.recipe.cook_time_minutes}min</span>
                            )}
                            {suggestion.recipe.servings && (
                              <span>👥 Serves: {suggestion.recipe.servings}</span>
                            )}
                          </div>

                          <div className="space-y-3">
                            {suggestion.matching_ingredients.length > 0 && (
                              <div>
                                <h4 className="font-medium text-green-700 mb-2">✅ You have these ingredients:</h4>
                                <div className="flex flex-wrap gap-1">
                                  {suggestion.matching_ingredients.map((ingredient: string) => (
                                    <Badge key={ingredient} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                      {ingredient}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {suggestion.missing_ingredients.length > 0 && (
                              <div>
                                <h4 className="font-medium text-orange-700 mb-2">🛒 You need to get:</h4>
                                <div className="flex flex-wrap gap-1">
                                  {suggestion.missing_ingredients.map((ingredient: string) => (
                                    <Badge key={ingredient} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                      {ingredient}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {suggestion.recipe.instructions && (
                            <div>
                              <h4 className="font-medium mb-2">📝 Instructions:</h4>
                              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                {suggestion.recipe.instructions}
                              </p>
                            </div>
                          )}
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
