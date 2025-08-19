import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

import { trpc } from '@/utils/trpc';
import { useState } from 'react';

import type { Transaction, Category, CreateTransactionInput } from '../../../server/src/schema';

interface TransactionFormProps {
  categories: Category[];
  onTransactionCreated: (transaction: Transaction) => void;
}

export function TransactionForm({ categories, onTransactionCreated }: TransactionFormProps) {
  const [formData, setFormData] = useState<CreateTransactionInput>({
    description: '',
    amount: 0,
    type: 'expense',
    category_id: null,
    transaction_date: new Date()
  });
  const [isLoading, setIsLoading] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await trpc.createTransaction.mutate(formData);
      onTransactionCreated(response);
      
      // Reset form
      setFormData({
        description: '',
        amount: 0,
        type: 'expense',
        category_id: null,
        transaction_date: new Date()
      });
    } catch (error) {
      console.error('Failed to create transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeChange = (type: 'income' | 'expense') => {
    setFormData((prev: CreateTransactionInput) => ({ ...prev, type }));
  };

  const handleCategoryChange = (value: string) => {
    const categoryId = value === 'none' ? null : parseInt(value);
    setFormData((prev: CreateTransactionInput) => ({ ...prev, category_id: categoryId }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData((prev: CreateTransactionInput) => ({ ...prev, transaction_date: date }));
      setDatePickerOpen(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transaction Type */}
        <div className="space-y-3">
          <Label htmlFor="type" className="text-sm font-medium">
            Transaction Type *
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={formData.type === 'income' ? 'default' : 'outline'}
              className={`h-12 ${
                formData.type === 'income' 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'border-green-300 text-green-700 hover:bg-green-50'
              }`}
              onClick={() => handleTypeChange('income')}
            >
              💰 Income
            </Button>
            <Button
              type="button"
              variant={formData.type === 'expense' ? 'default' : 'outline'}
              className={`h-12 ${
                formData.type === 'expense' 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'border-red-300 text-red-700 hover:bg-red-50'
              }`}
              onClick={() => handleTypeChange('expense')}
            >
              💸 Expense
            </Button>
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-3">
          <Label htmlFor="amount" className="text-sm font-medium">
            Amount *
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
              $
            </span>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={formData.amount || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateTransactionInput) => ({ 
                  ...prev, 
                  amount: parseFloat(e.target.value) || 0 
                }))
              }
              className="pl-8 h-12"
              step="0.01"
              min="0"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-3">
          <Label htmlFor="description" className="text-sm font-medium">
            Description *
          </Label>
          <Input
            id="description"
            placeholder="What was this transaction for?"
            value={formData.description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateTransactionInput) => ({ 
                ...prev, 
                description: e.target.value 
              }))
            }
            className="h-12"
            required
          />
        </div>

        {/* Category */}
        <div className="space-y-3">
          <Label htmlFor="category" className="text-sm font-medium">
            Category
          </Label>
          <Select 
            value={formData.category_id?.toString() || 'none'} 
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select a category (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-gray-500">No category</span>
              </SelectItem>
              {categories.map((category: Category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {categories.length === 0 && (
            <p className="text-sm text-amber-600">
              💡 Tip: Create some categories first to better organize your transactions
            </p>
          )}
        </div>

        {/* Date */}
        <div className="space-y-3 md:col-span-2">
          <Label htmlFor="date" className="text-sm font-medium">
            Transaction Date *
          </Label>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full h-12 justify-start text-left font-normal ${
                  !formData.transaction_date ? 'text-gray-400' : ''
                }`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.transaction_date ? (
                  formData.transaction_date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={formData.transaction_date}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Preview Card */}
      <Card className={`border-2 ${
        formData.type === 'income' 
          ? 'border-green-200 bg-green-50' 
          : 'border-red-200 bg-red-50'
      }`}>
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">Transaction Preview:</h3>
          <div className="text-sm space-y-1">
            <p>
              <span className="font-medium">Type:</span> 
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                formData.type === 'income' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {formData.type === 'income' ? '💰 Income' : '💸 Expense'}
              </span>
            </p>
            <p>
              <span className="font-medium">Amount:</span> 
              <span className={`ml-2 font-bold ${
                formData.type === 'income' ? 'text-green-700' : 'text-red-700'
              }`}>
                ${formData.amount.toFixed(2)}
              </span>
            </p>
            {formData.description && (
              <p>
                <span className="font-medium">Description:</span> 
                <span className="ml-2">{formData.description}</span>
              </p>
            )}
            {formData.category_id && (
              <p>
                <span className="font-medium">Category:</span> 
                <span className="ml-2">
                  {categories.find(c => c.id === formData.category_id)?.name}
                </span>
              </p>
            )}
            <p>
              <span className="font-medium">Date:</span> 
              <span className="ml-2">
                {formData.transaction_date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button 
        type="submit" 
        disabled={isLoading || !formData.description || formData.amount <= 0}
        className={`w-full h-12 text-lg font-medium ${
          formData.type === 'income'
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        {isLoading ? (
          'Adding Transaction...'
        ) : (
          `Add ${formData.type === 'income' ? '💰 Income' : '💸 Expense'} Transaction`
        )}
      </Button>
    </form>
  );
}
