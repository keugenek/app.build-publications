import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Target } from 'lucide-react';
import type { DashboardData } from '../../../server/src/schema';

export function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [isLoading, setIsLoading] = useState(false);

  const months = [
    { value: 'all', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - 2 + i;
    return { value: year.toString(), label: year.toString() };
  });

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = {
        ...(selectedMonth !== 'all' && { month: parseInt(selectedMonth) }),
        year: parseInt(selectedYear)
      };
      const data = await trpc.getDashboardData.query(query);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Month:</label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Year:</label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year.value} value={year.value}>
                  {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">
              ${dashboardData?.total_income.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">
              ${dashboardData?.total_expenses.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${
          (dashboardData?.net_amount || 0) >= 0 
            ? 'from-blue-50 to-blue-100' 
            : 'from-orange-50 to-orange-100'
        }`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${
              (dashboardData?.net_amount || 0) >= 0 ? 'text-blue-700' : 'text-orange-700'
            }`}>
              Net Amount
            </CardTitle>
            <DollarSign className={`h-4 w-4 ${
              (dashboardData?.net_amount || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'
            }`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              (dashboardData?.net_amount || 0) >= 0 ? 'text-blue-800' : 'text-orange-800'
            }`}>
              ${dashboardData?.net_amount.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Categories</CardTitle>
            <PieChart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">
              {dashboardData?.category_spending.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Spending Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Spending by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData?.category_spending.length ? (
            <div className="space-y-4">
              {dashboardData.category_spending.map((category) => (
                <div key={category.category_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.category_color || '#6B7280' }}
                    />
                    <div>
                      <p className="font-medium">{category.category_name}</p>
                      <p className="text-sm text-gray-500">
                        {category.transaction_count} transactions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${category.total_amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">
                      {dashboardData.total_expenses > 0 
                        ? ((category.total_amount / dashboardData.total_expenses) * 100).toFixed(1)
                        : 0
                      }%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No spending data available for the selected period
            </p>
          )}
        </CardContent>
      </Card>

      {/* Budget Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Budget Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData?.budget_status.length ? (
            <div className="space-y-6">
              {dashboardData.budget_status.map((budget) => (
                <div key={budget.category_id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{budget.category_name}</h4>
                    <Badge 
                      variant={budget.percentage_used > 100 ? 'destructive' : 
                               budget.percentage_used > 80 ? 'secondary' : 'default'}
                    >
                      {budget.percentage_used.toFixed(1)}% used
                    </Badge>
                  </div>
                  <Progress 
                    value={Math.min(budget.percentage_used, 100)}
                    className="h-2"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>${budget.spent_amount.toFixed(2)} spent</span>
                    <span>${budget.budget_limit.toFixed(2)} budget</span>
                  </div>
                  <div className="text-sm">
                    <span className={`font-medium ${
                      budget.remaining_amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${Math.abs(budget.remaining_amount).toFixed(2)} {budget.remaining_amount >= 0 ? 'remaining' : 'over budget'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No budget data available. Set up budgets to track your spending limits.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      {dashboardData?.monthly_trends.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.monthly_trends.map((trend) => (
                <div key={`${trend.year}-${trend.month}`} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {new Date(trend.year, trend.month - 1).toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div className="text-green-600">
                      Income: ${trend.total_income.toFixed(2)}
                    </div>
                    <div className="text-red-600">
                      Expenses: ${trend.total_expenses.toFixed(2)}
                    </div>
                    <div className={`font-bold ${trend.net_amount >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      Net: ${trend.net_amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
