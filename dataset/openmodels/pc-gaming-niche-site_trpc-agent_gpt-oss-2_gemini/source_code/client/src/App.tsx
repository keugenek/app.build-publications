import './App.css';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { ReviewForm } from '@/components/ReviewForm';
import type { ReviewArticle, Category } from '../../server/src/schema';

function App() {
  const [reviews, setReviews] = useState<ReviewArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ReviewArticle | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Load reviews on mount
  const loadReviews = useCallback(async () => {
    try {
      const data = await trpc.getReviews.query();
      setReviews(data);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleCreate = (article: ReviewArticle) => {
    setReviews((prev) => [...prev, article]);
    setShowForm(false);
  };

  const handleUpdate = (updated: ReviewArticle) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
    setEditing(null);
    setShowForm(false);
  };

  const handleDelete = (id: number) => {
    // Stub: client‑side removal only (no server endpoint yet)
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const categories: Category[] = ['Mice', 'Keyboards', 'Headsets', 'Gamepads'];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Budget PC Gaming Peripherals Reviews</h1>

      {/* Admin Controls */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Admin Dashboard</h2>
        <Button onClick={() => {
          setEditing(null);
          setShowForm((v) => !v);
        }}>{showForm ? 'Hide Form' : 'Add New Review'}</Button>
      </div>

      {showForm && (
        <div className="mb-8">
          <ReviewForm
            initialData={editing ?? undefined}
            onSuccess={editing ? handleUpdate : handleCreate}
          />
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <p className="text-center">Loading reviews...</p>
      ) : (
        categories.map((cat) => {
          const filtered = reviews.filter((r) => r.category === cat);
          if (filtered.length === 0) return null;
          return (
            <section key={cat} className="mb-8">
              <h2 className="text-xl font-bold mb-4">{cat}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((review) => (
                  <Card key={review.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle>{review.product_name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-gray-600 mb-2">Brand: {review.brand}</p>
                      <p className="text-sm mb-2">Rating: {review.overall_rating} / 5</p>
                      {review.featured_image && (
                        
                        <img src={review.featured_image} alt={review.product_name} className="w-full h-40 object-cover rounded" />
                      )}
                      <p className="mt-2 text-sm text-gray-700 line-clamp-3">
                        {review.detailed_review}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditing(review);
                        setShowForm(true);
                      }}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => {
                        if (window.confirm('Delete this review?')) {
                          handleDelete(review.id);
                        }
                      }}>
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

export default App;
