import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Edit, Eye, Star, Image, ThumbsUp, ThumbsDown, Mouse, Keyboard, Headphones, Square, Gamepad2, ExternalLink } from 'lucide-react';
import { ReviewDetailModal } from './ReviewDetailModal';
import { useState } from 'react';
import type { ProductReview } from '../../../server/src/schema';

const categoryIcons = {
  mice: Mouse,
  keyboards: Keyboard,
  headsets: Headphones,
  mousepads: Square,
  controllers: Gamepad2
};

interface ReviewCardProps {
  review: ProductReview;
  onEdit: (review: ProductReview) => void;
  onDelete: (id: number) => void;
}

export function ReviewCard({ review, onEdit, onDelete }: ReviewCardProps) {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const Icon = categoryIcons[review.category];
  
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      onDelete(review.id);
    }
  };

  // Create rating stars
  const renderRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating / 2); // Convert 10-point scale to 5-star visual
    const remainder = rating % 2;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />);
      } else if (i === fullStars && remainder > 0) {
        stars.push(<Star key={i} className="w-4 h-4 text-yellow-500 fill-current opacity-50" />);
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />);
      }
    }
    
    return stars;
  };

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl font-bold text-gray-900 truncate">
              {review.product_name}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2 text-gray-600">
              <Icon className="w-5 h-5 text-indigo-600" />
              <span className="font-medium">{review.brand}</span>
              <span>•</span>
              <span className="capitalize bg-gray-100 px-2 py-1 rounded-md text-xs font-medium">
                {review.category}
              </span>
            </CardDescription>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Badge variant={review.is_published ? "default" : "secondary"} className="shrink-0">
              {review.is_published ? (
                <><Eye className="w-3 h-3 mr-1" /> Live</>
              ) : (
                '📝 Draft'
              )}
            </Badge>
            <div className="flex items-center gap-1">
              <div className="flex">
                {renderRating(review.rating)}
              </div>
              <span className="font-bold text-lg text-indigo-600 ml-1">
                {review.rating}/10
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pros and Cons Summary */}
        {(review.pros.length > 0 || review.cons.length > 0) && (
          <div className="grid grid-cols-2 gap-4">
            {review.pros.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-green-700 font-medium text-sm">
                  <ThumbsUp className="w-4 h-4" />
                  <span>Pros ({review.pros.length})</span>
                </div>
                <div className="space-y-1">
                  {review.pros.slice(0, 2).map((pro: string, index: number) => (
                    <p key={index} className="text-sm text-gray-600 leading-relaxed">
                      • {pro.length > 30 ? `${pro.substring(0, 30)}...` : pro}
                    </p>
                  ))}
                  {review.pros.length > 2 && (
                    <p className="text-xs text-gray-400">
                      +{review.pros.length - 2} more pros
                    </p>
                  )}
                </div>
              </div>
            )}

            {review.cons.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-red-700 font-medium text-sm">
                  <ThumbsDown className="w-4 h-4" />
                  <span>Cons ({review.cons.length})</span>
                </div>
                <div className="space-y-1">
                  {review.cons.slice(0, 2).map((con: string, index: number) => (
                    <p key={index} className="text-sm text-gray-600 leading-relaxed">
                      • {con.length > 30 ? `${con.substring(0, 30)}...` : con}
                    </p>
                  ))}
                  {review.cons.length > 2 && (
                    <p className="text-xs text-gray-400">
                      +{review.cons.length - 2} more cons
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Review Preview */}
        <div className="space-y-2">
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
            {review.review_text}
          </p>
          <p className="text-xs text-gray-400">
            {review.review_text.length} characters
          </p>
        </div>

        {/* Media Info */}
        {review.image_urls.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-2 rounded-md">
            <Image className="w-4 h-4" />
            <span>{review.image_urls.length} image{review.image_urls.length > 1 ? 's' : ''} attached</span>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>Created: {review.created_at.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          {review.updated_at && (
            <p>Updated: {review.updated_at.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDetailModal(true)}
          className="flex-1 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View Details
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(review)}
          className="hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300"
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardFooter>

      <ReviewDetailModal
        review={review}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
      />
    </Card>
  );
}
