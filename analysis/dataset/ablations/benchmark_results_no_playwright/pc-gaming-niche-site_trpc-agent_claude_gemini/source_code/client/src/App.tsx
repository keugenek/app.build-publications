import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Category, ReviewArticleWithCategory } from '../../server/src/schema';
import { ReviewArticleForm } from '@/components/ReviewArticleForm';
import { CategoryManager } from '@/components/CategoryManager';
import { ReviewArticleList } from '@/components/ReviewArticleList';
import { ReviewArticleDetail } from '@/components/ReviewArticleDetail';

type View = 'home' | 'category' | 'article' | 'cms';

function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<ReviewArticleWithCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<ReviewArticleWithCategory | null>(null);
  const [currentView, setCurrentView] = useState<View>('home');

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.getCategories.query({});
      setCategories(result);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  // Load articles with optional category filter
  const loadArticles = useCallback(async (categoryId?: number) => {
    try {
      const result = await trpc.getReviewArticles.query({
        category_id: categoryId,
        limit: 20,
        offset: 0
      });
      setArticles(result);
    } catch (error) {
      console.error('Failed to load articles:', error);
    }
  }, []);



  useEffect(() => {
    loadCategories();
    loadArticles();
  }, [loadCategories, loadArticles]);

  const handleCategoryFilter = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setCurrentView('category');
    loadArticles(categoryId || undefined);
  };

  const handleArticleSelect = (article: ReviewArticleWithCategory) => {
    setSelectedArticle(article);
    setCurrentView('article');
  };

  const handleViewChange = (view: View) => {
    setCurrentView(view);
    if (view === 'home') {
      setSelectedCategory(null);
      setSelectedArticle(null);
      loadArticles();
    }
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ⭐
          </span>
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleViewChange('home')}
                className="flex items-center gap-2 text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
              >
                🎮 BudgetGaming Reviews
              </button>
              <Badge variant="secondary" className="hidden md:inline-flex">
                Budget PC Peripherals
              </Badge>
            </div>
            <nav className="flex items-center gap-4">
              <Button
                variant={currentView === 'home' ? 'default' : 'ghost'}
                onClick={() => handleViewChange('home')}
              >
                Home
              </Button>
              <Button
                variant={currentView === 'cms' ? 'default' : 'ghost'}
                onClick={() => handleViewChange('cms')}
              >
                CMS
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Home View */}
        {currentView === 'home' && (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-gray-900">
                Budget Gaming Peripheral Reviews
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Honest reviews of affordable gaming mice, keyboards, headsets, and more. 
                Find the best bang for your buck without breaking the bank! 💰
              </p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                onClick={() => handleCategoryFilter(null)}
                className="flex items-center gap-2"
              >
                🎯 All Categories
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  onClick={() => handleCategoryFilter(category.id)}
                  className="flex items-center gap-2"
                >
                  {category.name === 'Mice' && '🖱️'}
                  {category.name === 'Keyboards' && '⌨️'}
                  {category.name === 'Headsets' && '🎧'}
                  {!['Mice', 'Keyboards', 'Headsets'].includes(category.name) && '🎮'}
                  {category.name}
                </Button>
              ))}
            </div>

            {/* Articles Grid */}
            <ReviewArticleList
              articles={articles}
              onArticleSelect={handleArticleSelect}
              renderStarRating={renderStarRating}
            />

            {articles.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  No reviews available yet. Check back soon for amazing budget gaming gear reviews! 🚀
                </p>
              </div>
            )}
          </div>
        )}

        {/* Category View */}
        {currentView === 'category' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => handleViewChange('home')}
                className="flex items-center gap-2"
              >
                ← Back to Home
              </Button>
              <h1 className="text-3xl font-bold">
                {selectedCategory ? getCategoryName(selectedCategory) : 'All Categories'}
              </h1>
            </div>

            <ReviewArticleList
              articles={articles}
              onArticleSelect={handleArticleSelect}
              renderStarRating={renderStarRating}
            />
          </div>
        )}

        {/* Article Detail View */}
        {currentView === 'article' && selectedArticle && (
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={() => handleViewChange('home')}
              className="flex items-center gap-2"
            >
              ← Back to Reviews
            </Button>

            <ReviewArticleDetail
              article={selectedArticle}
              renderStarRating={renderStarRating}
            />
          </div>
        )}

        {/* CMS View */}
        {currentView === 'cms' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              ⚙️ Content Management System
            </h1>

            <Tabs defaultValue="articles" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="articles">📝 Articles</TabsTrigger>
                <TabsTrigger value="categories">📁 Categories</TabsTrigger>
              </TabsList>

              <TabsContent value="articles" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      ✍️ Create New Review Article
                    </CardTitle>
                    <CardDescription>
                      Add a new review for a budget gaming peripheral
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ReviewArticleForm
                      categories={categories}
                      onSuccess={() => {
                        loadArticles();
                      }}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      📋 Manage Articles
                    </CardTitle>
                    <CardDescription>
                      View, edit, or delete existing review articles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {articles.map((article) => (
                        <div key={article.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-semibold">{article.title}</h3>
                            <p className="text-sm text-gray-600">
                              {article.brand} {article.model} • {article.category.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {renderStarRating(article.star_rating)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleArticleSelect(article)}
                            >
                              👀 View
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await trpc.deleteReviewArticle.mutate({ id: article.id });
                                  loadArticles();
                                } catch (error) {
                                  console.error('Failed to delete article:', error);
                                }
                              }}
                            >
                              🗑️ Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                      {articles.length === 0 && (
                        <p className="text-gray-500 text-center py-8">
                          No articles found. Create your first review above! 📝
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="categories">
                <CategoryManager
                  categories={categories}
                  onCategoriesChange={loadCategories}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600">
          <p>© 2024 BudgetGaming Reviews - Helping gamers find affordable quality gear 🎮</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
