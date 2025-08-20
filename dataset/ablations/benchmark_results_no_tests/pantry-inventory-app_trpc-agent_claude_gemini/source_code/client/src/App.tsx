import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Clock, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { PantryItem, CreatePantryItemInput, PantryItemWithStatus } from '../../server/src/schema';

function App() {
  const [allItems, setAllItems] = useState<PantryItem[]>([]);
  const [itemsWithStatus, setItemsWithStatus] = useState<PantryItemWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [hasBackendData, setHasBackendData] = useState(false);

  const [formData, setFormData] = useState<CreatePantryItemInput>({
    name: '',
    quantity: 1,
    expiry_date: new Date()
  });

  const loadAllItems = useCallback(async () => {
    try {
      const result = await trpc.getAllPantryItems.query();
      setAllItems(result);
      setHasBackendData(result.length > 0);
    } catch (error) {
      console.error('Failed to load pantry items:', error);
      setHasBackendData(false);
    }
  }, []);

  const loadItemsWithStatus = useCallback(async () => {
    try {
      const result = await trpc.getItemsWithExpiryStatus.query({ days_ahead: 7 });
      setItemsWithStatus(result);
      setHasBackendData(result.length > 0);
    } catch (error) {
      console.error('Failed to load items with status:', error);
      setHasBackendData(false);
    }
  }, []);

  useEffect(() => {
    loadAllItems();
    loadItemsWithStatus();
  }, [loadAllItems, loadItemsWithStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createPantryItem.mutate(formData);
      setAllItems((prev: PantryItem[]) => [...prev, response]);
      // Reset form
      setFormData({
        name: '',
        quantity: 1,
        expiry_date: new Date()
      });
      // Reload items with status to update the categorized views
      await loadItemsWithStatus();
      setHasBackendData(true);
    } catch (error) {
      console.error('Failed to create pantry item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deletePantryItem.mutate({ id });
      setAllItems((prev: PantryItem[]) => prev.filter(item => item.id !== id));
      setItemsWithStatus((prev: PantryItemWithStatus[]) => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const getExpiryBadge = (item: PantryItemWithStatus) => {
    switch (item.expiry_status) {
      case 'expired':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Expired
          </Badge>
        );
      case 'expiring_soon':
        return (
          <Badge variant="outline" className="flex items-center gap-1 border-yellow-500 text-yellow-600">
            <Clock className="w-3 h-3" />
            Expiring Soon
          </Badge>
        );
      case 'fresh':
        return (
          <Badge variant="outline" className="flex items-center gap-1 border-green-500 text-green-600">
            <CheckCircle className="w-3 h-3" />
            Fresh
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysText = (days: number) => {
    if (days < 0) {
      return `Expired ${Math.abs(days)} days ago`;
    } else if (days === 0) {
      return 'Expires today';
    } else if (days === 1) {
      return 'Expires tomorrow';
    } else {
      return `Expires in ${days} days`;
    }
  };

  // Filter items by status
  const expiredItems = itemsWithStatus.filter(item => item.expiry_status === 'expired');
  const expiringSoonItems = itemsWithStatus.filter(item => item.expiry_status === 'expiring_soon');
  const freshItems = itemsWithStatus.filter(item => item.expiry_status === 'fresh');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
            🥫 Pantry Manager
          </h1>
          <p className="text-gray-600">Keep track of your pantry items and never let food go to waste!</p>
        </div>

        {/* Add New Item Form */}
        <Card className="mb-8 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Item
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Item name (e.g., Milk, Bread, Apples)"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePantryItemInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  className="text-lg"
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={formData.quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePantryItemInput) => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))
                  }
                  min="1"
                  required
                  className="text-lg"
                />
              </div>
              <div>
                <Input
                  type="date"
                  value={formData.expiry_date.toISOString().split('T')[0]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePantryItemInput) => ({ ...prev, expiry_date: new Date(e.target.value) }))
                  }
                  required
                  className="text-lg"
                />
              </div>
              <div className="md:col-span-4">
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-lg py-6"
                >
                  {isLoading ? 'Adding Item...' : '✨ Add to Pantry'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Backend Status Notice */}
        {!hasBackendData && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-yellow-700">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Backend Implementation Note:</span>
                <span>The backend handlers are currently stubs. Items you add will work for this session, but won't persist after refresh.</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pantry Items Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-md">
            <TabsTrigger value="all" className="flex items-center gap-2">
              📦 All Items ({allItems.length})
            </TabsTrigger>
            <TabsTrigger value="expired" className="flex items-center gap-2 text-red-600">
              ⚠️ Expired ({expiredItems.length})
            </TabsTrigger>
            <TabsTrigger value="expiring" className="flex items-center gap-2 text-yellow-600">
              ⏰ Expiring Soon ({expiringSoonItems.length})
            </TabsTrigger>
            <TabsTrigger value="fresh" className="flex items-center gap-2 text-green-600">
              ✅ Fresh ({freshItems.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {allItems.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-6xl mb-4">🏪</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Your pantry is empty!</h3>
                <p className="text-gray-500">Add some items above to get started managing your pantry.</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {allItems.map((item: PantryItem) => (
                  <Card key={item.id} className="shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-800">{item.name}</h3>
                          <div className="flex items-center gap-4 mt-2 text-gray-600">
                            <span>Quantity: {item.quantity}</span>
                            <span>Expires: {formatDate(item.expiry_date)}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="expired" className="space-y-4">
            {expiredItems.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No expired items!</h3>
                <p className="text-gray-500">Great job keeping your pantry fresh!</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {expiredItems.map((item: PantryItemWithStatus) => (
                  <Card key={item.id} className="shadow-md border-red-200 bg-red-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-800">{item.name}</h3>
                            {getExpiryBadge(item)}
                          </div>
                          <div className="flex items-center gap-4 text-gray-600">
                            <span>Quantity: {item.quantity}</span>
                            <span>Expired: {formatDate(item.expiry_date)}</span>
                            <span className="font-medium text-red-600">{getDaysText(item.days_until_expiry)}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:bg-red-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="expiring" className="space-y-4">
            {expiringSoonItems.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-6xl mb-4">⏰</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No items expiring soon!</h3>
                <p className="text-gray-500">Your pantry items have good expiry dates.</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {expiringSoonItems.map((item: PantryItemWithStatus) => (
                  <Card key={item.id} className="shadow-md border-yellow-200 bg-yellow-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-800">{item.name}</h3>
                            {getExpiryBadge(item)}
                          </div>
                          <div className="flex items-center gap-4 text-gray-600">
                            <span>Quantity: {item.quantity}</span>
                            <span>Expires: {formatDate(item.expiry_date)}</span>
                            <span className="font-medium text-yellow-600">{getDaysText(item.days_until_expiry)}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="fresh" className="space-y-4">
            {freshItems.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-6xl mb-4">🌱</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No fresh items yet!</h3>
                <p className="text-gray-500">Add some items with longer expiry dates.</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {freshItems.map((item: PantryItemWithStatus) => (
                  <Card key={item.id} className="shadow-md border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-800">{item.name}</h3>
                            {getExpiryBadge(item)}
                          </div>
                          <div className="flex items-center gap-4 text-gray-600">
                            <span>Quantity: {item.quantity}</span>
                            <span>Expires: {formatDate(item.expiry_date)}</span>
                            <span className="font-medium text-green-600">{getDaysText(item.days_until_expiry)}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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
