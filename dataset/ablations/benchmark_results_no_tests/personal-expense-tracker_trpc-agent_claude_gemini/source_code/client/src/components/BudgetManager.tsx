import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { EditIcon, TrashIcon, PlusIcon, TrendingUpIcon } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Category, Budget, Transaction, CreateBudgetInput } from '../../../server/src/schema';

interface BudgetManagerProps {
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
  onBudgetCreate: (budget: Budget) => void;
  onBudgetUpdate: (budget: Budget) => void;
  onBudgetDelete: (budgetId: number) => void;
}

export function BudgetManager({
  categories,
  budgets,
  transactions,
  onBudgetCreate,
  onBudgetUpdate,
  onBudgetDelete
}: BudgetManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Form state
  const [formData, setFormData] = useState<CreateBudgetInput>({
    category_id: categories[0]?.id || 0,
    amount: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  // Generate month and year options
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Calculate spending for budgets
  const budgetProgress = useMemo(() => {
    return budgets.map((budget: Budget) => {
      // Get expenses for this category in the budget month/year
      const budgetStart = new Date(budget.year, budget.month - 1, 1);
      const budgetEnd = new Date(budget.year, budget.month, 0);
      
      const categoryExpenses = transactions
        .filter((t: Transaction) => 
          t.category_id === budget.category_id &&
          t.type === 'expense' &&
          t.date >= budgetStart &&
          t.date <= budgetEnd
        )
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

      const percentageUsed = budget.amount > 0 ? (categoryExpenses / budget.amount) * 100 : 0;
      const category = categories.find((c: Category) => c.id === budget.category_id);
      
      return {
        ...budget,
        spent: categoryExpenses,
        remaining: budget.amount - categoryExpenses,
        percentageUsed: Math.min(percentageUsed, 100),
        isOverBudget: categoryExpenses > budget.amount,
        categoryName: category?.name || 'Unknown Category',
        categoryColor: category?.color ?? '#8B5CF6'
      };
    });
  }, [budgets, transactions, categories]);

  // Filter budgets by selected month/year
  const filteredBudgets = budgetProgress.filter((budget) => 
    budget.year === selectedYear && budget.month === selectedMonth
  );

  // Reset form
  const resetForm = () => {
    setFormData({
      category_id: categories[0]?.id || 0,
      amount: 0,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    });
    setIsCreating(false);
    setEditingBudget(null);
  };

  // Handle create budget
  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (categories.length === 0) {
      alert('Please create at least one category first.');
      return;
    }

    // Check if budget already exists for this category/month/year
    const existingBudget = budgets.find((b: Budget) => 
      b.category_id === formData.category_id &&
      b.month === formData.month &&
      b.year === formData.year
    );

    if (existingBudget && !editingBudget) {
      alert('A budget for this category and month already exists.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await trpc.createBudget.mutate(formData);
      onBudgetCreate(response);
      resetForm();
    } catch (error) {
      console.error('Failed to create budget:', error);
      alert('Failed to create budget. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle update budget
  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;

    setIsLoading(true);
    try {
      const updateData = {
        id: editingBudget.id,
        ...formData
      };
      const response = await trpc.updateBudget.mutate(updateData);
      onBudgetUpdate(response);
      resetForm();
    } catch (error) {
      console.error('Failed to update budget:', error);
      alert('Failed to update budget. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete budget
  const handleDeleteBudget = async (budgetId: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteBudget.mutate({ id: budgetId });
      onBudgetDelete(budgetId);
    } catch (error) {
      console.error('Failed to delete budget:', error);
      alert('Failed to delete budget. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Start editing
  const startEditing = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      category_id: budget.category_id,
      amount: budget.amount,
      month: budget.month,
      year: budget.year
    });
    setIsCreating(true);
  };

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
            You need to create at least one category before you can set budgets.
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
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                🎯 Budget Management
              </CardTitle>
              <CardDescription>
                Set monthly spending limits and track your progress towards financial goals
              </CardDescription>
            </div>
            <Button 
              onClick={() => setIsCreating(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={isCreating}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Set Budget
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Month/Year Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Budget Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Month
              </label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value: string) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Year
              </label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value: string) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingBudget ? 'Edit Budget' : 'Set New Budget'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingBudget ? handleUpdateBudget : handleCreateBudget} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Category
                  </label>
                  <Select
                    value={formData.category_id.toString()}
                    onValueChange={(value: string) =>
                      setFormData((prev: CreateBudgetInput) => ({ 
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

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Budget Amount ($)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateBudgetInput) => ({ 
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
                    Month
                  </label>
                  <Select
                    value={formData.month.toString()}
                    onValueChange={(value: string) =>
                      setFormData((prev: CreateBudgetInput) => ({ 
                        ...prev, 
                        month: parseInt(value) 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month, index) => (
                        <SelectItem key={index} value={(index + 1).toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Year
                  </label>
                  <Select
                    value={formData.year.toString()}
                    onValueChange={(value: string) =>
                      setFormData((prev: CreateBudgetInput) => ({ 
                        ...prev, 
                        year: parseInt(value) 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isLoading ? 'Saving...' : editingBudget ? 'Update Budget' : 'Set Budget'}
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

      {/* Budget List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {months[selectedMonth - 1]} {selectedYear} Budgets
          </CardTitle>
          <CardDescription>
            {filteredBudgets.length} {filteredBudgets.length === 1 ? 'budget' : 'budgets'} set for this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBudgets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-lg mb-2">No budgets set for {months[selectedMonth - 1]} {selectedYear}</p>
              <p className="text-sm mb-6">Set your first budget to start tracking your spending goals!</p>
              {budgets.length === 0 && (
                <p className="text-xs text-gray-400 mb-4">
                  <em>Note: Backend is currently using stub data - budget creation will work once the database is connected.</em>
                </p>
              )}
              <Button 
                onClick={() => setIsCreating(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={isCreating}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Set Your First Budget
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBudgets.map((budget) => (
                <div
                  key={budget.id}
                  className={`border rounded-lg p-6 ${
                    budget.isOverBudget ? 'bg-red-50 border-red-200' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full flex-shrink-0"
                        style={{ backgroundColor: budget.categoryColor }}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {budget.categoryName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          ${budget.amount.toFixed(2)} monthly budget
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {budget.isOverBudget && (
                        <Badge variant="destructive" className="bg-red-100 text-red-800">
                          Over Budget
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditing(budget)}
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
                            <AlertDialogTitle>Delete Budget</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this budget for {budget.categoryName}? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteBudget(budget.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={budget.isOverBudget ? 'text-red-600' : 'text-gray-600'}>
                        Spent: ${budget.spent.toFixed(2)}
                      </span>
                      <span className={budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {budget.remaining >= 0 ? 'Remaining' : 'Over'}: ${Math.abs(budget.remaining).toFixed(2)}
                      </span>
                    </div>
                    
                    <Progress
                      value={budget.percentageUsed}
                      className={`h-3 ${budget.isOverBudget ? 'bg-red-100' : 'bg-gray-100'}`}
                    />
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0%</span>
                      <span className={budget.percentageUsed > 100 ? 'text-red-600 font-medium' : ''}>
                        {budget.percentageUsed.toFixed(1)}%
                      </span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Status Message */}
                  <div className="mt-3 text-sm">
                    {budget.isOverBudget ? (
                      <p className="text-red-600 flex items-center gap-1">
                        ⚠️ You've exceeded your budget by ${(budget.spent - budget.amount).toFixed(2)}
                      </p>
                    ) : budget.percentageUsed > 80 ? (
                      <p className="text-orange-600 flex items-center gap-1">
                        ⚡ You're at {budget.percentageUsed.toFixed(1)}% of your budget
                      </p>
                    ) : (
                      <p className="text-green-600 flex items-center gap-1">
                        ✅ You're on track with your spending
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget Tips */}
      {budgets.length === 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5" />
              💡 Budgeting Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="text-green-700">
            <ul className="space-y-2 text-sm">
              <li>• Start with the 50/30/20 rule: 50% needs, 30% wants, 20% savings</li>
              <li>• Set realistic budgets based on your past spending patterns</li>
              <li>• Review and adjust your budgets monthly</li>
              <li>• Consider seasonal variations in your spending</li>
              <li>• Set aside a buffer for unexpected expenses</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
