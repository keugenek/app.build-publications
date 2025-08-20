import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangleIcon, ChefHatIcon } from 'lucide-react';
import { format } from 'date-fns';
import { PantryItemForm } from '@/components/PantryItemForm';
import { PantryItemList } from '@/components/PantryItemList';
import { RecipeSuggestions } from '@/components/RecipeSuggestions';
import { trpc } from '@/utils/trpc';
import type { PantryItem, CreatePantryItemInput, RecipeSuggestion } from '../../server/src/schema';

function App() {
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [expiringItems, setExpiringItems] = useState<PantryItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecipesLoading, setIsRecipesLoading] = useState(false);

  // Load pantry items
  const loadPantryItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const items = await trpc.getPantryItems.query();
      setPantryItems(items);
    } catch (error) {
      console.error('Failed to load pantry items:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load expiring items
  const loadExpiringItems = useCallback(async () => {
    try {
      const items = await trpc.getExpiringItems.query();
      setExpiringItems(items);
    } catch (error) {
      console.error('Failed to load expiring items:', error);
    }
  }, []);

  useEffect(() => {
    loadPantryItems();
    loadExpiringItems();
  }, [loadPantryItems, loadExpiringItems]);

  const handleAddItem = async (data: CreatePantryItemInput) => {
    try {
      const newItem = await trpc.createPantryItem.mutate(data);
      setPantryItems(prev => [...prev, newItem]);
      // Reload expiring items
      loadExpiringItems();
    } catch (error) {
      console.error('Failed to create pantry item:', error);
    }
  };

  const handleEditItem = (item: PantryItem) => {
    // In a real app, you would open an edit dialog here
    console.log('Editing item:', item);
  };

  const handleDeleteItem = async (id: number) => {
    try {
      // In a real implementation, you would have a delete endpoint
      // For now, we'll just remove it from the UI
      setPantryItems(prev => prev.filter(item => item.id !== id));
      setExpiringItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleGenerateRecipes = async () => {
    setIsRecipesLoading(true);
    try {
      const recipeList = await trpc.generateRecipes.query();
      setRecipes(recipeList);
    } catch (error) {
      console.error('Failed to generate recipes:', error);
    } finally {
      setIsRecipesLoading(false);
    }
  };

  // Get pantry item names for recipe suggestions
  const pantryItemNames = pantryItems.map(item => item.name);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Smart Pantry Manager
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Keep track of your pantry items and discover recipes
          </p>
        </header>

        {/* Expiring Items Alert */}
        {expiringItems.length > 0 && (
          <Alert className="mb-8 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
            <AlertTriangleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-200">
              Items Expiring Soon
            </AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-300">
              <ul className="list-disc pl-5 mt-2">
                {expiringItems.map(item => (
                  <li key={item.id}>
                    {item.name} ({item.quantity}) - Expires {format(item.expiry_date, 'MMM dd, yyyy')}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Item Form */}
          <div className="lg:col-span-1">
            <PantryItemForm onSubmit={handleAddItem} isLoading={isLoading} />
          </div>

          {/* Pantry Items List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Your Pantry Items</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    ))}
                  </div>
                ) : pantryItems.length === 0 ? (
                  <div className="text-center py-8">
                    <ChefHatIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                      Your pantry is empty
                    </h3>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">
                      Add items to get started
                    </p>
                  </div>
                ) : (
                  <PantryItemList 
                    items={pantryItems} 
                    onEdit={handleEditItem} 
                    onDelete={handleDeleteItem} 
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recipe Suggestions */}
        <div className="mt-6">
          <RecipeSuggestions 
            recipes={recipes} 
            isLoading={isRecipesLoading} 
            onGenerate={handleGenerateRecipes}
            pantryItems={pantryItemNames}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
