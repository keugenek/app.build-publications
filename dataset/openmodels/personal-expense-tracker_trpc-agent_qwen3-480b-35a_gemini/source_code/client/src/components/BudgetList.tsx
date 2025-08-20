import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import type { Budget, Transaction, Category } from '../../../server/src/schema';

interface BudgetListProps {
  budgets: Budget[];
  transactions: Transaction[];
  onBudgetUpdated: (budget: Budget) => void;
  onBudgetDeleted: (id: number) => void;
}

export function BudgetList({ 
  budgets, 
  transactions, 
  onBudgetUpdated, 
  onBudgetDeleted 
}: BudgetListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    category: Category;
    amount: number;
    month: number;
    year: number;
  }>({
    category: 'Food',
    amount: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const handleEdit = (budget: Budget) => {
    setEditingId(budget.id);
    setEditForm({
      category: budget.category,
      amount: budget.amount,
      month: budget.month,
      year: budget.year,
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    
    try {
      const updatedBudget = await trpc.updateBudget.mutate({
        id: editingId,
        category: editForm.category,
        amount: editForm.amount,
        month: editForm.month,
        year: editForm.year,
      });
      
      onBudgetUpdated(updatedBudget);
      setEditingId(null);
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteBudget.mutate(id);
      onBudgetDeleted(id);
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  const handleChange = (field: keyof typeof editForm, value: string | number) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // Calculate spent amount for each budget
  const calculateSpent = (budget: Budget) => {
    return transactions
      .filter(t => 
        t.type === 'expense' && 
        t.category === budget.category &&
        t.date.getMonth() + 1 === budget.month &&
        t.date.getFullYear() === budget.year
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0);
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
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Period</TableHead>
            <TableHead className="text-right">Budget</TableHead>
            <TableHead className="text-right">Spent</TableHead>
            <TableHead className="text-right">Progress</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {budgets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                No budgets found. Set your first budget!
              </TableCell>
            </TableRow>
          ) : (
            budgets.map((budget) => {
              const spent = calculateSpent(budget);
              const progress = Math.min(100, (spent / budget.amount) * 100);
              
              return (
                <TableRow key={budget.id}>
                  {editingId === budget.id ? (
                    <>
                      <TableCell>
                        <Select 
                          value={editForm.category} 
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
                      </TableCell>
                      <TableCell>
                        <div className="grid grid-cols-2 gap-2">
                          <Select 
                            value={editForm.month.toString()} 
                            onValueChange={(value) => handleChange('month', parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                                <SelectItem key={month} value={month.toString()}>
                                  {new Date(2020, month - 1).toLocaleString('default', { month: 'short' })}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Input
                            type="number"
                            value={editForm.year}
                            onChange={(e) => handleChange('year', parseInt(e.target.value) || new Date().getFullYear())}
                            min="2020"
                            max="2100"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={editForm.amount}
                          onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                          step="0.01"
                          min="0"
                        />
                      </TableCell>
                      <TableCell colSpan={2}>
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={handleUpdate}>Save</Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleDelete(budget.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">{budget.category}</TableCell>
                      <TableCell>
                        {new Date(budget.year, budget.month - 1).toLocaleString('default', { month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right font-medium">${budget.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-red-600">-${spent.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="w-full" />
                          <span className="text-xs w-10">{Math.round(progress)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleEdit(budget)}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDelete(budget.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
