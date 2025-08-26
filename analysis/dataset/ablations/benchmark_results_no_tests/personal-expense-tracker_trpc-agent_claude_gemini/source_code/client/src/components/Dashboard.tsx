import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, TrendingUpIcon, TrendingDownIcon } from 'lucide-react';
import { PieChart } from '@/components/PieChart';
import { LineChart } from '@/components/LineChart';
import type { Category, Transaction, Budget } from '../../../server/src/schema';

interface DashboardProps {
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
}

export function Dashboard({ categories, transactions, budgets }: DashboardProps) {
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year'>('month');

  // Calculate filtered transactions based on date range
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return transactions.filter((t: Transaction) => new Date(t.date) >= startDate);
  }, [transactions, dateRange]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter((t: Transaction) => t.type === 'income')
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

    const totalExpenses = filteredTransactions
      .filter((t: Transaction) => t.type === 'expense')
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      transactionCount: filteredTransactions.length
    };
  }, [filteredTransactions]);

  // Prepare data for pie chart (category breakdown)
  const categoryBreakdown = useMemo(() => {
    const expenseTransactions = filteredTransactions.filter((t: Transaction) => t.type === 'expense');
    const categoryTotals = new Map<number, number>();

    expenseTransactions.forEach((t: Transaction) => {
      const current = categoryTotals.get(t.category_id) || 0;
      categoryTotals.set(t.category_id, current + t.amount);
    });

    return Array.from(categoryTotals.entries()).map(([categoryId, amount]) => {
      const category = categories.find((c: Category) => c.id === categoryId);
      return {
        id: categoryId,
        name: category?.name || 'Unknown Category',
        value: amount,
        color: category?.color ?? '#8B5CF6'
      };
    }).sort((a, b) => b.value - a.value);
  }, [filteredTransactions, categories]);

  // Prepare data for line chart (spending trends)
  const spendingTrends = useMemo(() => {
    const dailyTotals = new Map<string, { income: number; expenses: number }>();

    filteredTransactions.forEach((t: Transaction) => {
      const dateKey = t.date.toISOString().split('T')[0];
      const current = dailyTotals.get(dateKey) || { income: 0, expenses: 0 };
      
      if (t.type === 'income') {
        current.income += t.amount;
      } else {
        current.expenses += t.amount;
      }
      
      dailyTotals.set(dateKey, current);
    });

    return Array.from(dailyTotals.entries())
      .map(([date, totals]) => ({
        date,
        income: totals.income,
        expenses: totals.expenses,
        net: totals.income - totals.expenses
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredTransactions]);

  // Show placeholder message when no data is available
  const hasData = transactions.length > 0;

  if (!hasData) {
    return (
      <div className="space-y-6">
        <Card className="border-dashed border-2 border-gray-300 bg-gray-50/50">
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No transaction data available
            </h3>
            <p className="text-gray-500 mb-6">
              Your dashboard will show spending insights once you start logging transactions.
              <br />
              <em className="text-sm">Note: Backend is currently using stub data - transaction logging will work once the database is connected.</em>
            </p>
            <Button 
              onClick={() => {
                // Switch to transactions tab (this would need to be passed as a prop in a real implementation)
                const transactionTab = document.querySelector('[value="transactions"]') as HTMLElement;
                if (transactionTab) transactionTab.click();
              }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Add Your First Transaction
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Dashboard Overview
          </CardTitle>
          <CardDescription>
            View your financial insights and spending patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={dateRange === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('month')}
            >
              This Month
            </Button>
            <Button
              variant={dateRange === 'quarter' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('quarter')}
            >
              This Quarter
            </Button>
            <Button
              variant={dateRange === 'year' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('year')}
            >
              This Year
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Income</p>
                <p className="text-2xl font-bold text-green-700">
                  ${summaryStats.totalIncome.toFixed(2)}
                </p>
              </div>
              <TrendingUpIcon className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-700">
                  ${summaryStats.totalExpenses.toFixed(2)}
                </p>
              </div>
              <TrendingDownIcon className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={`${summaryStats.netAmount >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${summaryStats.netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  Net Amount
                </p>
                <p className={`text-2xl font-bold ${summaryStats.netAmount >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  ${summaryStats.netAmount.toFixed(2)}
                </p>
              </div>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${summaryStats.netAmount >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                {summaryStats.netAmount >= 0 ? '📈' : '📉'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-700">
                  {summaryStats.transactionCount}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                💳
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>
              Breakdown of your expenses across different categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length > 0 ? (
              <PieChart data={categoryBreakdown} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">🥧</div>
                  <p>No expense data to display</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending Trends</CardTitle>
            <CardDescription>
              Your income and expenses over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {spendingTrends.length > 0 ? (
              <LineChart data={spendingTrends} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">📈</div>
                  <p>No trend data to display</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
