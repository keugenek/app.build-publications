import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dashboard } from '@/components/Dashboard';
import { TransactionManager } from '@/components/TransactionManager';
import { CategoryManager } from '@/components/CategoryManager';
import { BudgetManager } from '@/components/BudgetManager';
import { Wallet, PieChart, FolderOpen, Target } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">💰 Personal Finance Tracker</h1>
          <p className="text-lg text-gray-600">Take control of your financial future</p>
        </div>

        {/* Main Content */}
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl">Financial Management Suite</CardTitle>
            <CardDescription className="text-blue-100">
              Track expenses, manage budgets, and visualize your spending patterns
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 rounded-none bg-gray-50 border-b">
                <TabsTrigger 
                  value="dashboard" 
                  className="flex items-center gap-2 py-3"
                >
                  <PieChart size={18} />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger 
                  value="transactions" 
                  className="flex items-center gap-2 py-3"
                >
                  <Wallet size={18} />
                  Transactions
                </TabsTrigger>
                <TabsTrigger 
                  value="categories" 
                  className="flex items-center gap-2 py-3"
                >
                  <FolderOpen size={18} />
                  Categories
                </TabsTrigger>
                <TabsTrigger 
                  value="budgets" 
                  className="flex items-center gap-2 py-3"
                >
                  <Target size={18} />
                  Budgets
                </TabsTrigger>
              </TabsList>

              <div className="min-h-[600px]">
                <TabsContent value="dashboard" className="p-6">
                  <Dashboard />
                </TabsContent>

                <TabsContent value="transactions" className="p-6">
                  <TransactionManager />
                </TabsContent>

                <TabsContent value="categories" className="p-6">
                  <CategoryManager />
                </TabsContent>

                <TabsContent value="budgets" className="p-6">
                  <BudgetManager />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
