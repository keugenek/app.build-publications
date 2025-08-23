import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import type { Bookmark, GetBookmarksInput } from '../../../server/src/schema';

export function BookmarkList() {
  const [filters, setFilters] = useState<GetBookmarksInput>({
    user_id: 0, // placeholder, should be actual user ID
    search: undefined,
    tag_ids: undefined,
    collection_id: undefined,
  });

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadBookmarks = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await trpc.getBookmarks.query(filters);
      setBookmarks(data);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, search: value || undefined }));
  };

  const handleTagIdsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const ids = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s !== '')
      .map(Number)
      .filter((n) => !Number.isNaN(n));
    setFilters((prev) => ({ ...prev, tag_ids: ids.length ? ids : undefined }));
  };

  const handleCollectionIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFilters((prev) => ({
      ...prev,
      collection_id: val ? Number(val) : undefined,
    }));
  };

  const handleRefresh = () => loadBookmarks();

  return (
    <div className="space-y-4 p-4 border rounded-md">
      <h2 className="text-xl font-semibold">Your Bookmarks</h2>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
        <Input
          placeholder="Search…"
          value={filters.search ?? ''}
          onChange={handleSearchChange}
        />
        <Input
          placeholder="Tag IDs (comma separated)"
          value={filters.tag_ids?.join(', ') ?? ''}
          onChange={handleTagIdsChange}
        />
        <Input
          placeholder="Collection ID"
          type="number"
          value={filters.collection_id ?? ''}
          onChange={handleCollectionIdChange}
        />
        <Button onClick={handleRefresh} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>
      <div className="grid gap-4">
        {bookmarks.length === 0 ? (
          <p className="text-gray-500">No bookmarks found.</p>
        ) : (
          bookmarks.map((bm) => (
            <div key={bm.id} className="border p-3 rounded-md">
              <a href={bm.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                {bm.title || bm.url}
              </a>
              {bm.description && (
                <p className="text-sm text-gray-600 mt-1">{bm.description}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                <span>Collection: {bm.collection_id ?? 'none'}</span>
                
                <span>Added: {new Date(bm.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
