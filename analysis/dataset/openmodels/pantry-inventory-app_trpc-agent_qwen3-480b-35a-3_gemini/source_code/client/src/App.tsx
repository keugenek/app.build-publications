import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { CalendarIcon, PlusIcon, ClockIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trpc } from '@/utils/trpc';
import type { PantryItem, CreatePantryItemInput, UpdatePantryItemInput, Category, ExpiringItem, RecipeSuggestion } from '../../server/src/schema';

function App() {
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  const [formData, setFormData] = useState<CreatePantryItemInput>({
    name: '',
    quantity: 1,
    expiry_date: new Date(),
    category: 'Other'
  });

  const loadPantryItems = useCallback(async () => {
    try {
      const items = await trpc.getPantryItems.query();
      setPantryItems(items);
    } catch (error) {
      console.error('Failed to load pantry items:', error);
    }
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (editingItem) {
        // Update existing item
        const updateData: UpdatePantryItemInput = {
          id: editingItem.id,
          name: formData.name || undefined,
          quantity: formData.quantity,
          expiry_date: formData.expiry_date,
          category: formData.category
        };
        
        const updatedItem = await trpc.updatePantryItem.mutate(updateData);
        setPantryItems(prev => prev.map(item => 
          item.id === updatedItem.id ? updatedItem : item
        ));
      } else {
        // Create new item
        const newItem = await trpc.createPantryItem.mutate(formData);
        setPantryItems(prev => [...prev, newItem]);
      }
      
      // Reset form and close dialog
      setFormData({
        name: '',
        quantity: 1,
        expiry_date: new Date(),
        category: 'Other'
      });
      setEditingItem(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deletePantryItem.mutate(id);
      setPantryItems(prev => prev.filter(item => item.id !== id));
      setExpiringItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const openEditDialog = (item: PantryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity,
      expiry_date: item.expiry_date,
      category: item.category
    });
    setSelectedDate(item.expiry_date);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      quantity: 1,
      expiry_date: new Date(),
      category: 'Other'
    });
    setSelectedDate(new Date());
    setIsDialogOpen(true);
  };

  const handleGetRecipes = async () => {
    try {
      const itemIds = pantryItems.map(item => item.id);
      const suggestions = await trpc.getRecipeSuggestions.query({ pantry_items: itemIds });
      setRecipes(suggestions);
    } catch (error) {
      console.error('Failed to get recipe suggestions:', error);
    }
  };

  const getCategoryColor = (category: Category) => {
    const colors: Record<Category, string> = {
      'Dairy': 'bg-blue-100 text-blue-800',
      'Produce': 'bg-green-100 text-green-800',
      'Canned Goods': 'bg-yellow-100 text-yellow-800',
      'Grains': 'bg-amber-100 text-amber-800',
      'Condiments': 'bg-red-100 text-red-800',
      'Beverages': 'bg-purple-100 text-purple-800',
      'Snacks': 'bg-orange-100 text-orange-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[category];
  };

  const getExpiryColor = (days: number) => {
    if (days < 0) return 'text-red-600 font-bold';
    if (days <= 2) return 'text-red-500';
    if (days <= 5) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Pantry Manager</h1>
          <p className="text-gray-600">Track your pantry items and reduce food waste</p>
        </header>

        {/* Expiring Items Alert */}
        {expiringItems.length > 0 && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <ClockIcon className="h-4 w-4" />
            <AlertDescription>
              <h3 className="font-semibold mb-2">Expiring Soon!</h3>
              <div className="space-y-1">
                {expiringItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <span>{item.name}</span>
                    <span className={getExpiryColor(item.days_until_expiry)}>
                      {item.days_until_expiry < 0 
                        ? `${Math.abs(item.days_until_expiry)} days ago` 
                        : `in ${item.days_until_expiry} days`}
                    </span>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Button onClick={openCreateDialog} className="flex-1">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add New Item
          </Button>
          <Button onClick={handleGetRecipes} variant="outline" className="flex-1">
            Get Recipe Suggestions
          </Button>
        </div>

        {/* Pantry Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {pantryItems.map(item => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <Badge className={getCategoryColor(item.category)}>
                    {item.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{item.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expires:</span>
                    <span className={getExpiryColor(
                      Math.ceil((item.expiry_date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    )}>
                      {format(item.expiry_date, 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openEditDialog(item)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {pantryItems.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 mb-4">Your pantry is empty</p>
              <Button onClick={openCreateDialog}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Your First Item
              </Button>
            </div>
          )}
        </div>

        {/* Recipe Suggestions */}
        {recipes.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recipe Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recipes.map(recipe => (
                  <Card key={recipe.id}>
                    <CardHeader>
                      <CardTitle className="text-xl">{recipe.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-3">
                        <h4 className="font-semibold mb-1">Ingredients:</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {recipe.ingredients.map((ingredient, idx) => (
                            <li key={idx}>{ingredient}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Instructions:</h4>
                        <p>{recipe.instructions}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Item Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Item name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: Category) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dairy">Dairy</SelectItem>
                    <SelectItem value="Produce">Produce</SelectItem>
                    <SelectItem value="Canned Goods">Canned Goods</SelectItem>
                    <SelectItem value="Grains">Grains</SelectItem>
                    <SelectItem value="Condiments">Condiments</SelectItem>
                    <SelectItem value="Beverages">Beverages</SelectItem>
                    <SelectItem value="Snacks">Snacks</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        if (date) {
                          setFormData(prev => ({ ...prev, expiry_date: date }));
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : editingItem ? 'Update' : 'Add Item'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
