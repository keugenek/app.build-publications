import { useState } from 'react';
import type { CreateCategoryInput, CreateProductInput, CreateArticleInput } from '../../../server/src/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'category' | 'product' | 'article'>('category');
  const [categoryForm, setCategoryForm] = useState<Omit<CreateCategoryInput, 'description'> & { description: string }>({
    name: '',
    slug: '',
    description: '',
  });
  
  const [productForm, setProductForm] = useState<Omit<CreateProductInput, 'description' | 'image_url' | 'category_id'> & { 
    description: string; 
    image_url: string; 
    category_id: string;
  }>({
    name: '',
    slug: '',
    description: '',
    price: 0,
    image_url: '',
    category_id: '',
  });
  
  const [articleForm, setArticleForm] = useState<Omit<CreateArticleInput, 'excerpt' | 'image_url'> & { 
    excerpt: string; 
    image_url: string;
  }>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    image_url: '',
    published: false,
  });

  // Simulate the mutations since we're using sample data
  const createCategoryMutation = {
    isPending: false,
    mutateAsync: async (data: unknown) => {
      console.log('Creating category:', data);
      return Promise.resolve(data);
    }
  };
  
  const createProductMutation = {
    isPending: false,
    mutateAsync: async (data: unknown) => {
      console.log('Creating product:', data);
      return Promise.resolve(data);
    }
  };
  
  const createArticleMutation = {
    isPending: false,
    mutateAsync: async (data: unknown) => {
      console.log('Creating article:', data);
      return Promise.resolve(data);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCategoryMutation.mutateAsync({
        ...categoryForm,
        description: categoryForm.description || null,
      });
      // Reset form
      setCategoryForm({ name: '', slug: '', description: '' });
      alert('Category created successfully!');
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('Failed to create category');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProductMutation.mutateAsync({
        ...productForm,
        description: productForm.description || null,
        image_url: productForm.image_url || null,
        category_id: parseInt(productForm.category_id),
        price: parseFloat(productForm.price as unknown as string) || 0,
      });
      // Reset form
      setProductForm({ 
        name: '', 
        slug: '', 
        description: '', 
        price: 0, 
        image_url: '', 
        category_id: '' 
      });
      alert('Product created successfully!');
    } catch (error) {
      console.error('Failed to create product:', error);
      alert('Failed to create product');
    }
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createArticleMutation.mutateAsync({
        ...articleForm,
        excerpt: articleForm.excerpt || null,
        image_url: articleForm.image_url || null,
      });
      // Reset form
      setArticleForm({ 
        title: '', 
        slug: '', 
        content: '', 
        excerpt: '', 
        image_url: '', 
        published: false 
      });
      alert('Article created successfully!');
    } catch (error) {
      console.error('Failed to create article:', error);
      alert('Failed to create article');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Admin Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-4 mb-6">
          <Button 
            variant={activeTab === 'category' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('category')}
          >
            Create Category
          </Button>
          <Button 
            variant={activeTab === 'product' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('product')}
          >
            Create Product
          </Button>
          <Button 
            variant={activeTab === 'article' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('article')}
          >
            Create Article
          </Button>
        </div>

        {activeTab === 'category' && (
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                placeholder="e.g. Gaming Mice"
                required
              />
            </div>
            <div>
              <Label htmlFor="category-slug">Slug</Label>
              <Input
                id="category-slug"
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm({...categoryForm, slug: e.target.value})}
                placeholder="e.g. gaming-mice"
                required
              />
            </div>
            <div>
              <Label htmlFor="category-description">Description (Optional)</Label>
              <Textarea
                id="category-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                placeholder="Category description"
              />
            </div>
            <Button type="submit" disabled={createCategoryMutation.isPending}>
              {createCategoryMutation.isPending ? 'Creating...' : 'Create Category'}
            </Button>
          </form>
        )}

        {activeTab === 'product' && (
          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div>
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                value={productForm.name}
                onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                placeholder="e.g. BudgetMaster Pro Mouse"
                required
              />
            </div>
            <div>
              <Label htmlFor="product-slug">Slug</Label>
              <Input
                id="product-slug"
                value={productForm.slug}
                onChange={(e) => setProductForm({...productForm, slug: e.target.value})}
                placeholder="e.g. budgetmaster-pro-mouse"
                required
              />
            </div>
            <div>
              <Label htmlFor="product-category">Category</Label>
              <Select 
                value={productForm.category_id} 
                onValueChange={(value) => setProductForm({...productForm, category_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Gaming Mice</SelectItem>
                  <SelectItem value="2">Gaming Keyboards</SelectItem>
                  <SelectItem value="3">Headsets</SelectItem>
                  <SelectItem value="4">Controllers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="product-price">Price ($)</Label>
              <Input
                id="product-price"
                type="number"
                step="0.01"
                value={productForm.price}
                onChange={(e) => setProductForm({...productForm, price: parseFloat(e.target.value) || 0})}
                placeholder="e.g. 29.99"
                required
              />
            </div>
            <div>
              <Label htmlFor="product-description">Description (Optional)</Label>
              <Textarea
                id="product-description"
                value={productForm.description}
                onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                placeholder="Product description"
              />
            </div>
            <div>
              <Label htmlFor="product-image">Image URL (Optional)</Label>
              <Input
                id="product-image"
                value={productForm.image_url}
                onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <Button type="submit" disabled={createProductMutation.isPending}>
              {createProductMutation.isPending ? 'Creating...' : 'Create Product'}
            </Button>
          </form>
        )}

        {activeTab === 'article' && (
          <form onSubmit={handleCreateArticle} className="space-y-4">
            <div>
              <Label htmlFor="article-title">Title</Label>
              <Input
                id="article-title"
                value={articleForm.title}
                onChange={(e) => setArticleForm({...articleForm, title: e.target.value})}
                placeholder="e.g. Top 5 Budget Gaming Mice of 2023"
                required
              />
            </div>
            <div>
              <Label htmlFor="article-slug">Slug</Label>
              <Input
                id="article-slug"
                value={articleForm.slug}
                onChange={(e) => setArticleForm({...articleForm, slug: e.target.value})}
                placeholder="e.g. top-5-budget-gaming-mice-2023"
                required
              />
            </div>
            <div>
              <Label htmlFor="article-excerpt">Excerpt (Optional)</Label>
              <Textarea
                id="article-excerpt"
                value={articleForm.excerpt}
                onChange={(e) => setArticleForm({...articleForm, excerpt: e.target.value})}
                placeholder="Brief summary of the article"
              />
            </div>
            <div>
              <Label htmlFor="article-content">Content</Label>
              <Textarea
                id="article-content"
                value={articleForm.content}
                onChange={(e) => setArticleForm({...articleForm, content: e.target.value})}
                placeholder="Full article content"
                rows={10}
                required
              />
            </div>
            <div>
              <Label htmlFor="article-image">Image URL (Optional)</Label>
              <Input
                id="article-image"
                value={articleForm.image_url}
                onChange={(e) => setArticleForm({...articleForm, image_url: e.target.value})}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="article-published"
                checked={articleForm.published}
                onChange={(e) => setArticleForm({...articleForm, published: e.target.checked})}
              />
              <Label htmlFor="article-published">Published</Label>
            </div>
            <Button type="submit" disabled={createArticleMutation.isPending}>
              {createArticleMutation.isPending ? 'Creating...' : 'Create Article'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
