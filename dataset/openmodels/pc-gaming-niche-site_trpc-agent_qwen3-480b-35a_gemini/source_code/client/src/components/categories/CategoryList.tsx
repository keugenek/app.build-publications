import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CategoryPage } from '@/components/categories/CategoryPage';
import { trpc } from '@/utils/trpc';
import type { Category } from '../../../../server/src/schema';

export function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories only when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await trpc.getCategories.query();
        setCategories(result);
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isLoading) {
      fetchCategories();
    }
  }, [isLoading]);

  if (selectedCategory) {
    return <CategoryPage categoryId={selectedCategory} onBack={() => setSelectedCategory(null)} />;
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading categories...</div>;
  }

  if (categories.length === 0) {
    return <div className="text-center py-8">No categories found.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Product Categories</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Browse our collection of gaming peripherals by category
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card 
            key={category.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col"
            onClick={() => setSelectedCategory(category.id)}
          >
            <CardHeader>
              <CardTitle className="text-xl">{category.name}</CardTitle>
              <CardDescription>
                {category.description || 'Explore our curated selection'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-end">
              <Button variant="outline" className="w-full">
                View Products
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
