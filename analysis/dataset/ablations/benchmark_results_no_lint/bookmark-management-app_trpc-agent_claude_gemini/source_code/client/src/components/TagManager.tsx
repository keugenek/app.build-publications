import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TagIcon, PlusIcon, PaletteIcon } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { Tag, CreateTagInput } from '../../../server/src/schema';

interface TagManagerProps {
  userId: number;
  tags: Tag[];
  onTagCreated: (tag: Tag) => void;
}

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#f97316', // orange
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#ec4899', // pink
  '#6b7280', // gray
];

export function TagManager({ userId, tags, onTagCreated }: TagManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTagInput>({
    name: '',
    color: null,
    user_id: userId
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newTag = await trpc.createTag.mutate(formData);
      
      // Since the backend is a stub, we'll create a mock tag response
      const tagWithData: Tag = {
        id: newTag.id || Date.now(), // Fallback for stub
        name: formData.name,
        color: formData.color,
        user_id: formData.user_id,
        created_at: new Date()
      };

      onTagCreated(tagWithData);

      // Reset form
      setFormData({
        name: '',
        color: null,
        user_id: userId
      });
    } catch (error) {
      console.error('Failed to create tag:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectColor = (color: string) => {
    setFormData(prev => ({ ...prev, color }));
  };

  const clearColor = () => {
    setFormData(prev => ({ ...prev, color: null }));
  };

  return (
    <div className="space-y-6">
      {/* Create New Tag */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Create New Tag
          </CardTitle>
          <CardDescription>
            Organize your bookmarks with custom tags and colors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tag Name */}
            <div className="space-y-2">
              <Label htmlFor="tag-name">Tag Name *</Label>
              <Input
                id="tag-name"
                placeholder="e.g., Work, Personal, Resources"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            {/* Color Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <PaletteIcon className="w-4 h-4" />
                Color (optional)
              </Label>
              
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => selectColor(color)}
                    title={`Select ${color}`}
                  />
                ))}
                <button
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 bg-white transition-transform hover:scale-110 ${
                    formData.color === null ? 'border-gray-900 scale-110' : 'border-gray-300'
                  }`}
                  onClick={clearColor}
                  title="No color"
                >
                  <span className="text-xs">✕</span>
                </button>
              </div>

              {/* Color Preview */}
              {formData.name && (
                <div className="mt-3">
                  <Label className="text-sm text-gray-600">Preview:</Label>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: formData.color || undefined,
                        color: formData.color || undefined
                      }}
                    >
                      {formData.name}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {isLoading ? 'Creating Tag...' : 'Create Tag'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TagIcon className="w-5 h-5" />
            Your Tags ({tags.length})
          </CardTitle>
          {tags.length === 0 && (
            <CardDescription>
              No tags yet. Create your first tag above!
            </CardDescription>
          )}
        </CardHeader>
        {tags.length > 0 && (
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {tags.map(tag => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow"
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
                  <span className="text-xs text-gray-400">
                    {tag.created_at.toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
