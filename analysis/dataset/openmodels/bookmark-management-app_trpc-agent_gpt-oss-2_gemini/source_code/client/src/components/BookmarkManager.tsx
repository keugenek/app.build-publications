import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Bookmark, Tag, Collection } from '../../../server/src/schema';

/**
 * BookmarkManager component handles CRUD operations for bookmarks, tags, and collections.
 * It also provides a simple search feature.
 */
export function BookmarkManager() {
  // State
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Bookmark[]>([]);
  const [newBookmark, setNewBookmark] = useState<{ url: string; title: string; description: string | null }>({
    url: '',
    title: '',
    description: null,
  });
  const [newTag, setNewTag] = useState('');
  const [newCollection, setNewCollection] = useState('');
  const [loading, setLoading] = useState(false);

  // Load data callbacks (stable with empty deps)
  const loadBookmarks = useCallback(async () => {
    const data = await trpc.getBookmarks.query();
    setBookmarks(data);
  }, []);

  const loadTags = useCallback(async () => {
    const data = await trpc.getTags.query();
    setTags(data);
  }, []);

  const loadCollections = useCallback(async () => {
    const data = await trpc.getCollections.query();
    setCollections(data);
  }, []);

  useEffect(() => {
    loadBookmarks();
    loadTags();
    loadCollections();
  }, [loadBookmarks, loadTags, loadCollections]);

  // ---------- Bookmark handlers ----------
  const handleCreateBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await trpc.createBookmark.mutate({
        url: newBookmark.url,
        title: newBookmark.title,
        description: newBookmark.description,
      });
      setBookmarks(prev => [...prev, created]);
      setNewBookmark({ url: '', title: '', description: null });
    } catch (err) {
      console.error('Create bookmark error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBookmark = async (id: number) => {
    await trpc.deleteBookmark.mutate({ id });
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  // ---------- Tag handlers ----------
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await trpc.createTag.mutate({ name: newTag });
    setTags(prev => [...prev, created]);
    setNewTag('');
  };

  const handleDeleteTag = async (id: number) => {
    await trpc.deleteTag.mutate({ id });
    setTags(prev => prev.filter(t => t.id !== id));
  };

  // ---------- Collection handlers ----------
  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await trpc.createCollection.mutate({ name: newCollection });
    setCollections(prev => [...prev, created]);
    setNewCollection('');
  };

  const handleDeleteCollection = async (id: number) => {
    await trpc.deleteCollection.mutate({ id });
    setCollections(prev => prev.filter(c => c.id !== id));
  };

  // ---------- Search ----------
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const results = await trpc.searchBookmarks.query({ query: searchQuery });
    setSearchResults(results);
  };

  // ---------- Assignments ----------
  const handleAssignTag = async (bookmarkId: number, tagId: number) => {
    await trpc.assignTagToBookmark.mutate({ bookmark_id: bookmarkId, tag_id: tagId });
    // For a real app you might refetch the bookmark or optimistically update state.
  };

  const handleAssignCollection = async (bookmarkId: number, collectionId: number) => {
    await trpc.assignCollectionToBookmark.mutate({ bookmark_id: bookmarkId, collection_id: collectionId });
  };

  return (
    <div className="space-y-8">
      {/* Search Section */}
      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Search Bookmarks</h2>
        <form onSubmit={handleSearch} className="flex space-x-2">
          <Input
            placeholder="Search by URL, title, description, tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <Button type="submit">Search</Button>
        </form>
        {searchResults.length > 0 && (
          <ul className="mt-4 space-y-2">
            {searchResults.map(b => (
              <li key={b.id} className="border p-2 rounded">
                <a href={b.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                  {b.title || b.url}
                </a>
                {b.description && <p className="text-sm text-gray-600">{b.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Bookmark Section */}
      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Your Bookmarks</h2>
        <form onSubmit={handleCreateBookmark} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
          <Input
            placeholder="URL"
            value={newBookmark.url}
            onChange={e => setNewBookmark(prev => ({ ...prev, url: e.target.value }))}
            required
          />
          <Input
            placeholder="Title"
            value={newBookmark.title}
            onChange={e => setNewBookmark(prev => ({ ...prev, title: e.target.value }))}
            required
          />
          <Input
            placeholder="Description (optional)"
            value={newBookmark.description ?? ''}
            onChange={e => setNewBookmark(prev => ({ ...prev, description: e.target.value || null }))}
          />
          <Button type="submit" className="col-span-3" disabled={loading}>
            {loading ? 'Saving...' : 'Add Bookmark'}
          </Button>
        </form>
        {bookmarks.length === 0 ? (
          <p className="text-gray-500">No bookmarks yet.</p>
        ) : (
          <ul className="space-y-3">
            {bookmarks.map(b => (
              <li key={b.id} className="border p-3 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <a href={b.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                      {b.title || b.url}
                    </a>
                    {b.description && <p className="text-sm text-gray-600">{b.description}</p>}
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteBookmark(b.id)}>
                    Delete
                  </Button>
                </div>
                {/* Tag assignment */}
                {tags.length > 0 && (
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-sm font-medium">Tag:</span>
                    <select
                      className="border rounded px-2 py-1"
                      onChange={e => {
                        const tagId = Number(e.target.value);
                        if (tagId) handleAssignTag(b.id, tagId);
                      }}
                    >
                      <option value="">Select tag</option>
                      {tags.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {/* Collection assignment */}
                {collections.length > 0 && (
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-sm font-medium">Collection:</span>
                    <select
                      className="border rounded px-2 py-1"
                      onChange={e => {
                        const colId = Number(e.target.value);
                        if (colId) handleAssignCollection(b.id, colId);
                      }}
                    >
                      <option value="">Select collection</option>
                      {collections.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Tags Section */}
      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Tags</h2>
        <form onSubmit={handleCreateTag} className="flex space-x-2 mb-4">
          <Input placeholder="Tag name" value={newTag} onChange={e => setNewTag(e.target.value)} required />
          <Button type="submit">Add Tag</Button>
        </form>
        {tags.length === 0 ? (
          <p className="text-gray-500">No tags yet.</p>
        ) : (
          <ul className="space-y-2">
            {tags.map(t => (
              <li key={t.id} className="flex justify-between items-center border p-2 rounded">
                <span>{t.name}</span>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteTag(t.id)}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Collections Section */}
      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Collections</h2>
        <form onSubmit={handleCreateCollection} className="flex space-x-2 mb-4">
          <Input placeholder="Collection name" value={newCollection} onChange={e => setNewCollection(e.target.value)} required />
          <Button type="submit">Add Collection</Button>
        </form>
        {collections.length === 0 ? (
          <p className="text-gray-500">No collections yet.</p>
        ) : (
          <ul className="space-y-2">
            {collections.map(c => (
              <li key={c.id} className="flex justify-between items-center border p-2 rounded">
                <span>{c.name}</span>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteCollection(c.id)}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
