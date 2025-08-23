import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import type { PantryItem, CreatePantryItemInput } from '../../server/src/schema';

function App() {
  // State for pantry items
  const [items, setItems] = useState<PantryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreatePantryItemInput>({
    name: '',
    quantity: 1,
    expiry_date: new Date(),
  });

  // Load items from server
  const loadItems = useCallback(async () => {
    try {
      const result = await trpc.getPantryItems.query();
      setItems(result);
    } catch (error) {
      console.error('Failed to fetch pantry items:', error);
      toast.error('Unable to load pantry items');
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Notify about items expiring within 7 days
  useEffect(() => {
    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(now.getDate() + 7);
    items.forEach((item) => {
      const expiry = new Date(item.expiry_date);
      if (expiry >= now && expiry <= sevenDaysLater) {
        toast.warning(`${item.name} expires on ${expiry.toLocaleDateString()}`);
      }
    });
  }, [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const created = await trpc.createPantryItem.mutate(formData);
      setItems((prev) => [...prev, created]);
      // Reset form
      setFormData({
        name: '',
        quantity: 1,
        expiry_date: new Date(),
      });
      toast.success('Pantry item added');
    } catch (error) {
      console.error('Failed to create pantry item:', error);
      toast.error('Could not add pantry item');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Toaster />
      <h1 className="text-2xl font-bold mb-4">Pantry Manager</h1>
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-4 mb-8">
        <Input
          placeholder="Item name"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          required
        />
        <Input
          type="number"
          placeholder="Quantity"
          value={formData.quantity}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))
          }
          min="1"
          required
        />
        <Input
          type="date"
          placeholder="Expiry date"
          value={
            // Convert Date to YYYY-MM-DD for input value
            formData.expiry_date instanceof Date
              ? formData.expiry_date.toISOString().split('T')[0]
              : ''
          }
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, expiry_date: new Date(e.target.value) }))
          }
          required
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Adding...' : 'Add Item'}
        </Button>
      </form>

      {items.length === 0 ? (
        <p className="text-gray-500">No pantry items yet. Add one above!</p>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => {
            const expiry = new Date(item.expiry_date);
            const isNear = (() => {
              const now = new Date();
              const diff = expiry.getTime() - now.getTime();
              return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
            })();
            return (
              <div
                key={item.id}
                className={`border p-4 rounded-md ${isNear ? 'border-yellow-500 bg-yellow-50' : ''}`}
              >
                <h2 className="text-xl font-semibold">{item.name}</h2>
                <p className="text-gray-600">Quantity: {item.quantity}</p>
                <p className="text-gray-600">
                  Expiry: {expiry.toLocaleDateString()}
                </p>
                {isNear && (
                  <p className="text-sm text-yellow-700 mt-1">Expires soon!</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Created: {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default App;
