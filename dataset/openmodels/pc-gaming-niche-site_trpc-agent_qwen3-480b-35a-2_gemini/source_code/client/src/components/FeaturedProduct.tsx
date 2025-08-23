import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Product, Category } from '../../../server/src/schema';

interface FeaturedProductProps {
  product: Product;
  category?: Category;
}

export function FeaturedProduct({ product, category }: FeaturedProductProps) {
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
        <div className="flex justify-between items-start">
          <div>
            <Badge variant="secondary" className="bg-white text-blue-600">
              Featured
            </Badge>
            <h3 className="text-xl mt-2 text-white font-bold">{product.name}</h3>
            {category && (
              <p className="text-blue-100">{category.name}</p>
            )}
          </div>
          <Badge variant="secondary" className="bg-white text-blue-600 text-lg">
            ${product.price.toFixed(2)}
          </Badge>
        </div>
      </div>
      
      <CardContent className="flex-grow flex flex-col p-0">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="bg-gray-200 border-2 border-dashed w-full h-48 flex items-center justify-center">
            <span className="text-gray-500">No Image</span>
          </div>
        )}
        
        <div className="p-4 flex-grow flex flex-col">
          {product.description && (
            <p className="text-gray-600 text-sm mb-4 flex-grow">
              {product.description.substring(0, 100)}...
            </p>
          )}
          
          <div className="flex justify-between items-center mt-auto">
            <span className="text-xs text-gray-500">
              Added: {product.created_at.toLocaleDateString()}
            </span>
            <Button size="sm">View Details</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
