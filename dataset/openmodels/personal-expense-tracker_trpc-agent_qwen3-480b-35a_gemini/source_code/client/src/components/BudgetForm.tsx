import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import type { Budget, CreateBudgetInput, Category } from '../../../server/src/schema';

interface BudgetFormProps {
  onBudgetCreated: (budget: Budget) => void;
}

export function BudgetForm({ onBudgetCreated }: BudgetFormProps) {
  const [formData, setFormData] = useState<Omit<CreateBudgetInput, 'month' | 'year'> & { 
    month: number; 
    year: number 
  }>({
    category: 'Food',
    amount: 0,
    month: new Date().getMonth() + 1, // JavaScript months are 0-indexed
    year: new Date().getFullYear(),
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const newBudget = await trpc.createBudget.mutate({
        ...formData,
        amount: Number(formData.amount),
      });
      
      onBudgetCreated(newBudget);
      
      // Reset form
      setFormData({
        category: 'Food',
        amount: 0,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      });
    } catch (error) {
      console.error('Error creating budget:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Define categories array for type safety
  const categories: Category[] = [
    'Food', 
    'Transport', 
    'Utilities', 
    'Salary', 
    'Entertainment', 
    'Healthcare', 
    'Shopping', 
    'Other'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <Select 
          value={formData.category} 
          onValueChange={(value) => handleChange('category', value as Category)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Amount</label>
        <Input
          type="number"
          value={formData.amount}
          onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
          step="0.01"
          min="0"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Month</label>
          <Select 
            value={formData.month.toString()} 
            onValueChange={(value) => handleChange('month', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                <SelectItem key={month} value={month.toString()}>
                  {new Date(2020, month - 1).toLocaleString('default', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Year</label>
          <Input
            type="number"
            value={formData.year}
            onChange={(e) => handleChange('year', parseInt(e.target.value) || new Date().getFullYear())}
            min="2020"
            max="2100"
            required
          />
        </div>
      </div>
      
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Setting...' : 'Set Budget'}
      </Button>
    </form>
  );
}
