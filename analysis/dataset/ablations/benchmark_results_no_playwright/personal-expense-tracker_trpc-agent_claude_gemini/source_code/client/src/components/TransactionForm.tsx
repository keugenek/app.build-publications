import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import type { CreateTransactionInput, Transaction, Category, TransactionType } from '../../../server/src/schema';

interface TransactionFormProps {
  categories: Category[];
  onTransactionCreated: (transaction: Transaction) => void;
  initialData?: Partial<CreateTransactionInput>;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
}

export function TransactionForm({ 
  categories, 
  onTransactionCreated, 
  initialData,
  onCancel,
  mode = 'create'
}: TransactionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTransactionInput>({
    type: initialData?.type || 'expense',
    amount: initialData?.amount || 0,
    description: initialData?.description || '',
    date: initialData?.date || new Date(),
    category_id: initialData?.category_id || null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const transaction = await trpc.createTransaction.mutate(formData);
      onTransactionCreated(transaction);
      
      // Reset form if creating new transaction
      if (mode === 'create') {
        setFormData({
          type: 'expense',
          amount: 0,
          description: '',
          date: new Date(),
          category_id: null
        });
      }
    } catch (error) {
      console.error('Failed to create transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Type */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Transaction Type</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(value: TransactionType) => 
                setFormData((prev: CreateTransactionInput) => ({ ...prev, type: value }))
              }
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="income" id="income" />
                <Label htmlFor="income" className="flex items-center gap-2 cursor-pointer">
                  💰 Income
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expense" id="expense" />
                <Label htmlFor="expense" className="flex items-center gap-2 cursor-pointer">
                  💸 Expense
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-base font-semibold">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.amount || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateTransactionInput) => ({ 
                  ...prev, 
                  amount: parseFloat(e.target.value) || 0 
                }))
              }
              required
              className="text-lg"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-semibold">Description</Label>
            <Input
              id="description"
              placeholder="Enter transaction description..."
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateTransactionInput) => ({ 
                  ...prev, 
                  description: e.target.value 
                }))
              }
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-base font-semibold">Date</Label>
            <Input
              id="date"
              type="date"
              value={formatDateForInput(formData.date)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateTransactionInput) => ({ 
                  ...prev, 
                  date: new Date(e.target.value) 
                }))
              }
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Category (Optional)</Label>
            <Select
              value={formData.category_id?.toString() || 'none'}
              onValueChange={(value: string) =>
                setFormData((prev: CreateTransactionInput) => ({ 
                  ...prev, 
                  category_id: value === 'none' ? null : parseInt(value) 
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Category</SelectItem>
                {categories.map((category: Category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.is_predefined ? '🏷️' : '📝'} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Processing...' : mode === 'create' ? '➕ Add Transaction' : '💾 Update Transaction'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
