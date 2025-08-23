import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { cn } from '@/lib/utils';
import type { PantryItem, CreatePantryItemInput, RecipeSuggestion } from '../../server/src/schema';

function App() {
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [expiringItems, setExpiringItems] = useState<PantryItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreatePantryItemInput>({
    name: '',
    quantity: 1,
    expiry_date: new Date()
  });
  
  const [date, setDate] = useState<Date | undefined>(new Date());

  const loadPantryItems = useCallback(async () => {
    try {
      const items = await trpc.getPantryItems.query();
      setPantryItems(items);
    } catch {
      console.warn('Backend not implemented yet - using sample data');
      setPantryItems([
        {
          id: 1,
          name: "Milk",
          quantity: 2,
          expiry_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          name: "Bread",
          quantity: 1,
          expiry_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    }
  }, []);

  const loadExpiringItems = useCallback(async () => {
    try {
      const items = await trpc.getExpiringItems.query({ days: 7 });
      setExpiringItems(items);
    } catch {
      console.warn('Backend not implemented yet - using sample data');
      setExpiringItems([
        {
          id: 2,
          name: "Bread",
          quantity: 1,
          expiry_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    }
  }, []);

  const loadRecipes = useCallback(async () => {
    try {
      const suggestions = await trpc.getRecipeSuggestions.query();
      setRecipes(suggestions);
    } catch {
      console.warn('Backend not implemented yet - using sample data');
      setRecipes([
        {
          id: 1,
          name: "Milkshake",
          ingredients: ["Milk", "Banana", "Honey"],
          instructions: "Blend all ingredients until smooth. Serve chilled."
        },
        {
          id: 2,
          name: "French Toast",
          ingredients: ["Bread", "Eggs", "Milk", "Cinnamon"],
          instructions: "Dip bread in egg mixture and fry until golden. Sprinkle with cinnamon."
        }
      ]);
    }
  }, []);

  useEffect(() => {
    loadPantryItems();
    loadExpiringItems();
    loadRecipes();
  }, [loadPantryItems, loadExpiringItems, loadRecipes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const newItem = await trpc.createPantryItem.mutate(formData);
      setPantryItems(prev => [...prev, newItem]);
      
      // Reset form
      setFormData({
        name: '',
        quantity: 1,
        expiry_date: new Date()
      });
      setDate(new Date());
    } catch {
      console.warn('Backend not implemented yet - using sample data');
      const sampleItem = {
        id: Date.now(),
        name: formData.name,
        quantity: formData.quantity,
        expiry_date: formData.expiry_date,
        created_at: new Date(),
        updated_at: new Date()
      };
      setPantryItems(prev => [...prev, sampleItem]);
      
      // Reset form
      setFormData({
        name: '',
        quantity: 1,
        expiry_date: new Date()
      });
      setDate(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  const isItemExpiringSoon = (item: PantryItem) => {
    const today = new Date();
    const expiry = new Date(item.expiry_date);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">Pantry Manager</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Track your food items and reduce waste
          </p>
        </header>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Add Item Form */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Add New Item</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Item Name
                    </label>
                    <Input
                      placeholder="e.g., Milk, Bread, Apples"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData(prev => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantity
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))
                      }
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expiry Date
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(newDate) => {
                            setDate(newDate);
                            if (newDate) {
                              setFormData(prev => ({ ...prev, expiry_date: newDate }));
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Adding...' : 'Add to Pantry'}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Expiring Soon Section */}
            {expiringItems.length > 0 && (
              <Card className="shadow-lg mt-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <CardHeader>
                  <CardTitle className="text-amber-800 dark:text-amber-200">Expiring Soon</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {expiringItems.map(item => (
                      <li key={item.id} className="flex justify-between items-center py-2 border-b border-amber-100 dark:border-amber-800/50">
                        <span className="font-medium text-amber-900 dark:text-amber-100">{item.name}</span>
                        <Badge variant="destructive">
                          {format(new Date(item.expiry_date), 'MMM d')}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Middle Column - Pantry Items */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Your Pantry Items</CardTitle>
              </CardHeader>
              <CardContent>
                {pantryItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">Your pantry is empty</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Add items using the form to get started
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pantryItems.map(item => (
                      <div 
                        key={item.id} 
                        className={`p-4 rounded-lg border ${
                          isItemExpiringSoon(item) 
                            ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' 
                            : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-lg text-gray-800 dark:text-white">
                            {item.name}
                          </h3>
                          <Badge variant={isItemExpiringSoon(item) ? "destructive" : "default"}>
                            {item.quantity}
                          </Badge>
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Expires: {format(new Date(item.expiry_date), 'MMM d, yyyy')}
                          </span>
                          {isItemExpiringSoon(item) && (
                            <Badge variant="destructive" className="text-xs">
                              Expiring Soon
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Recipe Suggestions Section */}
            {recipes.length > 0 && (
              <Card className="shadow-lg mt-6">
                <CardHeader>
                  <CardTitle>Recipe Ideas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recipes.map(recipe => (
                      <div 
                        key={recipe.id} 
                        className="p-4 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                      >
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-white">
                          {recipe.name}
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Ingredients: {recipe.ingredients.join(', ')}
                          </p>
                        </div>
                        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                          {recipe.instructions}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
