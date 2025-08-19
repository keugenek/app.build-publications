import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
// Note: This component requires 'recharts' package to be installed
// Run: npm install recharts
// For now, we'll provide fallback displays
// import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3 } from 'lucide-react';
import type { 
  SpendingByCategory, 
  SpendingTrend, 
  FinancialSummary, 
  Transaction, 
  Category,
  DateRange 
} from '../../../server/src/schema';

interface DashboardProps {
  dateRange: DateRange;
  transactions: Transaction[];
  categories: Category[];
  financialSummary: FinancialSummary | null;
}

// Colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

export function Dashboard({ dateRange, transactions, categories, financialSummary }: DashboardProps) {
  const [spendingByCategory, setSpendingByCategory] = useState<SpendingByCategory[]>([]);
  const [spendingTrends, setSpendingTrends] = useState<SpendingTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);



  const processClientSideData = useCallback(() => {
    // Create spending by category data from transactions
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const categorySpending = expenseTransactions.reduce((acc, transaction) => {
      const categoryName = categories.find(c => c.id === transaction.category_id)?.name || 'Uncategorized';
      const categoryId = transaction.category_id;
      
      if (!acc[categoryId || 0]) {
        acc[categoryId || 0] = {
          category_id: categoryId,
          category_name: categoryName,
          total_amount: 0,
          transaction_count: 0
        };
      }
      
      acc[categoryId || 0].total_amount += transaction.amount;
      acc[categoryId || 0].transaction_count += 1;
      return acc;
    }, {} as Record<number, SpendingByCategory>);

    setSpendingByCategory(Object.values(categorySpending));

    // Create spending trends from transactions (group by day)
    const transactionsByDate = transactions.reduce((acc, transaction) => {
      const date = transaction.transaction_date.toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = {
          date,
          total_income: 0,
          total_expense: 0,
          net_amount: 0
        };
      }
      
      if (transaction.type === 'income') {
        acc[date].total_income += transaction.amount;
      } else {
        acc[date].total_expense += transaction.amount;
      }
      
      acc[date].net_amount = acc[date].total_income - acc[date].total_expense;
      return acc;
    }, {} as Record<string, SpendingTrend>);

    const sortedTrends = Object.values(transactionsByDate).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    setSpendingTrends(sortedTrends);
  }, [transactions, categories]);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [categoryData, trendsData] = await Promise.all([
        trpc.getSpendingByCategory.query(dateRange),
        trpc.getSpendingTrends.query(dateRange)
      ]);

      setSpendingByCategory(categoryData);
      setSpendingTrends(trendsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Fallback to client-side data processing from actual transactions
      processClientSideData();
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, processClientSideData]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const pieChartData = spendingByCategory.map((item, index) => ({
    name: item.category_name || 'Uncategorized',
    value: item.total_amount,
    transactions: item.transaction_count,
    color: COLORS[index % COLORS.length]
  }));

  const lineChartData = spendingTrends.map(trend => ({
    date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    income: trend.total_income,
    expense: trend.total_expense,
    net: trend.net_amount
  }));

  const hasTransactionData = transactions.length > 0;

  return (
    <div className="grid gap-6">
      {/* Financial Summary */}
      {financialSummary && (
        <Card className="bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📈 Financial Overview
              <Badge variant="secondary">
                Last 30 days
              </Badge>
            </CardTitle>
            <CardDescription>
              Your financial performance summary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/60 rounded-lg">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-700">
                  ${financialSummary.total_income.toFixed(2)}
                </p>
              </div>
              
              <div className="text-center p-4 bg-white/60 rounded-lg">
                <TrendingDown className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-700">
                  ${financialSummary.total_expense.toFixed(2)}
                </p>
              </div>
              
              <div className="text-center p-4 bg-white/60 rounded-lg">
                <BarChart3 className={`w-8 h-8 mx-auto mb-2 ${
                  financialSummary.net_balance >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`} />
                <p className="text-sm text-gray-600">Net Balance</p>
                <p className={`text-2xl font-bold ${
                  financialSummary.net_balance >= 0 ? 'text-blue-700' : 'text-orange-700'
                }`}>
                  ${financialSummary.net_balance.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!hasTransactionData ? (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            📊 No transaction data available yet. Add some transactions to see beautiful visualizations here!
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart - Spending by Category */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🥧 Spending Distribution
              </CardTitle>
              <CardDescription>
                Your expenses breakdown by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pieChartData.length > 0 ? (
                <div className="w-full h-80 flex flex-col justify-center">
                  {/* Fallback pie chart visualization using CSS */}
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <div className="inline-block p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
                        <BarChart3 className="w-12 h-12 text-blue-600" />
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        📊 Install 'recharts' package for interactive pie chart
                      </p>
                    </div>
                    {pieChartData.map((item, index) => {
                      const percentage = (item.value / pieChartData.reduce((sum, d) => sum + d.value, 0)) * 100;
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">${item.value.toFixed(2)}</div>
                            <div className="text-sm text-gray-600">{percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p>No expense data to display</p>
                  <p className="text-sm">Add some expenses to see the breakdown</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Line Chart - Spending Trends */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📈 Spending Trends
              </CardTitle>
              <CardDescription>
                Daily income, expenses, and net balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lineChartData.length > 0 ? (
                <div className="w-full h-80 flex flex-col justify-center">
                  {/* Fallback line chart visualization */}
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <div className="inline-block p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-full">
                        <TrendingUp className="w-12 h-12 text-green-600" />
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        📈 Install 'recharts' package for interactive line chart
                      </p>
                    </div>
                    
                    {/* Legend */}
                    <div className="flex justify-center gap-6 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Income</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Expense</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Net Balance</span>
                      </div>
                    </div>

                    {/* Data Table */}
                    <div className="max-h-48 overflow-y-auto">
                      <div className="grid gap-2">
                        {lineChartData.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white rounded text-sm">
                            <div className="font-medium">{item.date}</div>
                            <div className="flex gap-4">
                              <span className="text-green-600">+${item.income.toFixed(2)}</span>
                              <span className="text-red-600">-${item.expense.toFixed(2)}</span>
                              <span className={`font-bold ${item.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                ${item.net.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <TrendingUp className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p>No trend data available</p>
                  <p className="text-sm">Add transactions over multiple days to see trends</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Summary */}
      {spendingByCategory.length > 0 && (
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📋 Category Summary
            </CardTitle>
            <CardDescription>
              Detailed breakdown of your spending by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {spendingByCategory.map((category, index) => (
                <Card key={category.category_id} className="p-4 border-l-4" 
                      style={{ borderLeftColor: COLORS[index % COLORS.length] }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {category.category_name || 'Uncategorized'}
                      </h3>
                      <p className="text-2xl font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                        ${category.total_amount.toFixed(2)}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {category.transaction_count} transactions
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Avg: ${(category.total_amount / category.transaction_count).toFixed(2)} per transaction
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
