import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dashboard } from '@/components/Dashboard';
import { ProductManagement } from '@/components/ProductManagement';
import { StockMovements } from '@/components/StockMovements';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏪</span>
              <h1 className="text-xl font-bold text-gray-900">
                Inventory Manager
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Small Business Inventory System
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              🏠 Dashboard
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              📦 Products
            </TabsTrigger>
            <TabsTrigger value="movements" className="flex items-center gap-2">
              📊 Stock Movements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="movements">
            <StockMovements />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
            <p>💼 Built for small businesses to manage inventory efficiently</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
