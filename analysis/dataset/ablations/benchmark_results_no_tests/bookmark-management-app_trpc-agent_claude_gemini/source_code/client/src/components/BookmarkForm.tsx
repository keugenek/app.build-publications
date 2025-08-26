import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { Bookmark, CreateBookmarkInput, Collection, Tag } from '../../../server/src/schema';

interface BookmarkFormProps {
  userId: number;
  collections: Collection[];
  tags: Tag[];
  onBookmarkCreated: (bookmark: Bookmark) => void;
}

export function BookmarkForm({ userId, collections, tags, onBookmarkCreated }: BookmarkFormProps) {
  const [formData, setFormData] = useState<CreateBookmarkInput>({
    user_id: userId,
    url: '',
    title: '',
    description: null,
    collection_id: null,
    favicon_url: null,
    tag_ids: []
  });
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const bookmarkData = {
        ...formData,
        tag_ids: selectedTags,
        description: formData.description || null,
        favicon_url: formData.favicon_url || null,
        collection_id: formData.collection_id || null
      };

      const newBookmark = await trpc.createBookmark.mutate(bookmarkData);
      onBookmarkCreated(newBookmark);
      
      // Reset form
      setFormData({
        user_id: userId,
        url: '',
        title: '',
        description: null,
        collection_id: null,
        favicon_url: null,
        tag_ids: []
      });
      setSelectedTags([]);
    } catch (error) {
      console.error('Failed to create bookmark:', error);
      setError('Failed to create bookmark. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagToggle = (tagId: number) => {
    setSelectedTags((prev: number[]) =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleUrlBlur = () => {
    // Auto-generate title from URL if title is empty
    if (formData.url && !formData.title) {
      try {
        const url = new URL(formData.url);
        const domain = url.hostname.replace('www.', '');
        setFormData((prev: CreateBookmarkInput) => ({
          ...prev,
          title: domain
        }));
      } catch {
        // Invalid URL, ignore
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="url">URL *</Label>
        <Input
          id="url"
          type="url"
          placeholder="https://example.com"
          value={formData.url}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateBookmarkInput) => ({ ...prev, url: e.target.value }))
          }
          onBlur={handleUrlBlur}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          type="text"
          placeholder="Bookmark title"
          value={formData.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateBookmarkInput) => ({ ...prev, title: e.target.value }))
          }
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Optional description..."
          value={formData.description || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateBookmarkInput) => ({
              ...prev,
              description: e.target.value || null
            }))
          }
          disabled={isLoading}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="collection">Collection</Label>
        <Select
          value={formData.collection_id?.toString() || ''}
          onValueChange={(value: string) =>
            setFormData((prev: CreateBookmarkInput) => ({
              ...prev,
              collection_id: value ? parseInt(value) : null
            }))
          }
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a collection (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No collection</SelectItem>
            {collections.map((collection: Collection) => (
              <SelectItem key={collection.id} value={collection.id.toString()}>
                {collection.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="favicon_url">Favicon URL</Label>
        <Input
          id="favicon_url"
          type="url"
          placeholder="https://example.com/favicon.ico (optional)"
          value={formData.favicon_url || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateBookmarkInput) => ({
              ...prev,
              favicon_url: e.target.value || null
            }))
          }
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag: Tag) => (
            <Badge
              key={tag.id}
              variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/80"
              style={
                selectedTags.includes(tag.id) && tag.color
                  ? { backgroundColor: tag.color, borderColor: tag.color }
                  : {}
              }
              onClick={() => handleTagToggle(tag.id)}
            >
              {tag.name}
            </Badge>
          ))}
          {tags.length === 0 && (
            <p className="text-sm text-gray-500">
              No tags available. Create some tags first!
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? 'Saving...' : '📚 Save Bookmark'}
        </Button>
      </div>
    </form>
  );
}
