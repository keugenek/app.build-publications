import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Bookmark } from '../../../server/src/schema';

interface BookmarkListProps {
  bookmarks: Bookmark[];
}

export function BookmarkList({ bookmarks }: BookmarkListProps) {
  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No bookmarks found. Add your first bookmark to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {bookmarks.map((bookmark) => (
        <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">
              <a 
                href={bookmark.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {bookmark.title}
              </a>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {bookmark.description || 'No description'}
            </p>
            <div className="flex items-center text-xs text-muted-foreground mb-2">
              <span className="truncate">{bookmark.url}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-3">
              {/* In a complete implementation, we would show actual tags and collections */}
              <Badge variant="secondary">Sample Tag</Badge>
              <Badge variant="outline">Sample Collection</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
