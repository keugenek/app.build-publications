import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { BookmarkEditForm } from './BookmarkEditForm';
import { ExternalLinkIcon, EditIcon, TrashIcon, FolderIcon, CalendarIcon } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { BookmarkWithDetails, Collection, Tag } from '../../../server/src/schema';

interface BookmarkListProps {
  bookmarks: BookmarkWithDetails[];
  collections: Collection[];
  tags: Tag[];
  onBookmarkUpdated: () => void;
  onBookmarkDeleted: () => void;
  isSearchResults?: boolean;
}

export function BookmarkList({
  bookmarks,
  collections,
  tags,
  onBookmarkUpdated,
  onBookmarkDeleted,
  isSearchResults = false
}: BookmarkListProps) {
  const [editingBookmark, setEditingBookmark] = useState<BookmarkWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (bookmark: BookmarkWithDetails) => {
    setIsDeleting(true);
    try {
      await trpc.deleteBookmark.mutate({
        bookmarkId: bookmark.id,
        userId: bookmark.user_id
      });
      onBookmarkDeleted();
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
    } finally {
      setIsDeleting(false);
    }
  };



  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  if (bookmarks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {isSearchResults ? 'No bookmarks found' : 'No bookmarks yet'}
            </h3>
            <p className="text-gray-500">
              {isSearchResults
                ? 'Try adjusting your search criteria'
                : 'Create your first bookmark to get started!'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {isSearchResults && (
        <div className="text-sm text-gray-600 mb-4">
          Found {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''}
        </div>
      )}
      
      {bookmarks.map((bookmark: BookmarkWithDetails) => (
        <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg mb-2 line-clamp-2">
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 transition-colors flex items-start"
                  >
                    <span className="flex-1">{bookmark.title}</span>
                    <ExternalLinkIcon className="h-4 w-4 ml-2 mt-1 flex-shrink-0" />
                  </a>
                </CardTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                  <span className="flex items-center">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {bookmark.created_at.toLocaleDateString()}
                  </span>
                  <span>{formatUrl(bookmark.url)}</span>
                  {bookmark.collection_name && (
                    <span className="flex items-center">
                      <FolderIcon className="h-3 w-3 mr-1" />
                      {bookmark.collection_name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingBookmark(bookmark)}
                >
                  <EditIcon className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800 hover:bg-red-50">
                      <TrashIcon className="h-4 w-4" />
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
                        onClick={() => handleDelete(bookmark)}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          {(bookmark.description || bookmark.tags.length > 0) && (
            <CardContent className="pt-0">
              {bookmark.description && (
                <CardDescription className="mb-3 text-sm">
                  {bookmark.description}
                </CardDescription>
              )}
              {bookmark.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {bookmark.tags.map((tag: Tag) => (
                    <Badge key={tag.id} variant="secondary" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}

      {/* Edit Dialog */}
      {editingBookmark && (
        <BookmarkEditForm
          bookmark={editingBookmark}
          collections={collections}
          tags={tags}
          isOpen={!!editingBookmark}
          onClose={() => setEditingBookmark(null)}
          onSuccess={() => {
            setEditingBookmark(null);
            onBookmarkUpdated();
          }}
        />
      )}
    </div>
  );
}
