import { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction } from '../../../server/src/schema';

interface SpendingSummaryProps {
  transactions: Transaction[];
}

interface SummaryData {
  totalIncome: number;
  totalExpenses: number;
  categoryBreakdown: Record<string, number>;
  monthlyTrend: Array<{ month: string; income: number; expenses: number }>;
}

export function SpendingSummary({ transactions }: SpendingSummaryProps) {
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalIncome: 0,
    totalExpenses: 0,
    categoryBreakdown: {},
    monthlyTrend: []
  });

  // Calculate summary data when transactions or filters change
  useEffect(() => {
    // Filter transactions by selected month/year
    const filteredTransactions = transactions.filter(t => 
      t.date.getMonth() + 1 === month && 
      t.date.getFullYear() === year
    );
    
    // Calculate totals
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate category breakdown
    const categoryBreakdown = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, transaction) => {
        const category = transaction.category;
        acc[category] = (acc[category] || 0) + transaction.amount;
        return acc;
      }, {} as Record<string, number>);
    
    // Calculate monthly trend (previous 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(year, month - 1);
      date.setMonth(date.getMonth() - i);
      
      const monthTransactions = transactions.filter(t => 
        t.date.getMonth() === date.getMonth() && 
        t.date.getFullYear() === date.getFullYear()
      );
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      monthlyTrend.push({
        month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
        income,
        expenses
      });
    }
    
    setSummaryData({
      totalIncome,
      totalExpenses,
      categoryBreakdown,
      monthlyTrend
    });
  }, [transactions, month, year]);

  // Get available years from transactions
  const availableYears = Array.from(
    new Set(transactions.map(t => t.date.getFullYear()))
  ).sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Month</label>
          <Select 
            value={month.toString()} 
            onValueChange={(value) => setMonth(parseInt(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <SelectItem key={m} value={m.toString()}>
                  {new Date(2020, m - 1).toLocaleString('default', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Year</label>
          <Select 
            value={year.toString()} 
            onValueChange={(value) => setYear(parseInt(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${summaryData.totalIncome.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${summaryData.totalExpenses.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summaryData.totalIncome - summaryData.totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${(summaryData.totalIncome - summaryData.totalExpenses).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(summaryData.categoryBreakdown).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(summaryData.categoryBreakdown)
                  .sort(([,a], [,b]) => b - a)
                  .map(([category, amount]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="font-medium">{category}</span>
                      <span className="text-red-600">-${amount.toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No expenses for the selected period
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>6-Month Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summaryData.monthlyTrend.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span>{item.month}</span>
                  <div className="flex gap-4">
                    <span className="text-green-600">+${item.income.toFixed(2)}</span>
                    <span className="text-red-600">-${item.expenses.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
