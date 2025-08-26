import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ReviewCard } from '@/components/ReviewCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { StatsCard } from '@/components/StatsCard';
import { ReviewForm } from '@/components/ReviewForm';
import { EmptyState } from '@/components/EmptyState';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { ReviewArticle, CreateReviewArticleInput, ReviewQuery, ProductCategory } from '../../server/src/schema';
import type { ReviewStats } from '../../server/src/handlers/get_review_stats';

function App() {
  const [reviews, setReviews] = useState<ReviewArticle[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [currentView, setCurrentView] = useState<'public' | 'cms'>('public');

  const [selectedReview, setSelectedReview] = useState<ReviewArticle | null>(null);

  const loadReviews = useCallback(async () => {
    try {
      const query: ReviewQuery = {
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        published: currentView === 'public' ? true : undefined,
        limit: 20,
        offset: 0
      };
      const result = await trpc.getReviewArticles.query(query);
      setReviews(result);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  }, [selectedCategory, currentView]);

  const loadStats = useCallback(async () => {
    try {
      const result = await trpc.getReviewStats.query();
      setStats(result);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  useEffect(() => {
    loadReviews();
    if (currentView === 'cms') {
      loadStats();
    }
  }, [loadReviews, currentView, loadStats]);

  const handleCreateReview = async (data: CreateReviewArticleInput) => {
    setIsLoading(true);
    try {
      const response = await trpc.createReviewArticle.mutate(data);
      setReviews((prev: ReviewArticle[]) => [...prev, response]);
    } catch (error) {
      console.error('Failed to create review:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    try {
      await trpc.deleteReviewArticle.mutate({ id: reviewId });
      setReviews((prev: ReviewArticle[]) => prev.filter(r => r.id !== reviewId));
    } catch (error) {
      console.error('Failed to delete review:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-indigo-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎮</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Budget Gaming Gear</h1>
                <p className="text-sm text-gray-600">Reviews of affordable PC gaming peripherals</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant={currentView === 'public' ? 'default' : 'outline'}
                onClick={() => setCurrentView('public')}
              >
                🌐 Public Site
              </Button>
              <Button
                variant={currentView === 'cms' ? 'default' : 'outline'}
                onClick={() => setCurrentView('cms')}
              >
                📝 CMS
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {currentView === 'public' ? (
          /* Public Site View */
          <div className="space-y-8">
            {/* Category Filter */}
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              title="Browse Reviews"
            />

            {/* Reviews Grid */}
            {reviews.length === 0 ? (
              <EmptyState
                icon="📝"
                title="No reviews yet"
                description="Check back soon for detailed reviews of budget gaming peripherals! We're working hard to bring you honest, in-depth reviews."
              />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map((review: ReviewArticle) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* CMS View */
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
              <TabsTrigger value="reviews">📋 Manage Reviews</TabsTrigger>
              <TabsTrigger value="create">➕ Create Review</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Total Reviews"
                  value={stats?.total_reviews || 0}
                  icon="📝"
                  description="All reviews in the system"
                />
                <StatsCard
                  title="Published"
                  value={stats?.published_reviews || 0}
                  icon="✅"
                  valueColor="text-green-600"
                  description="Live on the website"
                />
                <StatsCard
                  title="Drafts"
                  value={stats?.draft_reviews || 0}
                  icon="📄"
                  valueColor="text-orange-600"
                  description="Waiting for publication"
                />
                <StatsCard
                  title="Avg Rating"
                  value={stats?.average_rating.toFixed(1) || '0.0'}
                  icon="⭐"
                  description="Overall quality score"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard
                  title="Mice Reviews"
                  value={stats?.reviews_by_category.mice || 0}
                  icon="🖱️"
                  valueColor="text-blue-600"
                />
                <StatsCard
                  title="Keyboard Reviews"
                  value={stats?.reviews_by_category.keyboards || 0}
                  icon="⌨️"
                  valueColor="text-purple-600"
                />
                <StatsCard
                  title="Headset Reviews"
                  value={stats?.reviews_by_category.headsets || 0}
                  icon="🎧"
                  valueColor="text-green-600"
                />
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">📋 Manage Reviews</h3>
                <CategoryFilter
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  variant="select"
                />
              </div>

              {reviews.length === 0 ? (
                <EmptyState
                  icon="📝"
                  title="No reviews found"
                  description="Create your first review to get started!"
                  action={
                    <Button 
                      onClick={() => {
                        // Switch to create tab
                        const createTab = document.querySelector('[data-value="create"]') as HTMLElement;
                        createTab?.click();
                      }}
                      variant="outline"
                    >
                      ➕ Create Review
                    </Button>
                  }
                />
              ) : (
                <div className="grid gap-4">
                  {reviews.map((review: ReviewArticle) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      showActions={true}
                      onEdit={(review) => setSelectedReview(review)}
                      onDelete={(review) => {
                        // Set the review for deletion confirmation
                        setSelectedReview(review);
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Delete Confirmation Dialog */}
              <AlertDialog open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>🗑️ Delete Review</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete the review for "{selectedReview?.product_name}"? 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        if (selectedReview) {
                          handleDeleteReview(selectedReview.id);
                          setSelectedReview(null);
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete Review
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TabsContent>

            <TabsContent value="create" className="space-y-6">
              <ReviewForm
                onSubmit={handleCreateReview}
                isLoading={isLoading}
                mode="create"
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

export default App;
