import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { TransactionForm } from './TransactionForm';
import type { Transaction, Category } from '../../../server/src/schema';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  onTransactionUpdated: (transaction: Transaction) => void;
  onTransactionDeleted: (id: number) => void;
}

export function TransactionList({ 
  transactions, 
  categories, 
  onTransactionUpdated, 
  onTransactionDeleted 
}: TransactionListProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find((c: Category) => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  // Edit functionality handled through dialog form component
  // const handleEdit = async (updatedData: UpdateTransactionInput) => {...}

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteTransaction.mutate({ id });
      onTransactionDeleted(id);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction: Transaction) => {
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesCategory = filterCategory === 'all' || 
      (filterCategory === 'none' && !transaction.category_id) ||
      transaction.category_id?.toString() === filterCategory;
    const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesCategory && matchesSearch;
  });

  // Sort by date (newest first)
  const sortedTransactions = [...filteredTransactions].sort((a: Transaction, b: Transaction) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Filter by Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">💰 Income</SelectItem>
                  <SelectItem value="expense">💸 Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Filter by Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="none">Uncategorized</SelectItem>
                  {categories.map((category: Category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.is_predefined ? '🏷️' : '📝'} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search descriptions..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <div className="space-y-3">
        {sortedTransactions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-500 text-lg">
                {transactions.length === 0 
                  ? '📝 No transactions yet. Add your first transaction above!' 
                  : '🔍 No transactions match your current filters.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedTransactions.map((transaction: Transaction) => (
            <Card key={transaction.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge 
                        variant={transaction.type === 'income' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {transaction.type === 'income' ? '💰 Income' : '💸 Expense'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getCategoryName(transaction.category_id)}
                      </Badge>
                    </div>
                    
                    <h3 className="font-semibold text-lg">{transaction.description}</h3>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>📅 {new Date(transaction.date).toLocaleDateString()}</span>
                      <span className={`font-bold text-lg ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setEditingTransaction(transaction)}>
                          ✏️ Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Transaction</DialogTitle>
                        </DialogHeader>
                        {editingTransaction && (
                          <TransactionForm
                            categories={categories}
                            onTransactionCreated={(updated: Transaction) => {
                              onTransactionUpdated(updated);
                              setEditingTransaction(null);
                            }}
                            initialData={{
                              type: editingTransaction.type,
                              amount: editingTransaction.amount,
                              description: editingTransaction.description,
                              date: editingTransaction.date,
                              category_id: editingTransaction.category_id
                            }}
                            onCancel={() => setEditingTransaction(null)}
                            mode="edit"
                          />
                        )}
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          🗑️ Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{transaction.description}"? 
                            This action cannot be undone.
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
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      {sortedTransactions.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold">{sortedTransactions.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  +${sortedTransactions
                    .filter((t: Transaction) => t.type === 'income')
                    .reduce((sum, t: Transaction) => sum + t.amount, 0)
                    .toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  -${sortedTransactions
                    .filter((t: Transaction) => t.type === 'expense')
                    .reduce((sum, t: Transaction) => sum + t.amount, 0)
                    .toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Net Amount</p>
                <p className={`text-2xl font-bold ${
                  sortedTransactions.reduce((sum, t: Transaction) => 
                    sum + (t.type === 'income' ? t.amount : -t.amount), 0
                  ) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${sortedTransactions.reduce((sum, t: Transaction) => 
                    sum + (t.type === 'income' ? t.amount : -t.amount), 0
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
