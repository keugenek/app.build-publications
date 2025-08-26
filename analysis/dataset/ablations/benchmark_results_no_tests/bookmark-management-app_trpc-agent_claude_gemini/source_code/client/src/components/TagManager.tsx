import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { Tag, CreateTagInput } from '../../../server/src/schema';

interface TagManagerProps {
  userId: number;
  tags: Tag[];
  onTagCreated: (tag: Tag) => void;
  onTagDeleted: (tagId: number) => void;
}

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#f97316', // orange
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#ec4899', // pink
  '#6b7280'  // gray
];

export function TagManager({ userId, tags, onTagCreated, onTagDeleted }: TagManagerProps) {
  const [formData, setFormData] = useState<CreateTagInput>({
    user_id: userId,
    name: '',
    color: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const tagData = {
        ...formData,
        color: formData.color || null,
        name: formData.name.toLowerCase().trim()
      };

      // Check for duplicate names
      if (tags.some(tag => tag.name.toLowerCase() === tagData.name)) {
        setError('A tag with this name already exists.');
        setIsLoading(false);
        return;
      }

      const newTag = await trpc.createTag.mutate(tagData);
      onTagCreated(newTag);
      
      // Reset form
      setFormData({
        user_id: userId,
        name: '',
        color: null
      });
    } catch (error) {
      console.error('Failed to create tag:', error);
      setError('Failed to create tag. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (tagId: number) => {
    setDeletingId(tagId);
    try {
      await trpc.deleteTag.mutate({ tagId, userId });
      onTagDeleted(tagId);
    } catch (error) {
      console.error('Failed to delete tag:', error);
      setError('Failed to delete tag. It may be in use by bookmarks.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleColorSelect = (color: string) => {
    setFormData((prev: CreateTagInput) => ({ ...prev, color }));
  };

  return (
    <div className="space-y-6">
      {/* Create New Tag */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Tag</CardTitle>
          <CardDescription>
            Add tags to categorize and organize your bookmarks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Tag Name *</Label>
              <Input
                id="tag-name"
                type="text"
                placeholder="e.g., javascript, tutorial, work"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateTagInput) => ({ ...prev, name: e.target.value }))
                }
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>Color (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color: string) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                      formData.color === color ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    disabled={isLoading}
                  />
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  type="color"
                  value={formData.color || '#3b82f6'}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateTagInput) => ({ ...prev, color: e.target.value }))
                  }
                  className="w-16 h-8"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData((prev: CreateTagInput) => ({ ...prev, color: null }))}
                  disabled={isLoading}
                >
                  Clear
                </Button>
              </div>
              {formData.name && (
                <div className="mt-2">
                  <Label className="text-xs text-gray-500">Preview:</Label>
                  <div className="mt-1">
                    <Badge
                      style={formData.color ? { backgroundColor: formData.color, borderColor: formData.color } : {}}
                    >
                      🏷️ {formData.name}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : '🏷️ Create Tag'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Existing Tags */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Your Tags ({tags.length})
        </h3>
        
        {tags.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="text-4xl mb-3">🏷️</div>
              <h4 className="font-semibold mb-2">No tags yet</h4>
              <p className="text-gray-500 text-center text-sm">
                Create your first tag to categorize your bookmarks
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-wrap gap-3">
            {tags.map((tag: Tag) => (
              <div key={tag.id} className="flex items-center space-x-2">
                <Badge
                  variant="outline"
                  className="text-sm px-3 py-1"
                  style={tag.color ? { borderColor: tag.color, color: tag.color } : {}}
                >
                  🏷️ {tag.name}
                </Badge>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === tag.id}
                      className="h-6 w-6 p-0 hover:bg-red-100"
                    >
                      ×
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete the tag "{tag.name}"? 
                        This will remove the tag from all bookmarks.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(tag.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
