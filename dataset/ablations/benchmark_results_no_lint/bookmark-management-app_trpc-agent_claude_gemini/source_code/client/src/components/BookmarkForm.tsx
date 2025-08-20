import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { BookmarkWithData, Tag, Collection, CreateBookmarkInput } from '../../../server/src/schema';

interface BookmarkFormProps {
  userId: number;
  tags: Tag[];
  collections: Collection[];
  onBookmarkCreated: (bookmark: BookmarkWithData) => void;
}

export function BookmarkForm({ userId, tags, collections, onBookmarkCreated }: BookmarkFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateBookmarkInput>({
    url: '',
    title: '',
    description: null,
    user_id: userId,
    collection_id: null,
    tag_ids: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create the bookmark
      const newBookmark = await trpc.createBookmark.mutate(formData);
      
      // Transform the basic bookmark to BookmarkWithData for the UI
      // Since the backend stub returns an empty response, we'll create a mock response
      // that matches the expected BookmarkWithData structure
      const bookmarkWithData: BookmarkWithData = {
        id: newBookmark.id || Date.now(), // Fallback for stub
        url: formData.url,
        title: formData.title,
        description: formData.description,
        user_id: formData.user_id,
        collection_id: formData.collection_id,
        collection_name: formData.collection_id 
          ? collections.find(c => c.id === formData.collection_id)?.name || null
          : null,
        tags: formData.tag_ids 
          ? tags.filter(tag => formData.tag_ids!.includes(tag.id))
          : [],
        created_at: new Date(),
        updated_at: new Date()
      };

      onBookmarkCreated(bookmarkWithData);

      // Reset form
      setFormData({
        url: '',
        title: '',
        description: null,
        user_id: userId,
        collection_id: null,
        tag_ids: []
      });
    } catch (error) {
      console.error('Failed to create bookmark:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTag = (tagId: number) => {
    setFormData(prev => ({
      ...prev,
      tag_ids: prev.tag_ids 
        ? prev.tag_ids.includes(tagId)
          ? prev.tag_ids.filter(id => id !== tagId)
          : [...prev.tag_ids, tagId]
        : [tagId]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* URL Input */}
      <div className="space-y-2">
        <Label htmlFor="url">URL *</Label>
        <Input
          id="url"
          type="url"
          placeholder="https://example.com"
          value={formData.url}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData(prev => ({ ...prev, url: e.target.value }))
          }
          required
        />
      </div>

      {/* Title Input */}
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="Bookmark title"
          value={formData.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData(prev => ({ ...prev, title: e.target.value }))
          }
          required
        />
      </div>

      {/* Description Input */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Optional description for your bookmark"
          value={formData.description || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData(prev => ({
              ...prev,
              description: e.target.value || null
            }))
          }
          rows={3}
        />
      </div>

      {/* Collection Selection */}
      <div className="space-y-2">
        <Label>Collection</Label>
        <Select
          value={formData.collection_id?.toString() || ''}
          onValueChange={(value: string) =>
            setFormData(prev => ({
              ...prev,
              collection_id: value ? parseInt(value) : null
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a collection (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No collection</SelectItem>
            {collections.map(collection => (
              <SelectItem key={collection.id} value={collection.id.toString()}>
                {collection.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tag Selection */}
      {tags.length > 0 && (
        <div className="space-y-3">
          <Label>Tags</Label>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Select tags for this bookmark</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {tags.map(tag => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag.id}`}
                      checked={formData.tag_ids?.includes(tag.id) || false}
                      onCheckedChange={() => toggleTag(tag.id)}
                    />
                    <Label
                      htmlFor={`tag-${tag.id}`}
                      className="cursor-pointer flex items-center gap-2"
                    >
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: tag.color || undefined,
                          color: tag.color || undefined
                        }}
                      >
                        {tag.name}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected Tags Preview */}
          {formData.tag_ids && formData.tag_ids.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Selected tags:</Label>
              <div className="flex flex-wrap gap-2">
                {tags
                  .filter(tag => formData.tag_ids!.includes(tag.id))
                  .map(tag => (
                    <Badge
                      key={tag.id}
                      style={{
                        backgroundColor: tag.color || undefined,
                        color: tag.color ? 'white' : undefined
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tags.length === 0 && (
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
          💡 Create some tags first to organize your bookmarks better!
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Saving Bookmark...' : 'Save Bookmark'}
      </Button>
    </form>
  );
}
