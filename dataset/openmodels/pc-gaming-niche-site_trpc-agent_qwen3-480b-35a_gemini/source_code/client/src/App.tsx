import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { HomePage } from '@/components/HomePage';
import { CategoryList } from '@/components/categories/CategoryList';
import { ReviewList } from '@/components/reviews/ReviewList';
import { AdminPanel } from '@/components/admin/AdminPanel';

function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center py-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Budget PC Gaming Peripherals
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
            Honest reviews for budget-conscious gamers
          </p>
        </header>

        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

        <main>
          {activeTab === 'home' && <HomePage />}
          {activeTab === 'categories' && <CategoryList />}
          {activeTab === 'reviews' && <ReviewList />}
          {activeTab === 'admin' && <AdminPanel />}
        </main>
      </div>
    </div>
  );
}

export default App;
