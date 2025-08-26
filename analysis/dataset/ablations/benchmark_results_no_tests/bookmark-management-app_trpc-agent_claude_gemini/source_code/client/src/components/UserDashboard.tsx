import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { UserStats } from '../../../server/src/schema';

interface UserDashboardProps {
  stats: UserStats;
  userName: string;
}

export function UserDashboard({ stats, userName }: UserDashboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center space-x-2">
          <span>👋</span>
          <span>Welcome back, {userName}!</span>
        </CardTitle>
        <CardDescription className="text-xs">
          Your bookmark collection overview
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">📚 Bookmarks</span>
            <Badge variant="secondary" className="text-xs">
              {stats.total_bookmarks}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">📁 Collections</span>
            <Badge variant="secondary" className="text-xs">
              {stats.total_collections}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">🏷️ Tags</span>
            <Badge variant="secondary" className="text-xs">
              {stats.total_tags}
            </Badge>
          </div>
        </div>
        
        {stats.total_bookmarks > 0 && (
          <div className="pt-2 border-t">
            <div className="text-xs text-gray-500 text-center">
              {stats.total_bookmarks === 1 
                ? 'You have 1 saved bookmark' 
                : `You have ${stats.total_bookmarks} saved bookmarks`}
              {stats.total_collections > 0 && 
                ` across ${stats.total_collections} ${stats.total_collections === 1 ? 'collection' : 'collections'}`}
              {stats.total_tags > 0 && 
                ` with ${stats.total_tags} ${stats.total_tags === 1 ? 'tag' : 'tags'}`}
            </div>
          </div>
        )}
        
        {stats.total_bookmarks === 0 && (
          <div className="pt-2 border-t">
            <div className="text-xs text-gray-500 text-center">
              🚀 Start by adding your first bookmark!
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
