import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { BookmarkWithDetails, Collection, Tag, UpdateBookmarkInput } from '../../../server/src/schema';

interface BookmarkEditFormProps {
  bookmark: BookmarkWithDetails;
  collections: Collection[];
  tags: Tag[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BookmarkEditForm({
  bookmark,
  collections,
  tags,
  isOpen,
  onClose,
  onSuccess
}: BookmarkEditFormProps) {
  const [formData, setFormData] = useState<UpdateBookmarkInput>({
    id: bookmark.id,
    url: bookmark.url,
    title: bookmark.title,
    description: bookmark.description,
    collection_id: bookmark.collection_id,
    tag_ids: []
  });

  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form data when bookmark changes
  useEffect(() => {
    setFormData({
      id: bookmark.id,
      url: bookmark.url,
      title: bookmark.title,
      description: bookmark.description,
      collection_id: bookmark.collection_id,
      tag_ids: bookmark.tags.map((tag: Tag) => tag.id)
    });
    setSelectedTagIds(bookmark.tags.map((tag: Tag) => tag.id));
    setError(null);
  }, [bookmark]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!formData.url || !formData.title) {
      setError('URL and title are required');
      setIsLoading(false);
      return;
    }

    try {
      // Validate URL format
      new URL(formData.url);
    } catch {
      setError('Please enter a valid URL');
      setIsLoading(false);
      return;
    }

    const submitData = {
      ...formData,
      tag_ids: selectedTagIds
    };

    try {
      await trpc.updateBookmark.mutate(submitData);
      onSuccess();
    } catch (error) {
      console.error('Failed to update bookmark:', error);
      setError('Failed to update bookmark. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagChange = (tagId: number, checked: boolean) => {
    setSelectedTagIds((prev: number[]) =>
      checked
        ? [...prev, tagId]
        : prev.filter((id: number) => id !== tagId)
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Bookmark</DialogTitle>
          <DialogDescription>
            Update your bookmark details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-url">URL *</Label>
              <Input
                id="edit-url"
                type="url"
                value={formData.url || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: UpdateBookmarkInput) => ({ ...prev, url: e.target.value }))
                }
                placeholder="https://example.com"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: UpdateBookmarkInput) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Bookmark title"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: UpdateBookmarkInput) => ({
                  ...prev,
                  description: e.target.value || null
                }))
              }
              placeholder="Optional description"
              disabled={isLoading}
              rows={3}
            />
          </div>

          {collections.length > 0 && (
            <div className="space-y-2">
              <Label>Collection</Label>
              <Select
                value={formData.collection_id?.toString() || 'none'}
                onValueChange={(value: string) =>
                  setFormData((prev: UpdateBookmarkInput) => ({
                    ...prev,
                    collection_id: value === 'none' ? null : parseInt(value)
                  }))
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a collection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No collection</SelectItem>
                  {collections.map((collection: Collection) => (
                    <SelectItem key={collection.id} value={collection.id.toString()}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {tags.length > 0 && (
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded-md p-3">
                {tags.map((tag: Tag) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-tag-${tag.id}`}
                      checked={selectedTagIds.includes(tag.id)}
                      onCheckedChange={(checked: boolean) => handleTagChange(tag.id, checked)}
                      disabled={isLoading}
                    />
                    <Label
                      htmlFor={`edit-tag-${tag.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {tag.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
