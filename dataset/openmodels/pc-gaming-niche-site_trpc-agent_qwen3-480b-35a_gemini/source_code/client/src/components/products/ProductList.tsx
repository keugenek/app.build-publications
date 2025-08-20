import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import type { Product } from '../../../../server/src/schema';

interface ProductListProps {
  categoryId?: number;
}

export function ProductList({ categoryId }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        let result: Product[];
        if (categoryId) {
          result = await trpc.getProductsByCategory.query({ categoryId });
        } else {
          result = await trpc.getProducts.query();
        }
        setProducts(result);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [categoryId]);

  if (isLoading) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  if (products.length === 0) {
    return <div className="text-center py-8">No products found.</div>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Card key={product.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex justify-between items-start">
              <span>{product.name}</span>
              {product.price && (
                <Badge variant="secondary">${product.price.toFixed(2)}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {product.description || 'No description available'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <Button variant="outline" size="sm">
                View Reviews
              </Button>
              <Badge variant="outline">
                ID: {product.id}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
