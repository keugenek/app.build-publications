import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { Plus, Edit, Trash2, Target, Calendar, DollarSign, FolderOpen } from 'lucide-react';
import type { Budget, CreateBudgetInput, Category, UpdateBudgetInput } from '../../../server/src/schema';

export function BudgetManager() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const [formData, setFormData] = useState<CreateBudgetInput>({
    category_id: 0,
    monthly_limit: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() + i;
    return { value: year, label: year.toString() };
  });

  const loadBudgets = useCallback(async () => {
    try {
      const result = await trpc.getBudgets.query();
      setBudgets(result);
    } catch (error) {
      console.error('Failed to load budgets:', error);
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
    loadBudgets();
    loadCategories();
  }, [loadBudgets, loadCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingBudget) {
        const updateData: UpdateBudgetInput = {
          id: editingBudget.id,
          monthly_limit: formData.monthly_limit,
          month: formData.month,
          year: formData.year
        };
        const updatedBudget = await trpc.updateBudget.mutate(updateData);
        setBudgets((prev: Budget[]) => 
          prev.map((b: Budget) => b.id === editingBudget.id ? updatedBudget : b)
        );
        setEditingBudget(null);
      } else {
        const newBudget = await trpc.createBudget.mutate(formData);
        setBudgets((prev: Budget[]) => [...prev, newBudget]);
      }
      
      // Reset form
      setFormData({
        category_id: 0,
        monthly_limit: 0,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      });
    } catch (error) {
      console.error('Failed to save budget:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      category_id: budget.category_id,
      monthly_limit: budget.monthly_limit,
      month: budget.month,
      year: budget.year
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteBudget.mutate(id);
      setBudgets((prev: Budget[]) => prev.filter((b: Budget) => b.id !== id));
    } catch (error) {
      console.error('Failed to delete budget:', error);
    }
  };

  const cancelEdit = () => {
    setEditingBudget(null);
    setFormData({
      category_id: 0,
      monthly_limit: 0,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
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

  const getMonthName = (month: number) => {
    return months.find((m) => m.value === month)?.label || 'Unknown';
  };

  // Group budgets by year for better organization
  const budgetsByYear = budgets.reduce((acc: Record<number, Budget[]>, budget: Budget) => {
    if (!acc[budget.year]) {
      acc[budget.year] = [];
    }
    acc[budget.year].push(budget);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Add/Edit Budget Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingBudget ? 'Edit Budget' : 'Set New Budget'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!editingBudget && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
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
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Monthly Limit</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.monthly_limit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateBudgetInput) => ({ 
                      ...prev, 
                      monthly_limit: parseFloat(e.target.value) || 0 
                    }))
                  }
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Month</label>
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
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Year</label>
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
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year.value} value={year.value.toString()}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading || (formData.category_id === 0 && !editingBudget) || formData.monthly_limit <= 0}>
                {isLoading ? 'Saving...' : editingBudget ? 'Update Budget' : 'Set Budget'}
              </Button>
              {editingBudget && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Budgets List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Your Budgets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Create categories first!</p>
              <p className="text-sm text-gray-400">You need to create spending categories before setting budgets 📂</p>
            </div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No budgets set yet!</p>
              <p className="text-sm text-gray-400">Set your first budget above to start tracking your spending limits 🎯</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(budgetsByYear)
                .sort(([a], [b]) => parseInt(b) - parseInt(a)) // Sort years descending
                .map(([year, yearBudgets]) => (
                  <div key={year}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {year}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {yearBudgets
                        .sort((a: Budget, b: Budget) => a.month - b.month)
                        .map((budget: Budget) => (
                          <Card key={budget.id} className="relative">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: getCategoryColor(budget.category_id) }}
                                  />
                                  <CardTitle className="text-base">
                                    {getCategoryName(budget.category_id)}
                                  </CardTitle>
                                </div>
                                <Badge variant="outline">
                                  {getMonthName(budget.month)}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Monthly Limit</span>
                                  <span className="font-bold text-blue-600">
                                    ${budget.monthly_limit.toFixed(2)}
                                  </span>
                                </div>

                                {/* Note: In a real app, we would calculate spent amount from transactions */}
                                <div className="text-center text-sm text-gray-500 py-2">
                                  💡 Spending progress will appear here once you add transactions
                                </div>

                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(budget)}
                                    className="flex-1"
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>

                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Budget</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete the budget for {getCategoryName(budget.category_id)} 
                                          in {getMonthName(budget.month)} {budget.year}?
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
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget Tips */}
      {budgets.length === 0 && categories.length > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="text-lg text-green-800">🎯 Budget Planning Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-green-700">
              <div className="flex items-start gap-2">
                <span className="text-green-600">💰</span>
                <p><strong>Start with the 50/30/20 rule:</strong> 50% needs, 30% wants, 20% savings</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">📊</span>
                <p><strong>Track your spending first:</strong> Add transactions to see your actual spending patterns</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">🎯</span>
                <p><strong>Set realistic limits:</strong> Base your budgets on your income and past spending</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">⏰</span>
                <p><strong>Review monthly:</strong> Adjust your budgets based on what you learn</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
