import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Article } from '../../../server/src/schema';

interface ArticleDetailProps {
  article: Article;
  onBack: () => void;
}

export function ArticleDetail({ article, onBack }: ArticleDetailProps) {
  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onBack}>
        ← Back to Articles
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{article.title}</CardTitle>
          <div className="flex items-center text-sm text-gray-500">
            <span>
              Published on {article.created_at.toLocaleDateString()} • 
              Updated on {article.updated_at.toLocaleDateString()}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {article.image_url ? (
            <img 
              src={article.image_url} 
              alt={article.title} 
              className="w-full h-96 object-cover rounded-lg mb-8"
            />
          ) : (
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-96 mb-8 flex items-center justify-center">
              <span className="text-gray-500 text-lg">Article Image</span>
            </div>
          )}
          
          <div className="prose max-w-none">
            {article.excerpt && (
              <p className="text-xl text-gray-600 mb-8 italic">
                {article.excerpt}
              </p>
            )}
            
            <div className="text-gray-800 leading-relaxed space-y-4">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt 
                ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation 
                ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              
              <p>
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat 
                nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui 
                officia deserunt mollit anim id est laborum.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">Key Points</h2>
              
              <ul className="list-disc list-inside space-y-2">
                <li>High-performance gaming peripherals don't have to break the bank</li>
                <li>Budget options now offer features previously found only in premium products</li>
                <li>Proper research can help you find excellent value in the $20-$50 range</li>
                <li>Consider your specific needs to maximize the value of your purchase</li>
              </ul>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">Our Top Picks</h2>
              
              <p>
                Based on our testing and research, we've identified several standout products in the 
                budget gaming peripheral category. These devices offer exceptional performance for 
                their price points and have earned our recommendation.
              </p>
              
              <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 my-6">
                "Budget gaming peripherals have come a long way in recent years. Today's best options 
                offer performance that rivals premium products at a fraction of the cost."
              </blockquote>
              
              <p>
                In conclusion, don't assume you need to spend hundreds of dollars to get a quality 
                gaming peripheral. With careful selection, you can find excellent options in the 
                budget category that will serve you well for years to come.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between items-center py-6 border-t border-b">
        <div className="text-sm text-gray-500">
          Published on {article.created_at.toLocaleDateString()}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            Share
          </Button>
          <Button variant="outline" size="sm">
            Save Article
          </Button>
        </div>
      </div>
    </div>
  );
}
