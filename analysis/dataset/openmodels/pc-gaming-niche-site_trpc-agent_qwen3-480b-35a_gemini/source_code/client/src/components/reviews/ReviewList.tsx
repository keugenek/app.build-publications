import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import type { Review } from '../../../../server/src/schema';

interface ReviewListProps {
  productId?: number;
}

export function ReviewList({ productId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      setIsLoading(true);
      try {
        let result: Review[];
        if (productId) {
          result = await trpc.getReviewsByProduct.query({ productId });
        } else {
          result = await trpc.getReviews.query();
        }
        setReviews(result);
      } catch (error) {
        console.error('Failed to load reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReviews();
  }, [productId]);

  if (isLoading) {
    return <div className="text-center py-8">Loading reviews...</div>;
  }

  if (reviews.length === 0) {
    return <div className="text-center py-8">No reviews found.</div>;
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{review.title}</CardTitle>
                <CardDescription>
                  Posted on {review.created_at.toLocaleDateString()}
                </CardDescription>
              </div>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 font-medium">{review.rating}/5</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{review.content}</p>
            
            {(review.pros || review.cons) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {review.pros && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-700 dark:text-green-400 flex items-center">
                      <span className="mr-2">✓</span> Pros
                    </h4>
                    <p>{review.pros}</p>
                  </div>
                )}
                {review.cons && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-700 dark:text-red-400 flex items-center">
                      <span className="mr-2">✗</span> Cons
                    </h4>
                    <p>{review.cons}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
