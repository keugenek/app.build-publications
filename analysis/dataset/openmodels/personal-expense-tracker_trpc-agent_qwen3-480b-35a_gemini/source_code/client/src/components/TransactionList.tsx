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
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import type { Transaction, TransactionType, Category } from '../../../server/src/schema';

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionUpdated: (transaction: Transaction) => void;
  onTransactionDeleted: (id: number) => void;
}

export function TransactionList({ 
  transactions, 
  onTransactionUpdated, 
  onTransactionDeleted 
}: TransactionListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    amount: number;
    date: string;
    description: string;
    type: TransactionType;
    category: Category;
  }>({
    amount: 0,
    date: '',
    description: '',
    type: 'expense',
    category: 'Food',
  });

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditForm({
      amount: transaction.amount,
      date: transaction.date.toISOString().split('T')[0],
      description: transaction.description || '',
      type: transaction.type,
      category: transaction.category,
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    
    try {
      const updatedTransaction = await trpc.updateTransaction.mutate({
        id: editingId,
        amount: editForm.amount,
        date: new Date(editForm.date),
        description: editForm.description || null,
        type: editForm.type,
        category: editForm.category,
      });
      
      onTransactionUpdated(updatedTransaction);
      setEditingId(null);
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteTransaction.mutate(id);
      onTransactionDeleted(id);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleChange = (field: keyof typeof editForm, value: string | number) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
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
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                No transactions found. Add your first transaction!
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                {editingId === transaction.id ? (
                  <>
                    <TableCell>
                      <Input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => handleChange('date', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={editForm.type} 
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
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={editForm.category} 
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
                    </TableCell>
                    <TableCell>
                      <Textarea
                        value={editForm.description || ''}
                        onChange={(e) => handleChange('description', e.target.value)}
                      />
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
                    <TableCell>
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
                  </>
                ) : (
                  <>
                    <TableCell>
                      {transaction.date.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.type === 'income' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type}
                      </span>
                    </TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>{transaction.description || '-'}</TableCell>
                    <TableCell className={`text-right font-medium ${
                      transaction.type === 'income' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEdit(transaction)}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleDelete(transaction.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
