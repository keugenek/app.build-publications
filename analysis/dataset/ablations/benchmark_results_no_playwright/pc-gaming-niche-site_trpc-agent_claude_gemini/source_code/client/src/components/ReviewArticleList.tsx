import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ReviewArticleWithCategory } from '../../../server/src/schema';

interface ReviewArticleListProps {
  articles: ReviewArticleWithCategory[];
  onArticleSelect: (article: ReviewArticleWithCategory) => void;
  renderStarRating: (rating: number) => React.ReactNode;
}

export function ReviewArticleList({ 
  articles, 
  onArticleSelect, 
  renderStarRating
}: ReviewArticleListProps) {
  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'mice':
        return '🖱️';
      case 'keyboards':
        return '⌨️';
      case 'headsets':
        return '🎧';
      case 'monitors':
        return '🖥️';
      case 'mousepads':
        return '🎯';
      default:
        return '🎮';
    }
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Reviews Found</h3>
        <p className="text-gray-500">
          No reviews are available for the selected category. Check back soon for new content!
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <Card key={article.id} className="hover:shadow-lg transition-shadow duration-300 cursor-pointer group">
          <CardHeader className="pb-3">
            {/* Category Badge */}
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                {getCategoryIcon(article.category.name)}
                {article.category.name}
              </Badge>
              <span className="text-xs text-gray-400">
                {formatDate(article.published_at)}
              </span>
            </div>

            {/* Product Image */}
            {article.main_image_url && (
              <div className="aspect-video bg-gray-100 rounded-md overflow-hidden mb-3">
                <img
                  src={article.main_image_url}
                  alt={`${article.brand} ${article.model}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
                  }}
                />
              </div>
            )}

            {/* Title */}
            <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
              {article.title}
            </CardTitle>

            {/* Brand and Model */}
            <CardDescription className="text-base font-medium text-gray-700">
              {article.brand} {article.model}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Star Rating */}
            <div className="mb-3">
              {renderStarRating(article.star_rating)}
            </div>

            {/* Review Preview */}
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              {truncateContent(article.review_content)}
            </p>

            {/* Pros/Cons Preview */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
              <div>
                <div className="font-medium text-green-700 mb-1 flex items-center gap-1">
                  ✅ Pros
                </div>
                <p className="text-gray-600 line-clamp-2">
                  {truncateContent(article.pros, 60)}
                </p>
              </div>
              <div>
                <div className="font-medium text-red-700 mb-1 flex items-center gap-1">
                  ❌ Cons
                </div>
                <p className="text-gray-600 line-clamp-2">
                  {truncateContent(article.cons, 60)}
                </p>
              </div>
            </div>

            {/* Read More Button */}
            <Button
              onClick={() => onArticleSelect(article)}
              className="w-full"
              variant="outline"
            >
              📖 Read Full Review
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
