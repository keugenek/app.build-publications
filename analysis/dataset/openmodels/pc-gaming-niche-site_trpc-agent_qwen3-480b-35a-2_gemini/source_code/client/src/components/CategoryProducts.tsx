import { ProductCard } from '@/components/ProductCard';
import type { Product, Category } from '../../../server/src/schema';

interface CategoryProductsProps {
  category: Category;
  products: Product[];
  onBack: () => void;
}

export function CategoryProducts({ category, products, onBack }: CategoryProductsProps) {
  const getCategory = (categoryId: number) => {
    return categoryId === category.id ? category : undefined;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button 
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 flex items-center mb-2"
          >
            ← Back to Categories
          </button>
          <h1 className="text-3xl font-bold">{category.name}</h1>
          {category.description && (
            <p className="text-gray-600 mt-2">{category.description}</p>
          )}
        </div>
        <div className="text-sm text-gray-500">
          {products.length} {products.length === 1 ? 'product' : 'products'}
        </div>
      </div>
      
      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              category={getCategory(product.category_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
