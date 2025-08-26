import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag, Folder } from 'lucide-react';
import type { Bookmark } from '../../../server/src/schema';

interface BookmarkCardProps {
  bookmark: Bookmark;
}

export function BookmarkCard({ bookmark }: BookmarkCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between">
          <div>
            <h3 className="font-semibold text-lg">{bookmark.title}</h3>
            <a 
              href={bookmark.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              {bookmark.url}
            </a>
            {bookmark.description && (
              <p className="text-gray-600 mt-2 text-sm">
                {bookmark.description}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm">
            View
          </Button>
        </div>
        <div className="flex items-center mt-3 space-x-2">
          <Badge variant="secondary" className="text-xs">
            <Tag className="mr-1 h-3 w-3" />
            Work
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Folder className="mr-1 h-3 w-3" />
            Favorites
          </Badge>
          <span className="text-xs text-gray-500 ml-auto">
            {bookmark.created_at.toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
