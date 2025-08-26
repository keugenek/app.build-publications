import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Tag, Folder } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { SearchBar } from '@/components/SearchBar';
import { BookmarkForm } from '@/components/BookmarkForm';
import { BookmarkCard } from '@/components/BookmarkCard';
import type { Bookmark, User as UserType, CreateBookmarkInput } from '../../server/src/schema';

function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with a default user for demo purposes
  useEffect(() => {
    setUser({
      id: 1,
      email: 'user@example.com',
      name: 'Demo User',
      created_at: new Date(),
      updated_at: new Date(),
    });
  }, []);

  // Load bookmarks when user is available
  useEffect(() => {
    if (user) {
      loadBookmarks(user.id);
    }
  }, [user]);

  const loadBookmarks = async (userId: number) => {
    try {
      setIsLoading(true);
      const result = await trpc.getUserBookmarks.query(userId);
      setBookmarks(result);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const result = await trpc.searchBookmarks.query({
        user_id: user.id,
        query,
      });
      setBookmarks(result);
    } catch (error) {
      console.error('Failed to search bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBookmark = async (data: Omit<CreateBookmarkInput, 'user_id'>) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const result = await trpc.createBookmark.mutate({
        user_id: user.id,
        ...data,
      });
      
      setBookmarks(prev => [...prev, result]);
    } catch (error) {
      console.error('Failed to create bookmark:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bookmark Manager</h1>
          <p className="text-gray-600">Save, organize, and search your bookmarks</p>
        </header>

        {/* User Info */}
        {user && (
          <Card className="mb-6">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                <div>
                  <h2 className="font-semibold">{user.name}</h2>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Search and Add Bookmark */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Search Section */}
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />

          {/* Add Bookmark Section */}
          <BookmarkForm 
              onSubmit={handleCreateBookmark} 
              isLoading={isLoading} 
            />
        </div>

        {/* Tags and Collections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Tags Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tag className="mr-2 h-5 w-5" />
                Tags
              </CardTitle>
              <CardDescription>Organize bookmarks with tags</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Work</Badge>
                <Badge variant="secondary">Personal</Badge>
                <Badge variant="secondary">Learning</Badge>
                <Badge variant="secondary">Research</Badge>
                <Badge variant="secondary">Entertainment</Badge>
              </div>
              <Button variant="outline" size="sm" className="mt-4">
                + Create Tag
              </Button>
            </CardContent>
          </Card>

          {/* Collections Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Folder className="mr-2 h-5 w-5" />
                Collections
              </CardTitle>
              <CardDescription>Group bookmarks into collections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Favorites</Badge>
                <Badge variant="outline">To Read</Badge>
                <Badge variant="outline">Resources</Badge>
              </div>
              <Button variant="outline" size="sm" className="mt-4">
                + Create Collection
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Bookmarks List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Bookmarks</CardTitle>
            <CardDescription>
              {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''} saved
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No bookmarks found. Add your first bookmark above!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookmarks.map((bookmark) => (
                  <BookmarkCard key={bookmark.id} bookmark={bookmark} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
