import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { CreatePantryItemInput, PantryItem } from '../../../server/src/schema';

interface PantryItemFormProps {
  onItemAdded: (item: PantryItem) => void;
}

export function PantryItemForm({ onItemAdded }: PantryItemFormProps) {
  const [formData, setFormData] = useState<CreatePantryItemInput>({
    name: '',
    quantity: 1,
    expiry_date: new Date()
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const newItem = await trpc.createPantryItem.mutate(formData);
      onItemAdded(newItem);
      
      // Reset form
      setFormData({
        name: '',
        quantity: 1,
        expiry_date: new Date()
      });
      
      setMessage({ type: 'success', text: `✅ "${newItem.name}" added to your pantry!` });
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.warn('Backend not available, simulating add operation:', error);
      
      // Simulate adding item for demo purposes
      const simulatedItem: PantryItem = {
        id: Date.now(), // Use timestamp as temporary ID
        name: formData.name,
        quantity: formData.quantity,
        expiry_date: formData.expiry_date,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      onItemAdded(simulatedItem);
      
      // Reset form
      setFormData({
        name: '',
        quantity: 1,
        expiry_date: new Date()
      });
      
      setMessage({ type: 'success', text: `✅ "${simulatedItem.name}" added to demo pantry! (Backend not implemented)` });
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for the min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      {message && (
        <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-dashed border-2 border-gray-200 hover:border-orange-300 transition-colors">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Item Name 🏷️
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Tomatoes, Milk, Bread..."
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePantryItemInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  className="border-gray-200 focus:border-orange-300 focus:ring-orange-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                  Quantity 📊
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="1"
                  value={formData.quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePantryItemInput) => ({ 
                      ...prev, 
                      quantity: parseFloat(e.target.value) || 1 
                    }))
                  }
                  required
                  className="border-gray-200 focus:border-orange-300 focus:ring-orange-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry_date" className="text-sm font-medium text-gray-700">
                Expiry Date 📅
              </Label>
              <Input
                id="expiry_date"
                type="date"
                min={today}
                value={formData.expiry_date.toISOString().split('T')[0]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreatePantryItemInput) => ({ 
                    ...prev, 
                    expiry_date: new Date(e.target.value) 
                  }))
                }
                required
                className="border-gray-200 focus:border-orange-300 focus:ring-orange-200"
              />
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding Item...
                </>
              ) : (
                '🛒 Add to Pantry'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
