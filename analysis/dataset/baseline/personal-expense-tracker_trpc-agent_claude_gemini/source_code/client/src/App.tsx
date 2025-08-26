import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { TransactionForm } from '@/components/TransactionForm';
import { CategoryForm } from '@/components/CategoryForm';
import { BudgetForm } from '@/components/BudgetForm';
import { TransactionList } from '@/components/TransactionList';
import { Dashboard } from '@/components/Dashboard';
import { PlusCircle, TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import type { 
  Transaction, 
  Category, 
  Budget, 
  FinancialSummary
} from '../../server/src/schema';

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Date range for dashboard (last 30 days by default)
  const [dateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end_date: new Date()
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [transactionsData, categoriesData, budgetsData, summaryData] = await Promise.all([
        trpc.getTransactions.query(),
        trpc.getCategories.query(),
        trpc.getBudgets.query(),
        trpc.getFinancialSummary.query(dateRange)
      ]);

      setTransactions(transactionsData);
      setCategories(categoriesData);
      setBudgets(budgetsData);
      setFinancialSummary(summaryData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTransactionCreated = (transaction: Transaction) => {
    setTransactions((prev: Transaction[]) => [transaction, ...prev]);
    // Reload financial summary to reflect new transaction
    trpc.getFinancialSummary.query(dateRange).then(setFinancialSummary);
  };

  const handleCategoryCreated = (category: Category) => {
    setCategories((prev: Category[]) => [...prev, category]);
  };

  const handleBudgetCreated = (budget: Budget) => {
    setBudgets((prev: Budget[]) => [...prev, budget]);
  };

  const handleTransactionsFiltered = (filteredTransactions: Transaction[]) => {
    setTransactions(filteredTransactions);
  };

  // Quick stats for header
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const netBalance = totalIncome - totalExpense;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <DollarSign className="w-16 h-16 text-green-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading your financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-10 h-10 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">💰 ExpenseTracker</h1>
              <p className="text-gray-600">Take control of your finances</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-r from-green-100 to-green-200 border-green-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-800 font-semibold">Total Income</p>
                    <p className="text-2xl font-bold text-green-900">
                      ${totalIncome.toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-100 to-red-200 border-red-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-800 font-semibold">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-900">
                      ${totalExpense.toFixed(2)}
                    </p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-r ${netBalance >= 0 
              ? 'from-blue-100 to-blue-200 border-blue-300' 
              : 'from-orange-100 to-orange-200 border-orange-300'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-semibold ${netBalance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                      Net Balance
                    </p>
                    <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                      ${netBalance.toFixed(2)}
                    </p>
                  </div>
                  <Target className={`w-8 h-8 ${netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/60 backdrop-blur-sm">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-white">
              📊 Dashboard
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-white">
              💳 Transactions
            </TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-white">
              🏷️ Categories
            </TabsTrigger>
            <TabsTrigger value="budgets" className="data-[state=active]:bg-white">
              🎯 Budgets
            </TabsTrigger>
            <TabsTrigger value="add-transaction" className="data-[state=active]:bg-white">
              <PlusCircle className="w-4 h-4 mr-1" />
              Add Transaction
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard 
              dateRange={dateRange}
              transactions={transactions}
              categories={categories}
              financialSummary={financialSummary}
            />
          </TabsContent>

          <TabsContent value="transactions">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  💳 Transaction History
                </CardTitle>
                <CardDescription>
                  View and filter all your transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionList 
                  transactions={transactions}
                  categories={categories}
                  onTransactionsFiltered={handleTransactionsFiltered}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <div className="grid gap-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🏷️ Categories
                  </CardTitle>
                  <CardDescription>
                    Organize your transactions with custom categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CategoryForm onCategoryCreated={handleCategoryCreated} />
                </CardContent>
              </Card>

              {categories.length > 0 && (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Your Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categories.map((category: Category) => (
                        <Card key={category.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{category.name}</h3>
                              {category.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {category.description}
                                </p>
                              )}
                            </div>
                            <Badge variant="secondary">
                              {transactions.filter(t => t.category_id === category.id).length} txns
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="budgets">
            <div className="grid gap-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🎯 Budget Management
                  </CardTitle>
                  <CardDescription>
                    Set monthly spending limits for your categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BudgetForm 
                    categories={categories}
                    onBudgetCreated={handleBudgetCreated}
                  />
                </CardContent>
              </Card>

              {budgets.length > 0 && (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Your Budgets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {budgets.map((budget: Budget) => {
                        const category = categories.find(c => c.id === budget.category_id);
                        const spent = transactions
                          .filter(t => 
                            t.category_id === budget.category_id &&
                            t.type === 'expense' &&
                            new Date(t.transaction_date).getMonth() + 1 === budget.month &&
                            new Date(t.transaction_date).getFullYear() === budget.year
                          )
                          .reduce((sum, t) => sum + t.amount, 0);
                        
                        const percentage = Math.min((spent / budget.amount) * 100, 100);
                        const isOverBudget = spent > budget.amount;

                        return (
                          <Card key={budget.id} className={`p-4 ${isOverBudget ? 'border-red-300 bg-red-50' : ''}`}>
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-semibold">
                                  {category?.name || 'Unknown Category'}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {new Date(budget.year, budget.month - 1).toLocaleDateString('en-US', { 
                                    month: 'long', 
                                    year: 'numeric' 
                                  })}
                                </p>
                              </div>
                              <Badge variant={isOverBudget ? 'destructive' : 'default'}>
                                ${spent.toFixed(2)} / ${budget.amount.toFixed(2)}
                              </Badge>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${
                                  isOverBudget ? 'bg-red-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                              {percentage.toFixed(1)}% used
                              {isOverBudget && (
                                <span className="text-red-600 font-semibold ml-2">
                                  (Over budget!)
                                </span>
                              )}
                            </p>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="add-transaction">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlusCircle className="w-5 h-5" />
                  Add New Transaction
                </CardTitle>
                <CardDescription>
                  Record your income or expense
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionForm 
                  categories={categories}
                  onTransactionCreated={handleTransactionCreated}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Empty State Messages */}
        {!isLoading && categories.length === 0 && (
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <Target className="w-12 h-12 text-blue-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Welcome to ExpenseTracker! 🎉
              </h3>
              <p className="text-blue-700 mb-4">
                Get started by creating some categories to organize your transactions.
              </p>
              <Button 
                onClick={() => setActiveTab('categories')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create Your First Category
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;
