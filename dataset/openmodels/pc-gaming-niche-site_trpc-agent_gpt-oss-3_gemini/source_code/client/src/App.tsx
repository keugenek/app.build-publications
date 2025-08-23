import './App.css';
import { useEffect, useState, useCallback, FormEvent } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { Category, CreateCategoryInput, Product, CreateProductInput, Review, CreateReviewInput } from '../../server/src/schema';

function App() {
  // ----- Categories -----
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryForm, setCategoryForm] = useState<CreateCategoryInput>({ name: '' });
  const [categoryLoading, setCategoryLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const data = await trpc.getCategories.query();
      setCategories(data);
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleCategorySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCategoryLoading(true);
    try {
      const newCat = await trpc.createCategory.mutate(categoryForm);
      setCategories((prev) => [...prev, newCat]);
      setCategoryForm({ name: '' });
    } catch (e) {
      console.error('Create category error', e);
    } finally {
      setCategoryLoading(false);
    }
  };

  // ----- Products -----
  const [products, setProducts] = useState<Product[]>([]);
  const [productForm, setProductForm] = useState<CreateProductInput>({
    name: '',
    category_id: 0,
    image_url: null,
    price: 0,
    specifications: null,
  });
  const [productLoading, setProductLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const data = await trpc.getProducts.query();
      setProducts(data);
    } catch (e) {
      console.error('Failed to load products', e);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleProductSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProductLoading(true);
    try {
      const newProd = await trpc.createProduct.mutate(productForm);
      setProducts((prev) => [...prev, newProd]);
      setProductForm({
        name: '',
        category_id: 0,
        image_url: null,
        price: 0,
        specifications: null,
      });
    } catch (e) {
      console.error('Create product error', e);
    } finally {
      setProductLoading(false);
    }
  };

  // ----- Reviews -----
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewForm, setReviewForm] = useState<CreateReviewInput>({
    product_id: 0,
    title: '',
    content: '',
    rating: 1,
    pros: [],
    cons: [],
  });
  const [reviewLoading, setReviewLoading] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      const data = await trpc.getReviews.query();
      setReviews(data);
    } catch (e) {
      console.error('Failed to load reviews', e);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setReviewLoading(true);
    try {
      const newRev = await trpc.createReview.mutate(reviewForm);
      setReviews((prev) => [...prev, newRev]);
      setReviewForm({
        product_id: 0,
        title: '',
        content: '',
        rating: 1,
        pros: [],
        cons: [],
      });
    } catch (e) {
      console.error('Create review error', e);
    } finally {
      setReviewLoading(false);
    }
  };

  // Helper to render rating stars
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'text-yellow-400' : 'text-gray-300'}>
          ★
        </span>
      );
    }
    return <div className="flex space-x-0.5">{stars}</div>;
  };

  return (
    <div className="container mx-auto p-6 space-y-12">
      <h1 className="text-3xl font-bold text-center">Budget PC Peripherals Reviews</h1>

      {/* ==== Category Management ==== */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Categories</h2>
        <form onSubmit={handleCategorySubmit} className="flex gap-2 items-end mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              placeholder="Category name"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ name: e.target.value })}
              required
            />
          </div>
          <Button type="submit" disabled={categoryLoading}>
            {categoryLoading ? 'Saving...' : 'Add Category'}
          </Button>
        </form>
        {categories.length === 0 ? (
          <p className="text-gray-500">No categories yet.</p>
        ) : (
          <ul className="grid md:grid-cols-2 gap-4">
            {categories.map((c) => (
              <li key={c.id} className="border p-3 rounded-md">
                <span className="font-medium">{c.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ==== Product Management ==== */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Products</h2>
        <form onSubmit={handleProductSubmit} className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              placeholder="Product name"
              value={productForm.name}
              onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <Select
              value={productForm.category_id?.toString() || ''}
              onValueChange={(val) => setProductForm((prev) => ({ ...prev, category_id: Number(val) }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image URL</label>
            <Input
              placeholder="https://..."
              value={productForm.image_url ?? ''}
              onChange={(e) => setProductForm((prev) => ({ ...prev, image_url: e.target.value || null }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price (USD)</label>
            <Input
              type="number"
              placeholder="0.00"
              value={productForm.price}
              onChange={(e) => setProductForm((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
              step="0.01"
              min="0"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Specifications</label>
            <Textarea
              placeholder="Enter specifications..."
              value={productForm.specifications ?? ''}
              onChange={(e) => setProductForm((prev) => ({ ...prev, specifications: e.target.value || null }))}
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={productLoading}>
              {productLoading ? 'Saving...' : 'Add Product'}
            </Button>
          </div>
        </form>
        {products.length === 0 ? (
          <p className="text-gray-500">No products yet.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {products.map((p) => (
              <div key={p.id} className="border rounded-md p-4 flex flex-col">
                {p.image_url && (
                  <img src={p.image_url} alt={p.name} className="w-full h-40 object-cover mb-2 rounded" />
                )}
                <h3 className="font-semibold text-lg mb-1">{p.name}</h3>
                <p className="text-sm text-gray-600 mb-1">
                  Category:{' '}
                  {categories.find((c) => c.id === p.category_id)?.name || 'Unknown'}
                </p>
                <p className="text-sm font-medium mb-2">${p.price.toFixed(2)}</p>
                {p.specifications && (
                  <p className="text-xs text-gray-500 flex-1">{p.specifications}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ==== Review Management ==== */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Reviews</h2>
        <form onSubmit={handleReviewSubmit} className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Product</label>
            <Select
              value={reviewForm.product_id?.toString() || ''}
              onValueChange={(val) => setReviewForm((prev) => ({ ...prev, product_id: Number(val) }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((prod) => (
                  <SelectItem key={prod.id} value={prod.id.toString()}>
                    {prod.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input
              placeholder="Review title"
              value={reviewForm.title}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Content</label>
            <Textarea
              placeholder="Write your review..."
              value={reviewForm.content}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, content: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rating (1‑5)</label>
            <Select
              value={reviewForm.rating.toString()}
              onValueChange={(val) => setReviewForm((prev) => ({ ...prev, rating: Number(val) }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Pros (comma separated)</label>
              <Input
                placeholder="e.g., Excellent performance, Great value"
                value={reviewForm.pros.join(', ')}
                onChange={(e) =>
                  setReviewForm((prev) => ({ ...prev, pros: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))
                }
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Cons (comma separated)</label>
              <Input
                placeholder="e.g., No RGB, Short cable"
                value={reviewForm.cons.join(', ')}
                onChange={(e) =>
                  setReviewForm((prev) => ({ ...prev, cons: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))
                }
              />
            </div>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={reviewLoading}>
              {reviewLoading ? 'Saving...' : 'Add Review'}
            </Button>
          </div>
        </form>
        {reviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet.</p>
        ) : (
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="grid">Grid</TabsTrigger>
            </TabsList>
            <TabsContent value="list" className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="border rounded-md p-4">
                  <h3 className="font-semibold text-lg mb-1">{rev.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Product: {products.find((p) => p.id === rev.product_id)?.name || 'Unknown'}
                  </p>
                  {renderStars(rev.rating)}
                  <p className="mt-2 text-gray-800">{rev.content}</p>
                  {rev.pros.length > 0 && (
                    <ul className="list-disc list-inside mt-2 text-green-600">
                      {rev.pros.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  )}
                  {rev.cons.length > 0 && (
                    <ul className="list-disc list-inside mt-2 text-red-600">
                      {rev.cons.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </TabsContent>
            <TabsContent value="grid" className="grid md:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="border rounded-md p-4 flex flex-col">
                  <h3 className="font-semibold text-lg mb-1">{rev.title}</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    {products.find((p) => p.id === rev.product_id)?.name || 'Unknown'}
                  </p>
                  {renderStars(rev.rating)}
                  <p className="mt-2 text-gray-800 flex-1">{rev.content}</p>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </section>
    </div>
  );
}

export default App;
