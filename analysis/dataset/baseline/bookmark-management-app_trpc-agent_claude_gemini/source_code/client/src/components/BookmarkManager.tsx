import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { BookmarkList } from './BookmarkList';
import { BookmarkForm } from './BookmarkForm';
import { CollectionManager } from './CollectionManager';
import { TagManager } from './TagManager';
import { SearchBar } from './SearchBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusIcon, BookmarkIcon, FolderIcon, TagIcon } from 'lucide-react';
import type { User, BookmarkWithDetails, Collection, Tag, SearchBookmarksInput } from '../../../server/src/schema';

interface BookmarkManagerProps {
  user: User;
}

export function BookmarkManager({ user }: BookmarkManagerProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkWithDetails[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookmarkForm, setShowBookmarkForm] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<BookmarkWithDetails[] | null>(null);

  const loadBookmarks = useCallback(async (collectionId?: number) => {
    try {
      const result = await trpc.getBookmarks.query({ 
        userId: user.id, 
        collectionId: collectionId || undefined 
      });
      setBookmarks(result);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    }
  }, [user.id]);

  const loadCollections = useCallback(async () => {
    try {
      const result = await trpc.getCollections.query({ userId: user.id });
      setCollections(result);
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  }, [user.id]);

  const loadTags = useCallback(async () => {
    try {
      const result = await trpc.getTags.query({ userId: user.id });
      setTags(result);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }, [user.id]);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadBookmarks(selectedCollection || undefined),
        loadCollections(),
        loadTags()
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [loadBookmarks, loadCollections, loadTags, selectedCollection]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleSearch = async (searchParams: SearchBookmarksInput) => {
    try {
      const results = await trpc.searchBookmarks.query(searchParams);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const clearSearch = () => {
    setSearchResults(null);
  };

  const handleCollectionFilter = (collectionId: number | null) => {
    setSelectedCollection(collectionId);
    setSearchResults(null);
    loadBookmarks(collectionId || undefined);
  };

  const displayedBookmarks = searchResults !== null ? searchResults : bookmarks;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your bookmarks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 w-full sm:max-w-md">
              <SearchBar
                user={user}
                collections={collections}
                tags={tags}
                onSearch={handleSearch}
                onClear={clearSearch}
                isSearchActive={searchResults !== null}
              />
            </div>
            <Button
              onClick={() => setShowBookmarkForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Bookmark
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Collection Filter */}
      {collections.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCollection === null ? "default" : "outline"}
                size="sm"
                onClick={() => handleCollectionFilter(null)}
              >
                All Bookmarks
              </Button>
              {collections.map((collection: Collection) => (
                <Button
                  key={collection.id}
                  variant={selectedCollection === collection.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCollectionFilter(collection.id)}
                >
                  <FolderIcon className="h-3 w-3 mr-1" />
                  {collection.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Bookmark Form */}
          {showBookmarkForm && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <BookmarkIcon className="h-5 w-5 mr-2" />
                    Add New Bookmark
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBookmarkForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
                <BookmarkForm
                  user={user}
                  collections={collections}
                  tags={tags}
                  onSuccess={() => {
                    setShowBookmarkForm(false);
                    loadBookmarks(selectedCollection || undefined);
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Bookmarks List */}
          <BookmarkList
            bookmarks={displayedBookmarks}
            collections={collections}
            tags={tags}
            onBookmarkUpdated={() => loadBookmarks(selectedCollection || undefined)}
            onBookmarkDeleted={() => loadBookmarks(selectedCollection || undefined)}
            isSearchResults={searchResults !== null}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Tabs defaultValue="collections" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="collections" className="text-xs">
                <FolderIcon className="h-3 w-3 mr-1" />
                Collections
              </TabsTrigger>
              <TabsTrigger value="tags" className="text-xs">
                <TagIcon className="h-3 w-3 mr-1" />
                Tags
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="collections" className="mt-4">
              <CollectionManager
                user={user}
                collections={collections}
                onCollectionCreated={loadCollections}
                onCollectionUpdated={loadCollections}
                onCollectionDeleted={loadCollections}
              />
            </TabsContent>
            
            <TabsContent value="tags" className="mt-4">
              <TagManager
                user={user}
                tags={tags}
                onTagCreated={loadTags}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
