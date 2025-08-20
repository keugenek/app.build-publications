import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { Plus, Edit, Trash2, DollarSign, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import type { Transaction, CreateTransactionInput, Category, UpdateTransactionInput } from '../../../server/src/schema';

export function TransactionManager() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [formData, setFormData] = useState<CreateTransactionInput>({
    amount: 0,
    description: '',
    type: 'expense',
    category_id: 0,
    transaction_date: new Date()
  });

  const loadTransactions = useCallback(async () => {
    try {
      const result = await trpc.getTransactions.query();
      setTransactions(result);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.getCategories.query();
      setCategories(result);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
    loadCategories();
  }, [loadTransactions, loadCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingTransaction) {
        const updateData: UpdateTransactionInput = {
          id: editingTransaction.id,
          amount: formData.amount,
          description: formData.description,
          type: formData.type,
          category_id: formData.category_id,
          transaction_date: formData.transaction_date
        };
        const updatedTransaction = await trpc.updateTransaction.mutate(updateData);
        setTransactions((prev: Transaction[]) => 
          prev.map((t: Transaction) => t.id === editingTransaction.id ? updatedTransaction : t)
        );
        setEditingTransaction(null);
      } else {
        const newTransaction = await trpc.createTransaction.mutate(formData);
        setTransactions((prev: Transaction[]) => [...prev, newTransaction]);
      }
      
      // Reset form
      setFormData({
        amount: 0,
        description: '',
        type: 'expense',
        category_id: 0,
        transaction_date: new Date()
      });
    } catch (error) {
      console.error('Failed to save transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      amount: transaction.amount,
      description: transaction.description,
      type: transaction.type,
      category_id: transaction.category_id,
      transaction_date: transaction.transaction_date
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteTransaction.mutate(id);
      setTransactions((prev: Transaction[]) => prev.filter((t: Transaction) => t.id !== id));
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const cancelEdit = () => {
    setEditingTransaction(null);
    setFormData({
      amount: 0,
      description: '',
      type: 'expense',
      category_id: 0,
      transaction_date: new Date()
    });
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c: Category) => c.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const getCategoryColor = (categoryId: number) => {
    const category = categories.find((c: Category) => c.id === categoryId);
    return category?.color || '#6B7280';
  };

  return (
    <div className="space-y-6">
      {/* Add/Edit Transaction Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Amount</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateTransactionInput) => ({ 
                      ...prev, 
                      amount: parseFloat(e.target.value) || 0 
                    }))
                  }
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: 'income' | 'expense') => 
                    setFormData((prev: CreateTransactionInput) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">💰 Income</SelectItem>
                    <SelectItem value="expense">💸 Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select 
                  value={formData.category_id.toString()} 
                  onValueChange={(value: string) => 
                    setFormData((prev: CreateTransactionInput) => ({ 
                      ...prev, 
                      category_id: parseInt(value) 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category: Category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color || '#6B7280' }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Date</label>
                <Input
                  type="date"
                  value={formData.transaction_date instanceof Date 
                    ? formData.transaction_date.toISOString().split('T')[0]
                    : new Date(formData.transaction_date).toISOString().split('T')[0]
                  }
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateTransactionInput) => ({ 
                      ...prev, 
                      transaction_date: new Date(e.target.value)
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                placeholder="Enter transaction description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateTransactionInput) => ({ 
                    ...prev, 
                    description: e.target.value 
                  }))
                }
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading || formData.category_id === 0}>
                {isLoading ? 'Saving...' : editingTransaction ? 'Update Transaction' : 'Add Transaction'}
              </Button>
              {editingTransaction && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No transactions yet. Add your first transaction above! 💳
            </p>
          ) : (
            <div className="space-y-4">
              {transactions
                .sort((a: Transaction, b: Transaction) => 
                  new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
                )
                .map((transaction: Transaction) => (
                  <div 
                    key={transaction.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        {transaction.type === 'income' ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                        <Badge 
                          variant={transaction.type === 'income' ? 'default' : 'secondary'}
                          className="text-xs mt-1"
                        >
                          {transaction.type}
                        </Badge>
                      </div>

                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getCategoryColor(transaction.category_id) }}
                      />

                      <div>
                        <h3 className="font-medium">{transaction.description}</h3>
                        <p className="text-sm text-gray-500">
                          {getCategoryName(transaction.category_id)} • {' '}
                          <Calendar className="inline h-3 w-3" />
                          {new Date(transaction.transaction_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`text-lg font-bold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </span>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(transaction)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this transaction? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(transaction.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
