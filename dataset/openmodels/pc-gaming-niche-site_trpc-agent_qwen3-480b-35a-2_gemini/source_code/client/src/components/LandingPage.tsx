import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FeaturedProduct } from '@/components/FeaturedProduct';
import { ArticlePreview } from '@/components/ArticlePreview';
import type { Category, Product, Article } from '../../../server/src/schema';

interface LandingPageProps {
  categories: Category[];
  products: Product[];
  articles: Article[];
  onShowProducts: () => void;
  onShowArticles: () => void;
}

export function LandingPage({ categories, products, articles, onShowProducts, onShowArticles }: LandingPageProps) {
  const featuredProducts = products.slice(0, 3);
  const recentArticles = articles.slice(0, 3);
  const getCategory = (categoryId: number) => {
    return categories.find(cat => cat.id === categoryId);
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-16 md:py-24 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl text-white">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Budget PC Gaming Hub
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-10 opacity-90">
            Unbiased reviews and buying guides for budget-friendly gaming peripherals
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={onShowProducts} className="text-lg px-8 py-6">
              Browse Products
            </Button>
            <Button size="lg" variant="outline" onClick={onShowArticles} className="text-lg px-8 py-6 bg-white/10 hover:bg-white/20 border-white">
              Read Articles
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-4">Shop by Category</h2>
        <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
          Find the perfect gaming peripherals for your setup
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Card key={category.id} className="text-center cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 feature-card">
              <CardHeader>
                <CardTitle className="text-lg">{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {category.description || 'Browse our selection'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <p className="text-gray-600">Our top picks for budget gaming peripherals</p>
          </div>
          <Button variant="outline" onClick={onShowProducts}>
            View All Products →
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredProducts.map((product) => (
            <FeaturedProduct 
              key={product.id} 
              product={product} 
              category={getCategory(product.category_id)}
            />
          ))}
        </div>
      </section>

      {/* Latest Articles */}
      <section>
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold">Latest Articles</h2>
            <p className="text-gray-600">Guides, reviews, and buying advice</p>
          </div>
          <Button variant="outline" onClick={onShowArticles}>
            View All Articles →
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentArticles.map((article) => (
            <ArticlePreview key={article.id} article={article} />
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-100 rounded-xl">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Why Gamers Trust Us</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            We're dedicated to helping you make informed decisions about budget gaming gear
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center bg-white p-6 rounded-lg shadow-sm">
              <div className="bg-blue-100 text-blue-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✓</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Unbiased Reviews</h3>
              <p className="text-gray-600">
                We test products thoroughly and provide honest opinions to help you make the best buying decisions.
              </p>
            </div>
            <div className="text-center bg-white p-6 rounded-lg shadow-sm">
              <div className="bg-green-100 text-green-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">$</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Budget-Friendly</h3>
              <p className="text-gray-600">
                Focused exclusively on affordable options that deliver great performance without breaking the bank.
              </p>
            </div>
            <div className="text-center bg-white p-6 rounded-lg shadow-sm">
              <div className="bg-purple-100 text-purple-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⏱</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Up-to-Date</h3>
              <p className="text-gray-600">
                We constantly review new products and update our recommendations based on the latest market trends.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
