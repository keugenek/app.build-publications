import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Package, ChefHat, Clock } from 'lucide-react';
import { PantryItemForm } from '@/components/PantryItemForm';
import { PantryItemList } from '@/components/PantryItemList';
import { ExpiringItems } from '@/components/ExpiringItems';
import { RecipeSuggestions } from '@/components/RecipeSuggestions';
import type { PantryItem } from '../../server/src/schema';

function App() {
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [expiringItems, setExpiringItems] = useState<PantryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<string | null>(null);

  const loadPantryItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const items = await trpc.getPantryItems.query();
      setPantryItems(items);
    } catch (err) {
      // Backend not implemented yet - use demo data for UI demonstration
      console.warn('Backend not available, using demo data:', err);
      const demoItems: PantryItem[] = [
        {
          id: 1,
          name: "Tomatoes",
          quantity: 3,
          expiry_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        {
          id: 2,
          name: "Milk",
          quantity: 1,
          expiry_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        },
        {
          id: 3,
          name: "Bread",
          quantity: 2,
          expiry_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      ];
      setPantryItems(demoItems);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadExpiringItems = useCallback(async () => {
    try {
      const items = await trpc.getExpiringItems.query({ days_ahead: 7 });
      setExpiringItems(items);
    } catch (err) {
      console.warn('Backend not available for expiring items, will filter from demo data:', err);
      // Filter demo items that expire within 7 days
      const expiringDemoItems = pantryItems.filter((item: PantryItem) => {
        const daysDiff = Math.ceil((item.expiry_date.getTime() - Date.now()) / (1000 * 3600 * 24));
        return daysDiff <= 7 && daysDiff >= 0;
      });
      setExpiringItems(expiringDemoItems);
    }
  }, [pantryItems]);

  useEffect(() => {
    loadPantryItems();
    loadExpiringItems();
  }, [loadPantryItems, loadExpiringItems]);

  const handleItemAdded = useCallback((newItem: PantryItem) => {
    setPantryItems((prev: PantryItem[]) => [...prev, newItem]);
    loadExpiringItems(); // Refresh expiring items
  }, [loadExpiringItems]);

  const handleItemUpdated = useCallback((updatedItem: PantryItem) => {
    setPantryItems((prev: PantryItem[]) => 
      prev.map((item: PantryItem) => item.id === updatedItem.id ? updatedItem : item)
    );
    loadExpiringItems(); // Refresh expiring items
  }, [loadExpiringItems]);

  const handleItemDeleted = useCallback((deletedId: number) => {
    setPantryItems((prev: PantryItem[]) => prev.filter((item: PantryItem) => item.id !== deletedId));
    setExpiringItems((prev: PantryItem[]) => prev.filter((item: PantryItem) => item.id !== deletedId));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-4">
        <div className="container mx-auto max-w-4xl">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      <div className="container mx-auto max-w-6xl p-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
            🥘 Smart Pantry Manager
          </h1>
          <p className="text-gray-600">
            Keep track of your ingredients and get recipe suggestions
          </p>
          <div className="mt-2 text-xs text-amber-600 bg-amber-50 inline-block px-3 py-1 rounded-full border border-amber-200">
            ⚠️ Demo Mode: Backend handlers not implemented yet - showing sample data
          </div>
        </div>

        {/* Expiring Items Alert */}
        {expiringItems.length > 0 && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>⚠️ {expiringItems.length} item(s) expiring soon!</strong> Check the "Expiring Soon" tab to see details.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="pantry" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="pantry" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Pantry Items
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              ➕ Add Item
            </TabsTrigger>
            <TabsTrigger value="expiring" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Expiring Soon
              {expiringItems.length > 0 && (
                <span className="ml-1 bg-amber-500 text-white text-xs rounded-full px-2 py-0.5">
                  {expiringItems.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="recipes" className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              Recipes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pantry">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-600" />
                  Your Pantry ({pantryItems.length} items)
                </CardTitle>
                <CardDescription>
                  All your pantry items in one place
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PantryItemList 
                  items={pantryItems}
                  isLoading={isLoading}
                  onItemUpdated={handleItemUpdated}
                  onItemDeleted={handleItemDeleted}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ➕ Add New Item
                </CardTitle>
                <CardDescription>
                  Add a new item to your pantry
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PantryItemForm onItemAdded={handleItemAdded} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expiring">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  Expiring Soon
                </CardTitle>
                <CardDescription>
                  Items that will expire within the next 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExpiringItems items={expiringItems} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recipes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-green-600" />
                  Recipe Suggestions
                </CardTitle>
                <CardDescription>
                  Get recipe ideas based on your pantry items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecipeSuggestions pantryItems={pantryItems} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
