import type { Product } from '../../../server/src/schema';
import { Card } from '@/components/ui/card';

// This component receives products and loading state from parent
export function ProductList({ products, loading }: { products: Product[]; loading: boolean }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Products</h2>
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex flex-col gap-1">
                <span className="font-medium">{p.name}</span>
                <span className="text-sm text-muted-foreground">SKU: {p.sku}</span>
                <span className="text-sm">Stock: {p.stock_quantity}</span>
                <span className="text-xs text-muted-foreground">
                  Created: {new Date(p.created_at).toLocaleDateString()}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
