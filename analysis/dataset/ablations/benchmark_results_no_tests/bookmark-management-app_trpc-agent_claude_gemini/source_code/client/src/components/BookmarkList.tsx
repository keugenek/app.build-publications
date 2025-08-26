import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';
import type { Bookmark, BookmarkWithRelations, Collection, Tag } from '../../../server/src/schema';

interface BookmarkListProps {
  bookmarks: Bookmark[] | BookmarkWithRelations[];
  collections: Collection[];
  tags: Tag[];
  onBookmarkDeleted: (bookmarkId: number) => void;
  isLoading?: boolean;
  showExtended?: boolean;
}

export function BookmarkList({
  bookmarks,
  collections,
  tags,
  onBookmarkDeleted,
  isLoading = false,
  showExtended = false
}: BookmarkListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [bookmarkTags, setBookmarkTags] = useState<Record<number, Tag[]>>({});

  const handleDelete = async (bookmarkId: number, userId: number) => {
    setDeletingId(bookmarkId);
    try {
      await trpc.deleteBookmark.mutate({ bookmarkId, userId });
      onBookmarkDeleted(bookmarkId);
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const loadBookmarkTags = async (bookmarkId: number) => {
    if (bookmarkTags[bookmarkId]) return; // Already loaded

    try {
      const tagsData = await trpc.getBookmarkTags.query({ bookmarkId });
      setBookmarkTags((prev: Record<number, Tag[]>) => ({
        ...prev,
        [bookmarkId]: tagsData
      }));
    } catch (error) {
      console.error('Failed to load bookmark tags:', error);
    }
  };

  const getBookmarkTags = (bookmark: Bookmark | BookmarkWithRelations): Tag[] => {
    if ('tags' in bookmark && bookmark.tags) {
      return bookmark.tags;
    }
    return bookmarkTags[bookmark.id] || [];
  };

  const getCollectionName = (collectionId: number | null): string => {
    if (!collectionId) return '';
    const collection = collections.find(c => c.id === collectionId);
    return collection ? collection.name : '';
  };

  const formatUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-start space-x-4">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-semibold mb-2">No bookmarks found</h3>
          <p className="text-gray-500 text-center">
            {showExtended
              ? "Try adjusting your search criteria"
              : "Start by adding your first bookmark!"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookmarks.map((bookmark: Bookmark | BookmarkWithRelations) => {
        const bookmarkTagsData = getBookmarkTags(bookmark);
        const collectionName = showExtended && 'collection' in bookmark && bookmark.collection
          ? bookmark.collection.name
          : getCollectionName(bookmark.collection_id);

        return (
          <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={bookmark.favicon_url || ''}
                      alt={`${formatUrl(bookmark.url)} favicon`}
                    />
                    <AvatarFallback className="text-xs">
                      🔗
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 hover:underline"
                      >
                        {bookmark.title}
                      </a>
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-2">
                      <span>{formatUrl(bookmark.url)}</span>
                      {collectionName && (
                        <>
                          <span>•</span>
                          <Badge variant="secondary" className="text-xs">
                            📁 {collectionName}
                          </Badge>
                        </>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === bookmark.id}
                    >
                      🗑️
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Bookmark</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{bookmark.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(bookmark.id, bookmark.user_id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            
            {(bookmark.description || bookmarkTagsData.length > 0) && (
              <CardContent>
                {bookmark.description && (
                  <p className="text-sm text-gray-600 mb-3">
                    {bookmark.description}
                  </p>
                )}
                
                {bookmarkTagsData.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {bookmarkTagsData.map((tag: Tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="text-xs"
                        style={tag.color ? { borderColor: tag.color, color: tag.color } : {}}
                      >
                        🏷️ {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400 mt-3">
                  <span>
                    Added {bookmark.created_at.toLocaleDateString()}
                  </span>
                  {!bookmarkTagsData.length && !('tags' in bookmark) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => loadBookmarkTags(bookmark.id)}
                    >
                      Load tags
                    </Button>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
