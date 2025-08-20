import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { Dashboard } from '@/components/Dashboard';
import { TransactionManager } from '@/components/TransactionManager';
import { CategoryManager } from '@/components/CategoryManager';
import { BudgetManager } from '@/components/BudgetManager';
// Type-only imports for better TypeScript compliance
import type { Category, Transaction, Budget } from '../../server/src/schema';

function App() {
  // State management for all data
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all initial data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [categoriesData, transactionsData, budgetsData] = await Promise.all([
        trpc.getCategories.query(),
        trpc.getTransactions.query(),
        trpc.getBudgets.query()
      ]);
      
      setCategories(categoriesData);
      setTransactions(transactionsData);
      setBudgets(budgetsData);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Callback functions for updating state from child components
  const handleCategoryCreate = useCallback((newCategory: Category) => {
    setCategories((prev: Category[]) => [...prev, newCategory]);
  }, []);

  const handleCategoryUpdate = useCallback((updatedCategory: Category) => {
    setCategories((prev: Category[]) => 
      prev.map((cat: Category) => cat.id === updatedCategory.id ? updatedCategory : cat)
    );
  }, []);

  const handleCategoryDelete = useCallback((categoryId: number) => {
    setCategories((prev: Category[]) => prev.filter((cat: Category) => cat.id !== categoryId));
    // Also remove transactions in this category
    setTransactions((prev: Transaction[]) => prev.filter((t: Transaction) => t.category_id !== categoryId));
  }, []);

  const handleTransactionCreate = useCallback((newTransaction: Transaction) => {
    setTransactions((prev: Transaction[]) => [newTransaction, ...prev]);
  }, []);

  const handleTransactionUpdate = useCallback((updatedTransaction: Transaction) => {
    setTransactions((prev: Transaction[]) => 
      prev.map((t: Transaction) => t.id === updatedTransaction.id ? updatedTransaction : t)
    );
  }, []);

  const handleTransactionDelete = useCallback((transactionId: number) => {
    setTransactions((prev: Transaction[]) => prev.filter((t: Transaction) => t.id !== transactionId));
  }, []);

  const handleBudgetCreate = useCallback((newBudget: Budget) => {
    setBudgets((prev: Budget[]) => [...prev, newBudget]);
  }, []);

  const handleBudgetUpdate = useCallback((updatedBudget: Budget) => {
    setBudgets((prev: Budget[]) => 
      prev.map((b: Budget) => b.id === updatedBudget.id ? updatedBudget : b)
    );
  }, []);

  const handleBudgetDelete = useCallback((budgetId: number) => {
    setBudgets((prev: Budget[]) => prev.filter((b: Budget) => b.id !== budgetId));
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-64">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your financial data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            💰 Personal Expense Tracker
          </h1>
          <p className="text-lg text-gray-600">
            Take control of your finances with smart tracking and budgeting
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="dashboard" className="text-sm font-medium">
              📊 Dashboard
            </TabsTrigger>
            <TabsTrigger value="transactions" className="text-sm font-medium">
              💳 Transactions
            </TabsTrigger>
            <TabsTrigger value="categories" className="text-sm font-medium">
              🏷️ Categories
            </TabsTrigger>
            <TabsTrigger value="budgets" className="text-sm font-medium">
              🎯 Budgets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard 
              categories={categories}
              transactions={transactions}
              budgets={budgets}
            />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <TransactionManager
              categories={categories}
              transactions={transactions}
              onTransactionCreate={handleTransactionCreate}
              onTransactionUpdate={handleTransactionUpdate}
              onTransactionDelete={handleTransactionDelete}
            />
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <CategoryManager
              categories={categories}
              onCategoryCreate={handleCategoryCreate}
              onCategoryUpdate={handleCategoryUpdate}
              onCategoryDelete={handleCategoryDelete}
            />
          </TabsContent>

          <TabsContent value="budgets" className="space-y-6">
            <BudgetManager
              categories={categories}
              budgets={budgets}
              transactions={transactions}
              onBudgetCreate={handleBudgetCreate}
              onBudgetUpdate={handleBudgetUpdate}
              onBudgetDelete={handleBudgetDelete}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
