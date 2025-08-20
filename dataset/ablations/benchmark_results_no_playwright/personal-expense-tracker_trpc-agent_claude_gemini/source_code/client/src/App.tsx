import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Removed unused Button import
import { trpc } from '@/utils/trpc';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionList } from '@/components/TransactionList';
import { BudgetManager } from '@/components/BudgetManager';
import { Dashboard } from '@/components/Dashboard';
import { CategoryManager } from '@/components/CategoryManager';
import type { Transaction, Category, Budget } from '../../server/src/schema';

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Load initial data
  const loadTransactions = useCallback(async () => {
    try {
      const result = await trpc.getTransactions.query();
      setTransactions(result);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.getCategories.query();
      setCategories(result);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  const loadBudgets = useCallback(async () => {
    try {
      const result = await trpc.getBudgets.query();
      setBudgets(result);
    } catch (error) {
      console.error('Failed to load budgets:', error);
    }
  }, []);

  // Initialize predefined categories on first load
  const initializePredefinedCategories = useCallback(async () => {
    try {
      await trpc.seedPredefinedCategories.mutate();
    } catch (error) {
      console.error('Failed to seed predefined categories:', error);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      await initializePredefinedCategories();
      await loadCategories();
      await loadTransactions();
      await loadBudgets();
    };
    initialize();
  }, [initializePredefinedCategories, loadCategories, loadTransactions, loadBudgets]);

  const handleTransactionCreated = useCallback((newTransaction: Transaction) => {
    setTransactions((prev: Transaction[]) => [newTransaction, ...prev]);
  }, []);

  const handleTransactionUpdated = useCallback((updatedTransaction: Transaction) => {
    setTransactions((prev: Transaction[]) =>
      prev.map((t: Transaction) => t.id === updatedTransaction.id ? updatedTransaction : t)
    );
  }, []);

  const handleTransactionDeleted = useCallback((deletedId: number) => {
    setTransactions((prev: Transaction[]) =>
      prev.filter((t: Transaction) => t.id !== deletedId)
    );
  }, []);

  const handleCategoryCreated = useCallback((newCategory: Category) => {
    setCategories((prev: Category[]) => [...prev, newCategory]);
  }, []);

  const handleBudgetCreated = useCallback((newBudget: Budget) => {
    setBudgets((prev: Budget[]) => [...prev, newBudget]);
  }, []);

  const handleBudgetUpdated = useCallback((updatedBudget: Budget) => {
    setBudgets((prev: Budget[]) =>
      prev.map((b: Budget) => b.id === updatedBudget.id ? updatedBudget : b)
    );
  }, []);

  const handleBudgetDeleted = useCallback((deletedId: number) => {
    setBudgets((prev: Budget[]) =>
      prev.filter((b: Budget) => b.id !== deletedId)
    );
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">💰 Personal Finance Tracker</h1>
          <p className="text-gray-600">Track your income, expenses, and budgets all in one place</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              📊 Dashboard
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              💳 Transactions
            </TabsTrigger>
            <TabsTrigger value="budgets" className="flex items-center gap-2">
              🎯 Budgets
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              🏷️ Categories
            </TabsTrigger>
            <TabsTrigger value="add-transaction" className="flex items-center gap-2">
              ➕ Add Transaction
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  💳 Transaction History
                </CardTitle>
                <CardDescription>
                  View and manage all your income and expense transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionList
                  transactions={transactions}
                  categories={categories}
                  onTransactionUpdated={handleTransactionUpdated}
                  onTransactionDeleted={handleTransactionDeleted}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budgets">
            <BudgetManager
              categories={categories}
              budgets={budgets}
              onBudgetCreated={handleBudgetCreated}
              onBudgetUpdated={handleBudgetUpdated}
              onBudgetDeleted={handleBudgetDeleted}
            />
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManager
              categories={categories}
              onCategoryCreated={handleCategoryCreated}
            />
          </TabsContent>

          <TabsContent value="add-transaction">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ➕ Add New Transaction
                </CardTitle>
                <CardDescription>
                  Record a new income or expense transaction
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
      </div>
    </div>
  );
}

export default App;
