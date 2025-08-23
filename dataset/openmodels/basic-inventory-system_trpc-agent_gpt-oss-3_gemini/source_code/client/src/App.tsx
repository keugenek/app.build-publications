import { useEffect, useState, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { ProductForm } from '@/components/ProductForm';
import { ProductList } from '@/components/ProductList';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionList } from '@/components/TransactionList';
import type { Product, CreateProductInput } from '../../server/src/schema';
import '@/App.css';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const data = await trpc.getProducts.query();
      setProducts(data);
    } catch (e) {
      console.error('Error loading products', e);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleCreateProduct = async (data: CreateProductInput) => {
    try {
      const newProduct = await trpc.createProduct.mutate(data);
      setProducts((prev) => [...prev, newProduct]);
    } catch (e) {
      console.error('Error creating product', e);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Inventory Management</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <section className="space-y-6">
          <ProductForm onSubmit={handleCreateProduct} />
          <ProductList products={products} loading={productsLoading} />
        </section>
        <section className="space-y-6">
          <TransactionForm />
          <TransactionList />
        </section>
      </div>
    </div>
  );
}

export default App;
