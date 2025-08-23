import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Product, Category } from '../../../server/src/schema';

interface ProductDetailProps {
  product: Product;
  category?: Category;
  onBack: () => void;
}

export function ProductDetail({ product, category, onBack }: ProductDetailProps) {
  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onBack}>
        ← Back to Products
      </Button>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl md:text-3xl">{product.name}</CardTitle>
              {category && (
                <p className="text-lg text-gray-600">{category.name}</p>
              )}
            </div>
            <Badge variant="secondary" className="text-lg py-2 px-4">
              ${product.price.toFixed(2)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/2">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="w-full h-96 object-cover rounded-lg"
                />
              ) : (
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-96 flex items-center justify-center">
                  <span className="text-gray-500 text-lg">No Image Available</span>
                </div>
              )}
            </div>
            
            <div className="md:w-1/2">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-700">
                    {product.description || 'No description available for this product.'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Key Features</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>High precision gaming sensor</li>
                    <li>Ergonomic design for comfort</li>
                    <li>Customizable RGB lighting</li>
                    <li>Programmable buttons</li>
                    <li>Durable construction</li>
                  </ul>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button size="lg">
                    Add to Cart
                  </Button>
                  <Button size="lg" variant="outline">
                    Add to Wishlist
                  </Button>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Our Verdict</h3>
                  <p className="text-blue-700">
                    An excellent budget option that delivers solid performance for its price point. 
                    Great value for casual and competitive gamers alike.
                  </p>
                  <div className="mt-3">
                    <span className="font-bold text-lg text-blue-900">8.5/10</span>
                    <span className="text-blue-700 ml-2">★ ★ ★ ★ ☆</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between border-b pb-2">
                <dt className="font-medium">Brand</dt>
                <dd>BudgetGaming</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="font-medium">Model</dt>
                <dd>{product.name}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="font-medium">Weight</dt>
                <dd>120g</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="font-medium">Dimensions</dt>
                <dd>120 x 65 x 40 mm</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="font-medium">Warranty</dt>
                <dd>2 Years</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Pros & Cons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-green-700 mb-2">Pros</h4>
                <ul className="space-y-1 text-green-600">
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Affordable price point</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Excellent build quality</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>High precision sensor</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Comfortable ergonomics</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-red-700 mb-2">Cons</h4>
                <ul className="space-y-1 text-red-600">
                  <li className="flex items-start">
                    <span className="mr-2">✗</span>
                    <span>Limited customization software</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✗</span>
                    <span>No wireless option</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
