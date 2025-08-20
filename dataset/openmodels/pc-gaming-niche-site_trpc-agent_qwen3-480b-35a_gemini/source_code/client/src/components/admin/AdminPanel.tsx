import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import type { Product, Category, Review } from '../../../../server/src/schema';

export function AdminPanel() {
  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: ''
  });
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });
  
  const [reviewForm, setReviewForm] = useState({
    product_id: '',
    title: '',
    content: '',
    rating: 5,
    pros: '',
    cons: ''
  });

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [productsData, categoriesData, reviewsData] = await Promise.all([
          trpc.getProducts.query(),
          trpc.getCategories.query(),
          trpc.getReviews.query()
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
        setReviews(reviewsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Mutation functions
  const createProduct = async () => {
    try {
      const newProduct = await trpc.createProduct.mutate({
        name: productForm.name,
        description: productForm.description || null,
        price: productForm.price ? parseFloat(productForm.price) : null,
        category_id: parseInt(productForm.category_id)
      });
      setProducts([...products, newProduct]);
      setProductForm({ name: '', description: '', price: '', category_id: '' });
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  const createCategory = async () => {
    try {
      const newCategory = await trpc.createCategory.mutate({
        name: categoryForm.name,
        description: categoryForm.description || null
      });
      setCategories([...categories, newCategory]);
      setCategoryForm({ name: '', description: '' });
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const createReview = async () => {
    try {
      const newReview = await trpc.createReview.mutate({
        product_id: parseInt(reviewForm.product_id),
        title: reviewForm.title,
        content: reviewForm.content,
        rating: reviewForm.rating,
        pros: reviewForm.pros || null,
        cons: reviewForm.cons || null
      });
      setReviews([...reviews, newReview]);
      setReviewForm({ product_id: '', title: '', content: '', rating: 5, pros: '', cons: '' });
    } catch (error) {
      console.error('Error creating review:', error);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading admin panel...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Admin Panel</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Manage products, categories, and reviews
        </p>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Add Product Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Product</CardTitle>
                <CardDescription>
                  Add a new gaming peripheral to the database
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Product name"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  required
                />
                <Textarea
                  placeholder="Description"
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={productForm.price}
                  onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                  step="0.01"
                />
                <Select 
                  value={productForm.category_id || undefined}
                  onValueChange={(value) => setProductForm({...productForm, category_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={createProduct} className="w-full">
                  Add Product
                </Button>
              </CardContent>
            </Card>

            {/* Products List */}
            <Card>
              <CardHeader>
                <CardTitle>Existing Products</CardTitle>
                <CardDescription>
                  {products.length} products in database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {products.map(product => {
                    const category = categories.find(c => c.id === product.category_id);
                    return (
                      <div key={product.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-gray-500">
                            {category?.name || 'Uncategorized'} • 
                            {product.price ? ` $${product.price.toFixed(2)}` : ' Price N/A'}
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="categories" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Add Category Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Category</CardTitle>
                <CardDescription>
                  Create a new product category
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Category name"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                  required
                />
                <Textarea
                  placeholder="Description"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                />
                <Button onClick={createCategory} className="w-full">
                  Add Category
                </Button>
              </CardContent>
            </Card>

            {/* Categories List */}
            <Card>
              <CardHeader>
                <CardTitle>Existing Categories</CardTitle>
                <CardDescription>
                  {categories.length} categories in database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {categories.map(category => (
                    <div key={category.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-gray-500">
                            {category.description}
                          </p>
                        )}
                      </div>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="reviews" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Add Review Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Review</CardTitle>
                <CardDescription>
                  Create a review for a product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select 
                  value={reviewForm.product_id || undefined}
                  onValueChange={(value) => setReviewForm({...reviewForm, product_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={String(product.id)}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Review title"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({...reviewForm, title: e.target.value})}
                  required
                />
                <Textarea
                  placeholder="Review content"
                  value={reviewForm.content}
                  onChange={(e) => setReviewForm({...reviewForm, content: e.target.value})}
                  required
                />
                <div className="flex items-center space-x-2">
                  <span>Rating:</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({...reviewForm, rating: star})}
                        className="focus:outline-none"
                      >
                        <span
                          className={`text-2xl ${
                            star <= reviewForm.rating 
                              ? 'text-yellow-400' 
                              : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea
                  placeholder="Pros (optional)"
                  value={reviewForm.pros}
                  onChange={(e) => setReviewForm({...reviewForm, pros: e.target.value})}
                />
                <Textarea
                  placeholder="Cons (optional)"
                  value={reviewForm.cons}
                  onChange={(e) => setReviewForm({...reviewForm, cons: e.target.value})}
                />
                <Button onClick={createReview} className="w-full">
                  Add Review
                </Button>
              </CardContent>
            </Card>

            {/* Reviews List */}
            <Card>
              <CardHeader>
                <CardTitle>Existing Reviews</CardTitle>
                <CardDescription>
                  {reviews.length} reviews in database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {reviews.map(review => {
                    const product = products.find(p => p.id === review.product_id);
                    return (
                      <div key={review.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between">
                          <h3 className="font-medium">{review.title}</h3>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-lg ${
                                  i < review.rating
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">
                          For: {product?.name || 'Unknown Product'}
                        </p>
                        <p className="text-sm mt-2 line-clamp-2">
                          {review.content}
                        </p>
                        <div className="flex justify-end mt-2">
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
