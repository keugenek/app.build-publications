import { useState } from 'react';
import type { Category, Product, Article } from '../../server/src/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LandingPage } from '@/components/LandingPage';
import { AdminPanel } from '@/components/AdminPanel';
import { ProductCard } from '@/components/ProductCard';
import { ArticleCard } from '@/components/ArticleCard';
import { CategoryFilter } from '@/components/CategoryFilter';

type View = 'landing' | 'products' | 'articles' | 'admin';

function App() {
  const [categories] = useState<Category[]>([
    { id: 1, name: 'Gaming Mice', slug: 'gaming-mice', description: 'Budget gaming mice with high DPI and low latency', created_at: new Date('2023-01-15') },
    { id: 2, name: 'Gaming Keyboards', slug: 'gaming-keyboards', description: 'Affordable mechanical and membrane keyboards', created_at: new Date('2023-01-15') },
    { id: 3, name: 'Headsets', slug: 'headsets', description: 'Gaming headsets with crystal clear audio', created_at: new Date('2023-01-15') },
    { id: 4, name: 'Controllers', slug: 'controllers', description: 'Game controllers for PC and console', created_at: new Date('2023-01-15') }
  ]);
  
  const [products] = useState<Product[]>([
    { 
      id: 1, 
      name: 'BudgetMaster Pro Mouse', 
      slug: 'budgetmaster-pro-mouse', 
      description: 'High precision gaming mouse with 16000 DPI sensor and customizable RGB lighting', 
      price: 29.99, 
      category_id: 1, 
      image_url: null, 
      created_at: new Date('2023-02-01') 
    },
    { 
      id: 2, 
      name: 'SpeedType Mechanical Keyboard', 
      slug: 'speedtype-mechanical-keyboard', 
      description: 'Tenkeyless mechanical keyboard with blue switches and programmable macro keys', 
      price: 49.99, 
      category_id: 2, 
      image_url: null, 
      created_at: new Date('2023-02-05') 
    },
    { 
      id: 3, 
      name: 'AudioClear Gaming Headset', 
      slug: 'audioclear-gaming-headset', 
      description: '7.1 surround sound headset with noise cancelling microphone', 
      price: 39.99, 
      category_id: 3, 
      image_url: null, 
      created_at: new Date('2023-02-10') 
    },
    { 
      id: 4, 
      name: 'UltraGrip Controller', 
      slug: 'ultragrip-controller', 
      description: 'Ergonomic controller with customizable buttons and triggers', 
      price: 34.99, 
      category_id: 4, 
      image_url: null, 
      created_at: new Date('2023-02-15') 
    },
    { 
      id: 5, 
      name: 'RGBMaster Mouse Pad', 
      slug: 'rgbmaster-mouse-pad', 
      description: 'Large gaming mouse pad with RGB lighting and smooth surface', 
      price: 19.99, 
      category_id: 1, 
      image_url: null, 
      created_at: new Date('2023-02-20') 
    },
    { 
      id: 6, 
      name: 'KeyQuick Mechanical Pad', 
      slug: 'keyquick-mechanical-pad', 
      description: 'Compact 60% mechanical keyboard with hot-swappable switches', 
      price: 59.99, 
      category_id: 2, 
      image_url: null, 
      created_at: new Date('2023-02-25') 
    }
  ]);
  
  const [publishedArticles] = useState<Article[]>([
    { 
      id: 1, 
      title: 'Top 5 Budget Gaming Mice of 2023', 
      slug: 'top-5-budget-gaming-mice-2023', 
      content: 'Detailed review of the best budget gaming mice...', 
      excerpt: 'Find the best budget gaming mice without breaking the bank', 
      image_url: null, 
      published: true, 
      created_at: new Date('2023-03-01'), 
      updated_at: new Date('2023-03-01') 
    },
    { 
      id: 2, 
      title: 'Mechanical vs Membrane Keyboards', 
      slug: 'mechanical-vs-membrane-keyboards', 
      content: 'Complete guide comparing mechanical and membrane keyboards...', 
      excerpt: 'Understanding the differences between mechanical and membrane keyboards', 
      image_url: null, 
      published: true, 
      created_at: new Date('2023-03-05'), 
      updated_at: new Date('2023-03-05') 
    },
    { 
      id: 3, 
      title: 'Headset Buying Guide for Budget Gamers', 
      slug: 'headset-buying-guide-budget-gamers', 
      content: 'Everything you need to know when choosing a budget gaming headset...', 
      excerpt: 'Essential factors to consider when buying a gaming headset on a budget', 
      image_url: null, 
      published: true, 
      created_at: new Date('2023-03-10'), 
      updated_at: new Date('2023-03-10') 
    }
  ]);
  
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<View>('landing');

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory ? product.category_id === selectedCategory : true;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategory = (categoryId: number) => {
    return categories.find(cat => cat.id === categoryId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Budget PC Gaming Hub</h1>
              <p className="text-gray-600 mt-1">Reviews for budget-friendly gaming peripherals</p>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <div className="flex items-center space-x-2">
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="w-full md:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => setCurrentView(currentView === 'admin' ? 'landing' : 'admin')}
              >
                {currentView === 'admin' ? 'Hide Admin' : 'Show Admin'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {currentView === 'admin' ? (
          <AdminPanel />
        ) : currentView === 'landing' ? (
          <LandingPage 
            categories={categories}
            products={products}
            articles={publishedArticles}
            onShowProducts={() => setCurrentView('products')}
            onShowArticles={() => setCurrentView('articles')}
          />
        ) : currentView === 'products' ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Products</h1>
              <Button variant="outline" onClick={() => setCurrentView('landing')}>
                ← Back to Home
              </Button>
            </div>
            
            <CategoryFilter 
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No products found matching your criteria.</p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchTerm('');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    category={getCategory(product.category_id)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Articles</h1>
              <Button variant="outline" onClick={() => setCurrentView('landing')}>
                ← Back to Home
              </Button>
            </div>
            
            {publishedArticles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No articles published yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publishedArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-600">
            <p>© {new Date().getFullYear()} Budget PC Gaming Hub. All rights reserved.</p>
            <p className="mt-2 text-sm">Reviews for budget-friendly gaming peripherals</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
