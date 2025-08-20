import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ReviewArticle, ProductCategory, PriceRange } from '../../../server/src/schema';

interface ReviewCardProps {
  review: ReviewArticle;
  showActions?: boolean;
  onEdit?: (review: ReviewArticle) => void;
  onDelete?: (review: ReviewArticle) => void;
}

export function ReviewCard({ review, showActions = false, onEdit, onDelete }: ReviewCardProps) {
  const getCategoryIcon = (category: ProductCategory) => {
    switch (category) {
      case 'mice': return '🖱️';
      case 'keyboards': return '⌨️';
      case 'headsets': return '🎧';
      default: return '🎮';
    }
  };

  const getPriceRangeText = (range: PriceRange) => {
    switch (range) {
      case 'under_25': return 'Under $25';
      case '25_50': return '$25 - $50';
      case '50_100': return '$50 - $100';
      case '100_plus': return '$100+';
      default: return range;
    }
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 border-2 hover:border-indigo-200 ${showActions ? '' : 'hover-lift'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getCategoryIcon(review.category)}</span>
            <Badge variant="secondary" className="text-xs">
              {review.category.toUpperCase()}
            </Badge>
            {showActions && (
              <Badge variant={review.published ? 'default' : 'secondary'} className="text-xs">
                {review.published ? '✅ Published' : '📄 Draft'}
              </Badge>
            )}
          </div>
          <div className="text-xl star-rating">{renderStars(review.star_rating)}</div>
        </div>
        <CardTitle className="text-lg">{review.product_name}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <span className="font-medium">{review.brand}</span>
          <span>•</span>
          <span className="text-green-600 font-medium">{getPriceRangeText(review.price_range)}</span>
        </CardDescription>
      </CardHeader>
      
      {!showActions && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-green-700 mb-1 flex items-center gap-1">
                ✅ Pros
              </h4>
              <ul className="space-y-1">
                {review.pros.slice(0, 2).map((pro: string, idx: number) => (
                  <li key={idx} className="text-gray-600 text-xs">• {pro}</li>
                ))}
                {review.pros.length > 2 && (
                  <li className="text-gray-500 text-xs">+{review.pros.length - 2} more</li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-red-700 mb-1 flex items-center gap-1">
                ❌ Cons
              </h4>
              <ul className="space-y-1">
                {review.cons.slice(0, 2).map((con: string, idx: number) => (
                  <li key={idx} className="text-gray-600 text-xs">• {con}</li>
                ))}
                {review.cons.length > 2 && (
                  <li className="text-gray-500 text-xs">+{review.cons.length - 2} more</li>
                )}
              </ul>
            </div>
          </div>
          <p className="text-sm text-gray-600 line-clamp-3">
            {review.review_body.substring(0, 150)}
            {review.review_body.length > 150 && '...'}
          </p>
        </CardContent>
      )}
      
      <CardFooter className="pt-3">
        <div className="flex items-center justify-between w-full text-xs text-gray-500">
          <span>
            {showActions ? 'Created' : 'Published'} {review.created_at.toLocaleDateString()}
          </span>
          {showActions ? (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEdit?.(review)}
              >
                ✏️ Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onDelete?.(review)}
              >
                🗑️ Delete
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm">
              📖 Read Full Review →
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
