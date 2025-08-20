import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { EditIcon, TrashIcon, PlusIcon } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Category, Transaction, CreateTransactionInput, TransactionType } from '../../../server/src/schema';

interface TransactionManagerProps {
  categories: Category[];
  transactions: Transaction[];
  onTransactionCreate: (transaction: Transaction) => void;
  onTransactionUpdate: (transaction: Transaction) => void;
  onTransactionDelete: (transactionId: number) => void;
}

export function TransactionManager({
  categories,
  transactions,
  onTransactionCreate,
  onTransactionUpdate,
  onTransactionDelete
}: TransactionManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Form state
  const [formData, setFormData] = useState<CreateTransactionInput>({
    amount: 0,
    date: new Date(),
    description: '',
    type: 'expense' as TransactionType,
    category_id: categories[0]?.id || 0
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      amount: 0,
      date: new Date(),
      description: '',
      type: 'expense' as TransactionType,
      category_id: categories[0]?.id || 0
    });
    setIsCreating(false);
    setEditingTransaction(null);
  };

  // Handle create transaction
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (categories.length === 0) {
      alert('Please create at least one category first.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await trpc.createTransaction.mutate(formData);
      onTransactionCreate(response);
      resetForm();
    } catch (error) {
      console.error('Failed to create transaction:', error);
      alert('Failed to create transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle update transaction
  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    setIsLoading(true);
    try {
      const updateData = {
        id: editingTransaction.id,
        ...formData
      };
      const response = await trpc.updateTransaction.mutate(updateData);
      onTransactionUpdate(response);
      resetForm();
    } catch (error) {
      console.error('Failed to update transaction:', error);
      alert('Failed to update transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete transaction
  const handleDeleteTransaction = async (transactionId: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteTransaction.mutate({ id: transactionId });
      onTransactionDelete(transactionId);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      alert('Failed to delete transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Start editing
  const startEditing = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      amount: transaction.amount,
      date: transaction.date,
      description: transaction.description,
      type: transaction.type,
      category_id: transaction.category_id
    });
    setIsCreating(true);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((t: Transaction) => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  // Get category name for display
  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c: Category) => c.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  // Show placeholder when no categories exist
  if (categories.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-300 bg-gray-50/50">
        <CardContent className="p-12 text-center">
          <div className="text-6xl mb-4">🏷️</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No categories available
          </h3>
          <p className="text-gray-500 mb-6">
            You need to create at least one category before you can add transactions.
            <br />
            <em className="text-sm">Note: Backend is currently using stub data - category creation will work once the database is connected.</em>
          </p>
          <Button 
            onClick={() => {
              const categoryTab = document.querySelector('[value="categories"]') as HTMLElement;
              if (categoryTab) categoryTab.click();
            }}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Create Categories First
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Transaction Button */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                💳 Transaction Management
              </CardTitle>
              <CardDescription>
                Log your income and expenses to track your financial activity
              </CardDescription>
            </div>
            <Button 
              onClick={() => setIsCreating(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={isCreating}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Transaction Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingTransaction ? handleUpdateTransaction : handleCreateTransaction} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Amount ($)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateTransactionInput) => ({ 
                        ...prev, 
                        amount: parseFloat(e.target.value) || 0 
                      }))
                    }
                    required
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={formData.date.toISOString().split('T')[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateTransactionInput) => ({ 
                        ...prev, 
                        date: new Date(e.target.value) 
                      }))
                    }
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Type
                  </label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: TransactionType) =>
                      setFormData((prev: CreateTransactionInput) => ({ 
                        ...prev, 
                        type: value 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">💰 Income</SelectItem>
                      <SelectItem value="expense">💸 Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Category
                  </label>
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
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category: Category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateTransactionInput) => ({ 
                      ...prev, 
                      description: e.target.value 
                    }))
                  }
                  placeholder="Enter transaction description..."
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isLoading ? 'Saving...' : editingTransaction ? 'Update Transaction' : 'Add Transaction'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                {filteredTransactions.length} {filter === 'all' ? 'transactions' : filter + ' transactions'} found
              </CardDescription>
            </div>
            <Select value={filter} onValueChange={(value: 'all' | 'income' | 'expense') => setFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expenses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">💳</div>
              <p className="text-lg mb-2">
                {filter === 'all' ? 'No transactions yet' : `No ${filter} transactions found`}
              </p>
              <p className="text-sm">
                {filter === 'all' 
                  ? 'Add your first transaction to get started!' 
                  : `Switch to "All" to see other transaction types.`
                }
              </p>
              {transactions.length === 0 && (
                <p className="text-xs text-gray-400 mt-4">
                  <em>Note: Backend is currently using stub data - transaction logging will work once the database is connected.</em>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction: Transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <Badge 
                        variant={transaction.type === 'income' ? 'default' : 'secondary'}
                        className={transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {transaction.type === 'income' ? '💰' : '💸'} 
                        {transaction.type}
                      </Badge>
                      <span className={`text-lg font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${transaction.amount.toFixed(2)}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span>📅 {transaction.date.toLocaleDateString()}</span>
                      <span>🏷️ {getCategoryName(transaction.category_id)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing(transaction)}
                      disabled={isLoading}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={isLoading}>
                          <TrashIcon className="h-4 w-4" />
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
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
