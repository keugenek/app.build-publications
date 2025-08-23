import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Product, Category } from '../../../server/src/schema';

interface ProductCardProps {
  product: Product;
  category?: Category;
}

export function ProductCard({ product, category }: ProductCardProps) {
  return (
    <Card className="overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
          <Badge variant="secondary">${product.price.toFixed(2)}</Badge>
        </div>
        {category && (
          <p className="text-sm text-gray-500">{category.name}</p>
        )}
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-48 object-cover rounded-md mb-4"
          />
        ) : (
          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-48 mb-4 flex items-center justify-center">
            <span className="text-gray-500">No Image</span>
          </div>
        )}
        {product.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">{product.description}</p>
        )}
        <div className="flex justify-between items-center mt-auto">
          <span className="text-xs text-gray-500">
            Added: {product.created_at.toLocaleDateString()}
          </span>
          <Button size="sm">View Details</Button>
        </div>
      </CardContent>
    </Card>
  );
}
