import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { DashboardData } from '../../../server/src/schema';

export function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await trpc.getDashboardData.query();
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  if (!dashboardData) {
    return <div className="text-center py-8">Failed to load dashboard data</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Spending by Category Chart Placeholder */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-64 h-64 mx-auto flex items-center justify-center">
                  <span className="text-gray-500">Pie Chart Visualization</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Visual representation of spending distribution by category
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Spending Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-64 h-64 mx-auto flex items-center justify-center">
                  <span className="text-gray-500">Bar Chart Visualization</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Historical spending trends
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Status */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Status</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData.budgetStatus.length === 0 ? (
            <p className="text-center py-4 text-gray-500">
              No budgets set up yet. Create budgets to track your spending.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.budgetStatus.map((budget) => (
                <div 
                  key={budget.categoryId} 
                  className="border rounded-lg p-4 flex flex-col"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{budget.categoryName}</h3>
                    <Badge 
                      variant={budget.isOverBudget ? "destructive" : "secondary"}
                    >
                      {budget.isOverBudget ? "Over Budget" : "On Track"}
                    </Badge>
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Spent:</span>
                      <span>${budget.spentAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Budgeted:</span>
                      <span>${budget.budgetedAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Remaining:</span>
                      <span>${budget.remainingAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${budget.isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ 
                        width: `${Math.min(100, (budget.spentAmount / budget.budgetedAmount) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
