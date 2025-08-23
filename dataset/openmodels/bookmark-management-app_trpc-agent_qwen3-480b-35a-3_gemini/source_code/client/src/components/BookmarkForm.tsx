import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tag, Folder } from 'lucide-react';
import type { CreateBookmarkInput, Tag as TagType, Collection as CollectionType } from '../../../server/src/schema';

interface BookmarkFormProps {
  onSubmit: (data: CreateBookmarkInput) => Promise<void>;
  isLoading: boolean;
  tags: TagType[];
  collections: CollectionType[];
}

export function BookmarkForm({ onSubmit, isLoading, tags, collections }: BookmarkFormProps) {
  const [formData, setFormData] = useState<CreateBookmarkInput>({
    url: '',
    title: '',
    description: null,
    tagIds: [],
    collectionIds: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleTagToggle = (tagId: number) => {
    setFormData(prev => {
      const currentTags = prev.tagIds || [];
      const newTags = currentTags.includes(tagId)
        ? currentTags.filter(id => id !== tagId)
        : [...currentTags, tagId];
      
      return { ...prev, tagIds: newTags };
    });
  };

  const handleCollectionToggle = (collectionId: number) => {
    setFormData(prev => {
      const currentCollections = prev.collectionIds || [];
      const newCollections = currentCollections.includes(collectionId)
        ? currentCollections.filter(id => id !== collectionId)
        : [...currentCollections, collectionId];
      
      return { ...prev, collectionIds: newCollections };
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          placeholder="URL"
          value={formData.url}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, url: e.target.value }))
          }
          required
        />
      </div>
      <div>
        <Input
          placeholder="Title"
          value={formData.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          required
        />
      </div>
      <div>
        <Textarea
          placeholder="Description (optional)"
          value={formData.description || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev) => ({
              ...prev,
              description: e.target.value || null
            }))
          }
        />
      </div>
      
      {tags.length > 0 && (
        <div>
          <div className="flex items-center mb-2">
            <Tag className="mr-2 h-4 w-4" />
            <label className="text-sm font-medium">Tags</label>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant={formData.tagIds?.includes(tag.id) ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => handleTagToggle(tag.id)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {collections.length > 0 && (
        <div>
          <div className="flex items-center mb-2">
            <Folder className="mr-2 h-4 w-4" />
            <label className="text-sm font-medium">Collections</label>
          </div>
          <div className="flex flex-wrap gap-2">
            {collections.map((collection) => (
              <Badge
                key={collection.id}
                variant={formData.collectionIds?.includes(collection.id) ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => handleCollectionToggle(collection.id)}
              >
                {collection.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Creating...' : 'Create Bookmark'}
      </Button>
    </form>
  );
}
