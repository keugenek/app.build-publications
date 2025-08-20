import { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import type { Category } from '../../../../server/src/schema';
import { ProductList } from '@/components/products/ProductList';
import { Button } from '@/components/ui/button';

interface CategoryPageProps {
  categoryId: number;
  onBack: () => void;
}

export function CategoryPage({ categoryId, onBack }: CategoryPageProps) {
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCategory = async () => {
      setIsLoading(true);
      try {
        // We need to fetch all categories and filter by ID since there's no getCategoryById endpoint
        const categories = await trpc.getCategories.query();
        const foundCategory = categories.find(cat => cat.id === categoryId);
        setCategory(foundCategory || null);
      } catch (error) {
        console.error('Failed to load category:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategory();
  }, [categoryId]);

  if (isLoading) {
    return <div className="text-center py-8">Loading category...</div>;
  }

  if (!category) {
    return (
      <div className="text-center py-8">
        <p>Category not found.</p>
        <Button onClick={onBack} className="mt-4">Back to Categories</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button onClick={onBack} variant="outline">← Back</Button>
        <h2 className="text-2xl font-bold">{category.name}</h2>
      </div>
      
      {category.description && (
        <p className="text-gray-600 dark:text-gray-300">
          {category.description}
        </p>
      )}
      
      <ProductList categoryId={categoryId} />
    </div>
  );
}
