import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { BookmarkForm } from '@/components/BookmarkForm';
import { BookmarkList } from '@/components/BookmarkList';
import type { Bookmark, CreateBookmarkInput, Tag as TagType, Collection as CollectionType } from '../../server/src/schema';

function App() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [collections, setCollections] = useState<CollectionType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadBookmarks = useCallback(async () => {
    try {
      const result = await trpc.getBookmarks.query();
      setBookmarks(result);
      setFilteredBookmarks(result);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    }
  }, []);

  const loadTags = useCallback(async () => {
    // In a complete implementation, we would fetch tags from the backend
    // For now, we'll use empty arrays since the backend doesn't have tag endpoints yet
    setTags([]);
  }, []);

  const loadCollections = useCallback(async () => {
    // In a complete implementation, we would fetch collections from the backend
    // For now, we'll use empty arrays since the backend doesn't have collection endpoints yet
    setCollections([]);
  }, []);

  useEffect(() => {
    loadBookmarks();
    loadTags();
    loadCollections();
  }, [loadBookmarks, loadTags, loadCollections]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBookmarks(bookmarks);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = bookmarks.filter(bookmark => 
        bookmark.title.toLowerCase().includes(query) ||
        bookmark.url.toLowerCase().includes(query) ||
        (bookmark.description && bookmark.description.toLowerCase().includes(query)) ||
        (bookmark.id.toString().includes(query))
      );
      setFilteredBookmarks(filtered);
    }
  }, [searchQuery, bookmarks]);

  const handleCreateBookmark = async (data: CreateBookmarkInput) => {
    setIsLoading(true);
    try {
      const response = await trpc.createBookmark.mutate(data);
      setBookmarks((prev: Bookmark[]) => [...prev, response]);
      setFilteredBookmarks((prev: Bookmark[]) => [...prev, response]);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create bookmark:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bookmark Manager</h1>
          <p className="text-muted-foreground">Organize your favorite links with tags and collections</p>
        </header>

        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search bookmarks..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="mr-2 h-4 w-4" />
              {showCreateForm ? 'Cancel' : 'Add Bookmark'}
            </Button>
          </div>

          {showCreateForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Add New Bookmark</CardTitle>
              </CardHeader>
              <CardContent>
                <BookmarkForm 
                  onSubmit={handleCreateBookmark} 
                  isLoading={isLoading}
                  tags={tags}
                  collections={collections}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">
            Your Bookmarks {filteredBookmarks.length > 0 && `(${filteredBookmarks.length})`}
          </h2>
          
          <BookmarkList bookmarks={filteredBookmarks} />
        </div>
      </div>
    </div>
  );
}

export default App;
