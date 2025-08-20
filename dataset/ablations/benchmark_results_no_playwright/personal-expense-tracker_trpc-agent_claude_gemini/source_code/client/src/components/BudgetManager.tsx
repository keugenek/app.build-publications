import { useState } from 'react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import type { Budget, Category, CreateBudgetInput } from '../../../server/src/schema';

interface BudgetManagerProps {
  categories: Category[];
  budgets: Budget[]; // Used in parent component for state management
  onBudgetCreated: (budget: Budget) => void;
  onBudgetUpdated: (budget: Budget) => void;
  onBudgetDeleted: (id: number) => void;
}

interface BudgetWithSpending extends Budget {
  category_name: string;
  spent_amount: number;
}

export function BudgetManager({ 
  categories, 
  budgets: _budgets, // Received but using budgetsWithSpending instead
  onBudgetCreated, 
  onBudgetUpdated, 
  onBudgetDeleted 
}: BudgetManagerProps) {
  // Suppress unused variable warning for _budgets
  void _budgets;
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // const [editingBudget, setEditingBudget] = useState<Budget | null>(null); // Currently handled inline
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [budgetsWithSpending, setBudgetsWithSpending] = useState<BudgetWithSpending[]>([]);

  const [formData, setFormData] = useState<CreateBudgetInput>({
    category_id: 0,
    monthly_limit: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  // Load budgets with spending data
  const loadBudgetsWithSpending = async (month: number, year: number) => {
    try {
      const result = await trpc.getBudgets.query({ month, year });
      // Note: Server currently returns stub data (empty array)
      // When implemented, it should return budgets with category_name and spent_amount
      setBudgetsWithSpending(result as BudgetWithSpending[]);
    } catch (error) {
      console.error('Failed to load budgets with spending:', error);
    }
  };

  const handleMonthYearChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    loadBudgetsWithSpending(month, year);
  };

  // Load current month data on component mount
  React.useEffect(() => {
    loadBudgetsWithSpending(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newBudget = await trpc.createBudget.mutate(formData);
      onBudgetCreated(newBudget);
      setFormData({
        category_id: 0,
        monthly_limit: 0,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      });
      setIsCreating(false);
      // Reload budgets with spending
      loadBudgetsWithSpending(selectedMonth, selectedYear);
    } catch (error) {
      console.error('Failed to create budget:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (budgetId: number, monthlyLimit: number) => {
    try {
      const updatedBudget = await trpc.updateBudget.mutate({
        id: budgetId,
        monthly_limit: monthlyLimit
      });
      onBudgetUpdated(updatedBudget);
      // Reload budgets with spending
      loadBudgetsWithSpending(selectedMonth, selectedYear);
    } catch (error) {
      console.error('Failed to update budget:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteBudget.mutate({ id });
      onBudgetDeleted(id);
      // Reload budgets with spending
      loadBudgetsWithSpending(selectedMonth, selectedYear);
    } catch (error) {
      console.error('Failed to delete budget:', error);
    }
  };

  const getSpendingPercentage = (spent: number, limit: number) => {
    return limit > 0 ? (spent / limit) * 100 : 0;
  };

  // Helper functions for category name and progress variant (used inline for now)
  // const getCategoryName = (categoryId: number) => {...} // Currently using category_name from server
  // const getProgressVariant = (percentage: number) => {...} // Currently using inline logic

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-6">
      {/* Header with month/year selector and create button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">🎯 Budget Manager</span>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button>➕ Create Budget</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Budget</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={formData.category_id.toString() || ''}
                      onValueChange={(value: string) =>
                        setFormData((prev: CreateBudgetInput) => ({ 
                          ...prev, 
                          category_id: parseInt(value) 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: Category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.is_predefined ? '🏷️' : '📝'} {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Monthly Limit ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.monthly_limit || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateBudgetInput) => ({ 
                          ...prev, 
                          monthly_limit: parseFloat(e.target.value) || 0 
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Month</Label>
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
                          {monthNames.map((month, index) => (
                            <SelectItem key={index} value={(index + 1).toString()}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Year</Label>
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

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={isLoading} className="flex-1">
                      {isLoading ? 'Creating...' : 'Create Budget'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>
            Set monthly spending limits for your categories
            <span className="block text-orange-600 mt-1">
              ⚠️ Budget spending tracking is currently using stub implementation
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value: string) => 
                  handleMonthYearChange(parseInt(value), selectedYear)
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Year</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value: string) => 
                  handleMonthYearChange(selectedMonth, parseInt(value))
                }
              >
                <SelectTrigger className="w-32">
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

      {/* Budget List */}
      <div className="space-y-4">
        {budgetsWithSpending.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-500 text-lg">
                📊 No budgets set for {monthNames[selectedMonth - 1]} {selectedYear}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Create a budget above to start tracking your spending limits
              </p>
            </CardContent>
          </Card>
        ) : (
          budgetsWithSpending.map((budget: BudgetWithSpending) => {
            const spentPercentage = getSpendingPercentage(budget.spent_amount, budget.monthly_limit);
            const isOverBudget = spentPercentage > 100;
            const remainingAmount = budget.monthly_limit - budget.spent_amount;

            return (
              <Card key={budget.id} className={`${isOverBudget ? 'border-red-200 bg-red-50' : ''}`}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">
                          🏷️ {budget.category_name}
                        </h3>
                        {isOverBudget && (
                          <Badge variant="destructive" className="text-xs">
                            ⚠️ Over Budget
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                            >
                              ✏️ Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Budget Limit</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Category: {budget.category_name}</Label>
                              </div>
                              <div className="space-y-2">
                                <Label>Monthly Limit ($)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  defaultValue={budget.monthly_limit}
                                  id={`edit-limit-${budget.id}`}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => {
                                    const input = document.getElementById(`edit-limit-${budget.id}`) as HTMLInputElement;
                                    const newLimit = parseFloat(input.value);
                                    if (newLimit > 0) {
                                      handleUpdate(budget.id, newLimit);
                                    }
                                  }}
                                  className="flex-1"
                                >
                                  Update Budget
                                </Button>
                                <Button 
                                  variant="outline"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
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
                              <AlertDialogTitle>Delete Budget</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the budget for {budget.category_name}? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(budget.id)}
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
                        <span>Spent: ${budget.spent_amount.toFixed(2)}</span>
                        <span>Limit: ${budget.monthly_limit.toFixed(2)}</span>
                      </div>
                      <Progress 
                        value={Math.min(spentPercentage, 100)} 
                        className={`h-3 ${isOverBudget ? '[&>div]:bg-red-500' : ''}`}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{spentPercentage.toFixed(1)}% used</span>
                        <span className={remainingAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {remainingAmount >= 0 ? 'Remaining: ' : 'Over by: '}
                          ${Math.abs(remainingAmount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
