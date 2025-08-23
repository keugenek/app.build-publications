import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import type { Budget, Category, CreateBudgetInput } from '../../../server/src/schema';

export function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  
  const [formData, setFormData] = useState({
    categoryId: 0,
    amount: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  // Fetch budgets and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [budgetsData, categoriesData] = await Promise.all([
          trpc.getBudgets.query(),
          trpc.getCategories.query(),
        ]);
        setBudgets(budgetsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateBudget = async () => {
    try {
      const newBudget = await trpc.createBudget.mutate({
        categoryId: formData.categoryId,
        amount: formData.amount,
        month: formData.month,
        year: formData.year,
      } as CreateBudgetInput);
      
      setBudgets([...budgets, newBudget]);
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create budget:', error);
    }
  };

  const handleUpdateBudget = async () => {
    if (!editingBudget) return;
    
    try {
      const updatedBudget = await trpc.updateBudget.mutate({
        id: editingBudget.id,
        categoryId: formData.categoryId,
        amount: formData.amount,
        month: formData.month,
        year: formData.year,
      });
      
      setBudgets(budgets.map(b => 
        b.id === updatedBudget.id ? updatedBudget : b
      ));
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to update budget:', error);
    }
  };

  const handleDeleteBudget = async (id: number) => {
    try {
      await trpc.deleteBudget.mutate(id);
      setBudgets(budgets.filter(b => b.id !== id));
    } catch (error) {
      console.error('Failed to delete budget:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      categoryId: 0,
      amount: 0,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    });
    setEditingBudget(null);
  };

  const openEditDialog = (budget: Budget) => {
    setFormData({
      categoryId: budget.categoryId,
      amount: budget.amount,
      month: budget.month,
      year: budget.year,
    });
    setEditingBudget(budget);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Group budgets by year and month for display
  const groupedBudgets = budgets.reduce((acc, budget) => {
    const key = `${budget.year}-${budget.month}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(budget);
    return acc;
  }, {} as Record<string, Budget[]>);

  const sortedGroups = Object.keys(groupedBudgets).sort((a, b) => {
    const [yearA, monthA] = a.split('-').map(Number);
    const [yearB, monthB] = b.split('-').map(Number);
    return new Date(yearB, monthB - 1).getTime() - new Date(yearA, monthA - 1).getTime();
  });

  if (loading) {
    return <div className="text-center py-8">Loading budgets...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Budgets</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>Add Budget</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBudget ? 'Edit Budget' : 'Add Budget'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select 
                  value={formData.categoryId.toString()} 
                  onValueChange={(value) => 
                    setFormData({...formData, categoryId: parseInt(value)})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category">
                      {categories.find(c => c.id === formData.categoryId)?.name || 'Select category'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Month</label>
                <Select 
                  value={formData.month.toString()} 
                  onValueChange={(value) => 
                    setFormData({...formData, month: parseInt(value)})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select month">
                      {new Date(2023, formData.month - 1).toLocaleString('default', { month: 'long' })}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        {new Date(2023, month - 1).toLocaleString('default', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Year</label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: parseInt(e.target.value) || new Date().getFullYear()})}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="secondary" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={editingBudget ? handleUpdateBudget : handleCreateBudget}
              >
                {editingBudget ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {Object.keys(groupedBudgets).length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No budgets set up yet. Create your first budget to start tracking your spending.
        </div>
      ) : (
        <div className="space-y-6">
          {sortedGroups.map((key) => {
            const [year, month] = key.split('-');
            const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' });
            const groupBudgets = groupedBudgets[key];
            
            return (
              <Card key={key}>
                <CardHeader>
                  <CardTitle>{monthName} {year}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {groupBudgets.map((budget) => {
                      const category = categories.find(c => c.id === budget.categoryId);
                      return (
                        <div 
                          key={budget.id} 
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <div className="font-medium">
                              {category ? category.name : 'Unknown Category'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {budget.month}/{budget.year}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="font-medium">
                              ${budget.amount.toFixed(2)}
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openEditDialog(budget)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDeleteBudget(budget.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
