import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, ThumbsUp, ThumbsDown, Eye, Calendar, Mouse, Keyboard, Headphones, Square, Gamepad2 } from 'lucide-react';
import type { ProductReview } from '../../../server/src/schema';

const categoryIcons = {
  mice: Mouse,
  keyboards: Keyboard,
  headsets: Headphones,
  mousepads: Square,
  controllers: Gamepad2
};

interface ReviewDetailModalProps {
  review: ProductReview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReviewDetailModal({ review, open, onOpenChange }: ReviewDetailModalProps) {
  if (!review) return null;

  const Icon = categoryIcons[review.category];

  const renderRatingStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = rating % 2 > 0;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="w-5 h-5 text-yellow-500 fill-current opacity-50" />);
      } else {
        stars.push(<Star key={i} className="w-5 h-5 text-gray-300" />);
      }
    }
    
    return stars;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Icon className="w-6 h-6 text-indigo-600" />
                {review.product_name}
              </DialogTitle>
              <p className="text-gray-600 mt-1">
                by <span className="font-medium">{review.brand}</span> • 
                <span className="capitalize ml-1">{review.category}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant={review.is_published ? "default" : "secondary"} className="text-sm">
                {review.is_published ? (
                  <><Eye className="w-4 h-4 mr-1" /> Published</>
                ) : (
                  '📝 Draft'
                )}
              </Badge>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  {renderRatingStars(review.rating)}
                </div>
                <p className="text-2xl font-bold text-indigo-600 mt-1">
                  {review.rating}/10
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Pros and Cons */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pros */}
            {review.pros.length > 0 && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <ThumbsUp className="w-5 h-5" />
                    Pros ({review.pros.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {review.pros.map((pro: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-green-700">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Cons */}
            {review.cons.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <ThumbsDown className="w-5 h-5" />
                    Cons ({review.cons.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {review.cons.map((con: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-red-700">
                        <span className="text-red-500 mt-1">✗</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          <Separator />

          {/* Review Text */}
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📝 Detailed Review
            </h3>
            <div className="prose max-w-none">
              <div className="bg-gray-50 rounded-lg p-6 border">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {review.review_text}
                </p>
              </div>
            </div>
          </div>

          {/* Image Gallery */}
          {review.image_urls.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                📸 Image Gallery ({review.image_urls.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {review.image_urls.map((url: string, index: number) => (
                  <div key={index} className="aspect-video bg-gray-100 rounded-lg border overflow-hidden">
                    <img
                      src={url}
                      alt={`${review.product_name} image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center text-gray-500">
                              <div class="text-center">
                                <div class="text-2xl mb-2">🖼️</div>
                                <p class="text-sm">Image not available</p>
                              </div>
                            </div>
                          `;
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Metadata */}
          <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Created: {review.created_at.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
              {review.updated_at && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Updated: {review.updated_at.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <p>{review.review_text.length} characters</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
