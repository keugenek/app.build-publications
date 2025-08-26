import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import { Target, DollarSign, Calendar } from 'lucide-react';
import type { Budget, Category, CreateBudgetInput } from '../../../server/src/schema';

interface BudgetFormProps {
  categories: Category[];
  onBudgetCreated: (budget: Budget) => void;
}

const MONTHS = [
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

export function BudgetForm({ categories, onBudgetCreated }: BudgetFormProps) {
  const currentDate = new Date();
  const [formData, setFormData] = useState<CreateBudgetInput>({
    category_id: 0,
    amount: 0,
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear()
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await trpc.createBudget.mutate(formData);
      onBudgetCreated(response);
      
      // Reset form
      setFormData({
        category_id: 0,
        amount: 0,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear()
      });
    } catch (error) {
      console.error('Failed to create budget:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev: CreateBudgetInput) => ({ 
      ...prev, 
      category_id: parseInt(value) 
    }));
  };

  const handleMonthChange = (value: string) => {
    setFormData((prev: CreateBudgetInput) => ({ 
      ...prev, 
      month: parseInt(value) 
    }));
  };

  const handleYearChange = (value: string) => {
    setFormData((prev: CreateBudgetInput) => ({ 
      ...prev, 
      year: parseInt(value) 
    }));
  };

  const selectedCategory = categories.find(c => c.id === formData.category_id);
  const selectedMonth = MONTHS.find(m => m.value === formData.month);
  
  // Generate years (current year and next 2 years)
  const years = Array.from({ length: 3 }, (_, i) => currentDate.getFullYear() + i);

  if (categories.length === 0) {
    return (
      <Alert className="bg-amber-50 border-amber-200">
        <Target className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          📋 You need to create some categories first before setting up budgets. 
          Go to the Categories tab to add some!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Tips */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardContent className="p-4">
          <h3 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
            <Target className="w-4 h-4" />
            💡 Budget Tips
          </h3>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• Set realistic monthly spending limits for each category</li>
            <li>• Review and adjust your budgets monthly based on actual spending</li>
            <li>• Start with essential categories like Food, Transportation, and Bills</li>
          </ul>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category */}
          <div className="space-y-3">
            <Label htmlFor="category" className="text-sm font-medium">
              Category *
            </Label>
            <Select 
              value={formData.category_id.toString()} 
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category: Category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <div className="flex flex-col items-start">
                      <span>{category.name}</span>
                      {category.description && (
                        <span className="text-xs text-gray-500">{category.description}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Budget Amount */}
          <div className="space-y-3">
            <Label htmlFor="amount" className="text-sm font-medium">
              Monthly Budget Amount *
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={formData.amount || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateBudgetInput) => ({ 
                    ...prev, 
                    amount: parseFloat(e.target.value) || 0 
                  }))
                }
                className="pl-10 h-12"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          {/* Month */}
          <div className="space-y-3">
            <Label htmlFor="month" className="text-sm font-medium">
              Month *
            </Label>
            <Select value={formData.month.toString()} onValueChange={handleMonthChange}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year */}
          <div className="space-y-3">
            <Label htmlFor="year" className="text-sm font-medium">
              Year *
            </Label>
            <Select value={formData.year.toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="h-12">
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

        {/* Preview Card */}
        {selectedCategory && formData.amount > 0 && (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Budget Preview:
              </h3>
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium">Category:</span> 
                  <span className="ml-2 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                    {selectedCategory.name}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Budget:</span> 
                  <span className="ml-2 font-bold text-green-700">
                    ${formData.amount.toFixed(2)} per month
                  </span>
                </p>
                <p>
                  <span className="font-medium">Period:</span> 
                  <span className="ml-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {selectedMonth?.label} {formData.year}
                  </span>
                </p>
                <p className="text-xs text-green-600 mt-2">
                  💡 You'll be notified when you approach or exceed this limit
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <Button 
          type="submit" 
          disabled={isLoading || formData.category_id === 0 || formData.amount <= 0}
          className="w-full h-12 text-lg font-medium bg-green-600 hover:bg-green-700"
        >
          {isLoading ? (
            'Creating Budget...'
          ) : (
            <>
              <Target className="w-5 h-5 mr-2" />
              Set Monthly Budget
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
