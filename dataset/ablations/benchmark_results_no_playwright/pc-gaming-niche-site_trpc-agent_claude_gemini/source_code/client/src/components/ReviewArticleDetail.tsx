import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { ReviewArticleWithCategory } from '../../../server/src/schema';

interface ReviewArticleDetailProps {
  article: ReviewArticleWithCategory;
  renderStarRating: (rating: number) => React.ReactNode;
}

export function ReviewArticleDetail({ article, renderStarRating }: ReviewArticleDetailProps) {
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatContent = (content: string) => {
    // Simple text formatting - convert line breaks to proper paragraphs
    return content.split('\n').map((paragraph, index) => {
      if (paragraph.trim() === '') return null;
      return (
        <p key={index} className="mb-4 text-gray-700 leading-relaxed">
          {paragraph}
        </p>
      );
    });
  };

  const formatListContent = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    return (
      <ul className="space-y-2">
        {lines.map((line, index) => {
          const cleanLine = line.replace(/^[•\-*]\s*/, '').trim();
          return (
            <li key={index} className="flex items-start gap-2">
              <span className="text-blue-500 mt-1 flex-shrink-0">•</span>
              <span>{cleanLine}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        {/* Category Badge */}
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="flex items-center gap-1 text-sm px-3 py-1">
            {getCategoryIcon(article.category.name)}
            {article.category.name}
          </Badge>
          <span className="text-sm text-gray-500">
            Published {formatDate(article.published_at)}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
          {article.title}
        </h1>

        {/* Brand and Model */}
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-700">
            {article.brand} {article.model}
          </h2>
          <div className="flex items-center">
            {renderStarRating(article.star_rating)}
          </div>
        </div>
      </div>

      {/* Product Image */}
      {article.main_image_url && (
        <Card>
          <CardContent className="p-0">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={article.main_image_url}
                alt={`${article.brand} ${article.model}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UHJvZHVjdCBJbWFnZSBOb3QgQXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pros and Cons */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-green-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-green-700">
              ✅ Pros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-green-800">
              {formatListContent(article.pros)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-red-700">
              ❌ Cons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-red-800">
              {formatListContent(article.cons)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📝 Detailed Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-gray max-w-none">
            {formatContent(article.review_content)}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Section */}
      <Card className="bg-gray-50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🎮</span>
                <div>
                  <h3 className="font-semibold text-lg">{article.brand} {article.model}</h3>
                  <p className="text-gray-600">Budget Gaming Peripheral</p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">Our Rating</div>
              {renderStarRating(article.star_rating)}
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="text-center text-sm text-gray-500">
            <p>
              Review published on {formatDate(article.published_at)} • 
              Last updated on {formatDate(article.updated_at)}
            </p>
            <p className="mt-2">
              💰 Looking for budget-friendly gaming gear? Check out our other reviews!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
