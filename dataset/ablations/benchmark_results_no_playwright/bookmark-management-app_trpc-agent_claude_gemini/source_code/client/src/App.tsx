import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import type { 
  Bookmark, 
  Collection, 
  Tag, 
  CreateBookmarkInput, 
  CreateCollectionInput, 
  CreateTagInput, 
  SearchBookmarksInput 
} from '../../server/src/schema';

function App() {
  // Current user ID (in a real app, this would come from authentication)
  const CURRENT_USER_ID = 1;

  // State management
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  // Dialog states
  const [isBookmarkDialogOpen, setIsBookmarkDialogOpen] = useState(false);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);

  // Form states
  const [bookmarkForm, setBookmarkForm] = useState<CreateBookmarkInput>({
    user_id: CURRENT_USER_ID,
    collection_id: null,
    title: '',
    url: '',
    description: null,
    tag_ids: []
  });

  const [collectionForm, setCollectionForm] = useState<CreateCollectionInput>({
    user_id: CURRENT_USER_ID,
    name: '',
    description: null
  });

  const [tagForm, setTagForm] = useState<CreateTagInput>({
    user_id: CURRENT_USER_ID,
    name: '',
    color: null
  });

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      const [bookmarksData, collectionsData, tagsData] = await Promise.all([
        trpc.getBookmarks.query({ user_id: CURRENT_USER_ID }),
        trpc.getCollections.query({ user_id: CURRENT_USER_ID }),
        trpc.getTags.query({ user_id: CURRENT_USER_ID })
      ]);
      
      setBookmarks(bookmarksData);
      setCollections(collectionsData);
      setTags(tagsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Search bookmarks
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() && selectedCollection === 'all' && selectedTags.length === 0) {
      // No filters, show all bookmarks
      await loadData();
      return;
    }

    try {
      const searchInput: SearchBookmarksInput = {
        user_id: CURRENT_USER_ID,
        query: searchQuery.trim() || undefined,
        collection_id: selectedCollection !== 'all' ? parseInt(selectedCollection) : undefined,
        tag_ids: selectedTags.length > 0 ? selectedTags : undefined,
        limit: 50,
        offset: 0
      };

      const searchResults = await trpc.searchBookmarks.query(searchInput);
      setBookmarks(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, [searchQuery, selectedCollection, selectedTags, loadData]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  // Create bookmark
  const handleCreateBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newBookmark = await trpc.createBookmark.mutate(bookmarkForm);
      setBookmarks((prev: Bookmark[]) => [newBookmark, ...prev]);
      setBookmarkForm({
        user_id: CURRENT_USER_ID,
        collection_id: null,
        title: '',
        url: '',
        description: null,
        tag_ids: []
      });
      setIsBookmarkDialogOpen(false);
    } catch (error) {
      console.error('Failed to create bookmark:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create collection
  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newCollection = await trpc.createCollection.mutate(collectionForm);
      setCollections((prev: Collection[]) => [...prev, newCollection]);
      setCollectionForm({
        user_id: CURRENT_USER_ID,
        name: '',
        description: null
      });
      setIsCollectionDialogOpen(false);
    } catch (error) {
      console.error('Failed to create collection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create tag
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newTag = await trpc.createTag.mutate(tagForm);
      setTags((prev: Tag[]) => [...prev, newTag]);
      setTagForm({
        user_id: CURRENT_USER_ID,
        name: '',
        color: null
      });
      setIsTagDialogOpen(false);
    } catch (error) {
      console.error('Failed to create tag:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle tag selection in filter
  const toggleTagFilter = (tagId: number) => {
    setSelectedTags((prev: number[]) =>
      prev.includes(tagId)
        ? prev.filter((id: number) => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Toggle tag in bookmark form
  const toggleBookmarkTag = (tagId: number) => {
    setBookmarkForm((prev: CreateBookmarkInput) => ({
      ...prev,
      tag_ids: prev.tag_ids?.includes(tagId)
        ? prev.tag_ids.filter((id: number) => id !== tagId)
        : [...(prev.tag_ids || []), tagId]
    }));
  };

  // Get collection name
  const getCollectionName = (collectionId: number | null) => {
    if (!collectionId) return null;
    const collection = collections.find((c: Collection) => c.id === collectionId);
    return collection?.name || 'Unknown Collection';
  };

  // Get tag names for bookmark (STUB implementation)
  // In a real implementation, the backend would include tag information

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📚 Bookmark Manager
          </h1>
          <p className="text-gray-600">Save, organize, and find your favorite links</p>
        </div>

        {/* Search and Filter Section */}
        <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Search Input */}
              <div className="lg:col-span-2">
                <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">
                  🔍 Search Bookmarks
                </Label>
                <Input
                  id="search"
                  placeholder="Search by title, URL, or description..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="border-gray-200 focus:border-blue-400"
                />
              </div>

              {/* Collection Filter */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  📁 Collection
                </Label>
                <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                  <SelectTrigger className="border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Collections</SelectItem>
                    {collections.map((collection: Collection) => (
                      <SelectItem key={collection.id} value={collection.id.toString()}>
                        {collection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quick Actions */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  ⚡ Quick Actions
                </Label>
                <Dialog open={isBookmarkDialogOpen} onOpenChange={setIsBookmarkDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      ➕ Add Bookmark
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>

            {/* Tag Filter */}
            {tags.length > 0 && (
              <div className="mt-4">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  🏷️ Filter by Tags
                </Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag: Tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        selectedTags.includes(tag.id)
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => toggleTagFilter(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="bookmarks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur shadow-sm">
            <TabsTrigger value="bookmarks" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              📖 Bookmarks ({bookmarks.length})
            </TabsTrigger>
            <TabsTrigger value="collections" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              📁 Collections ({collections.length})
            </TabsTrigger>
            <TabsTrigger value="tags" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              🏷️ Tags ({tags.length})
            </TabsTrigger>
            <TabsTrigger value="manage" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              ⚙️ Manage
            </TabsTrigger>
          </TabsList>

          {/* Bookmarks Tab */}
          <TabsContent value="bookmarks" className="space-y-4">
            {bookmarks.length === 0 ? (
              <Card className="text-center py-12 shadow-lg bg-white/80 backdrop-blur">
                <CardContent>
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Bookmarks Yet</h3>
                  <p className="text-gray-500 mb-4">Start saving your favorite links!</p>
                  <Dialog open={isBookmarkDialogOpen} onOpenChange={setIsBookmarkDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        ➕ Add Your First Bookmark
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bookmarks.map((bookmark: Bookmark) => (
                  <Card key={bookmark.id} className="shadow-lg hover:shadow-xl transition-shadow bg-white/90 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800 truncate">
                        {bookmark.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>🌐</span>
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 truncate flex-1"
                        >
                          {bookmark.url}
                        </a>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {bookmark.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {bookmark.description}
                        </p>
                      )}
                      
                      <div className="space-y-2">
                        {bookmark.collection_id && (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-gray-100">
                              📁 {getCollectionName(bookmark.collection_id)}
                            </Badge>
                          </div>
                        )}
                        
                        {/* STUB: Tag display will be implemented when backend provides tag associations */}
                        <div className="flex flex-wrap gap-1">
                          {/* Real implementation would show bookmark tags here */}
                        </div>
                      </div>

                      <Separator className="my-3" />
                      
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Added {bookmark.created_at.toLocaleDateString()}</span>
                        <Button variant="outline" size="sm" className="h-8">
                          ✏️ Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Collections Tab */}
          <TabsContent value="collections" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-800">Your Collections</h2>
              <Dialog open={isCollectionDialogOpen} onOpenChange={setIsCollectionDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    ➕ New Collection
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>

            {collections.length === 0 ? (
              <Card className="text-center py-12 shadow-lg bg-white/80 backdrop-blur">
                <CardContent>
                  <div className="text-6xl mb-4">📁</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Collections Yet</h3>
                  <p className="text-gray-500">Create collections to organize your bookmarks</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {collections.map((collection: Collection) => (
                  <Card key={collection.id} className="shadow-lg bg-white/90 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-800">
                        📁 {collection.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {collection.description && (
                        <p className="text-gray-600 text-sm mb-3">{collection.description}</p>
                      )}
                      <div className="text-xs text-gray-400">
                        Created {collection.created_at.toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tags Tab */}
          <TabsContent value="tags" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-800">Your Tags</h2>
              <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    ➕ New Tag
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>

            {tags.length === 0 ? (
              <Card className="text-center py-12 shadow-lg bg-white/80 backdrop-blur">
                <CardContent>
                  <div className="text-6xl mb-4">🏷️</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Tags Yet</h3>
                  <p className="text-gray-500">Create tags to categorize your bookmarks</p>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-wrap gap-3">
                {tags.map((tag: Tag) => (
                  <Badge
                    key={tag.id}
                    className="text-sm px-3 py-2 bg-white/90 text-gray-700 border-2 hover:shadow-md transition-shadow"
                    style={{ borderColor: tag.color || '#d1d5db' }}
                  >
                    🏷️ {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="shadow-lg bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📖 Bookmarks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-2">{bookmarks.length}</div>
                  <p className="text-gray-600">Total saved bookmarks</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📁 Collections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-2">{collections.length}</div>
                  <p className="text-gray-600">Organization folders</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🏷️ Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600 mb-2">{tags.length}</div>
                  <p className="text-gray-600">Category labels</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Bookmark Dialog */}
        <Dialog open={isBookmarkDialogOpen} onOpenChange={setIsBookmarkDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>➕ Add New Bookmark</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateBookmark} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={bookmarkForm.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setBookmarkForm((prev: CreateBookmarkInput) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Enter bookmark title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  type="url"
                  value={bookmarkForm.url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setBookmarkForm((prev: CreateBookmarkInput) => ({ ...prev, url: e.target.value }))
                  }
                  placeholder="https://example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={bookmarkForm.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setBookmarkForm((prev: CreateBookmarkInput) => ({ 
                      ...prev, 
                      description: e.target.value || null 
                    }))
                  }
                  placeholder="Optional description"
                />
              </div>

              <div>
                <Label>Collection</Label>
                <Select 
                  value={bookmarkForm.collection_id?.toString() || 'none'} 
                  onValueChange={(value) =>
                    setBookmarkForm((prev: CreateBookmarkInput) => ({ 
                      ...prev, 
                      collection_id: value !== 'none' ? parseInt(value) : null 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select collection (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Collection</SelectItem>
                    {collections.map((collection: Collection) => (
                      <SelectItem key={collection.id} value={collection.id.toString()}>
                        {collection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {tags.length > 0 && (
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag: Tag) => (
                      <Badge
                        key={tag.id}
                        variant={bookmarkForm.tag_ids?.includes(tag.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleBookmarkTag(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsBookmarkDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Bookmark'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Collection Dialog */}
        <Dialog open={isCollectionDialogOpen} onOpenChange={setIsCollectionDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>📁 Create New Collection</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <Label htmlFor="collection-name">Name *</Label>
                <Input
                  id="collection-name"
                  value={collectionForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCollectionForm((prev: CreateCollectionInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Collection name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="collection-description">Description</Label>
                <Textarea
                  id="collection-description"
                  value={collectionForm.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCollectionForm((prev: CreateCollectionInput) => ({ 
                      ...prev, 
                      description: e.target.value || null 
                    }))
                  }
                  placeholder="Optional description"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCollectionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                  {isLoading ? 'Creating...' : 'Create Collection'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Tag Dialog */}
        <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>🏷️ Create New Tag</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTag} className="space-y-4">
              <div>
                <Label htmlFor="tag-name">Name *</Label>
                <Input
                  id="tag-name"
                  value={tagForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTagForm((prev: CreateTagInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Tag name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="tag-color">Color</Label>
                <Input
                  id="tag-color"
                  type="color"
                  value={tagForm.color || '#6366f1'}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTagForm((prev: CreateTagInput) => ({ ...prev, color: e.target.value }))
                  }
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsTagDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
                  {isLoading ? 'Creating...' : 'Create Tag'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
