import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusIcon, SearchIcon, BookmarkIcon, TagIcon, FolderIcon, ExternalLinkIcon } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import './App.css';

// Import types
import type { BookmarkWithData, Tag, Collection } from '../../server/src/schema';

// Import components
import { BookmarkForm } from '@/components/BookmarkForm';
import { TagManager } from '@/components/TagManager';
import { CollectionManager } from '@/components/CollectionManager';

function App() {
  // Demo user ID - in real app, this would come from authentication
  const currentUserId = 1;

  const [bookmarks, setBookmarks] = useState<BookmarkWithData[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('bookmarks');
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | undefined>();

  // Load all data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [bookmarksData, tagsData, collectionsData] = await Promise.all([
        trpc.getUserBookmarks.query({ userId: currentUserId }),
        trpc.getUserTags.query({ userId: currentUserId }),
        trpc.getUserCollections.query({ userId: currentUserId })
      ]);
      
      setBookmarks(bookmarksData);
      setTags(tagsData);
      setCollections(collectionsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Search bookmarks
  const searchBookmarks = useCallback(async () => {
    if (!searchQuery && selectedTagIds.length === 0 && !selectedCollectionId) {
      // If no search criteria, load all bookmarks
      const bookmarksData = await trpc.getUserBookmarks.query({ userId: currentUserId });
      setBookmarks(bookmarksData);
      return;
    }

    try {
      const searchResult = await trpc.searchBookmarks.query({
        user_id: currentUserId,
        query: searchQuery || undefined,
        tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        collection_id: selectedCollectionId
      });
      setBookmarks(searchResult);
    } catch (error) {
      console.error('Failed to search bookmarks:', error);
    }
  }, [currentUserId, searchQuery, selectedTagIds, selectedCollectionId]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchBookmarks();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchBookmarks]);

  const handleBookmarkCreated = (newBookmark: BookmarkWithData) => {
    setBookmarks(prev => [newBookmark, ...prev]);
  };

  const handleBookmarkUpdated = (updatedBookmark: BookmarkWithData) => {
    setBookmarks(prev => prev.map(bookmark => 
      bookmark.id === updatedBookmark.id ? updatedBookmark : bookmark
    ));
  };

  const handleBookmarkDeleted = async (bookmarkId: number) => {
    try {
      await trpc.deleteBookmark.mutate({ bookmarkId, userId: currentUserId });
      setBookmarks(prev => prev.filter(bookmark => bookmark.id !== bookmarkId));
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
    }
  };

  const handleTagCreated = (newTag: Tag) => {
    setTags(prev => [...prev, newTag]);
  };

  const handleCollectionCreated = (newCollection: Collection) => {
    setCollections(prev => [...prev, newCollection]);
  };

  const toggleTagFilter = (tagId: number) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTagIds([]);
    setSelectedCollectionId(undefined);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📚 Bookmark Manager
          </h1>
          <p className="text-lg text-gray-600">
            Save, organize, and find your favorite links
          </p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="bookmarks" className="flex items-center gap-2">
              <BookmarkIcon className="w-4 h-4" />
              Bookmarks
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              Add Bookmark
            </TabsTrigger>
            <TabsTrigger value="tags" className="flex items-center gap-2">
              <TagIcon className="w-4 h-4" />
              Tags
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex items-center gap-2">
              <FolderIcon className="w-4 h-4" />
              Collections
            </TabsTrigger>
          </TabsList>

          {/* Bookmarks Tab */}
          <TabsContent value="bookmarks">
            <div className="space-y-6">
              {/* Search and Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SearchIcon className="w-5 h-5" />
                    Search & Filter
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search Input */}
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search bookmarks by title, URL, or description..."
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Collection Filter */}
                  <div className="flex gap-4 items-center">
                    <Select 
                      value={selectedCollectionId?.toString() || ''} 
                      onValueChange={(value: string) => setSelectedCollectionId(value ? parseInt(value) : undefined)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by collection" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All collections</SelectItem>
                        {collections.map(collection => (
                          <SelectItem key={collection.id} value={collection.id.toString()}>
                            {collection.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>

                  {/* Tag Filters */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Filter by tags:</label>
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <Badge
                          key={tag.id}
                          variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                          className="cursor-pointer hover:scale-105 transition-transform"
                          style={{
                            backgroundColor: selectedTagIds.includes(tag.id) && tag.color ? tag.color : undefined,
                            borderColor: tag.color || undefined
                          }}
                          onClick={() => toggleTagFilter(tag.id)}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bookmarks List */}
              <div className="space-y-4">
                {isLoading ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading bookmarks...</p>
                    </CardContent>
                  </Card>
                ) : bookmarks.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <BookmarkIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg mb-2">No bookmarks found</p>
                      <p className="text-gray-500">
                        {searchQuery || selectedTagIds.length > 0 || selectedCollectionId
                          ? "Try adjusting your search criteria"
                          : "Add your first bookmark to get started!"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  bookmarks.map(bookmark => (
                    <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <a
                                href={bookmark.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2"
                              >
                                {bookmark.title}
                                <ExternalLinkIcon className="w-4 h-4" />
                              </a>
                            </CardTitle>
                            <CardDescription className="mt-1">
                              <a
                                href={bookmark.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 hover:text-gray-700 text-sm break-all"
                              >
                                {bookmark.url}
                              </a>
                            </CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBookmarkDeleted(bookmark.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </CardHeader>
                      {(bookmark.description || bookmark.tags.length > 0 || bookmark.collection_name) && (
                        <CardContent>
                          {bookmark.description && (
                            <p className="text-gray-600 mb-3">{bookmark.description}</p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-2">
                            {bookmark.collection_name && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <FolderIcon className="w-3 h-3" />
                                {bookmark.collection_name}
                              </Badge>
                            )}
                            
                            {bookmark.tags.map(tag => (
                              <Badge
                                key={tag.id}
                                variant="outline"
                                style={{
                                  borderColor: tag.color || undefined,
                                  color: tag.color || undefined
                                }}
                              >
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                          
                          <p className="text-xs text-gray-400 mt-3">
                            Added: {bookmark.created_at.toLocaleDateString()}
                            {bookmark.updated_at.getTime() !== bookmark.created_at.getTime() && (
                              <span> • Updated: {bookmark.updated_at.toLocaleDateString()}</span>
                            )}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Add Bookmark Tab */}
          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlusIcon className="w-5 h-5" />
                  Add New Bookmark
                </CardTitle>
                <CardDescription>
                  Save a new link with tags and collections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BookmarkForm
                  userId={currentUserId}
                  tags={tags}
                  collections={collections}
                  onBookmarkCreated={handleBookmarkCreated}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tags Tab */}
          <TabsContent value="tags">
            <TagManager
              userId={currentUserId}
              tags={tags}
              onTagCreated={handleTagCreated}
            />
          </TabsContent>

          {/* Collections Tab */}
          <TabsContent value="collections">
            <CollectionManager
              userId={currentUserId}
              collections={collections}
              onCollectionCreated={handleCollectionCreated}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
