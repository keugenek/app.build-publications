import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionList } from '@/components/TransactionList';
import { BudgetForm } from '@/components/BudgetForm';
import { BudgetList } from '@/components/BudgetList';
import { Dashboard } from '@/components/Dashboard';
import { SpendingSummary } from '@/components/SpendingSummary';
import { trpc } from '@/utils/trpc';
import type { Transaction, Budget } from '../../server/src/schema';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // Load data when component mounts
  trpc.getTransactions.query().then(setTransactions).catch(console.error);
  trpc.getBudgets.query().then(setBudgets).catch(console.error);

  const handleTransactionCreated = (transaction: Transaction) => {
    setTransactions(prev => [...prev, transaction]);
  };

  const handleTransactionUpdated = (updatedTransaction: Transaction) => {
    setTransactions(prev => 
      prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
    );
  };

  const handleTransactionDeleted = (id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleBudgetCreated = (budget: Budget) => {
    setBudgets(prev => [...prev, budget]);
  };

  const handleBudgetUpdated = (updatedBudget: Budget) => {
    setBudgets(prev => 
      prev.map(b => b.id === updatedBudget.id ? updatedBudget : b)
    );
  };

  const handleBudgetDeleted = (id: number) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Personal Expense Tracker</h1>
          <p className="text-gray-600">Manage your income, expenses, and budgets</p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard 
              transactions={transactions}
              budgets={budgets}
            />
          </TabsContent>

          <TabsContent value="transactions">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Add Transaction</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TransactionForm 
                      onTransactionCreated={handleTransactionCreated}
                    />
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction List</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TransactionList 
                      transactions={transactions}
                      onTransactionUpdated={handleTransactionUpdated}
                      onTransactionDeleted={handleTransactionDeleted}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="budgets">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Set Budget</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BudgetForm 
                      onBudgetCreated={handleBudgetCreated}
                    />
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Budget List</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BudgetList 
                      budgets={budgets}
                      transactions={transactions}
                      onBudgetUpdated={handleBudgetUpdated}
                      onBudgetDeleted={handleBudgetDeleted}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>Spending Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <SpendingSummary transactions={transactions} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Settings and preferences will be available here.</p>
                <Button className="mt-4">Export Data</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
