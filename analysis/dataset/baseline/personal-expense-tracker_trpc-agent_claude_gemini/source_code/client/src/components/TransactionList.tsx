import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, TrendingUp, TrendingDown, X } from 'lucide-react';
import type { Transaction, Category, TransactionFilter } from '../../../server/src/schema';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  onTransactionsFiltered: (transactions: Transaction[]) => void;
}

export function TransactionList({ transactions, categories, onTransactionsFiltered }: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<TransactionFilter>({});
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter(transaction => {
    // Search filter
    if (searchTerm && !transaction.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Category filter
    if (filters.category_id !== undefined && filters.category_id !== transaction.category_id) {
      return false;
    }

    // Type filter
    if (filters.type && transaction.type !== filters.type) {
      return false;
    }

    // Date range filter
    if (filters.start_date && new Date(transaction.transaction_date) < filters.start_date) {
      return false;
    }

    if (filters.end_date && new Date(transaction.transaction_date) > filters.end_date) {
      return false;
    }

    return true;
  });

  // Update parent with filtered transactions
  useEffect(() => {
    onTransactionsFiltered(filteredTransactions);
  }, [filteredTransactions, onTransactionsFiltered]);

  const handleApplyFilters = async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getTransactions.query(filters);
      onTransactionsFiltered(result);
    } catch (error) {
      console.error('Failed to filter transactions:', error);
      // Fallback to client-side filtering
      onTransactionsFiltered(filteredTransactions);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
    onTransactionsFiltered(transactions);
  };

  const handleCategoryFilter = (value: string) => {
    const categoryId = value === 'all' ? undefined : (value === 'none' ? null : parseInt(value));
    setFilters(prev => ({ ...prev, category_id: categoryId }));
  };

  const handleTypeFilter = (value: string) => {
    const type = value === 'all' ? undefined : (value as 'income' | 'expense');
    setFilters(prev => ({ ...prev, type }));
  };

  const handleDateFilter = (field: 'start_date' | 'end_date', value: string) => {
    const date = value ? new Date(value) : undefined;
    setFilters(prev => ({ ...prev, [field]: date }));
  };

  // Calculate totals for filtered transactions
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netAmount = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search transactions by description..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>

          {(Object.keys(filters).length > 0 || searchTerm) && (
            <Button variant="ghost" onClick={handleClearFilters} size="sm">
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={
                    filters.category_id === undefined ? 'all' : 
                    filters.category_id === null ? 'none' : 
                    filters.category_id.toString()
                  }
                  onValueChange={handleCategoryFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {categories.map((category: Category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={filters.type || 'all'} onValueChange={handleTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={filters.start_date ? filters.start_date.toISOString().split('T')[0] : ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleDateFilter('start_date', e.target.value)
                  }
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={filters.end_date ? filters.end_date.toISOString().split('T')[0] : ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleDateFilter('end_date', e.target.value)
                  }
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button onClick={handleApplyFilters} disabled={isLoading}>
                {isLoading ? 'Applying...' : 'Apply Filters'}
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                Showing <strong>{filteredTransactions.length}</strong> of {transactions.length} transactions
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-green-700 font-medium">+${totalIncome.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-red-700 font-medium">-${totalExpenses.toFixed(2)}</span>
              </div>
              <div className={`font-bold ${netAmount >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                Net: ${netAmount.toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            <Calendar className="w-16 h-16 mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No transactions found</h3>
            <p>
              {searchTerm || Object.keys(filters).length > 0 
                ? 'Try adjusting your search or filters'
                : 'Start by adding your first transaction!'
              }
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTransactions
            .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
            .map((transaction: Transaction) => {
              const category = categories.find(c => c.id === transaction.category_id);
              
              return (
                <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-full ${
                            transaction.type === 'income' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {transaction.type === 'income' ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">
                              {transaction.description}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-3 h-3" />
                              {transaction.transaction_date.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                              {category && (
                                <>
                                  <Separator orientation="vertical" className="h-3" />
                                  <Badge variant="secondary" className="text-xs">
                                    {category.name}
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          transaction.type === 'income' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </div>
                        <Badge 
                          variant={transaction.type === 'income' ? 'default' : 'destructive'} 
                          className="mt-1"
                        >
                          {transaction.type === 'income' ? '💰 Income' : '💸 Expense'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}
