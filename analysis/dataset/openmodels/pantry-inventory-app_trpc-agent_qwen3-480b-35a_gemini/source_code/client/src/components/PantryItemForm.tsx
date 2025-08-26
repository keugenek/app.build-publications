import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import type { CreatePantryItemInput } from '../../../server/src/schema';

interface PantryItemFormProps {
  onSubmit: (data: CreatePantryItemInput) => Promise<void>;
  isLoading?: boolean;
}

export function PantryItemForm({ onSubmit, isLoading = false }: PantryItemFormProps) {
  const [formData, setFormData] = useState<CreatePantryItemInput>({
    name: '',
    quantity: 1,
    expiry_date: new Date()
  });
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    // Reset form after successful submission
    setFormData({
      name: '',
      quantity: 1,
      expiry_date: new Date()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-white dark:bg-gray-800">
      <h2 className="text-xl font-semibold">Add New Item</h2>
      
      <div>
        <label className="block text-sm font-medium mb-1">Item Name</label>
        <Input
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="e.g., Apples, Milk, Bread"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Quantity</label>
        <Input
          type="number"
          value={formData.quantity}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))
          }
          min="1"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Expiry Date</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(formData.expiry_date, 'PPP')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={formData.expiry_date}
              onSelect={(date) => {
                if (date) {
                  setFormData((prev) => ({ ...prev, expiry_date: date }));
                  setOpen(false);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Adding...' : 'Add to Pantry'}
      </Button>
    </form>
  );
}
