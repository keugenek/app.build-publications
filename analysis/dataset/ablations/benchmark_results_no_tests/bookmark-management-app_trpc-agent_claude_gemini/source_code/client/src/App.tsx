import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';
import { BookmarkForm } from '@/components/BookmarkForm';
import { BookmarkList } from '@/components/BookmarkList';
import { CollectionManager } from '@/components/CollectionManager';
import { TagManager } from '@/components/TagManager';
import { SearchBar } from '@/components/SearchBar';
import { UserDashboard } from '@/components/UserDashboard';
// Type-only imports for better TypeScript compliance
import type { 
  User, 
  Bookmark, 
  Collection, 
  Tag, 
  BookmarkWithRelations,
  UserStats 
} from '../../server/src/schema';

function App() {
  // User authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Data state
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchResults, setSearchResults] = useState<BookmarkWithRelations[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('bookmarks');
  const [selectedCollection, setSelectedCollection] = useState<number | undefined>(undefined);
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Load user data when user changes
  const loadUserData = useCallback(async (userId: number) => {
    try {
      setIsLoading(true);
      const [bookmarksData, collectionsData, tagsData, statsData] = await Promise.all([
        trpc.getBookmarks.query({ userId }),
        trpc.getCollections.query({ userId }),
        trpc.getTags.query({ userId }),
        trpc.getUserStats.query({ userId })
      ]);
      
      setBookmarks(bookmarksData);
      setCollections(collectionsData);
      setTags(tagsData);
      setUserStats(statsData);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect to load data when user logs in
  useEffect(() => {
    if (currentUser) {
      loadUserData(currentUser.id);
    }
  }, [currentUser, loadUserData]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setBookmarks([]);
    setCollections([]);
    setTags([]);
    setUserStats(null);
    setSearchResults([]);
    setIsSearchMode(false);
    setSelectedCollection(undefined);
  };

  const handleBookmarkCreated = (newBookmark: Bookmark) => {
    setBookmarks((prev: Bookmark[]) => [newBookmark, ...prev]);
    if (userStats) {
      setUserStats((prev: UserStats | null) => 
        prev ? { ...prev, total_bookmarks: prev.total_bookmarks + 1 } : prev
      );
    }
  };

  const handleBookmarkDeleted = (bookmarkId: number) => {
    setBookmarks((prev: Bookmark[]) => prev.filter(b => b.id !== bookmarkId));
    if (userStats) {
      setUserStats((prev: UserStats | null) => 
        prev ? { ...prev, total_bookmarks: prev.total_bookmarks - 1 } : prev
      );
    }
  };

  const handleCollectionCreated = (newCollection: Collection) => {
    setCollections((prev: Collection[]) => [newCollection, ...prev]);
    if (userStats) {
      setUserStats((prev: UserStats | null) => 
        prev ? { ...prev, total_collections: prev.total_collections + 1 } : prev
      );
    }
  };

  const handleCollectionDeleted = (collectionId: number) => {
    setCollections((prev: Collection[]) => prev.filter(c => c.id !== collectionId));
    if (selectedCollection === collectionId) {
      setSelectedCollection(undefined);
    }
    if (userStats) {
      setUserStats((prev: UserStats | null) => 
        prev ? { ...prev, total_collections: prev.total_collections - 1 } : prev
      );
    }
  };

  const handleTagCreated = (newTag: Tag) => {
    setTags((prev: Tag[]) => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)));
    if (userStats) {
      setUserStats((prev: UserStats | null) => 
        prev ? { ...prev, total_tags: prev.total_tags + 1 } : prev
      );
    }
  };

  const handleTagDeleted = (tagId: number) => {
    setTags((prev: Tag[]) => prev.filter(t => t.id !== tagId));
    if (userStats) {
      setUserStats((prev: UserStats | null) => 
        prev ? { ...prev, total_tags: prev.total_tags - 1 } : prev
      );
    }
  };

  const handleSearch = async (query: string, collectionId?: number, tagIds?: number[]) => {
    if (!currentUser || !query.trim()) {
      setIsSearchMode(false);
      setSearchResults([]);
      return;
    }

    try {
      setIsLoading(true);
      const results = await trpc.searchBookmarks.query({
        user_id: currentUser.id,
        query,
        collection_id: collectionId,
        tag_ids: tagIds,
        limit: 50
      });
      setSearchResults(results);
      setIsSearchMode(true);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setIsSearchMode(false);
    setSearchResults([]);
  };

  // If no user is logged in, show authentication
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-indigo-900">
              📚 BookmarkVault
            </CardTitle>
            <CardDescription>
              Your personal bookmark management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={authMode} onValueChange={(value: string) => setAuthMode(value as 'login' | 'register')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <LoginForm onLogin={handleLogin} />
              </TabsContent>
              <TabsContent value="register">
                <RegisterForm onRegister={handleLogin} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main application interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-indigo-900">
                📚 BookmarkVault
              </h1>
              <Badge variant="outline" className="text-xs">
                {currentUser.display_name}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <SearchBar
                collections={collections}
                tags={tags}
                onSearch={handleSearch}
                onClear={clearSearch}
              />
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* User Dashboard */}
              {userStats && (
                <UserDashboard
                  stats={userStats}
                  userName={currentUser.display_name}
                />
              )}

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={() => setActiveTab('add-bookmark')}
                    className="w-full justify-start"
                    variant={activeTab === 'add-bookmark' ? 'default' : 'ghost'}
                    size="sm"
                  >
                    ➕ Add Bookmark
                  </Button>
                  <Button
                    onClick={() => setActiveTab('collections')}
                    className="w-full justify-start"
                    variant={activeTab === 'collections' ? 'default' : 'ghost'}
                    size="sm"
                  >
                    📁 Manage Collections
                  </Button>
                  <Button
                    onClick={() => setActiveTab('tags')}
                    className="w-full justify-start"
                    variant={activeTab === 'tags' ? 'default' : 'ghost'}
                    size="sm"
                  >
                    🏷️ Manage Tags
                  </Button>
                </CardContent>
              </Card>

              {/* Collection Filter */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Collections</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={() => {
                      setSelectedCollection(undefined);
                      setActiveTab('bookmarks');
                    }}
                    className="w-full justify-start text-xs"
                    variant={selectedCollection === undefined ? 'default' : 'ghost'}
                    size="sm"
                  >
                    📚 All Bookmarks
                  </Button>
                  {collections.map((collection: Collection) => (
                    <Button
                      key={collection.id}
                      onClick={() => {
                        setSelectedCollection(collection.id);
                        setActiveTab('bookmarks');
                      }}
                      className="w-full justify-start text-xs truncate"
                      variant={selectedCollection === collection.id ? 'default' : 'ghost'}
                      size="sm"
                    >
                      📁 {collection.name}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="bookmarks">
                  📖 {isSearchMode ? 'Search Results' : 'Bookmarks'}
                </TabsTrigger>
                <TabsTrigger value="add-bookmark">➕ Add</TabsTrigger>
                <TabsTrigger value="collections">📁 Collections</TabsTrigger>
                <TabsTrigger value="tags">🏷️ Tags</TabsTrigger>
              </TabsList>

              <TabsContent value="bookmarks" className="mt-4">
                {isSearchMode ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">
                        Search Results ({searchResults.length})
                      </h2>
                      <Button onClick={clearSearch} variant="outline" size="sm">
                        Clear Search
                      </Button>
                    </div>
                    <BookmarkList
                      bookmarks={searchResults}
                      collections={collections}
                      tags={tags}
                      onBookmarkDeleted={handleBookmarkDeleted}
                      isLoading={isLoading}
                      showExtended={true}
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">
                        {selectedCollection
                          ? `${collections.find(c => c.id === selectedCollection)?.name || 'Collection'} Bookmarks`
                          : 'All Bookmarks'}
                        ({bookmarks.filter(b => selectedCollection ? b.collection_id === selectedCollection : true).length})
                      </h2>
                      {selectedCollection && (
                        <Button
                          onClick={() => setSelectedCollection(undefined)}
                          variant="outline"
                          size="sm"
                        >
                          Show All
                        </Button>
                      )}
                    </div>
                    <BookmarkList
                      bookmarks={bookmarks.filter(b => selectedCollection ? b.collection_id === selectedCollection : true)}
                      collections={collections}
                      tags={tags}
                      onBookmarkDeleted={handleBookmarkDeleted}
                      isLoading={isLoading}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="add-bookmark" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Add New Bookmark</CardTitle>
                    <CardDescription>
                      Save a new bookmark with title, description, and tags
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BookmarkForm
                      userId={currentUser.id}
                      collections={collections}
                      tags={tags}
                      onBookmarkCreated={handleBookmarkCreated}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="collections" className="mt-4">
                <CollectionManager
                  userId={currentUser.id}
                  collections={collections}
                  onCollectionCreated={handleCollectionCreated}
                  onCollectionDeleted={handleCollectionDeleted}
                />
              </TabsContent>

              <TabsContent value="tags" className="mt-4">
                <TagManager
                  userId={currentUser.id}
                  tags={tags}
                  onTagCreated={handleTagCreated}
                  onTagDeleted={handleTagDeleted}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
