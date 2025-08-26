import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Article, ProductCategory } from '../../../server/src/schema';

interface ArticleDetailViewProps {
  article: Article;
}

export function ArticleDetailView({ article }: ArticleDetailViewProps) {
  // Render star rating
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ⭐
      </span>
    ));
  };

  // Category badges with gaming-themed colors
  const getCategoryBadgeColor = (category: ProductCategory) => {
    switch (category) {
      case 'mice': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'keyboards': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'headsets': return 'bg-green-100 text-green-800 hover:bg-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: ProductCategory) => {
    switch (category) {
      case 'mice': return '🖱️';
      case 'keyboards': return '⌨️';
      case 'headsets': return '🎧';
      default: return '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        {article.main_image_url && (
          <div className="w-full max-w-2xl mx-auto">
            <img
              src={article.main_image_url}
              alt={article.product_name}
              className="w-full h-64 md:h-80 object-cover rounded-lg shadow-lg"
            />
          </div>
        )}
        
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            {article.product_name}
          </h1>
          
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Badge className={getCategoryBadgeColor(article.category)} variant="secondary">
              {getCategoryIcon(article.category)} {article.category}
            </Badge>
            
            <div className="flex items-center gap-1">
              {renderStars(article.overall_rating)}
              <span className="text-lg font-medium ml-2">({article.overall_rating}/5)</span>
            </div>
            
            <div className="text-2xl font-bold text-green-600">
              ${article.price.toFixed(2)}
            </div>
          </div>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {article.short_description}
          </p>
        </div>
      </div>

      <Separator />

      {/* Detailed Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📝 Detailed Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {article.detailed_review}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pros and Cons */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-green-800 flex items-center gap-2">
              ✅ Pros
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ul className="space-y-2">
              {article.pros.map((pro: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span className="text-gray-700">{pro}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-800 flex items-center gap-2">
              ❌ Cons
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ul className="space-y-2">
              {article.cons.map((con: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span className="text-gray-700">{con}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Article Info */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <span className="font-medium">Published:</span> {article.created_at.toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span> {article.updated_at.toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
