import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Mouse, Keyboard, Headphones, Square, Gamepad2, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { ReviewCard } from '@/components/ReviewCard';
import { ReviewForm } from '@/components/ReviewForm';
import type { ProductReview, CreateProductReviewInput, ProductCategory, UpdateProductReviewInput } from '../../server/src/schema';

const categoryIcons = {
  mice: Mouse,
  keyboards: Keyboard,
  headsets: Headphones,
  mousepads: Square,
  controllers: Gamepad2
};

function App() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<ProductReview[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [publishedFilter, setPublishedFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ProductReview | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.getCategories.query();
      setCategories(result);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  const loadReviews = useCallback(async () => {
    try {
      const query: any = { limit: 50, offset: 0 };
      if (selectedCategory !== 'all') {
        query.category = selectedCategory as ProductCategory;
      }
      if (publishedFilter !== 'all') {
        query.is_published = publishedFilter === 'published';
      }
      
      const result = await trpc.getProductReviews.query(query);
      setReviews(result);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  }, [selectedCategory, publishedFilter]);

  // Filter reviews based on search term
  useEffect(() => {
    let filtered = reviews;
    
    if (searchTerm.trim()) {
      filtered = reviews.filter((review: ProductReview) => 
        review.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.review_text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredReviews(filtered);
  }, [reviews, searchTerm]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleFormSubmit = async (data: CreateProductReviewInput) => {
    setIsLoading(true);
    try {
      if (editingReview) {
        // Update existing review
        const updateData: UpdateProductReviewInput = {
          id: editingReview.id,
          ...data
        };
        await trpc.updateProductReview.mutate(updateData);
      } else {
        // Create new review
        await trpc.createProductReview.mutate(data);
      }

      // Reload reviews and close dialog
      await loadReviews();
      setIsCreateDialogOpen(false);
      setEditingReview(null);
    } catch (error) {
      console.error('Failed to save review:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (review: ProductReview) => {
    setEditingReview(review);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await trpc.deleteProductReview.mutate({ id });
      await loadReviews();
    } catch (error) {
      console.error('Failed to delete review:', error);
    }
  };

  const resetDialog = () => {
    setEditingReview(null);
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            🎮 Gaming Peripherals CMS
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage your budget PC gaming peripheral reviews with a powerful and intuitive content management system
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              {filteredReviews.filter(r => r.is_published).length} Published
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              {filteredReviews.filter(r => !r.is_published).length} Drafts
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              {filteredReviews.length} Total
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="relative min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search reviews by product name, brand, or content..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="font-medium">All Categories</span>
                    </SelectItem>
                    {categories.map((category: ProductCategory) => {
                      const Icon = categoryIcons[category];
                      return (
                        <SelectItem key={category} value={category}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <Select value={publishedFilter} onValueChange={setPublishedFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">✅ Published</SelectItem>
                  <SelectItem value="draft">📝 Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Create Button */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Review
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl">
                    {editingReview ? '✏️ Edit Review' : '✨ Create New Review'}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    {editingReview 
                      ? 'Update the product review details below.' 
                      : 'Fill out the form to create a comprehensive product review for your gaming peripheral.'}
                  </DialogDescription>
                </DialogHeader>

                <ReviewForm
                  categories={categories}
                  initialData={editingReview}
                  onSubmit={handleFormSubmit}
                  isLoading={isLoading}
                />

                <DialogFooter className="border-t pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetDialog}
                    className="min-w-[100px]"
                  >
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Results Summary */}
        {searchTerm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800">
              <strong>{filteredReviews.length}</strong> review{filteredReviews.length !== 1 ? 's' : ''} found for "{searchTerm}"
            </p>
          </div>
        )}

        {/* Reviews Grid */}
        {filteredReviews.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">🎮</div>
            {searchTerm ? (
              <>
                <p className="text-2xl text-gray-600 mb-2">No reviews found</p>
                <p className="text-gray-500 mb-4">Try adjusting your search terms or filters</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setPublishedFilter('all');
                  }}
                  className="mx-auto"
                >
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <p className="text-2xl text-gray-600 mb-2">No reviews yet!</p>
                <p className="text-gray-500 mb-6">Create your first gaming peripheral review to get started</p>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Review
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredReviews.map((review: ProductReview) => (
              <ReviewCard
                key={review.id}
                review={review}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
