import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import type { Product, Category, Review } from '../../../server/src/schema';

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [productsData, categoriesData, reviewsData] = await Promise.all([
          trpc.getProducts.query(),
          trpc.getCategories.query(),
          trpc.getReviews.query()
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
        setReviews(reviewsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Get top rated products
  const getTopRatedProducts = () => {
    return products
      .map(product => {
        const productReviews = reviews.filter(r => r.product_id === product.id);
        const avgRating = productReviews.length > 0 
          ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
          : 0;
        return { ...product, avgRating, reviewCount: productReviews.length };
      })
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 3);
  };

  // Get recent reviews
  const getRecentReviews = () => {
    return [...reviews]
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, 3);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading homepage...</div>;
  }

  const topProducts = getTopRatedProducts();
  const recentReviews = getRecentReviews();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Budget PC Gaming Peripherals</h1>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Honest reviews for budget-conscious gamers. Find the best gaming gear without breaking the bank.
        </p>
        <Button size="lg" variant="secondary">
          Browse Categories
        </Button>
      </section>

      {/* Categories Preview */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Product Categories</h2>
          <Button variant="outline">View All</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.slice(0, 3).map(category => (
            <Card key={category.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
                <CardDescription>
                  {category.description || 'Explore our curated selection'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Browse Products
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Top Rated Products */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Top Rated Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topProducts.map(product => {
            const category = categories.find(c => c.id === product.category_id);
            return (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between">
                    <span>{product.name}</span>
                    {product.price && (
                      <span className="text-lg font-bold text-green-600">
                        ${product.price.toFixed(2)}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {category?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="fill-yellow-400 text-yellow-400" />
                      <span className="ml-1 font-medium">
                        {product.avgRating.toFixed(1)}
                      </span>
                      <span className="text-gray-500 text-sm ml-1">
                        ({product.reviewCount})
                      </span>
                    </div>
                    <Button size="sm">View Details</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Recent Reviews */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Recent Reviews</h2>
        <div className="space-y-6">
          {recentReviews.map(review => {
            const product = products.find(p => p.id === review.product_id);
            return (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{review.title}</CardTitle>
                      <CardDescription>
                        For: {product?.name || 'Unknown Product'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 font-medium">{review.rating}/5</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2">{review.content}</p>
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm">
                      Read Full Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
