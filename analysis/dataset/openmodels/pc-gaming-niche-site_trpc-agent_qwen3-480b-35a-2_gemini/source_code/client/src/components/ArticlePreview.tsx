import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Article } from '../../../server/src/schema';

interface ArticlePreviewProps {
  article: Article;
}

export function ArticlePreview({ article }: ArticlePreviewProps) {
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
        <p className="text-xs text-gray-500">
          {article.created_at.toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        {article.image_url ? (
          <img 
            src={article.image_url} 
            alt={article.title} 
            className="w-full h-32 object-cover rounded-md mb-3"
          />
        ) : (
          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-32 mb-3 flex items-center justify-center">
            <span className="text-gray-500 text-sm">No Image</span>
          </div>
        )}
        {article.excerpt && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-3">{article.excerpt}</p>
        )}
        <Button size="sm" variant="outline" className="mt-auto">
          Read More
        </Button>
      </CardContent>
    </Card>
  );
}
