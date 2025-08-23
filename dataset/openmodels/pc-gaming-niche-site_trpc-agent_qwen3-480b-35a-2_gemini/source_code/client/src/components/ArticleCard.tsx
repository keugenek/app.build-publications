import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Article } from '../../../server/src/schema';

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Card className="overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
        <p className="text-xs text-gray-500">
          {article.published 
            ? `Published: ${article.created_at.toLocaleDateString()}` 
            : `Updated: ${article.updated_at.toLocaleDateString()}`}
        </p>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        {article.image_url ? (
          <img 
            src={article.image_url} 
            alt={article.title} 
            className="w-full h-48 object-cover rounded-md mb-4"
          />
        ) : (
          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-48 mb-4 flex items-center justify-center">
            <span className="text-gray-500">No Image</span>
          </div>
        )}
        {article.excerpt && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-4 flex-grow">{article.excerpt}</p>
        )}
        <div className="flex justify-between items-center mt-auto">
          <span className="text-xs text-gray-500">
            {article.published ? 'Published' : 'Draft'}
          </span>
          <Button size="sm">Read More</Button>
        </div>
      </CardContent>
    </Card>
  );
}
