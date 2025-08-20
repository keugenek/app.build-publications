import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import type { Transaction, CreateTransactionInput, TransactionType, Category } from '../../../server/src/schema';

interface TransactionFormProps {
  onTransactionCreated: (transaction: Transaction) => void;
}

export function TransactionForm({ onTransactionCreated }: TransactionFormProps) {
  const [formData, setFormData] = useState<Omit<CreateTransactionInput, 'date'> & { date: string }>({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'expense',
    category: 'Food',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const newTransaction = await trpc.createTransaction.mutate({
        ...formData,
        date: new Date(formData.date),
        amount: Number(formData.amount),
        description: formData.description || null,
      });
      
      onTransactionCreated(newTransaction);
      
      // Reset form
      setFormData({
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: '',
        type: 'expense',
        category: 'Food',
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Define types for select options
  const transactionTypes: TransactionType[] = ['income', 'expense'];
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
      
      <div>
        <label className="block text-sm font-medium mb-1">Date</label>
        <Input
          type="date"
          value={formData.date}
          onChange={(e) => handleChange('date', e.target.value)}
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Type</label>
        <Select 
          value={formData.type} 
          onValueChange={(value: TransactionType) => handleChange('type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {transactionTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <Select 
          value={formData.category} 
          onValueChange={(value: Category) => handleChange('category', value)}
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
        <label className="block text-sm font-medium mb-1">Description</label>
        <Textarea
          value={formData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Optional description"
        />
      </div>
      
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Adding...' : 'Add Transaction'}
      </Button>
    </form>
  );
}
