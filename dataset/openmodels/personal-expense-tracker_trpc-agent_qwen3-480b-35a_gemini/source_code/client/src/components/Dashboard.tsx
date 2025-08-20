import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction, Budget } from '../../../server/src/schema';

interface DashboardProps {
  transactions: Transaction[];
  budgets: Budget[];
}

export function Dashboard({ transactions, budgets }: DashboardProps) {
  // Calculate summary statistics
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const balance = totalIncome - totalExpenses;
  
  // Calculate expenses by category
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      const category = transaction.category;
      acc[category] = (acc[category] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);
  
  // Calculate monthly spending trend
  const monthlyData = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      const month = transaction.date.toLocaleString('default', { month: 'short' });
      const year = transaction.date.getFullYear();
      const key = `${month} ${year}`;
      acc[key] = (acc[key] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);
    
  const trendData = Object.entries(monthlyData).map(([name, value]) => ({
    name,
    amount: value
  }));

  // Calculate budget vs spending
  const budgetComparison = budgets.map(budget => {
    const spent = transactions
      .filter(t => 
        t.type === 'expense' && 
        t.category === budget.category &&
        t.date.getMonth() + 1 === budget.month &&
        t.date.getFullYear() === budget.year
      )
      .reduce((sum, t) => sum + t.amount, 0);
      
    return {
      category: budget.category,
      budget: budget.amount,
      spent
    };
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">💰</div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${balance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalIncome.toFixed(2)} income - {totalExpenses.toFixed(2)} expenses
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">📈</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              All time income
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">📉</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              All time expenses
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Replacement - Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(expensesByCategory).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(expensesByCategory)
                  .sort(([,a], [,b]) => b - a)
                  .map(([category, amount]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="font-medium">{category}</span>
                      <span className="text-red-600">-${amount.toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                No expense data available
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <div className="space-y-3">
                {trendData
                  .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime())
                  .map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span>{item.name}</span>
                      <span className="text-red-600">-${item.amount.toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                No expense data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Budget vs Spending */}
      <Card>
        <CardHeader>
          <CardTitle>Budget vs Spending</CardTitle>
        </CardHeader>
        <CardContent>
          {budgetComparison.length > 0 ? (
            <div className="space-y-4">
              {budgetComparison.map((item, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-2">
                  <span className="font-medium">{item.category}</span>
                  <div className="flex gap-4">
                    <span>Budget: ${item.budget.toFixed(2)}</span>
                    <span>Spent: <span className="text-red-600">${item.spent.toFixed(2)}</span></span>
                    <span className={item.spent > item.budget ? 'text-red-600 font-bold' : 'text-green-600'}>
                      {item.spent > item.budget 
                        ? `Over by $${(item.spent - item.budget).toFixed(2)}` 
                        : `Under by $${(item.budget - item.spent).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              No budget data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
