import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TagIcon, PlusIcon } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { User, Tag, CreateTagInput } from '../../../server/src/schema';

interface TagManagerProps {
  user: User;
  tags: Tag[];
  onTagCreated: () => void;
}

export function TagManager({ user, tags, onTagCreated }: TagManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateTagInput>({
    name: '',
    user_id: user.id
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const tagName = formData.name.trim();
    if (!tagName) {
      setError('Tag name is required');
      setIsLoading(false);
      return;
    }

    // Check for duplicate tags
    const existingTag = tags.find((tag: Tag) => 
      tag.name.toLowerCase() === tagName.toLowerCase()
    );
    
    if (existingTag) {
      setError('A tag with this name already exists');
      setIsLoading(false);
      return;
    }

    try {
      await trpc.createTag.mutate({ ...formData, name: tagName });
      onTagCreated();
      setFormData({ name: '', user_id: user.id });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create tag:', error);
      setError('Failed to create tag. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center">
              <TagIcon className="h-4 w-4 mr-2" />
              Tags
            </CardTitle>
            <CardDescription className="text-sm">
              Label your bookmarks
            </CardDescription>
          </div>
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <PlusIcon className="h-3 w-3 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Tag</DialogTitle>
                <DialogDescription>
                  Create a new tag to label your bookmarks.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="tag-name">Tag Name *</Label>
                  <Input
                    id="tag-name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateTagInput) => ({
                        ...prev,
                        name: e.target.value
                      }))
                    }
                    placeholder="e.g., javascript, tutorial, work"
                    required
                    disabled={isLoading}
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-500">
                    Tags help you categorize and find your bookmarks easily.
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Tag'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {tags.length === 0 ? (
          <div className="text-center py-4">
            <TagIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No tags yet</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: Tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-xs px-2 py-1"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
