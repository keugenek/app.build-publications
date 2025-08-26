import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { PieChart } from './charts/PieChart';
import { BarChart } from './charts/BarChart';
import type { DashboardData } from '../../../server/src/schema';

export function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadDashboardData = useCallback(async (year?: number) => {
    setIsLoading(true);
    try {
      const data = await trpc.getDashboardData.query(year ? { year } : undefined);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData(selectedYear);
  }, [loadDashboardData, selectedYear]);

  const handleYearChange = (year: string) => {
    const yearNumber = parseInt(year);
    setSelectedYear(yearNumber);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Calculate totals
  const totalIncome = dashboardData?.monthly_overview.reduce((sum, month) => sum + month.total_income, 0) || 0;
  const totalExpenses = dashboardData?.monthly_overview.reduce((sum, month) => sum + month.total_expenses, 0) || 0;
  const netAmount = totalIncome - totalExpenses;

  // Prepare data for charts
  const categorySpendingData = dashboardData?.category_spending.map(item => ({
    name: item.category_name || 'Uncategorized',
    value: item.total_amount,
    color: getRandomColor(item.category_name || 'Uncategorized')
  })) || [];

  const monthlyData = dashboardData?.monthly_overview.map(month => ({
    month: getMonthName(month.month),
    income: month.total_income,
    expenses: month.total_expenses
  })) || [];

  function getMonthName(monthNumber: number) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[monthNumber - 1];
  }

  function getRandomColor(name: string) {
    const colors = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
      '#0088aa', '#ff0088', '#88ff00', '#8800ff', '#ffaa00'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading dashboard data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isStubData = !dashboardData || (
    dashboardData.category_spending.length === 0 && 
    dashboardData.monthly_overview.length === 0 && 
    dashboardData.current_month_budgets.length === 0
  );

  return (
    <div className="space-y-6">
      {/* Header with year selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">📊 Financial Dashboard</span>
            <div className="flex items-center gap-2">
              <Label>Year:</Label>
              <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
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
          </CardTitle>
          <CardDescription>
            Overview of your financial data for {selectedYear}
            {isStubData && (
              <span className="block text-orange-600 mt-1">
                ⚠️ Dashboard data is currently using stub implementation
              </span>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Income</p>
                <p className="text-2xl font-bold text-green-700">
                  ${totalIncome.toFixed(2)}
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-700">
                  ${totalExpenses.toFixed(2)}
                </p>
              </div>
              <div className="text-3xl">💸</div>
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-r ${netAmount >= 0 
          ? 'from-blue-50 to-blue-100' 
          : 'from-orange-50 to-orange-100'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  Net Amount
                </p>
                <p className={`text-2xl font-bold ${netAmount >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  ${netAmount.toFixed(2)}
                </p>
              </div>
              <div className="text-3xl">{netAmount >= 0 ? '📈' : '📉'}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spending by Category - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🥧 Spending by Category
            </CardTitle>
            <CardDescription>
              Breakdown of your expenses across different categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categorySpendingData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">📊 No expense data to display</p>
                <p className="text-sm text-gray-400 mt-2">
                  Add some expense transactions to see the breakdown
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <PieChart data={categorySpendingData} />
                <div className="flex flex-wrap gap-2 justify-center">
                  {categorySpendingData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-xs">
                        {item.name}: ${item.value.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income vs Expenses - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Income vs Expenses
            </CardTitle>
            <CardDescription>
              Monthly comparison of your income and expenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">📈 No monthly data to display</p>
                <p className="text-sm text-gray-400 mt-2">
                  Add transactions to see monthly trends
                </p>
              </div>
            ) : (
              <BarChart data={monthlyData} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Current Month Budgets */}
      {dashboardData?.current_month_budgets && dashboardData.current_month_budgets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 Current Month Budget Status
            </CardTitle>
            <CardDescription>
              How you're doing against your monthly budgets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dashboardData.current_month_budgets.map((budget, index) => {
                const spentPercentage = budget.monthly_limit > 0 
                  ? (budget.spent_amount / budget.monthly_limit) * 100 
                  : 0;
                const isOverBudget = spentPercentage > 100;

                return (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg border ${
                      isOverBudget ? 'bg-red-50 border-red-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{budget.category_name}</h4>
                      {isOverBudget && (
                        <Badge variant="destructive" className="text-xs">
                          Over Budget
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Spent: ${budget.spent_amount.toFixed(2)}</span>
                        <span>Limit: ${budget.monthly_limit.toFixed(2)}</span>
                      </div>
                      <div className={`w-full bg-gray-200 rounded-full h-2 ${
                        isOverBudget ? 'bg-red-200' : ''
                      }`}>
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isOverBudget ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-600">
                        {spentPercentage.toFixed(1)}% used
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
